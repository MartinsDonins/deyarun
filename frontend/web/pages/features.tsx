import { 
  MapPinIcon, 
  ChartPieIcon, 
  BoltIcon, 
  TrophyIcon, 
  HeartIcon, 
  UserGroupIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CloudIcon,
  ShieldCheckIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import Footer from '../components/Footer'

const features = [
  {
    icon: MapPinIcon,
    title: 'GPS Izsekošana',
    description: 'Precīza GPS izsekošana ar detalizētu maršruta analīzi un distances mērījumiem.',
    details: [
      'Real-time GPS koordinātu ierakstīšana',
      'Maršruta kartes ar augstumu profiliem',
      'Distance, temps un ātruma mērījumi',
      'Geogrāfisko punktu atzīmēšana',
      'Treniņu maršrutu salīdzināšana'
    ]
  },
  {
    icon: ChartPieIcon,
    title: 'Progresa Analīze',
    description: 'Detalizēta statistika par taviem treniņiem, progresu un sasniegumiem.',
    details: [
      'Personīga progresa datu vizualizācija',
      'Nedēļas, mēneša un gada statistika',
      'Treniņu intensitātes analīze',
      'Mērķu sasniegumu izsekošana',
      'Progresa salīdzināšana ar iepriekšējiem periodiem'
    ]
  },
  {
    icon: BoltIcon,
    title: 'Personalizēti Plāni',
    description: 'Treniņu plāni, kas pielāgojas tavam līmenim un mērķiem.',
    details: [
      'Personalizēta treniņu plānu ģenerēšana',
      'Pielāgošana personīgajam līmenim',
      'Adaptīvi plāni atkarībā no progresa',
      'Dažādi treniņu veidi un intensitātes',
      'Atpūtas un atkopšanās periodi'
    ]
  },
  {
    icon: TrophyIcon,
    title: 'Sasniegumu Sistēma',
    description: 'Motivējoša sasniegumu sistēma ar mērķiem un apbalvojumiem.',
    details: [
      'Dažādi sasniegumu veidi un līmeņi',
      'Personīgie un kopienas mērķi',
      'Digitāli sertifikāti un medaļas',
      'Skriešanas izaicinājumi',
      'Sociāla atzīšana kopienā'
    ]
  },
  {
    icon: HeartIcon,
    title: 'Veselības Monitorings',
    description: 'Seko savam pulsa ritmam, sadedzinātajām kalorijām un vispārējai aktivitātei.',
    details: [
      'Pulsa ritma zonas analīze',
      'Kaloriju sadedzināšanas aprēķini',
      'Miera pulsa izsekošana',
      'Stress līmeņa monitorings',
      'Miega kvalitātes novērtēšana'
    ]
  },
  {
    icon: UserGroupIcon,
    title: 'Skriešanas Kopiena',
    description: 'Pievienojies aktīvai skrējēju kopienai un dalies pieredzē.',
    details: [
      'Kopienas forumi un diskusijas',
      'Kopēji treniņi un pasākumi',
      'Mentoru un treneru atbalsts',
      'Iedvesmojošas stāsti un pieredzes',
      'Sociālā motivācija un atbalsts'
    ]
  }
]

const platforms = [
  {
    icon: ComputerDesktopIcon,
    title: 'Web Platforma',
    description: 'Pilnvērtīga desktop pieredze ar visām funkcijām',
    features: [
      'Detalizēta statistika un analīze',
      'Treniņu plānu izveide un pārvaldība',
      'Kopienas funkcijas',
      'Datu eksportēšana',
      'Administratīvās funkcijas'
    ]
  },
  {
    icon: DevicePhoneMobileIcon,
    title: 'Mobilā Aplikācija',
    description: 'iOS un Android aplikācija ar GPS izsekošanu',
    features: [
      'GPS izsekošana reāllaikā',
      'Offline režīms treniņu laikā',
      'Push paziņojumi',
      'Ātra treniņu uzsākšana',
      'Sinhronizācija ar web platformu'
    ]
  },
  {
    icon: CloudIcon,
    title: 'Cloud Sinhronizācija',
    description: 'Visi dati droši saglabāti mākonī',
    features: [
      'Automātiska datu dublēšana',
      'Sinhronizācija starp ierīcēm',
      'Datu drošība un privātums',
      'GDPR atbilstība',
      '24/7 datu pieejamība'
    ]
  }
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-coral rounded-lg flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">DeyaRun</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-300 hover:text-white transition-colors">
                Ielogoties
              </Link>
              <Link href="/auth/register" className="btn-primary">
                Reģistrēties
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full glass-nav mb-8">
            <ShieldCheckIcon className="w-5 h-5 text-coral mr-2" />
            <span className="text-sm font-medium text-white">Pilna Funkcionalitāte</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-bold mb-8 leading-tight">
            <span className="gradient-text">Visas</span> funkcijas
            <br />
            <span className="text-white">vienā</span> <span className="gradient-text">vietā</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            DeyaRun piedāvā visu nepieciešamo profesionālam skriešanas treningam - 
            no GPS izsekošanas līdz detalizētai progresa analīzei.
          </p>

          <Link href="/auth/register" className="btn-primary text-lg px-8 py-4 inline-flex items-center">
            Sākt bez maksas
            <CheckIcon className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              <span className="gradient-text">Galvenās</span> funkcijas
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Katrs elements izstrādāts, lai palīdzētu tev sasniegt labākos rezultātus
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="card hover-lift">
                  <div className="p-6">
                    <div className="w-12 h-12 bg-gray-800 border border-coral rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-coral" />
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-3 gradient-text">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-400 mb-4 leading-relaxed text-sm">
                      {feature.description}
                    </p>

                    <ul className="space-y-2">
                      {feature.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-300">
                          <CheckIcon className="w-4 h-4 text-coral mr-2 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-900/30 via-transparent to-gray-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Available <span className="gradient-text">visur</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Izmanto DeyaRun jebkurā ierīcē - visi dati sinhronizēti un droši
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {platforms.map((platform, index) => {
              const Icon = platform.icon
              return (
                <div key={index} className="card hover-lift backdrop-blur-sm bg-surface/80">
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-gray-800 border border-coral rounded-xl flex items-center justify-center mx-auto mb-6">
                      <Icon className="w-8 h-8 text-coral" />
                    </div>
                    
                    <h3 className="text-2xl font-semibold mb-3 gradient-text">
                      {platform.title}
                    </h3>
                    
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      {platform.description}
                    </p>

                    <ul className="space-y-3 text-left">
                      {Array.isArray(platform.features) && platform.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-300">
                          <CheckIcon className="w-4 h-4 text-coral mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Gatavs <span className="gradient-text">sākt</span>?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Reģistrējies bez maksas un izmēģini visas DeyaRun funkcijas
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-primary text-lg px-8 py-4">
              Sākt bez maksas
            </Link>
            <Link href="/contact" className="btn-secondary text-lg px-8 py-4">
              Uzdot jautājumu
            </Link>
          </div>

          <p className="text-gray-400 text-sm mt-6">
            ✓ Bez maksas reģistrācija  ✓ Nav nepieciešama kredītkarte  ✓ Pilna funkcionalitāte
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}