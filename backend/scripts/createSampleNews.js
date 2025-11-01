// Script to create sample news articles for testing
// Run this after the backend is running to populate the news collection

import dotenv from 'dotenv';
import { News, User } from '../models/mongodb/index.js';
import { initializeDatabases } from '../config/database.js';

// Load environment variables
dotenv.config();

const sampleNewsArticles = [
  {
    title: "Jaunā DeyaRun versija 2.5.0 ir pieejama!",
    content: `
      <p>Mēs esam lepni paziņot par jaunākās DeyaRun versijas izlaišanu! Šī versija nes līdzi daudzas jaunas funkcijas un uzlabojumus.</p>
      
      <h3>Galvenās jaunās funkcijas:</h3>
      <ul>
        <li><strong>Reāllaika jaunumu sistēma</strong> - Saņem aktuālākos paziņojumus uzreiz</li>
        <li><strong>Uzlabota Google Analytics integrācija</strong> - Detalizētāka lietotāju darbības analīze</li>
        <li><strong>Jaunais ziņojumu centrs</strong> - Visas svarīgās ziņas vienā vietā</li>
        <li><strong>Optimizēta lietotāja saskarne</strong> - Ātrāka un ērtāka lietošanas pieredze</li>
      </ul>

      <p>Atjauninājumu var iegūt automātiski, vai arī restartējot aplikāciju.</p>
    `,
    excerpt: "Jaunākā DeyaRun versija 2.5.0 ir pieejama ar daudzām jaunām funkcijām un uzlabojumiem.",
    category: "updates",
    priority: "high",
    publishedAt: new Date(),
    readTime: "3 min",
    imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=400&fit=crop",
    tags: ["versija", "jaunumi", "funkcijas"],
    status: "published"
  },
  {
    title: "Maratona treneru padoms: Kā sagatavot ķermeni ziemai",
    content: `
      <p>Ziemas mēneši var būt izaicinošs laiks skrējējiem, bet ar pareizo sagatavošanu jūs varat turpināt treniņus un sasniegt savus mērķus arī aukstajos mēnešos.</p>

      <h3>Apģērba izvēle:</h3>
      <p>Izvēlieties apģērbu slāņos - tas ļaus regulēt ķermeņa temperatūru treniņa laikā. Sāciet ar mitrumu novadošu apakšveļu, pievienojiet siltuma slāni un aizsargājošu ārējo kārtu.</p>

      <h3>Apavu drošība:</h3>
      <p>Ziemas apstākļos prioritāte ir drošība. Izmantojiet apavus ar labu saķeri, un apsvēriet mikrošļūčošu vai ledus nagus slidenākos apstākļos.</p>

      <h3>Iesildīšanās:</h3>
      <p>Aukstā laikā iesildīšanās ir īpaši svarīga. Pavadiet vairāk laiku mājās, veicot dinamisko iesildīšanos, pirms doties ārā.</p>

      <p>Atcerieties - nav slikta laika, ir tikai nepareizs apģērbs!</p>
    `,
    excerpt: "Profesionāli padomi, kā sagatavot ķermeni un aprīkojumu skrējieniem ziemas mēnešos.",
    category: "training",
    priority: "normal",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    readTime: "5 min",
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop",
    tags: ["ziema", "treniņi", "padomi"],
    status: "published"
  },
  {
    title: "Sistēmas apkope 15. decembrī no 02:00 līdz 04:00",
    content: `
      <p><strong>Svarīgs paziņojums visiem DeyaRun lietotājiem!</strong></p>

      <p>Lai uzlabotu sistēmas veiktspēju un ieviestu jaunas funkcijas, mēs veicam plānu apkopi:</p>

      <ul>
        <li><strong>Datums:</strong> 15. decembris, 2024</li>
        <li><strong>Laiks:</strong> 02:00 - 04:00 (Latvijas laiks)</li>
        <li><strong>Paredzamais ilgums:</strong> 2 stundas</li>
      </ul>

      <h3>Ko tas nozīmē jums:</h3>
      <p>Šajā laikā nebūs pieejamas šādas funkcijas:</p>
      <ul>
        <li>Ielogošanās sistēmā</li>
        <li>Treniņu sinhronizācija</li>
        <li>Leaderboard atjauninājumi</li>
        <li>Push paziņojumi</li>
      </ul>

      <p><strong>Mobīlā aplikācija:</strong> Offline režīmā jūs joprojām varat ierakstīt treniņus. Tie tiks sinhronizēti, tiklīdz sistēma atkal būs pieejama.</p>

      <p>Paldies par izpratni!</p>
    `,
    excerpt: "Plānots sistēmas apkopes darbs 15. decembrī no 02:00 līdz 04:00 - dažas funkcijas nebūs pieejamas.",
    category: "maintenance",
    priority: "urgent",
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    readTime: "2 min",
    tags: ["apkope", "sistēma", "paziņojums"],
    status: "published"
  },
  {
    title: "Jaunā Strava integrācija - importējiet savas aktivitātes",
    content: `
      <p>Esam ieviesti pilnīgu Strava integrāciju, kas ļauj jums viegli importēt visas savas skrējiena aktivitātes!</p>

      <h3>Kā tas darbojas:</h3>
      <ol>
        <li>Dodieties uz Iestatījumi → Integrācijas</li>
        <li>Noklikšķiniet "Savienot ar Strava"</li>
        <li>Autorizējiet DeyaRun piekļuvi savam Strava kontam</li>
        <li>Izvēlieties, kuras aktivitātes importēt</li>
      </ol>

      <h3>Ko jūs iegūstat:</h3>
      <ul>
        <li>Automātiska aktivitāšu sinhronizācija</li>
        <li>GPS maršrutu importēšana</li>
        <li>Sirds ritma datu pārnešana</li>
        <li>Vienota statistika abās platformās</li>
      </ul>

      <p>Šī funkcija ir pieejama visiem Premium un Pro lietotājiem. Bezmaksas lietotāji var sinhronizēt līdz 5 aktivitātēm mēnesī.</p>

      <p>Sāciet izmantot jau šodien!</p>
    `,
    excerpt: "Jaunā Strava integrācija ļauj viegli importēt visas skrējiena aktivitātes un GPS datus.",
    category: "features",
    priority: "normal",
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    readTime: "4 min",
    imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop",
    tags: ["strava", "integrācija", "features"],
    status: "published"
  },
  {
    title: "DeyaRun ziemas izaicinājums 2024",
    content: `
      <p><strong>Pievienojieties mūsu ziemas izaicinājumam un saglabājiet motivāciju visa ziemas!</strong></p>

      <h3>Izaicinājuma mērķi:</h3>
      <ul>
        <li>Noskrējiet vismaz 100 km decembra mēnesī</li>
        <li>Veiciet vismaz 12 treniņus</li>
        <li>Uzturiet vidējo tempu stabilāku par 10%</li>
      </ul>

      <h3>Balvas:</h3>
      <ul>
        <li><strong>1. vieta:</strong> Premium abonements uz gadu + DeyaRun merchandise komplekts</li>
        <li><strong>2. vieta:</strong> Premium abonements uz 6 mēnešiem</li>
        <li><strong>3. vieta:</strong> Premium abonements uz 3 mēnešiem</li>
        <li><strong>Visi dalībnieki:</strong> Unikāla ziemas izaicinājuma medaļa</li>
      </ul>

      <h3>Kā piedalīties:</h3>
      <ol>
        <li>Reģistrējieties izaicinājumā līdz 5. decembrim</li>
        <li>Ierakstiet visus savus treniņus DeyaRun aplikācijā</li>
        <li>Sekojiet līdzi progress dashboard</li>
      </ol>

      <p>Izaicinājums sākas 1. decembrī! Vai esat gatavs?</p>
    `,
    excerpt: "Pievienojieties DeyaRun ziemas izaicinājumam 2024 un saglabājiet motivāciju visa ziemas!",
    category: "events",
    priority: "high",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    readTime: "3 min",
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop",
    tags: ["izaicinājums", "ziema", "konkurss"],
    status: "published"
  }
];

async function createSampleNews() {
  try {
    console.log('🔗 Connecting to database...');
    await initializeDatabases();

    console.log('👤 Finding admin user...');
    // Find first admin user to use as author
    let adminUser = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
    
    if (!adminUser) {
      console.log('📝 Creating system admin user...');
      // Create a system admin user
      adminUser = new User({
        email: 'system@runacademy.lv',
        firstName: 'System',
        lastName: 'Admin',
        birthDate: new Date('1990-01-01'),
        gender: 'other',
        role: 'admin'
      });
      await adminUser.save();
      console.log('✅ System admin user created');
    }

    console.log(`👨‍💼 Using admin: ${adminUser.firstName} ${adminUser.lastName}`);

    console.log('🗞️ Creating sample news articles...');
    
    // Clear existing news (optional)
    await News.deleteMany({});
    console.log('🗑️ Cleared existing news articles');

    // Create new articles
    for (const articleData of sampleNewsArticles) {
      const article = new News({
        ...articleData,
        author: adminUser._id
      });
      await article.save();
      console.log(`✅ Created: ${article.title}`);
    }

    console.log(`\n🎉 Successfully created ${sampleNewsArticles.length} sample news articles!`);
    console.log('📱 Check your DeyaRun app notification center to see them.');

  } catch (error) {
    console.error('❌ Error creating sample news:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
createSampleNews();