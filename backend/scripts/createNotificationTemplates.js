import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const notificationTemplates = [
  {
    name: 'workout_reminder_daily',
    type: 'workout_reminder',
    title: '🏃‍♂️ Daily Workout Reminder',
    body: "Don't forget about your scheduled workout today! Keep up the great work!",
    data: {
      deepLink: '/workouts/today',
      category: 'workout'
    },
    priority: 'normal'
  },
  {
    name: 'workout_reminder_specific',
    type: 'workout_reminder',
    title: '🏃‍♂️ Workout Starting Soon',
    body: 'Your {{workoutType}} workout starts in 30 minutes. Get ready!',
    data: {
      deepLink: '/workouts/{{workoutId}}',
      category: 'workout'
    },
    priority: 'high'
  },
  {
    name: 'achievement_unlock',
    type: 'achievement',
    title: '🏆 Achievement Unlocked!',
    body: 'Congratulations! You\'ve unlocked "{{achievementName}}". Keep pushing your limits!',
    data: {
      deepLink: '/achievements/{{achievementId}}',
      category: 'achievement'
    },
    priority: 'high'
  },
  {
    name: 'personal_best',
    type: 'achievement',
    title: '🚀 New Personal Best!',
    body: 'Amazing! You just set a new personal best: {{distance}} in {{time}}. You\'re unstoppable!',
    data: {
      deepLink: '/dashboard/achievements',
      category: 'achievement'
    },
    priority: 'high'
  },
  {
    name: 'course_completion',
    type: 'course_update',
    title: '🎓 Course Completed!',
    body: 'Congratulations on completing "{{courseName}}"! Your certificate is ready for download.',
    data: {
      deepLink: '/courses/{{courseId}}/certificate',
      category: 'course'
    },
    priority: 'high'
  },
  {
    name: 'course_reminder',
    type: 'course_reminder',
    title: '📚 Course Reminder',
    body: 'You\'re {{progress}}% through "{{courseName}}". Don\'t give up, you\'re doing great!',
    data: {
      deepLink: '/courses/{{courseId}}',
      category: 'course'
    },
    priority: 'normal'
  },
  {
    name: 'weekly_progress',
    type: 'weekly_progress',
    title: '📊 Your Weekly Progress',
    body: 'This week you completed {{workoutsCount}} workouts and ran {{totalDistance}}km. Great job!',
    data: {
      deepLink: '/dashboard/progress',
      category: 'progress'
    },
    priority: 'normal'
  },
  {
    name: 'streak_milestone',
    type: 'achievement',
    title: '🔥 Streak Milestone!',
    body: 'Incredible! You\'ve maintained your workout streak for {{streakDays}} days straight!',
    data: {
      deepLink: '/dashboard/streaks',
      category: 'achievement'
    },
    priority: 'high'
  },
  {
    name: 'friend_workout',
    type: 'social_update',
    title: '👥 Friend Activity',
    body: '{{friendName}} just completed a {{workoutType}} workout. Cheer them on!',
    data: {
      deepLink: '/social/friend/{{friendId}}',
      category: 'social'
    },
    priority: 'normal'
  },
  {
    name: 'training_plan_update',
    type: 'training_plan_update',
    title: '📋 Training Plan Update',
    body: 'Your training plan has been updated with new workouts for this week!',
    data: {
      deepLink: '/training-plans/current',
      category: 'training'
    },
    priority: 'normal'
  },
  {
    name: 'workout_goal_reached',
    type: 'achievement',
    title: '🎯 Goal Achieved!',
    body: 'Fantastic! You\'ve reached your {{goalType}} goal of {{goalValue}}. Time to set a new challenge!',
    data: {
      deepLink: '/goals/{{goalId}}',
      category: 'achievement'
    },
    priority: 'high'
  },
  {
    name: 'inactivity_reminder',
    type: 'workout_reminder',
    title: '💪 We Miss You!',
    body: 'It\'s been {{daysSince}} days since your last workout. Ready to get back on track?',
    data: {
      deepLink: '/workouts/quick-start',
      category: 'motivation'
    },
    priority: 'normal'
  },
  {
    name: 'weather_alert',
    type: 'system_update',
    title: '🌦️ Weather Update',
    body: 'Perfect running weather today! {{temperature}}°C and {{conditions}}. Great time for an outdoor run!',
    data: {
      deepLink: '/workouts/outdoor',
      category: 'weather'
    },
    priority: 'normal'
  },
  {
    name: 'app_update',
    type: 'system_update',
    title: '🆕 App Update Available',
    body: 'A new version of DeyaRun is available with exciting features and improvements!',
    data: {
      deepLink: '/update',
      category: 'system'
    },
    priority: 'normal'
  },
  {
    name: 'maintenance_notice',
    type: 'system_update',
    title: '🔧 Maintenance Notice',
    body: 'Scheduled maintenance from {{startTime}} to {{endTime}}. Some features may be temporarily unavailable.',
    data: {
      deepLink: '/maintenance-info',
      category: 'system'
    },
    priority: 'high'
  }
];

async function createNotificationTemplates() {
  try {
    // Connect to database first
    await prisma.$connect();
    console.log('📱 Creating notification templates...');

    let createdCount = 0;
    let skippedCount = 0;

    for (const template of notificationTemplates) {
      try {
        await prisma.notificationTemplate.create({
          data: template
        });
        console.log(`✅ Created template: ${template.name}`);
        createdCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⏭️ Template already exists: ${template.name}`);
          skippedCount++;
        } else {
          console.error(`❌ Failed to create template ${template.name}:`, error.message);
        }
      }
    }

    console.log(`\n📊 Template creation summary:`);
    console.log(`✅ Created: ${createdCount}`);
    console.log(`⏭️ Skipped: ${skippedCount}`);
    console.log(`📱 Total templates: ${notificationTemplates.length}`);

  } catch (error) {
    console.error('❌ Error creating notification templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createNotificationTemplates();