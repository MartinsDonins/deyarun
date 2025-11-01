import { AchievementDefinition, UserAchievement } from '../models/mongodb/achievement/achievement.model.js';
import { Workout } from '../models/mongodb/workout/workout.model.js';
import User from '../models/mongodb/user/user.model.js';

/**
 * Achievement Service - Core logic for achievement system
 * Handles achievement calculation, progress tracking, and unlock logic
 */
class AchievementService {
  
  /**
   * Initialize default achievements for a new user
   */
  static async initializeUserAchievements(userId) {
    try {
      // Get all active achievement definitions
      const definitions = await AchievementDefinition.find({ isActive: true });
      
      // Create user achievement records for each definition
      const userAchievements = definitions.map(def => ({
        userId,
        achievementId: def.id,
        progress: {
          current: 0,
          target: this._calculateTarget(def.criteria),
          unit: this._determineUnit(def.category, def.criteria)
        }
      }));
      
      await UserAchievement.insertMany(userAchievements, { ordered: false });
      console.log(`✅ Initialized ${userAchievements.length} achievements for user ${userId}`);
      
      return userAchievements;
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - achievements already exist
        console.log(`ℹ️ Achievements already exist for user ${userId}`);
        return null;
      }
      console.error('❌ Error initializing user achievements:', error);
      throw error;
    }
  }
  
  /**
   * Calculate and update user achievement progress based on workout completion
   */
  static async updateAchievementProgress(userId, workoutId) {
    try {
      const newAchievements = [];
      
      // Get user's current achievements
      const userAchievements = await UserAchievement.find({ userId, unlocked: false });
      
      // Get user's workout history for calculations
      const userWorkouts = await Workout.find({ 
        userId, 
        status: 'completed' 
      }).sort({ completedAt: -1 });
      
      const user = await User.findById(userId);
      
      // Process each achievement type
      for (const achievement of userAchievements) {
        const definition = await AchievementDefinition.findOne({ id: achievement.achievementId });
        if (!definition) continue;
        
        const oldProgress = achievement.progress.current;
        const newProgress = await this._calculateProgress(definition, userWorkouts, user);
        
        // Update progress if changed
        if (newProgress !== oldProgress) {
          achievement.progress.current = newProgress;
          achievement.progress.lastUpdated = new Date();
          
          // Check if achievement should be unlocked
          if (newProgress >= achievement.progress.target && !achievement.unlocked) {
            achievement.unlocked = true;
            achievement.unlockedAt = new Date();
            achievement.metadata.triggerWorkoutId = workoutId;
            
            newAchievements.push({
              id: achievement.achievementId,
              title: definition.title,
              description: definition.description,
              icon: definition.icon,
              points: definition.points,
              category: definition.category
            });
            
            console.log(`🏆 Achievement unlocked for user ${userId}: ${definition.title}`);
          }
          
          await achievement.save();
        }
      }
      
      return newAchievements;
    } catch (error) {
      console.error('❌ Error updating achievement progress:', error);
      throw error;
    }
  }
  
  /**
   * Get user's achievement summary for API responses
   */
  static async getUserAchievements(userId) {
    try {
      const achievements = await UserAchievement.find({ userId })
        .populate('achievementId');
      
      // Format for frontend consumption
      const formattedAchievements = await Promise.all(achievements.map(async (ua) => {
        const definition = await AchievementDefinition.findOne({ id: ua.achievementId });
        
        return {
          id: ua.achievementId,
          title: definition?.title || 'Unknown Achievement',
          description: definition?.description || '',
          icon: definition?.icon || 'trophy',
          unlocked: ua.unlocked,
          unlockedAt: ua.unlockedAt,
          progress: ua.unlocked ? null : {
            current: ua.progress.current,
            target: ua.progress.target,
            unit: ua.progress.unit
          },
          points: definition?.points || 100,
          category: definition?.category || 'milestone'
        };
      }));
      
      return {
        achievements: formattedAchievements,
        summary: {
          total: formattedAchievements.length,
          unlocked: formattedAchievements.filter(a => a.unlocked).length,
          inProgress: formattedAchievements.filter(a => !a.unlocked && a.progress?.current > 0).length,
          totalPoints: formattedAchievements
            .filter(a => a.unlocked)
            .reduce((sum, a) => sum + a.points, 0)
        }
      };
    } catch (error) {
      console.error('❌ Error getting user achievements:', error);
      throw error;
    }
  }
  
  /**
   * Calculate progress for a specific achievement definition
   */
  static async _calculateProgress(definition, userWorkouts, user) {
    const criteria = definition.criteria;
    const category = definition.category;
    
    switch (category) {
      case 'distance':
        if (criteria.totalDistance) {
          return userWorkouts.reduce((sum, w) => sum + (w.distance || 0), 0);
        }
        if (criteria.singleWorkoutDistance) {
          const maxDistance = Math.max(...userWorkouts.map(w => w.distance || 0));
          return maxDistance;
        }
        break;
        
      case 'frequency':
        if (criteria.totalWorkouts) {
          return userWorkouts.length;
        }
        if (criteria.workoutsPerWeek) {
          // Calculate workouts in last 7 days
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return userWorkouts.filter(w => new Date(w.completedAt) >= oneWeekAgo).length;
        }
        break;
        
      case 'streak':
        if (criteria.consecutiveDays) {
          return this._calculateStreakDays(userWorkouts);
        }
        break;
        
      case 'performance':
        if (criteria.personalBest) {
          return this._calculatePersonalBest(userWorkouts, criteria.personalBest);
        }
        break;
        
      default:
        return 0;
    }
    
    return 0;
  }
  
  /**
   * Calculate streak days from workout history
   */
  static _calculateStreakDays(workouts) {
    if (workouts.length === 0) return 0;
    
    const workoutDates = [...new Set(workouts.map(w => 
      new Date(w.completedAt).toDateString()
    ))].sort((a, b) => new Date(b) - new Date(a));
    
    let streakDays = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < workoutDates.length; i++) {
      const workoutDate = new Date(workoutDates[i]);
      const diffDays = Math.floor((currentDate - workoutDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streakDays++;
        currentDate = workoutDate;
      } else {
        break;
      }
    }
    
    return streakDays;
  }
  
  /**
   * Calculate personal best time for specific distance
   */
  static _calculatePersonalBest(workouts, distance) {
    const distanceWorkouts = workouts.filter(w => {
      const workoutDistance = w.distance / 1000; // convert to km
      return Math.abs(workoutDistance - parseFloat(distance)) < 0.5; // within 500m
    });
    
    if (distanceWorkouts.length === 0) return 0;
    
    const bestTime = Math.min(...distanceWorkouts.map(w => w.duration || Infinity));
    return bestTime === Infinity ? 0 : bestTime;
  }
  
  /**
   * Calculate target value from criteria
   */
  static _calculateTarget(criteria) {
    return criteria.totalDistance || 
           criteria.singleWorkoutDistance || 
           criteria.totalWorkouts || 
           criteria.workoutsPerWeek || 
           criteria.consecutiveDays || 
           criteria.personalBest || 
           100;
  }
  
  /**
   * Determine unit string from category and criteria
   */
  static _determineUnit(category, criteria) {
    switch (category) {
      case 'distance':
        return criteria.totalDistance || criteria.singleWorkoutDistance ? 'km' : 'units';
      case 'frequency':
        return 'workouts';
      case 'streak':
        return 'days';
      case 'performance':
        return 'seconds';
      default:
        return 'points';
    }
  }
  
  /**
   * Seed default achievement definitions
   */
  static async seedDefaultAchievements() {
    try {
      const defaultAchievements = [
        // Distance Milestones
        {
          id: 'first_5k',
          title: 'First 5K',
          description: 'Complete your first 5 kilometer run',
          category: 'distance',
          icon: 'star',
          criteria: { singleWorkoutDistance: 5000 },
          difficulty: 'easy',
          points: 100
        },
        {
          id: 'first_10k',
          title: 'First 10K',
          description: 'Complete your first 10 kilometer run',
          category: 'distance',
          icon: 'trophy',
          criteria: { singleWorkoutDistance: 10000 },
          difficulty: 'medium',
          points: 250
        },
        {
          id: 'half_marathon',
          title: 'Half Marathon Hero',
          description: 'Complete a half marathon (21.1 km)',
          category: 'distance',
          icon: 'trophy',
          criteria: { singleWorkoutDistance: 21100 },
          difficulty: 'hard',
          points: 500
        },
        {
          id: 'marathon_master',
          title: 'Marathon Master',
          description: 'Complete a full marathon (42.2 km)',
          category: 'distance',
          icon: 'trophy',
          criteria: { singleWorkoutDistance: 42200 },
          difficulty: 'expert',
          points: 1000
        },
        
        // Total Distance Achievements
        {
          id: 'total_100k',
          title: 'Century Runner',
          description: 'Run a total of 100 kilometers',
          category: 'distance',
          icon: 'fire',
          criteria: { totalDistance: 100000 },
          difficulty: 'medium',
          points: 300
        },
        {
          id: 'total_500k',
          title: 'Distance Warrior',
          description: 'Run a total of 500 kilometers',
          category: 'distance',
          icon: 'fire',
          criteria: { totalDistance: 500000 },
          difficulty: 'hard',
          points: 750
        },
        
        // Frequency Achievements
        {
          id: 'first_workout',
          title: 'Getting Started',
          description: 'Complete your first workout',
          category: 'frequency',
          icon: 'check',
          criteria: { totalWorkouts: 1 },
          difficulty: 'easy',
          points: 50
        },
        {
          id: 'workout_10',
          title: 'Consistent Runner',
          description: 'Complete 10 total workouts',
          category: 'frequency',
          icon: 'star',
          criteria: { totalWorkouts: 10 },
          difficulty: 'easy',
          points: 150
        },
        {
          id: 'workout_50',
          title: 'Dedicated Athlete',
          description: 'Complete 50 total workouts',
          category: 'frequency',
          icon: 'trophy',
          criteria: { totalWorkouts: 50 },
          difficulty: 'medium',
          points: 400
        },
        {
          id: 'weekly_5_runs',
          title: 'Weekly Warrior',
          description: 'Complete 5 workouts in one week',
          category: 'frequency',
          icon: 'fire',
          criteria: { workoutsPerWeek: 5 },
          difficulty: 'medium',
          points: 200
        },
        
        // Streak Achievements
        {
          id: 'streak_3',
          title: 'Three Day Streak',
          description: 'Run for 3 consecutive days',
          category: 'streak',
          icon: 'fire',
          criteria: { consecutiveDays: 3 },
          difficulty: 'easy',
          points: 120
        },
        {
          id: 'streak_7',
          title: 'Week Long Warrior',
          description: 'Run for 7 consecutive days',
          category: 'streak',
          icon: 'fire',
          criteria: { consecutiveDays: 7 },
          difficulty: 'medium',
          points: 300
        },
        {
          id: 'streak_30',
          title: 'Monthly Master',
          description: 'Run for 30 consecutive days',
          category: 'streak',
          icon: 'fire',
          criteria: { consecutiveDays: 30 },
          difficulty: 'expert',
          points: 1000
        }
      ];
      
      // Use upsert to avoid duplicates
      for (const achievement of defaultAchievements) {
        await AchievementDefinition.findOneAndUpdate(
          { id: achievement.id },
          achievement,
          { upsert: true, new: true }
        );
      }
      
      console.log(`✅ Seeded ${defaultAchievements.length} default achievements`);
      return defaultAchievements;
    } catch (error) {
      console.error('❌ Error seeding achievements:', error);
      throw error;
    }
  }
}

export default AchievementService;