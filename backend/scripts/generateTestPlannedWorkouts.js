// Script to generate test planned workouts for current week
import mongoose from 'mongoose';
import { PlannedWorkout } from '../models/mongodb/trainingPlan/plannedWorkout.model.js';
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;
console.log('🔗 Connecting to MongoDB...');
await mongoose.connect(mongoUri);

const userId = '688d8452795e3f77642e8b7e'; // Test user ID
const trainingPlanId = new mongoose.Types.ObjectId();

// Calculate current week
const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

console.log(`🏃 Generating test planned workouts for week: ${format(currentWeekStart, 'yyyy-MM-dd')} to ${format(currentWeekEnd, 'yyyy-MM-dd')}`);

// Define workout templates
const workoutTemplates = [
  {
    dayOffset: 0, // Monday
    dayOfWeek: 'monday',
    type: 'easy',
    name: 'Viegls skrējiens',
    description: 'Viegls aerobais skrējiens mierīgā tempā',
    targetMetrics: {
      totalDistance: 5000, // 5km
      totalDuration: 1800, // 30 min
      averagePace: 360, // 6 min/km
      heartRateZone: { min: 120, max: 140 },
      calories: 300
    }
  },
  {
    dayOffset: 2, // Wednesday  
    dayOfWeek: 'wednesday',
    type: 'tempo',
    name: 'Tempo skrējiens',
    description: 'Mēreni grūts tempo skrējiens',
    targetMetrics: {
      totalDistance: 4000, // 4km
      totalDuration: 1320, // 22 min
      averagePace: 330, // 5:30 min/km
      heartRateZone: { min: 140, max: 160 },
      calories: 280
    }
  },
  {
    dayOffset: 5, // Saturday
    dayOfWeek: 'saturday',
    type: 'long',
    name: 'Garš skrējiens',
    description: 'Ilgs aerobais skrējiens izturības attīstīšanai',
    targetMetrics: {
      totalDistance: 10000, // 10km
      totalDuration: 3900, // 65 min
      averagePace: 390, // 6:30 min/km
      heartRateZone: { min: 130, max: 150 },
      calories: 650
    }
  },
  {
    dayOffset: 6, // Sunday
    dayOfWeek: 'sunday',
    type: 'intervals',
    name: 'Intervālu treniņš',
    description: 'Ātru intervālu treniņš ar atpūtas pauzēm',
    targetMetrics: {
      totalDistance: 6000, // 6km
      totalDuration: 2400, // 40 min
      averagePace: 300, // 5:00 min/km
      heartRateZone: { min: 160, max: 180 },
      calories: 420
    }
  }
];

// Clear existing planned workouts for this user and week
await PlannedWorkout.deleteMany({
  userId: userId,
  scheduledDate: {
    $gte: currentWeekStart,
    $lte: currentWeekEnd
  }
});

console.log('🧹 Cleared existing planned workouts for this week');

// Generate new planned workouts
const plannedWorkouts = [];

for (const template of workoutTemplates) {
  const scheduledDate = addDays(currentWeekStart, template.dayOffset);
  
  const workout = new PlannedWorkout({
    trainingPlanId: trainingPlanId,
    userId: userId,
    scheduledDate: scheduledDate,
    week: 1,
    dayOfWeek: template.dayOfWeek,
    type: template.type,
    name: template.name,
    description: template.description,
    targetMetrics: template.targetMetrics,
    warmupInstructions: '10 minūšu silīšanās ar viegliem paātrinājumiem',
    cooldownInstructions: '10 minūšu staigāšana un izstiepšanās',
    coachingTips: [
      'Uzturiet vienmērīgu tempu',
      'Kontrolējiet elpošanu',
      'Koncentrējieties uz skrējiena formu'
    ],
    status: 'scheduled'
  });
  
  plannedWorkouts.push(workout);
}

// Save all planned workouts
const savedWorkouts = await PlannedWorkout.insertMany(plannedWorkouts);

console.log(`✅ Generated ${savedWorkouts.length} planned workouts:`);
savedWorkouts.forEach(workout => {
  console.log(`  - ${format(workout.scheduledDate, 'yyyy-MM-dd')} (${workout.dayOfWeek}): ${workout.name}`);
});

console.log('\n🎯 Test planned workouts created successfully!');
console.log('Now you can test the /api/training-plans/weekly/current endpoint');

// Close MongoDB connection
await mongoose.disconnect();