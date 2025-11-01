import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const subscriptionPlans = [
  {
    id: 'free-plan',
    name: 'Bezmaksas',
    description: 'Pamata funkcionalitāte bez maksas. Ideāls iesācējiem.',
    price: 0,
    currency: 'EUR',
    interval: 'monthly',
    intervalCount: 1,
    trialDays: 0,
    features: [
      'Līdz 2 treniņplāniem',
      'Pamata treniņu statistika',
      'GPS izsekošana',
      'Kopienas atbalsts',
      'Pamata sasniegumi'
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 1,
    maxTrainingPlans: 2,
    maxMonthlyWorkouts: 20,
    hasAICoaching: false,
    hasPersonalCoach: false,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false
  },
  {
    id: 'premium-plan',
    name: 'Premium',
    description: 'Uzlabota funkcionalitāte ar AI atbalstu un neierobežotiem treniņplāniem.',
    price: 19.99,
    currency: 'EUR',
    interval: 'monthly',
    intervalCount: 1,
    trialDays: 7,
    features: [
      'Neierobežoti treniņplāni',
      'AI treneru padomi',
      'Uzlabota analītika un grafiki',
      'Personalizēti treniņu ieteikumi',
      'Prioritārs klientu atbalsts',
      'Eksporta iespējas',
      'Detalizēta progress analīze',
      'Sirds ritma zonu analīze'
    ],
    isActive: true,
    isPopular: true,
    sortOrder: 2,
    maxTrainingPlans: null,
    maxMonthlyWorkouts: null,
    hasAICoaching: true,
    hasPersonalCoach: false,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true
  },
  {
    id: 'pro-plan',
    name: 'Pro',
    description: 'Profesionāla funkcionalitāte ar personīgo treneri un 1-uz-1 konsultācijām.',
    price: 39.99,
    currency: 'EUR',
    interval: 'monthly',
    intervalCount: 1,
    trialDays: 14,
    features: [
      'Viss no Premium plāna',
      'Personīgais treners',
      'Video analīze un feedback',
      '1-uz-1 konsultācijas (2x mēnesī)',
      'Individuāli pielāgoti treniņplāni',
      'Ēdienu plāni un uzturs',
      'Injury prevention padomi',
      'Prioritārs atbalsts 24/7',
      'Ekskluzīvi semināri'
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 3,
    maxTrainingPlans: null,
    maxMonthlyWorkouts: null,
    hasAICoaching: true,
    hasPersonalCoach: true,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true
  },
  {
    id: 'yearly-premium',
    name: 'Premium (Gada)',
    description: 'Premium plāns ar 20% atlaidi gadā. Vislabākā vērtība!',
    price: 191.90, // 12 months for the price of ~9.6 months
    currency: 'EUR',
    interval: 'yearly',
    intervalCount: 1,
    trialDays: 14,
    features: [
      'Viss no Premium plāna',
      '20% atlaides salīdzinot ar mēneša plānu',
      'Bezmaksas premium atbalsts',
      'Agrīna piekļuve jaunajām funkcijām',
      'Ekskluzīvi gada lietotāju bonusi'
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 4,
    maxTrainingPlans: null,
    maxMonthlyWorkouts: null,
    hasAICoaching: true,
    hasPersonalCoach: false,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true
  },
  {
    id: 'yearly-pro',
    name: 'Pro (Gada)',
    description: 'Pro plāns ar 25% atlaidi gadā. Maksimāla vērtība profesionāļiem!',
    price: 359.91, // 12 months for the price of ~9 months
    currency: 'EUR',
    interval: 'yearly',
    intervalCount: 1,
    trialDays: 30,
    features: [
      'Viss no Pro plāna',
      '25% atlaides salīdzinot ar mēneša plānu',
      'Papildu konsultācija katru mēnesi (3x mēnesī)',
      'Prioritāra piekļuve jaunajām funkcijām',
      'VIP atbalsts',
      'Ekskluzīvi semināri un masterclasses',
      'Bezmaksas gear un merchandise'
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 5,
    maxTrainingPlans: null,
    maxMonthlyWorkouts: null,
    hasAICoaching: true,
    hasPersonalCoach: true,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true
  }
];

async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...');

  try {
    // First, check if plans already exist
    const existingPlans = await prisma.subscriptionPlan.findMany();
    
    if (existingPlans.length > 0) {
      console.log('📝 Subscription plans already exist. Updating existing plans...');
      
      // Update existing plans
      for (const planData of subscriptionPlans) {
        await prisma.subscriptionPlan.upsert({
          where: { id: planData.id },
          update: {
            name: planData.name,
            description: planData.description,
            price: planData.price,
            currency: planData.currency,
            interval: planData.interval,
            intervalCount: planData.intervalCount,
            trialDays: planData.trialDays,
            features: planData.features,
            isActive: planData.isActive,
            isPopular: planData.isPopular,
            sortOrder: planData.sortOrder,
            maxTrainingPlans: planData.maxTrainingPlans,
            maxMonthlyWorkouts: planData.maxMonthlyWorkouts,
            hasAICoaching: planData.hasAICoaching,
            hasPersonalCoach: planData.hasPersonalCoach,
            hasAdvancedAnalytics: planData.hasAdvancedAnalytics,
            hasPrioritySupport: planData.hasPrioritySupport
          },
          create: planData
        });
        
        console.log(`✅ Plan "${planData.name}" seeded successfully`);
      }
    } else {
      // Create new plans
      for (const planData of subscriptionPlans) {
        await prisma.subscriptionPlan.create({
          data: planData
        });
        
        console.log(`✅ Plan "${planData.name}" created successfully`);
      }
    }

    console.log('🎉 All subscription plans seeded successfully!');
    
    // Display summary
    const allPlans = await prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    
    console.log('\n📊 Subscription Plans Summary:');
    console.log('━'.repeat(60));
    allPlans.forEach(plan => {
      console.log(`${plan.name.padEnd(20)} | €${plan.price.toString().padEnd(8)} | ${plan.interval.padEnd(10)} | ${plan.isActive ? '✅' : '❌'} Active`);
    });
    console.log('━'.repeat(60));
    
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  }
}

// Run the seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSubscriptionPlans()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedSubscriptionPlans };
export default seedSubscriptionPlans;