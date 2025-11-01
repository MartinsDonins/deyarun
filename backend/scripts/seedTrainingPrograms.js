import mongoose from 'mongoose';
import { TrainingProgramTemplate } from '../models/mongodb/index.js';

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://martinsmondodb:sRvZBr7p71kGZ2hT@runningacademy.y4zul.mongodb.net/running_academy');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample training program templates
const samplePrograms = [
  {
    name: '5K Iesācēju Programma',
    description: 'Piemērota iesācējiem, kas vēlas sasniegt 5K distanci pirmo reizi. Programma koncentrējas uz pakāpenisku izturības veidošanu un pareizas skrējiena tehnikas apguvi.',
    targetDistance: '5K',
    duration: 8,
    sessionsPerWeek: 3,
    difficultyLevel: 'beginner',
    phases: [
      { name: 'Pamatu veidošana', weeks: 3, focus: 'Pamatizturība un tehnika', description: 'Vieglā skrējiena un pastaigāšanas kombinācija' },
      { name: 'Intensitātes ieviešana', weeks: 3, focus: 'Intervālu darbs', description: 'Īsu intervālu ieviešana programma' },
      { name: 'Sacensību sagatavošana', weeks: 2, focus: '5K temps', description: 'Sagatavošanās sacensībām ar tempiem' }
    ],
    prerequisites: {
      minimumWeeklyMileage: 0,
      minimumLongRun: 0,
      monthsOfConsistentRunning: 0,
      injuryFreeMonths: 3
    },
    goals: {
      primaryGoal: 'Veiksmīgi pabeigt 5K distanci',
      secondaryGoals: ['Veidot skrējiena paradumu', 'Uzlabot kardiovaskulāro izturību'],
      expectedImprovements: ['Fiziskā forma', 'Izturība', 'Pašapziņa']
    },
    overview: 'Šī programma ir ideāla tiem, kas tikko sāk skrējiena ceļojumu. Tā nodrošina pakāpenisku ievadīšanu skrējienā, kombinējot skriešanu ar pastaigāšanu.',
    keyPrinciples: ['Pakāpeniska progresija', 'Atpūta ir tikpat svarīga', 'Konsistence pār intensitāti'],
    workoutDistribution: {
      easyRuns: 70,
      tempoRuns: 0,
      intervals: 15,
      longRuns: 15,
      rest: 0
    },
    adaptationRules: {
      missedWorkoutHandling: 'Nekad necenties atgūt zaudēto - turpini no plāna',
      illnessProtocol: 'Slimības gadījumā - pilna atpūta līdz atveseļošanai',
      plateauBreaking: 'Palēlini progresu, ja sajūti pārslodzi'
    },
    createdBy: 'system',
    isActive: true,
    isPublic: true,
    tags: ['iesācējs', '5K', 'pirmā distance', 'izturība']
  },
  {
    name: '10K Uzlabotā Programma',
    description: 'Paredzēta skrējējiem ar pieredzi, kas vēlas uzlabot savu 10K laiku. Ietver dažādus treniņu veidus un intensitātes.',
    targetDistance: '10K',
    duration: 12,
    sessionsPerWeek: 4,
    difficultyLevel: 'intermediate',
    phases: [
      { name: 'Bāzes veidošana', weeks: 4, focus: 'Aerobā jauda', description: 'Izturības pamatu stiprināšana' },
      { name: 'Spēka attīstība', weeks: 4, focus: 'Kalna treniņi', description: 'Spēka un jaudas attīstīšana' },
      { name: 'Ātruma darbs', weeks: 3, focus: 'Intervāli un tempi', description: 'Sacensību ātruma attīstīšana' },
      { name: 'Sagatavošana', weeks: 1, focus: 'Atjaunošanās', description: 'Atjaunošanās pirms sacensībām' }
    ],
    prerequisites: {
      minimumWeeklyMileage: 20,
      minimumLongRun: 8,
      monthsOfConsistentRunning: 6,
      injuryFreeMonths: 3
    },
    goals: {
      primaryGoal: 'Uzlabot 10K laiku par 2-5 minūtēm',
      secondaryGoals: ['Palielināt nedēļas kilometrāžu', 'Attīstīt ātrumu'],
      expectedImprovements: ['VO2 max', 'Laktat slieksnis', 'Skrējiena ekonomija']
    },
    overview: 'Strukturēta programma pieredzējušiem skrējējiem 10K laika uzlabošanai ar dažādiem intensitātes līmeņiem.',
    keyPrinciples: ['80/20 princips', 'Progresīva pārslodze', 'Specifiskums sacensībām'],
    workoutDistribution: {
      easyRuns: 60,
      tempoRuns: 20,
      intervals: 15,
      longRuns: 5,
      rest: 0
    },
    adaptationRules: {
      missedWorkoutHandling: 'Prioritizē kvalitātes treniņus',
      illnessProtocol: '2 dienu atpūta par katru slimības dienu',
      plateauBreaking: 'Mainīt treniņu secību vai intensitāti'
    },
    createdBy: 'system',
    isActive: true,
    isPublic: true,
    tags: ['vidējais', '10K', 'laika uzlabošana', 'intensitāte']
  },
  {
    name: 'Pusmaratona Izaicinājums',
    description: 'Visaptveroša programma pusmaratona (21.1 km) veiksmīgai pabeigšanai. Paredzēta pieredzējušiem skrējējiem.',
    targetDistance: 'half-marathon',
    duration: 16,
    sessionsPerWeek: 4,
    difficultyLevel: 'advanced',
    phases: [
      { name: 'Bāzes veidošana', weeks: 6, focus: 'Aerobā izturība', description: 'Izturības pamatu nostiprināšana' },
      { name: 'Spēka periods', weeks: 4, focus: 'Kalna treniņi un spēks', description: 'Spēka un jaudas attīstīšana' },
      { name: 'Ātruma attīstība', weeks: 4, focus: 'Tempa skrējieni', description: 'Pusmaratona tempa attīstīšana' },
      { name: 'Pikulminācija', weeks: 2, focus: 'Atjaunošanās', description: 'Sagatavošanās galvenajai sacensībai' }
    ],
    prerequisites: {
      minimumWeeklyMileage: 30,
      minimumLongRun: 15,
      monthsOfConsistentRunning: 12,
      injuryFreeMonths: 6
    },
    goals: {
      primaryGoal: 'Veiksmīgi pabeigt pusmaratonu',
      secondaryGoals: ['Sasniegt mērķa laiku', 'Saglabāt veselību'],
      expectedImprovements: ['Maksimālā izturība', 'Mentālā izturība', 'Sacensību pieredze']
    },
    overview: 'Progresīva pusmaratona programma ar uzsvaru uz ilgstošu izturību un pareizu tempu vadību.',
    keyPrinciples: ['Pakāpeniska kilometrāžas palielināšana', 'Tempa kontrole', 'Atjaunošanās prioritāte'],
    workoutDistribution: {
      easyRuns: 70,
      tempoRuns: 15,
      intervals: 5,
      longRuns: 10,
      rest: 0
    },
    adaptationRules: {
      missedWorkoutHandling: 'Prioritizē garos skrējienus',
      illnessProtocol: 'Pilna atpūta līdz pilnīgai atveseļošanai',
      plateauBreaking: 'Ieviest krustu treniņus'
    },
    createdBy: 'system',
    isActive: true,
    isPublic: true,
    tags: ['uzlabotais', 'pusmaratons', 'izturība', 'garā distance']
  }
];

// Main seeding function
const seedTrainingPrograms = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting training program templates seeding...');

    // Clear existing templates created by system
    await TrainingProgramTemplate.deleteMany({ createdBy: 'system' });
    console.log('🗑️ Cleared existing system templates');

    // Insert new templates
    const createdPrograms = await TrainingProgramTemplate.insertMany(samplePrograms);
    console.log(`✅ Successfully created ${createdPrograms.length} training program templates:`);
    
    createdPrograms.forEach(program => {
      console.log(`   - ${program.name} (${program.targetDistance}, ${program.difficultyLevel})`);
    });

    console.log('🎉 Training program templates seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding training programs:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    process.exit(0);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTrainingPrograms();
}

export default seedTrainingPrograms;