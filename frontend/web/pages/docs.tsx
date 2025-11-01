import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'
import Link from 'next/link'
import { 
  DocumentTextIcon, 
  BookOpenIcon, 
  PlayIcon, 
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

interface ProgressStep {
  id: string
  title: string
  description: string
  completed: boolean
  duration: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

interface DocSection {
  id: string
  title: string
  description: string
  icon: any
  progress: number
  totalSteps: number
  steps: ProgressStep[]
}

const docSections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Darba sākšana',
    description: 'Pilns ceļvedis DeyaRun platformas apguvei - no konta izveides līdz pirmajiem treniņiem un kopienas izmantošanai.',
    icon: PlayIcon,
    progress: 0,
    totalSteps: 8,
    steps: [
      {
        id: 'platform-overview',
        title: 'DeyaRun platforma - ievads',
        description: 'Iepazīstieties ar DeyaRun funkcionalitāti: GPS izsekošanu, AI treneri, progresa analīzi, kopienas funkcijām un personalizētiem treniņu plāniem. Uzziniet par mobilās un web aplikācijas iespējām.',
        completed: false,
        duration: '8 min',
        difficulty: 'beginner'
      },
      {
        id: 'account-setup',
        title: 'Konta izveide un drošība',
        description: 'Detalizēts process konta izveidei ar visu 4 reģistrācijas soļu izskaidrojumu. Uzziniet par paroles drošību, divu-faktoru autentifikāciju un konta pārvaldību. Iepazīstieties ar privātuma iestatījumiem.',
        completed: false,
        duration: '12 min',
        difficulty: 'beginner'
      },
      {
        id: 'profile-completion',
        title: 'Detalizēta profila konfigurācija',
        description: 'Pilnīga informācija par profila aizpildīšanu: personas dati, skriešanas pieredze, veselības rādītāji, aprīkojums un mērķi. Uzziniet, kā pareizi norādīt valsts kodus, dzimšanas datumu un fiziskos parametrus optimāliem AI ieteikumiem.',
        completed: false,
        duration: '18 min',
        difficulty: 'beginner'
      },
      {
        id: 'first-workout',
        title: 'Pirmā treniņa sesija',
        description: 'Soli pa solim ceļvedis pirmā skriešanas treniņa uzsākšanai. GPS konfigurācija, drošības padomi, treniņa sākšana/pabeigšana, datu saglabāšana un pamatanalīze. Uzziniet par offline režīmu un datu sinhronizāciju.',
        completed: false,
        duration: '35 min',
        difficulty: 'beginner'
      },
      {
        id: 'training-plan',
        title: 'AI treniņu plāna personalizācija',
        description: 'Dziļa iedegšanās DeyaRun AI trenera funkcionalitātē. Uzziniet, kā sistēma analizē jūsu datus un izveido personalizētus plānus. Mācieties pielāgot intensitāti, biežumu un mērķus. SMART mērķu iestatīšana.',
        completed: false,
        duration: '22 min',
        difficulty: 'intermediate'
      },
      {
        id: 'dashboard-navigation',
        title: 'Pārskata paneļa pilnīga izmantošana',
        description: 'Detalizēts ceļvedis pa visiem dashboard elementiem: nedēļas pārskats, progresa grafiki, tuvojošies treniņi, sasniegumi, kopienas aktivitātes. Uzziniet par widget pielāgošanu un datu eksportu.',
        completed: false,
        duration: '15 min',
        difficulty: 'beginner'
      },
      {
        id: 'mobile-web-sync',
        title: 'Mobīlās un web sinhronizācija',
        description: 'Kā efektīvi izmantot gan mobilās aplikācijas, gan web platformas priekšrocības. Datu sinhronizācija, offline/online funkcionalitāte, backup sistēmas un ierīču pārvaldība.',
        completed: false,
        duration: '12 min',
        difficulty: 'intermediate'
      },
      {
        id: 'community-join',
        title: 'Kopienas ekosistēmas ievads',
        description: 'Iepazīšanās ar DeyaRun kopienu: draugu pievienošana, grupas, klubi, izaicinājumi. Uzziniet par lietotāju privātuma līmeņiem, aktivitāšu dalīšanu un sociālo mijiedarbību. Kopienas etiķetes pamati.',
        completed: false,
        duration: '16 min',
        difficulty: 'beginner'
      }
    ]
  },
  {
    id: 'training-guides',
    title: 'Treniņu metodikas un plāni',
    description: 'Zinātnē balstīti treniņu plāni visiem līmeņiem - no 5km iesācējiem līdz maratona veterāniem. Profesionālu treneru izstrādātas programmas.',
    icon: BookOpenIcon,
    progress: 0,
    totalSteps: 10,
    steps: [
      {
        id: 'running-fundamentals',
        title: 'Skriešanas pamati un tehnika',
        description: 'Pareizā skriešanas tehnika: soļa mehānika, elpošana, pozitūra. Uzziniet par kadenci, kontakta laiku ar zemi, enerģijas efektivitāti. Video analīze un biežākās kļūdas. Stiepšanās un iesildīšanās protokoli.',
        completed: false,
        duration: '25 min',
        difficulty: 'beginner'
      },
      {
        id: '5k-beginner-program',
        title: 'Iesācēju 5km programma (0→5km)',
        description: 'Pilna 8 nedēļu programma cilvēkiem bez skriešanas pieredzes. Iet/skriet metode, progresīva slodzes palielināšana, atjaunošanās principi. Iekļauj iesildīšanos, spēka treniņus un uzturu. Nedēļas plāns ar 3 treniņiem.',
        completed: false,
        duration: '8 nedēļas',
        difficulty: 'beginner'
      },
      {
        id: '5k-improvement',
        title: '5km uzlabošana un ātruma attīstība',
        description: 'Programma 5km laika uzlabošanai. Intervālu treniņi, tempo skrējieni, fartlek metode. Uzziniet par VO2max, laktāta slieksni un pulszonas. 6 nedēļu intensīva programma pieredzējušiem skrējējiem.',
        completed: false,
        duration: '6 nedēļas',
        difficulty: 'intermediate'
      },
      {
        id: '10k-training',
        title: '10km distance - kompleksa sagatavošana',
        description: '12 nedēļu progresīva 10km programma. Bāzes veidošana, ātruma darbs, konkurences stratēģija. Iekļauts nedēļas periodizācijas plāns, uzturs, atjaunošanās, mentālā sagatavošana un sacensību taktika.',
        completed: false,
        duration: '12 nedēļas',
        difficulty: 'intermediate'
      },
      {
        id: 'half-marathon',
        title: 'Pusmaratona (21km) profesionālā sagatavošana',
        description: '16 nedēļu sistemātiska pusmaratona programma. Garās distances pamati, tempo izturība, ūdens/elektrolītu stratēģija. Detalizēts tapering plāns, sacensību simulācijas un atjaunošanās protokoli.',
        completed: false,
        duration: '16 nedēļas',
        difficulty: 'intermediate'
      },
      {
        id: 'marathon-training',
        title: 'Maratona (42km) pilnā programma',
        description: '20 nedēļu intensīva maratona sagatavošana. Periodizācija, makrocikli, pīķa nedēļas. Wall fenomena novēršana, ūdeņošana, enerģijas stratēģija. Mentālās sagatavotības tehnikas un sacensību plāns.',
        completed: false,
        duration: '20 nedēļas',
        difficulty: 'advanced'
      },
      {
        id: 'speed-power-training',
        title: 'Ātruma un spēka attīstība',
        description: 'Specializēti treniņi maksimālā ātruma, anaerobās jaudas un neiromuskulārās koordinācijas attīstībai. Sprintu tehnika, pliometrija, kalnu treniņi. Track&Field metodikas skriešanai.',
        completed: false,
        duration: '8 nedēļas',
        difficulty: 'advanced'
      },
      {
        id: 'endurance-base-building',
        title: 'Aerobās bāzes veidošana',
        description: 'Ilgtermiņa izturības attīstība. MAF metode, polarizētā treniņa princips, aerobā efektivitāte. 12-16 nedēļu bāzes periods ar zemām pulszonām. Tilpuma progresīva palielināšana.',
        completed: false,
        duration: '12-16 nedēļas',
        difficulty: 'intermediate'
      },
      {
        id: 'injury-prevention',
        title: 'Traumu profilakse un ķermeņa aprūpe',
        description: 'Visaptveroša traumu novēršanas sistēma. Funkcionālie treniņi, mobilitāte, stability. Biežākās skrējēju traumas, to cēloņi un novēršana. Atjaunošanās protokoli, masāža, fizioterapijas pamati.',
        completed: false,
        duration: '4 nedēļas',
        difficulty: 'intermediate'
      },
      {
        id: 'cross-training',
        title: 'Papildu sporta veidi un cross-training',
        description: 'Kā citi sporta veidi uzlabo skriešanas rezultātus. Peldēšana, riteņbraukšana, airēšana, slēpošana. Periodizācija ar dažādām aktivitātēm. Sezonāla plānošana un treniņu daudzveidība.',
        completed: false,
        duration: '6 nedēļas',
        difficulty: 'intermediate'
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Datu analīze un progresa optimizācija',
    description: 'Padziļināta sporta analīze: no GPS datiem līdz fizioloģiskajiem rādītājiem. Mācieties pieņemt lēmumus, balstoties uz datiem.',
    icon: ChartBarIcon,
    progress: 0,
    totalSteps: 8,
    steps: [
      {
        id: 'gps-data-understanding',
        title: 'GPS datu pilnīga interpretācija',
        description: 'Detalizēta GPS metriku analīze: ātrums, pace, distance, augstuma maiņas, kadence. Ground contact time, vertical oscillation, power meters. Kā identificēt datu kļūdas un uzticamības problēmas.',
        completed: false,
        duration: '22 min',
        difficulty: 'intermediate'
      },
      {
        id: 'heart-rate-zones',
        title: 'Pulsa zonas un aerobie/anaerobie sliekšņi',
        description: 'Zinātniski pamatota pulsa zonu noteikšana. Laktāta sliekšņa testi, VT1/VT2 identifikācija, individuāla zonu kalibrācija. HRV (Heart Rate Variability) analīze atjaunošanās novērtēšanai.',
        completed: false,
        duration: '30 min',
        difficulty: 'advanced'
      },
      {
        id: 'performance-metrics',
        title: 'Veiktspējas metriku sistēma',
        description: 'Training Load, TSS (Training Stress Score), CTL/ATL/TSB analīze. VO2max novērtēšana, anaerobā ātruma rezerve, kritiskā ātruma noteikšana. Efficiency Factor un Decoupling analīze.',
        completed: false,
        duration: '35 min',
        difficulty: 'advanced'
      },
      {
        id: 'progress-tracking-advanced',
        title: 'Progresa izsekošanas metodikas',
        description: 'Dažādu progress tracking sistēmu izveidošana. Trending analīze, sezonālie salīdzinājumi, benchmark testi. Power curves, pace/HR relācijas, fitness signatures un to interpretācija.',
        completed: false,
        duration: '25 min',
        difficulty: 'intermediate'
      },
      {
        id: 'fatigue-recovery-analysis',
        title: 'Noguruma un atjaunošanās analīze',
        description: 'Biomarķieru izsekošana: miera pulss, HRV, subjektīvais novērtējums. Sleep quality impact, stress markers. Periodizācijas efektivitātes novērtēšana un pārmācīšanās identificēšana.',
        completed: false,
        duration: '28 min',
        difficulty: 'advanced'
      },
      {
        id: 'race-analysis',
        title: 'Sacensību stratēģijas un post-race analīze',
        description: 'Sacensību taktikas plānošana, pacing stratēģijas. Post-race detalizēta analīze: splits, negative/positive splitting, competition execution. Physiological stress analīze sacensībās.',
        completed: false,
        duration: '30 min',
        difficulty: 'advanced'
      },
      {
        id: 'environmental-factors',
        title: 'Apkārtējās vides ietekmes analīze',
        description: 'Temperature, mitruma, vēja, augstuma ietekme uz veiktspēju. Heat index, wind chill calculations. Sezonālo variāciju ietekme uz treniņu un sacensību rezultātiem.',
        completed: false,
        duration: '20 min',
        difficulty: 'intermediate'
      },
      {
        id: 'predictive-modeling',
        title: 'Rezultātu prognozēšana un mērķu plānošana',
        description: 'AI algoritmu izmantošana rezultātu prognozēšanai. VDOT, Riegel, Cameron modelis distance konvertēšanai. Long-term goal setting un reverse periodization plānošana.',
        completed: false,
        duration: '32 min',
        difficulty: 'advanced'
      }
    ]
  },
  {
    id: 'nutrition-health',
    title: 'Uzturs, atjaunošanās un veselība',
    description: 'Holistiska pieeja skrējēja veselībai: sports nutrition, atjaunošanās protokoli, miega optimizācija un mentālā labsajūta.',
    icon: HeartIcon,
    progress: 0,
    totalSteps: 7,
    steps: [
      {
        id: 'sports-nutrition-fundamentals',
        title: 'Sporta uztura pamati skrējējiem',
        description: 'Makro un mikronutrientu vajadzības izturības sportistiem. Carb loading, protein timing, fat adaptation. Pre/during/post workout nutrition. Hidratācijas stratēģijas un elektrolītu balanss.',
        completed: false,
        duration: '40 min',
        difficulty: 'intermediate'
      },
      {
        id: 'race-day-nutrition',
        title: 'Sacensību dienas uztura stratēģija',
        description: 'Detalizēts plāns sacensību uztura optimizācijai. Carb loading protokols, race morning meals, during-race fueling. Stomach training, GI distress prevention. Distance-specific strategies.',
        completed: false,
        duration: '25 min',
        difficulty: 'intermediate'
      },
      {
        id: 'recovery-protocols',
        title: 'Atjaunošanās protokoli un tehnikas',
        description: 'Zinātniski pierādītas atjaunošanās metodes. Active recovery, compression, ice baths, sauna. Sleep optimization, stress management. Recovery tracking un periodizācija.',
        completed: false,
        duration: '35 min',
        difficulty: 'intermediate'
      },
      {
        id: 'sleep-optimization',
        title: 'Miega kvalitātes optimizācija sportistiem',
        description: 'Miega fāžu izpratne, circadian rhythm regulācija. Sleep hygiene, bedroom optimization, technology impact. Recovery sleep vs performance sleep. Sleep debt un travel adjustments.',
        completed: false,
        duration: '30 min',
        difficulty: 'beginner'
      },
      {
        id: 'injury-management',
        title: 'Traumu pārvaldība un rehabilitācija',
        description: 'Common running injuries: IT band, plantar fasciitis, shin splints, stress fractures. RICE vs modern protocols. Return to running guidelines, load management post-injury.',
        completed: false,
        duration: '45 min',
        difficulty: 'advanced'
      },
      {
        id: 'mental-training',
        title: 'Mentālā spēka attīstība',
        description: 'Sports psychology skrējējiem. Visualization, goal setting, race day nerves. Pain tolerance training, motivation maintenance, burnout prevention. Mindfulness un meditation practices.',
        completed: false,
        duration: '28 min',
        difficulty: 'intermediate'
      },
      {
        id: 'female-athlete-specific',
        title: 'Sieviešu specifiskās vajadzības skrējienos',
        description: 'Menstrual cycle impact uz veiktspēju. Iron deficiency, bone health, REDs (Relative Energy Deficiency in Sport). Pregnancy un return to running. Hormonal considerations.',
        completed: false,
        duration: '35 min',
        difficulty: 'intermediate'
      }
    ]
  },
  {
    id: 'community',
    title: 'Kopienas funkcijas un sociālā mijiedarbība',
    description: 'Maksimāli izmantojiet DeyaRun kopienas spēku: grupas, izaicinājumi, mentorings un globālā skrējēju tīkla priekšrocības.',
    icon: UserGroupIcon,
    progress: 0,
    totalSteps: 6,
    steps: [
      {
        id: 'social-features-complete',
        title: 'Sociālo funkciju pilnīga izmantošana',
        description: 'Draugu sistēma, followers/following dynamics. Aktivitāšu dalīšana, komentāri, reactions. Privacy settings, public/private workouts. Social feed algoritma izpratne un engagement optimizācija.',
        completed: false,
        duration: '20 min',
        difficulty: 'beginner'
      },
      {
        id: 'challenges-competitions',
        title: 'Izaicinājumi un virtuālās sacensības',
        description: 'Participation stratēģijas monthly challenges. Virtual races, segment competitions, team challenges. Leaderboards, achievements system. Creating custom challenges for groups.',
        completed: false,
        duration: '15 min',
        difficulty: 'beginner'
      },
      {
        id: 'groups-clubs-management',
        title: 'Grupu un klubu pārvaldība',
        description: 'Local running groups creation/joining. Club administration, member management, event organization. Training group formation, pace group matching. Leadership roles un community building.',
        completed: false,
        duration: '25 min',
        difficulty: 'intermediate'
      },
      {
        id: 'mentoring-coaching',
        title: 'Mentorings un coaching sistēma',
        description: 'Certified coach program, finding mentors, peer coaching. Knowledge sharing, experience transfer. Structured feedback system, progress accountability partnerships.',
        completed: false,
        duration: '22 min',
        difficulty: 'intermediate'
      },
      {
        id: 'global-events',
        title: 'Globālie notikumi un kampaņas',
        description: 'International running day participation, charity runs, global challenges. Cultural exchange through running, destination running events. Ambassador program un community leadership.',
        completed: false,
        duration: '18 min',
        difficulty: 'beginner'
      },
      {
        id: 'community-content',
        title: 'Satura radīšana un znowledžu dalīšana',
        description: 'Blog posts, training tips sharing, photo/video content. Route recommendations, gear reviews. Building personal brand within community, thought leadership development.',
        completed: false,
        duration: '30 min',
        difficulty: 'intermediate'
      }
    ]
  },
  {
    id: 'advanced-features',
    title: 'Uzlabotās funkcijas un integrācijas',
    description: 'Profesionāļu līmeņa rīki: API, pielāgotas integrācijas, advanced analytics un enterprise funkcionalitāte.',
    icon: CogIcon,
    progress: 0,
    totalSteps: 8,
    steps: [
      {
        id: 'custom-workout-builder',
        title: 'Pielāgotu treniņu veidotājs',
        description: 'Advanced workout creator: interval structures, warm-up/cool-down protocols. Power/pace/HR based targets. Seasonal periodization templates, microcycle planning. Workout library management.',
        completed: false,
        duration: '35 min',
        difficulty: 'advanced'
      },
      {
        id: 'device-integrations',
        title: 'Ierīču integrācijas un sync',
        description: 'Garmin Connect, Strava, Apple Health, Google Fit synchronization. Polar, Suunto, Wahoo compatibility. Smart watch optimal settings, data field customization. Troubleshooting sync issues.',
        completed: false,
        duration: '20 min',
        difficulty: 'intermediate'
      },
      {
        id: 'api-development',
        title: 'DeyaRun API un developers tools',
        description: 'REST API authentication, endpoints documentation. Rate limiting, webhook configurations. SDK usage, custom integrations development. Third-party app development guidelines.',
        completed: false,
        duration: '60 min',
        difficulty: 'advanced'
      },
      {
        id: 'data-export-import',
        title: 'Datu eksports, imports un migrācija',
        description: 'Comprehensive data export: GPX, TCX, FIT formats. Historical data migration from other platforms. Backup strategies, data sovereignty. GDPR compliance tools, data portability rights.',
        completed: false,
        duration: '15 min',
        difficulty: 'intermediate'
      },
      {
        id: 'automation-workflows',
        title: 'Automatizācija un workflows',
        description: 'Training plan automation, smart notifications. Weather-based workout adjustments, injury risk alerts. Performance milestone celebrations, social sharing automation. IFTTT/Zapier integrations.',
        completed: false,
        duration: '25 min',
        difficulty: 'advanced'
      },
      {
        id: 'enterprise-features',
        title: 'Enterprise un team funkcionalitāte',
        description: 'Team dashboards, corporate wellness programs. Bulk user management, training camp coordination. Performance benchmarking across teams. Custom branding, white-label solutions.',
        completed: false,
        duration: '40 min',
        difficulty: 'advanced'
      },
      {
        id: 'ai-coaching-advanced',
        title: 'Uzlabotais AI treneris un Machine Learning',
        description: 'AI algorithm insights, personalization engines. Predictive analytics, injury risk modeling. Custom AI model training, feedback loops. Future feature development participation.',
        completed: false,
        duration: '45 min',
        difficulty: 'advanced'
      },
      {
        id: 'beta-testing',
        title: 'Beta testēšana un jauno funkciju piekļuve',
        description: 'Beta testing program participation, early access features. Feedback providing methodologies, bug reporting. Feature request prioritization, community voting systems. Alpha testing qualification.',
        completed: false,
        duration: '20 min',
        difficulty: 'intermediate'
      }
    ]
  }
]

function DocsPage() {
  const { isAuthenticated } = useAuth()
  const [selectedSection, setSelectedSection] = useState<DocSection | null>(null)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-400/10'
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/10'
      case 'advanced': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Iesācējs'
      case 'intermediate': return 'Vidējais'
      case 'advanced': return 'Uzlabotais'
      default: return 'Nezināms'
    }
  }

  // Calculate total steps across all sections
  const totalStepsAcrossAllSections = docSections.reduce((total, section) => total + section.totalSteps, 0)
  const totalCompletedSteps = docSections.reduce((total, section) => {
    return total + section.steps.filter(step => step.completed).length
  }, 0) 

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Navigation */}
      <nav className="bg-surface/95 backdrop-blur-md border-b border-gray-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-coral rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold gradient-text">DeyaRun</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link href="/dashboard" className="btn-primary">
                  Pārskats
                </Link>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/auth/login" className="text-gray-300 hover:text-white transition-colors">
                    Ielogoties
                  </Link>
                  <Link href="/auth/register" className="btn-primary">
                    Reģistrēties
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-primary/10 via-coral/5 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-coral rounded-full flex items-center justify-center">
              <DocumentTextIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            DeyaRun <span className="gradient-text">dokumentācija</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Visaptverošs ceļvedis DeyaRun platformas apguvei. No iesācēju pamatiem līdz profesionāļu līmeņa funkcionalitātei - 
            viss, kas nepieciešams, lai kļūtu par skriešanas ekspertu.
          </p>
          <div className="mt-8 flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{docSections.length}</div>
              <div className="text-gray-400 text-sm">Sadaļas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-coral">{totalStepsAcrossAllSections}</div>
              <div className="text-gray-400 text-sm">Mācību soļi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {Math.round((totalCompletedSteps / totalStepsAcrossAllSections) * 100) || 0}%
              </div>
              <div className="text-gray-400 text-sm">Progress</div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {!selectedSection ? (
            <>
              {/* Quick Start Guide */}
              <div className="mb-16">
                <div className="bg-gradient-to-br from-primary/10 to-coral/10 rounded-xl p-8 border border-gray-700 mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">🚀 Ātrās sākšanas ceļvedis</h2>
                  <p className="text-gray-300 mb-6">
                    Jauns DeyaRun lietotājs? Sāciet ar šiem soļiem, lai maksimāli izmantotu platformu:
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-lg font-semibold text-white mb-2">1. Sāciet šeit</div>
                      <p className="text-gray-400 text-sm">Uzsāciet ar "Darba sākšana" sadaļu</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-lg font-semibold text-white mb-2">2. Izvēlieties plānu</div>
                      <p className="text-gray-400 text-sm">Pārejiet uz "Treniņu metodikas"</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-lg font-semibold text-white mb-2">3. Analizējiet datus</div>
                      <p className="text-gray-400 text-sm">Apgūstiet "Datu analīzi"</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Overview */}
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-8">📊 Jūsu progress</h2>
                <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 mb-8">
                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {Math.round((totalCompletedSteps / totalStepsAcrossAllSections) * 100) || 0}%
                      </div>
                      <p className="text-gray-300">Kopējais progress</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-coral mb-2">{totalCompletedSteps}</div>
                      <p className="text-gray-300">Pabeigti soļi</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-400 mb-2">{totalStepsAcrossAllSections}</div>
                      <p className="text-gray-300">Kopējie soļi</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-400 mb-2">{docSections.length}</div>
                      <p className="text-gray-300">Sadaļas</p>
                    </div>
                  </div>
                  
                  {/* Overall Progress Bar */}
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Kopējais progress</span>
                      <span className="text-gray-400">
                        {totalCompletedSteps}/{totalStepsAcrossAllSections}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-primary to-coral h-3 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(totalCompletedSteps / totalStepsAcrossAllSections) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Path Recommendations */}
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-8">🎯 Ieteicamie mācību ceļi</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-green-400 mb-3">Iesācējiem</h3>
                    <p className="text-gray-300 text-sm mb-4">Ideāls sākums tiem, kas vēl nav skriešanas pieredzes</p>
                    <ul className="text-green-300 text-sm space-y-1">
                      <li>• Darba sākšana</li>
                      <li>• 5km iesācēju programma</li>
                      <li>• Uzturs un veselība</li>
                      <li>• Kopienas funkcijas</li>
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-yellow-400 mb-3">Vidējiem</h3>
                    <p className="text-gray-300 text-sm mb-4">Skrējējiem ar pamatpieredzi, kas vēlas uzlabot rezultātus</p>
                    <ul className="text-yellow-300 text-sm space-y-1">
                      <li>• 10km un pusmaratona plāni</li>
                      <li>• Datu analīze</li>
                      <li>• Traumu profilakse</li>
                      <li>• Mentālā sagatavošana</li>
                    </ul>
                  </div>
                  
                  <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-red-400 mb-3">Uzlabotiem</h3>
                    <p className="text-gray-300 text-sm mb-4">Pieredzējušiem sportistiem un treneriem</p>
                    <ul className="text-red-300 text-sm space-y-1">
                      <li>• Maratona sagatavošana</li>
                      <li>• Uzlabotā analītika</li>
                      <li>• API integrācijas</li>
                      <li>• Enterprise funkcijas</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Documentation Sections */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {docSections.map((section) => {
                  const Icon = section.icon
                  const completedSteps = section.steps.filter(step => step.completed).length
                  const progressPercent = (completedSteps / section.totalSteps) * 100

                  return (
                    <div 
                      key={section.id}
                      onClick={() => setSelectedSection(section)}
                      className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:transform hover:scale-105"
                    >
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-coral rounded-lg flex items-center justify-center mr-4">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-1">{section.title}</h3>
                          <div className="flex items-center text-sm text-gray-400">
                            <span>{completedSteps}/{section.totalSteps} soļi</span>
                            <span className="mx-2">•</span>
                            <span>{Math.round(progressPercent)}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                        {section.description}
                      </p>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                        <div 
                          className="bg-gradient-to-r from-primary to-coral h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{section.totalSteps} soļi</span>
                        <span className="text-primary font-medium">Sākt →</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            /* Selected Section Detail */
            <div>
              {/* Back Button */}
              <button 
                onClick={() => setSelectedSection(null)}
                className="flex items-center text-gray-400 hover:text-white transition-colors mb-8"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Atpakaļ uz dokumentāciju
              </button>

              {/* Section Header */}
              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 mb-8">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-coral rounded-xl flex items-center justify-center mr-6">
                    <selectedSection.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-2">{selectedSection.title}</h1>
                    <p className="text-gray-300 text-lg">{selectedSection.description}</p>
                  </div>
                </div>
                
                {/* Progress */}
                <div className="bg-gray-900/50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-medium text-lg">Progress sadaļā</span>
                    <span className="text-gray-400">
                      {selectedSection.steps.filter(s => s.completed).length}/{selectedSection.totalSteps}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                    <div 
                      className="bg-gradient-to-r from-primary to-coral h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(selectedSection.steps.filter(s => s.completed).length / selectedSection.totalSteps) * 100}%` 
                      }}
                    ></div>
                  </div>
                  
                  {/* Difficulty Distribution */}
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                      <span className="text-gray-300">
                        {selectedSection.steps.filter(s => s.difficulty === 'beginner').length} iesācējs
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                      <span className="text-gray-300">
                        {selectedSection.steps.filter(s => s.difficulty === 'intermediate').length} vidējais
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                      <span className="text-gray-300">
                        {selectedSection.steps.filter(s => s.difficulty === 'advanced').length} uzlabotais
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {selectedSection.steps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`bg-gray-800/50 rounded-xl p-6 border transition-all duration-300 ${
                      step.completed 
                        ? 'border-green-500/50 bg-green-900/10' 
                        : 'border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start">
                      {/* Step Number/Check */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 flex-shrink-0 ${
                        step.completed 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {step.completed ? (
                          <CheckCircleIcon className="w-6 h-6" />
                        ) : (
                          <span className="font-bold text-lg">{index + 1}</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`text-xl font-semibold ${
                            step.completed ? 'text-green-400' : 'text-white'
                          }`}>
                            {step.title}
                            {step.completed && (
                              <span className="ml-3 text-sm text-green-400 font-normal">✓ Pabeigts</span>
                            )}
                          </h3>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center text-gray-400 text-sm">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {step.duration}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(step.difficulty)}`}>
                              {getDifficultyText(step.difficulty)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-300 leading-relaxed mb-4">
                          {step.description}
                        </p>
                        
                        {!step.completed && (
                          <button className="btn-primary text-sm">
                            Sākt šo soli
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Section Completion */}
              {selectedSection.steps.filter(s => s.completed).length === selectedSection.totalSteps && (
                <div className="mt-8 bg-green-900/20 border border-green-500/30 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-green-400 mb-2">Apsveicam!</h3>
                  <p className="text-gray-300">
                    Jūs esat pabeiguši visus soļus sadaļā "{selectedSection.title}". 
                    Tagad varat pāriet pie nākamās sadaļas vai dzīļāk iegremdēties praktiskajā pieredzē.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default DocsPage