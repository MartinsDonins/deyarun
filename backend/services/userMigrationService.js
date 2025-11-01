// User Migration Service - PostgreSQL to MongoDB Sync
import prisma from '../prismaClient.js';
import { User } from '../models/mongodb/index.js';

export class UserMigrationService {
  
  /**
   * Sync user from PostgreSQL to MongoDB
   */
  static async syncUserToMongoDB(postgresUserId, firebaseUID = null) {
    try {
      // Get user from PostgreSQL
      const postgresUser = await prisma.user.findUnique({
        where: { id: postgresUserId }
      });

      if (!postgresUser) {
        throw new Error(`PostgreSQL user ${postgresUserId} not found`);
      }

      // Check if user already exists in MongoDB
      let mongoUser = await User.findOne({
        $or: [
          { postgresId: postgresUserId },
          { email: postgresUser.email.toLowerCase() },
          ...(firebaseUID ? [{ firebaseUID }] : [])
        ]
      });

      const userData = {
        // Firebase Integration
        firebaseUID: firebaseUID || mongoUser?.firebaseUID,
        postgresId: postgresUserId,
        
        // Basic Identity
        email: postgresUser.email.toLowerCase(),
        firstName: postgresUser.firstName,
        lastName: postgresUser.lastName,
        password: postgresUser.password, // Migrate password hash
        
        // OAuth Integration
        googleId: postgresUser.googleId,
        supabaseId: postgresUser.supabaseId,
        profilePicture: postgresUser.profilePicture,
        
        // Personal Information
        phone: postgresUser.phone,
        birthDate: postgresUser.birthDate,
        age: postgresUser.age,
        gender: postgresUser.gender,
        
        // Physical Profile
        weight: postgresUser.weight,
        height: postgresUser.height,
        
        // Running Profile
        fitnessLevel: postgresUser.fitnessLevel,
        weeklyGoal: postgresUser.weeklyGoal,
        preferredPace: postgresUser.preferredPace,
        runningExperience: postgresUser.runningExperience,
        injuryHistory: postgresUser.injuryHistory,
        preferredDistance: postgresUser.preferredDistance,
        
        // Detailed Training Profile
        hasRunningExperience: postgresUser.hasRunningExperience,
        longestRunEver: postgresUser.longestRunEver,
        longestRunLastMonth: postgresUser.longestRunLastMonth,
        personalBest5k: postgresUser.personalBest5k,
        personalBest10k: postgresUser.personalBest10k,
        personalBestHalfMarathon: postgresUser.personalBestHalfMarathon,
        personalBestMarathon: postgresUser.personalBestMarathon,
        
        // Training Frequency
        workoutsPerWeekCurrent: postgresUser.workoutsPerWeekCurrent,
        workoutsPerWeekLastMonth: postgresUser.workoutsPerWeekLastMonth,
        strengthTrainingPerWeek: postgresUser.strengthTrainingPerWeek,
        coreTrainingPerWeek: postgresUser.coreTrainingPerWeek,
        otherActivities: postgresUser.otherActivities,
        
        // Equipment & Gear
        hasRunningShoes: postgresUser.hasRunningShoes,
        runningShoesBrand: postgresUser.runningShoesBrand,
        runningShoesModel: postgresUser.runningShoesModel,
        hasHeartRateMonitor: postgresUser.hasHeartRateMonitor,
        monitorsHeartRate: postgresUser.monitorsHeartRate,
        hasStressTest: postgresUser.hasStressTest,
        
        // Health & Medical
        medicalConditions: postgresUser.medicalConditions,
        currentInjuries: postgresUser.currentInjuries,
        currentPain: postgresUser.currentPain,
        hasExcessWeight: postgresUser.hasExcessWeight,
        needsWalkingStart: postgresUser.needsWalkingStart,
        
        // Training Goals
        targetEventType: postgresUser.targetEventType,
        targetEventDate: postgresUser.targetEventDate,
        maxHeartRate: postgresUser.maxHeartRate,
        restingHeartRate: postgresUser.restingHeartRate,
        trainingIntensityPref: postgresUser.trainingIntensityPref,
        
        // Recovery & Lifestyle
        sleepHoursPerNight: postgresUser.sleepHoursPerNight,
        stressLevel: postgresUser.stressLevel,
        nutritionQuality: postgresUser.nutritionQuality,
        hydrationLevel: postgresUser.hydrationLevel,
        
        // App Preferences
        timezone: postgresUser.timezone,
        units: postgresUser.units,
        theme: postgresUser.theme,
        notificationsEnabled: postgresUser.notificationsEnabled,
        locationSharingEnabled: postgresUser.locationSharingEnabled,
        
        // Profile Status
        isEmailVerified: postgresUser.isEmailVerified,
        isProfileComplete: postgresUser.isProfileComplete,
        avatarUrl: postgresUser.avatarUrl,
        
        // User Roles
        role: postgresUser.role,
        subscriptionType: postgresUser.subscriptionType,
        permissions: postgresUser.permissions,
        
        // Statistics
        totalWorkouts: postgresUser.totalWorkouts,
        totalDistance: postgresUser.totalDistance,
        totalDuration: postgresUser.totalDuration,
        bestPace: postgresUser.bestPace,
        longestRun: postgresUser.longestRun,
        
        // Timestamps
        lastLoginAt: postgresUser.lastLoginAt,
        loginCount: mongoUser?.loginCount || 0
      };

      if (mongoUser) {
        // Update existing MongoDB user
        mongoUser = await User.findByIdAndUpdate(
          mongoUser._id,
          { $set: userData },
          { new: true, runValidators: true }
        );
        console.log(`✅ Updated MongoDB user: ${mongoUser.email}`);
      } else {
        // Create new MongoDB user
        mongoUser = new User(userData);
        await mongoUser.save();
        console.log(`✅ Created MongoDB user: ${mongoUser.email}`);
      }

      return mongoUser;

    } catch (error) {
      console.error('❌ User sync error:', error);
      throw error;
    }
  }

  /**
   * Find or create MongoDB user from Firebase UID
   */
  static async findOrCreateFromFirebase(firebaseUID, firebaseUserData) {
    try {
      // First try to find by Firebase UID
      let mongoUser = await User.findByFirebaseUID(firebaseUID);
      
      if (mongoUser) {
        console.log(`✅ Found MongoDB user by Firebase UID: ${mongoUser.email}`);
        return mongoUser;
      }

      // Try to find by email
      if (firebaseUserData.email) {
        mongoUser = await User.findByEmail(firebaseUserData.email);
        
        if (mongoUser) {
          // Link Firebase UID to existing user
          mongoUser.firebaseUID = firebaseUID;
          if (firebaseUserData.picture) {
            mongoUser.profilePicture = firebaseUserData.picture;
          }
          await mongoUser.save();
          console.log(`✅ Linked Firebase UID to existing MongoDB user: ${mongoUser.email}`);
          return mongoUser;
        }
      }

      // Create new user from Firebase data
      const [firstName, ...lastNameParts] = (firebaseUserData.name || firebaseUserData.email?.split('@')[0] || 'User').split(' ');
      const lastName = lastNameParts.join(' ') || 'User';

      mongoUser = new User({
        firebaseUID,
        email: firebaseUserData.email?.toLowerCase(),
        firstName,
        lastName,
        profilePicture: firebaseUserData.picture,
        isEmailVerified: firebaseUserData.email_verified || false,
        birthDate: new Date('1990-01-01'), // Default
        gender: 'other',
        fitnessLevel: 'beginner',
        weeklyGoal: 20,
        runningExperience: 'beginner',
        preferredDistance: '5k',
        timezone: 'UTC',
        units: 'metric',
        isProfileComplete: false
      });

      await mongoUser.save();
      console.log(`✅ Created new MongoDB user from Firebase: ${mongoUser.email}`);
      
      return mongoUser;

    } catch (error) {
      console.error('❌ Firebase user creation error:', error);
      throw error;
    }
  }

  /**
   * Batch sync all PostgreSQL users to MongoDB
   */
  static async batchSyncUsers(limit = 100, offset = 0) {
    try {
      console.log(`🔄 Starting batch sync: limit=${limit}, offset=${offset}`);
      
      const postgresUsers = await prisma.user.findMany({
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'asc' }
      });

      console.log(`📊 Found ${postgresUsers.length} PostgreSQL users to sync`);

      const results = {
        success: 0,
        errors: 0,
        total: postgresUsers.length
      };

      for (const postgresUser of postgresUsers) {
        try {
          await this.syncUserToMongoDB(postgresUser.id);
          results.success++;
        } catch (error) {
          console.error(`❌ Failed to sync user ${postgresUser.id}:`, error.message);
          results.errors++;
        }
      }

      console.log(`✅ Batch sync complete:`, results);
      return results;

    } catch (error) {
      console.error('❌ Batch sync error:', error);
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  static async getSyncStats() {
    try {
      const [postgresCount, mongoCount, syncedCount] = await Promise.all([
        prisma.user.count(),
        User.countDocuments(),
        User.countDocuments({ postgresId: { $exists: true } })
      ]);

      return {
        postgresUsers: postgresCount,
        mongoUsers: mongoCount,
        syncedUsers: syncedCount,
        unsyncedUsers: postgresCount - syncedCount,
        firebaseUsers: await User.countDocuments({ firebaseUID: { $exists: true } })
      };
    } catch (error) {
      console.error('❌ Sync stats error:', error);
      throw error;
    }
  }
}

export default UserMigrationService;