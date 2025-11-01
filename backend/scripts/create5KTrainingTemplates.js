// Script to create 5K training program templates
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { connectMongoDB } from '../config/database.js';
import { TrainingProgramTemplate } from '../models/mongodb/index.js';

async function create5KTemplates() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectMongoDB();
    
    console.log('🏃‍♂️ Creating 5K training program templates...');
    
    // 5K Beginner Template - Couch to 5K style
    const beginner5K = {
      name: '5K Beginner - Couch to 5K',
      description: 'Perfect for absolute beginners who want to complete their first 5K. This program gradually builds your running stamina from zero to 5K over 8 weeks.',
      targetDistance: '5K',
      duration: 8,
      sessionsPerWeek: 3,
      difficultyLevel: 'beginner',
      
      phases: [
        {
          name: 'Foundation Phase',
          weeks: 3,
          focus: 'Building basic cardiovascular endurance',
          description: 'Alternating walking and jogging to build initial stamina',
          weeklyMileageIncrease: 10,
          keyWorkoutTypes: ['walk-jog intervals', 'recovery walks']
        },
        {
          name: 'Building Phase',
          weeks: 3,
          focus: 'Increasing continuous running time',
          description: 'Gradually reducing walking intervals and increasing running duration',
          weeklyMileageIncrease: 15,
          keyWorkoutTypes: ['continuous jogs', 'walk-jog intervals']
        },
        {
          name: 'Race Preparation',
          weeks: 2,
          focus: 'Preparing for race distance',
          description: 'Building confidence with longer runs and race pace practice',
          weeklyMileageIncrease: 5,
          keyWorkoutTypes: ['continuous runs', 'race pace efforts']
        }
      ],
      
      prerequisites: {
        minimumWeeklyMileage: 0,
        minimumLongRun: 0,
        monthsOfConsistentRunning: 0,
        injuryFreeMonths: 1
      },
      
      goals: {
        primaryGoal: 'Complete first 5K without stopping',
        secondaryGoals: [
          'Build cardiovascular fitness',
          'Establish consistent running habit',
          'Learn proper running form'
        ],
        expectedImprovements: [
          'Complete 5K in 30-40 minutes',
          'Improved cardiovascular health',
          'Increased energy levels',
          'Weight management'
        ]
      },
      
      overview: 'This 8-week program is designed for complete beginners who want to run their first 5K. Using a proven walk-jog progression, you\'ll safely build endurance while minimizing injury risk.',
      
      keyPrinciples: [
        'Gradual progression is key - never increase weekly mileage by more than 10%',
        'Rest days are crucial for recovery and adaptation',
        'Focus on time/duration rather than speed in early weeks',
        'Listen to your body and adjust pace as needed',
        'Consistency matters more than intensity'
      ],
      
      weekStructureExample: 'Week 1: Day 1 - 20 min walk-jog (1 min jog, 2 min walk x6), Day 3 - 20 min walk-jog, Day 5 - 25 min walk-jog. Week 4: Day 1 - 25 min run (10 min jog, 2 min walk, 10 min jog), Day 3 - 20 min continuous jog, Day 5 - 30 min run with 1 walk break.',
      
      nutritionGuidance: 'Stay hydrated throughout the day. Eat a light snack 30-60 minutes before running. Focus on whole foods, adequate protein for recovery, and complex carbohydrates for energy.',
      
      recoveryGuidance: 'Take at least 1 rest day between runs. Include light stretching after each run. Consider yoga or swimming on rest days for active recovery.',
      
      injuryPreventionTips: [
        'Always warm up with 5 minutes of walking',
        'Cool down with 5 minutes of walking and stretching',
        'Invest in proper running shoes',
        'Run on softer surfaces when possible',
        'Stop if you feel sharp pain'
      ],
      
      workoutDistribution: {
        easyRuns: 70,
        tempoRuns: 10,
        intervals: 5,
        longRuns: 15,
        rest: 0
      },
      
      adaptationRules: {
        missedWorkoutHandling: 'If you miss 1 workout, continue as planned. If you miss 2+ workouts in a week, repeat that week.',
        illnessProtocol: 'Take 2 days off for minor illness. For flu or fever, wait until fully recovered plus 2 days before resuming.',
        plateauBreaking: 'Add 1 extra easy run per week or increase run duration by 5 minutes.',
        overtrainingSignals: [
          'Persistent fatigue',
          'Elevated resting heart rate',
          'Difficulty sleeping',
          'Decreased performance',
          'Frequent minor illnesses'
        ]
      },
      
      stats: {
        timesUsed: 0,
        successRate: 0,
        averageRating: 0,
        totalRatings: 0
      },
      
      isActive: true,
      isPublic: true,
      createdBy: 'system',
      tags: ['5K', 'beginner', 'couch-to-5k', 'first-race', '8-weeks']
    };

    // 5K Intermediate Template
    const intermediate5K = {
      name: '5K Intermediate - Speed Development',
      description: 'For runners who can already run 5K and want to improve their time. This 10-week program focuses on speed development and race strategy.',
      targetDistance: '5K',
      duration: 10,
      sessionsPerWeek: 4,
      difficultyLevel: 'intermediate',
      
      phases: [
        {
          name: 'Base Building Phase',
          weeks: 3,
          focus: 'Building aerobic base and mileage',
          description: 'Increasing weekly mileage with easy runs and strides',
          weeklyMileageIncrease: 10,
          keyWorkoutTypes: ['easy runs', 'strides', 'long runs']
        },
        {
          name: 'Speed Development Phase',
          weeks: 4,
          focus: 'Developing speed and lactate threshold',
          description: 'Introducing intervals and tempo runs to improve speed',
          weeklyMileageIncrease: 5,
          keyWorkoutTypes: ['intervals', 'tempo runs', 'fartlek']
        },
        {
          name: 'Peak & Taper Phase',
          weeks: 3,
          focus: 'Race preparation and tapering',
          description: 'Sharpening speed while reducing volume for peak performance',
          weeklyMileageIncrease: -10,
          keyWorkoutTypes: ['race pace runs', 'short intervals', 'easy runs']
        }
      ],
      
      prerequisites: {
        minimumWeeklyMileage: 15,
        minimumLongRun: 8,
        monthsOfConsistentRunning: 3,
        injuryFreeMonths: 2
      },
      
      goals: {
        primaryGoal: 'Improve 5K personal best by 1-2 minutes',
        secondaryGoals: [
          'Develop race pace awareness',
          'Improve running economy',
          'Build speed endurance'
        ],
        expectedImprovements: [
          '5K time under 25-28 minutes',
          'Improved VO2 max',
          'Better pacing strategy',
          'Increased running efficiency'
        ]
      },
      
      overview: 'This 10-week program is designed for intermediate runners who want to improve their 5K time. Through structured speedwork and strategic training, you\'ll develop the speed and endurance needed for a PR.',
      
      keyPrinciples: [
        'Follow the hard-easy principle - hard days hard, easy days easy',
        'Speed work should be done at appropriate paces - not all-out',
        'Maintain consistent weekly mileage',
        'Include dynamic warm-up before speed sessions',
        'Practice race pace regularly'
      ],
      
      weekStructureExample: 'Monday: Easy 5K, Tuesday: 6x800m intervals @ 5K pace, Wednesday: Rest, Thursday: Tempo run 20 min @ threshold pace, Friday: Rest, Saturday: Easy 5K, Sunday: Long run 10-12K.',
      
      nutritionGuidance: 'Increase carbohydrate intake on hard training days. Time protein intake within 30 minutes post-workout. Stay hydrated with electrolytes during longer runs. Consider pre-race carb loading 2 days before race.',
      
      recoveryGuidance: 'Include 1-2 complete rest days per week. Use foam rolling and stretching daily. Consider ice baths after hard sessions. Get 7-9 hours of sleep per night.',
      
      injuryPreventionTips: [
        'Include strength training 2x per week',
        'Dynamic warm-up before speed work',
        'Progressive cool-down after hard efforts',
        'Regular sports massage',
        'Replace shoes every 500-600km'
      ],
      
      workoutDistribution: {
        easyRuns: 50,
        tempoRuns: 20,
        intervals: 15,
        longRuns: 15,
        rest: 0
      },
      
      adaptationRules: {
        missedWorkoutHandling: 'Prioritize key workouts (intervals/tempo). Easy runs can be skipped if needed.',
        illnessProtocol: 'No hard workouts until 48 hours symptom-free. Ease back with easy runs first.',
        plateauBreaking: 'Add hill repeats or increase interval intensity by 2-3%.',
        overtrainingSignals: [
          'Inability to hit workout paces',
          'Chronic muscle soreness',
          'Irritability or mood changes',
          'Loss of appetite',
          'Declining race performances'
        ]
      },
      
      stats: {
        timesUsed: 0,
        successRate: 0,
        averageRating: 0,
        totalRatings: 0
      },
      
      isActive: true,
      isPublic: true,
      createdBy: 'system',
      tags: ['5K', 'intermediate', 'speed', 'PR', '10-weeks']
    };

    // 5K Advanced Template
    const advanced5K = {
      name: '5K Advanced - Elite Performance',
      description: 'For experienced runners targeting sub-20 minute 5K. This 12-week high-intensity program requires strong fitness base and racing experience.',
      targetDistance: '5K',
      duration: 12,
      sessionsPerWeek: 5,
      difficultyLevel: 'advanced',
      
      phases: [
        {
          name: 'Aerobic Development Phase',
          weeks: 4,
          focus: 'Maximizing aerobic capacity',
          description: 'High mileage base building with lactate threshold work',
          weeklyMileageIncrease: 8,
          keyWorkoutTypes: ['steady runs', 'threshold runs', 'long runs']
        },
        {
          name: 'Anaerobic Power Phase',
          weeks: 4,
          focus: 'Developing top-end speed and power',
          description: 'High-intensity intervals and VO2 max development',
          weeklyMileageIncrease: 0,
          keyWorkoutTypes: ['VO2 max intervals', 'hill repeats', 'track work']
        },
        {
          name: 'Competition Phase',
          weeks: 4,
          focus: 'Race readiness and peaking',
          description: 'Race-specific workouts with strategic tapering',
          weeklyMileageIncrease: -15,
          keyWorkoutTypes: ['race simulations', 'sharpening workouts', 'time trials']
        }
      ],
      
      prerequisites: {
        minimumWeeklyMileage: 40,
        minimumLongRun: 15,
        monthsOfConsistentRunning: 12,
        injuryFreeMonths: 3
      },
      
      goals: {
        primaryGoal: 'Achieve sub-20 minute 5K',
        secondaryGoals: [
          'Maximize VO2 max',
          'Perfect race tactics',
          'Develop championship mindset'
        ],
        expectedImprovements: [
          '5K time under 20 minutes',
          'VO2 max above 60 ml/kg/min',
          'Lactate threshold improvement',
          'Enhanced neuromuscular power'
        ]
      },
      
      overview: 'This 12-week advanced program is for serious runners chasing elite-level 5K times. It combines high mileage, intense speedwork, and strategic periodization for peak performance.',
      
      keyPrinciples: [
        'Periodization is crucial - each phase builds on the previous',
        'Recovery is as important as training',
        'Mental preparation and visualization',
        'Precise pace control in all workouts',
        'Regular physiological testing recommended'
      ],
      
      weekStructureExample: 'Monday: 10K easy + 6x100m strides, Tuesday: 5x1000m @ 3K pace (2 min recovery), Wednesday: 8K recovery, Thursday: 3x2K @ threshold (90s recovery), Friday: Rest, Saturday: Parkrun or 5K time trial, Sunday: 16K long run progressive.',
      
      nutritionGuidance: 'Work with sports nutritionist for personalized plan. Precise fueling before/during/after workouts. Consider legal supplements (beta-alanine, beetroot juice). Maintain race weight without compromising energy.',
      
      recoveryGuidance: 'Professional massage weekly. Daily mobility work and stretching. Consider altitude training or heat adaptation. Monitor HRV and adjust training accordingly.',
      
      injuryPreventionTips: [
        'Comprehensive strength program 3x week',
        'Regular gait analysis',
        'Prophylactic physiotherapy',
        'Multiple pairs of rotating shoes',
        'Blood work monitoring for deficiencies'
      ],
      
      workoutDistribution: {
        easyRuns: 40,
        tempoRuns: 20,
        intervals: 25,
        longRuns: 15,
        rest: 0
      },
      
      adaptationRules: {
        missedWorkoutHandling: 'Never try to make up missed workouts. Adjust weekly plan to maintain key session quality.',
        illnessProtocol: 'Complete rest until recovered. Rebuild with easy mileage for days equal to days missed.',
        plateauBreaking: 'Introduce new stimulus: altitude training, different surface, or workout variation.',
        overtrainingSignals: [
          'Declining workout performance',
          'Elevated CK levels',
          'Suppressed testosterone',
          'Recurring injuries',
          'Loss of competitive drive'
        ]
      },
      
      stats: {
        timesUsed: 0,
        successRate: 0,
        averageRating: 0,
        totalRatings: 0
      },
      
      isActive: true,
      isPublic: true,
      createdBy: 'system',
      tags: ['5K', 'advanced', 'elite', 'sub-20', '12-weeks', 'competitive']
    };

    // Check and create templates
    const templates = [beginner5K, intermediate5K, advanced5K];
    
    for (const template of templates) {
      try {
        // Check if template already exists
        const existing = await TrainingProgramTemplate.findOne({ name: template.name });
        
        if (existing) {
          console.log(`⚠️  Template "${template.name}" already exists, updating...`);
          await TrainingProgramTemplate.findByIdAndUpdate(existing._id, template, { new: true });
          console.log(`✅ Updated: ${template.name}`);
        } else {
          const newTemplate = new TrainingProgramTemplate(template);
          await newTemplate.save();
          console.log(`✅ Created: ${template.name}`);
        }
      } catch (error) {
        console.error(`❌ Error with template "${template.name}":`, error.message);
      }
    }
    
    // Verify templates
    console.log('\n📊 Verifying 5K templates in database...');
    const allTemplates = await TrainingProgramTemplate.find({ targetDistance: '5K' });
    console.log(`Found ${allTemplates.length} 5K templates:`);
    
    allTemplates.forEach(t => {
      console.log(`  - ${t.name} (${t.difficultyLevel}) - ${t.duration} weeks`);
    });
    
    console.log('\n🎉 5K training program templates created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating templates:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
create5KTemplates();