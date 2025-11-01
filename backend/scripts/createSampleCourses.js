// Script to create sample courses
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleCourses = [
  {
    name: 'Couch to 5K - Sācēju kurss',
    description: 'Perfekts kurss tiem, kas vēlas sākt skriet. 8 nedēļu programma, kas pakāpeniski sagatavos jūs 5 km distancei.',
    shortDescription: 'Sācēju draudzīgs 8 nedēļu kurss 5K distancei',
    category: '5k',
    level: 'beginner',
    duration: '8 nedēļas',
    price: 0,
    isPaid: false,
    features: [
      '8 nedēļu progresīvs plāns',
      'Video instrukcijas',
      'Mobilā aplikācija',
      'Kopienas atbalsts',
      'Iesācēju draudzīgs'
    ],
    whatYouLearn: [
      'Pareizu skriešanas tehniku',
      'Elpošanas paņēmienus',
      'Traumatisma novēršanu',
      'Treniņu plānošanu'
    ],
    requirements: [
      'Nav nepieciešama iepriekšēja pieredze',
      'Skriešanas apavi',
      'Motivācija un pacietība'
    ],
    instructorName: 'Laura Bērziņa',
    instructorBio: 'Sertificēta skriešanas trenere ar 8 gadu pieredzi',
    targetAudience: 'Sācēji, kas vēlas sākt skriet',
    difficulty: 1,
    tags: ['sācēji', '5k', 'couch-to-5k', 'bezmaksas'],
    isActive: true,
    isFeatured: true
  },
  {
    name: '10K Treniņu Plāns - Intermediate',
    description: 'Uzlabojiet savu izturību un ātrumu ar mūsu 12 nedēļu 10K treniņu plānu. Ideāls tiem, kas jau var noskriet 5K.',
    shortDescription: '12 nedēļu intensīvs plāns 10K distancei',
    category: '10k',
    level: 'intermediate',
    duration: '12 nedēļas',
    price: 29.99,
    isPaid: true,
    features: [
      '12 nedēļu detalizēts plāns',
      'Intervālu treniņi',
      'Tempo skrējieni',
      'Personalizēti ieteikumi',
      'Progresa izsekošana',
      'Trenera atbalsts'
    ],
    whatYouLearn: [
      'Intervālu treniņu tehnikas',
      'Tempo kontroli',
      'Spēka treniņus',
      'Sacensību stratēģijas'
    ],
    requirements: [
      'Spēja noskriet 5K bez apstāšanās',
      '3-4 mēnešu skriešanas pieredze',
      'Skriešanas apavi'
    ],
    instructorName: 'Andris Kalniņš',
    instructorBio: 'Olimpisko spēļu dalībnieks, sertificēts treneris',
    targetAudience: 'Skrējēji ar pamata pieredzi',
    difficulty: 3,
    tags: ['10k', 'intermediate', 'tempo', 'intervals'],
    isActive: true,
    isFeatured: true
  },
  {
    name: 'Maratona Sagatavošanās - Pro līmenis',
    description: 'Intensīvs 20 nedēļu kurss maratona distancei. Ietver visus aspektus - no treniņiem līdz uzturvielām un mentālajai sagatavošanai.',
    shortDescription: 'Profesionāls 20 nedēļu maratona kurss',
    category: 'marathon',
    level: 'advanced',
    duration: '20 nedēļas',
    price: 99.99,
    isPaid: true,
    features: [
      '20 nedēļu profesionāls plāns',
      'Personīgs treneris',
      'Uzturu plāns',
      'Mentālā sagatavošanās',
      'Nedēļas treniņu analīze',
      'Video konsultācijas',
      '24/7 atbalsts'
    ],
    whatYouLearn: [
      'Maratona stratēģijas',
      'Garā distancē skriešanu',
      'Uztura plānošanu',
      'Atveseļošanās metodes',
      'Mentālo izturību'
    ],
    requirements: [
      'Spēja noskriet pusmaratonu',
      'Vismaz 1 gada skriešanas pieredze',
      'Medicīniskā apskate',
      'Liela motivācija'
    ],
    instructorName: 'Māris Štrombergs',
    instructorBio: 'Maratona rekordists, olimpietis, 15 gadu trenera pieredze',
    targetAudience: 'Pieredzējuši skrējēji',
    difficulty: 5,
    tags: ['marathon', 'advanced', 'professional', 'endurance'],
    isActive: true,
    isFeatured: false
  },
  {
    name: 'Spēka Treniņi Skrējējiem',
    description: 'Specializēts spēka treniņu kurss, kas paredzēts skrējējiem. Uzlabos jūsu sniegumu un samazinās traumatisma risku.',
    shortDescription: 'Spēka treniņi skrējiena uzlabošanai',
    category: 'strength',
    level: 'intermediate',
    duration: '6 nedēļas',
    price: 19.99,
    isPaid: true,
    features: [
      '6 nedēļu spēka treniņu plāns',
      'Video demonstrācijas',
      'Mājās izpildāmi vingrinājumi',
      'Progresa tests',
      'Aprīkojuma alternatīvas'
    ],
    whatYouLearn: [
      'Funkcionālos vingrinājumus',
      'Kodola stiprināšanu',
      'Kāju spēka attīstību',
      'Traumatisma novēršanu'
    ],
    requirements: [
      'Pamata skriešanas pieredze',
      'Pieejamība trenažieru zālei vai mājas aprīkojums'
    ],
    instructorName: 'Kristīne Vēvere',
    instructorBio: 'Fizioterapeite un spēka trenere',
    targetAudience: 'Skrējēji, kas vēlas uzlabot sniegumu',
    difficulty: 2,
    tags: ['strength', 'injury-prevention', 'functional'],
    isActive: true,
    isFeatured: false
  },
  {
    name: 'Uztura Pamati Izturības Sportā',
    description: 'Uzziniet, kā pareizi baroties, lai uzlabotu savu izturību un atveseļošanos. Praktiskas receptes un ēšanas plāni.',
    shortDescription: 'Uztura vadlīnijas skrējējiem',
    category: 'nutrition',
    level: 'beginner',
    duration: '4 nedēļas',
    price: 15.99,
    isPaid: true,
    features: [
      'Uztura pamatu teorija',
      'Praktiskas receptes',
      'Ēšanas plāni',
      'Hidratācijas vadlīnijas',
      'Supplementu ieteikumi'
    ],
    whatYouLearn: [
      'Makroelementu līdzsvaru',
      'Treniņu uztura',
      'Sacensību ēšanu',
      'Atveseļošanās ēdienu'
    ],
    requirements: [
      'Nav nepieciešamas priekšzināšanas'
    ],
    instructorName: 'Dr. Agnese Liepa',
    instructorBio: 'Sporta uztura speciāliste, Ph.D uzturā',
    targetAudience: 'Visi sportisti',
    difficulty: 1,
    tags: ['nutrition', 'health', 'recovery'],
    isActive: true,
    isFeatured: false
  }
];

async function createSampleCourses() {
  try {
    console.log('Creating sample courses...');
    
    for (const courseData of sampleCourses) {
      // Check if course already exists
      const existing = await prisma.course.findFirst({
        where: { name: courseData.name }
      });
      
      if (existing) {
        console.log(`⚠️  Course already exists: ${courseData.name}`);
        continue;
      }
      
      const course = await prisma.course.create({
        data: courseData
      });
      
      console.log(`✅ Created course: ${course.name} (${course.isPaid ? '€' + course.price : 'FREE'})`);
    }
    
    console.log('\n🎉 All sample courses created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating sample courses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleCourses();