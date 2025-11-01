import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { 
  PlayIcon, 
  TrophyIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  ArrowRightIcon,
  CheckIcon,
  StarIcon,
  ClockIcon,
  MapPinIcon,
  HeartIcon,
  SparklesIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CpuChipIcon,
  ChartPieIcon,
  BoltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'

const ThemeToggle = dynamic(() => import('../components/ThemeToggle'), {
  ssr: false,
  loading: () => <div className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse" />
})

const stats = [
  { label: 'Profesionāla platforma', value: '2025', icon: UserGroupIcon },
  { label: 'GPS izsekošana', value: 'Real-time', icon: MapPinIcon },
  { label: 'Personalizēti plāni', value: 'Smart', icon: ChartBarIcon },
  { label: 'Web & Mobile', value: '24/7', icon: TrophyIcon }
]


const features = [
  {
    icon: MapPinIcon,
    title: 'GPS Izsekošana',
    description: 'Precīza GPS izsekošana ar detalizētu maršruta analīzi un distances mērījumiem.',
    highlight: true
  },
  {
    icon: ChartPieIcon,
    title: 'Progresa Analīze',
    description: 'Detalizēta statistika par taviem treniņiem, progresu un sasniegumiem.',
    highlight: true
  },
  {
    icon: BoltIcon,
    title: 'Personalizēti Plāni',
    description: 'Treniņu plāni, kas pielāgojas tavam līmenim un mērķiem.',
    highlight: true
  },
  {
    icon: TrophyIcon,
    title: 'Sasniegumu Sistēma',
    description: 'Izseko savu progresu un sasniedz jaunus mērķus ar motivējošu sasniegumu sistēmu.',
    highlight: false
  },
  {
    icon: HeartIcon,
    title: 'Veselības Monitorings',
    description: 'Seko savam pulsa ritmam, sadedzinātajām kalorijām un vispārējai fiziskajai aktivitātei.',
    highlight: false
  },
  {
    icon: UserGroupIcon,
    title: 'Skriešanas Kopiena',
    description: 'Pievienojies skriešanas kopienai un dalies savā pieredzē ar citiem skrējējiem.',
    highlight: false
  }
]

const testimonials = [
  {
    name: 'Anna Bergmane',
    role: 'Maratona skrējēja',
    content: 'DeyaRun palīdzēja man sagatavoties pirmajam maratonam. Treniņu plāns bija ideāls!',
    rating: 5
  },
  {
    name: 'Jānis Kalniņš',
    role: 'Iesācējs skrējējs',
    content: 'Nekad nebiju domājis, ka skriešana var būt tik interesanta. Tagad skrien katru dienu!',
    rating: 5
  },
  {
    name: 'Linda Ozoliņa',
    role: 'Fitness trenere',
    content: 'Lieliska aplikācija gan personīgajam lietošanai, gan klientu treniņu plānošanai.',
    rating: 5
  }
]

export default function HomePage() {
  const { isAuthenticated, user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <>
      <Head>
        <title>DeyaRun - Personīgais skrējiena treneris</title>
        <meta name="description" content="Sasniedz savus skriešanas mērķus ar personalizētiem treniņu plāniem, precīzu GPS izsekošanu un profesionālu progresa analīzi." />
      </Head>
      <div className="min-h-screen bg-bg text-white">
      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-coral rounded-lg flex items-center justify-center">
                <PlayIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">DeyaRun</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle size="sm" />
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300">Sveiks, {user?.firstName}!</span>
                  <Link 
                    href="/dashboard"
                    className="btn-primary"
                  >
                    Pārskats
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link 
                    href="/auth/login"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Ielogoties
                  </Link>
                  <Link 
                    href="/auth/register"
                    className="btn-primary"
                  >
                    Reģistrēties
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Modern Dark Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-black/10 to-transparent"></div>
          <div className="absolute top-20 left-20 w-72 h-72 bg-coral/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-coral/8 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
            <div className="text-center max-w-5xl mx-auto">
              {/* Status Badge */}
              <div className="inline-flex items-center px-4 py-2 rounded-full glass-nav mb-8">
                <ShieldCheckIcon className="w-5 h-5 text-coral mr-2" />
                <span className="text-sm font-medium text-white">Profesionāla Skriešanas Platforma</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
                <span className="gradient-text">Tavs</span>
                <br />
                <span className="text-white">Skriešanas</span>
                <br />
                <span className="gradient-text">Treneris</span>
              </h1>
              
              <p className="text-lg lg:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Sasniedz savus skriešanas mērķus ar personalizētiem treniņu plāniem, 
                precīzu GPS izsekošanu un profesionālu progresa analīzi.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                {!isAuthenticated ? (
                  <>
                    <Link 
                      href="/auth/register"
                      className="btn-primary text-lg px-8 py-4 group"
                    >
                      Sākt bez maksas
                      <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link 
                      href="/auth/login"
                      className="btn-secondary text-lg px-8 py-4"
                    >
                      Ielogoties
                    </Link>
                  </>
                ) : (
                  <Link 
                    href="/dashboard"
                    className="btn-primary text-lg px-8 py-4 group"
                  >
                    Doties uz pārskatu
                    <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
                {stats.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <div key={index} className="card group hover-lift cursor-pointer">
                      <div className="text-center p-6">
                        <div className="w-12 h-12 bg-gray-800 border border-coral/30 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform group-hover:border-coral">
                          <Icon className="w-6 h-6 text-coral" />
                        </div>
                        <div className="text-3xl lg:text-4xl font-bold gradient-text mb-2">
                          {stat.value}
                        </div>
                        <div className="text-gray-400 text-sm lg:text-base">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 relative">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/10 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full glass-nav mb-6">
              <TrophyIcon className="w-5 h-5 text-coral mr-2" />
              <span className="text-sm font-medium text-white">Galvenās Funkcijas</span>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              <span className="gradient-text">Profesionāla</span> Skriešanas Platforma
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Visa nepieciešamā funkcionalitāte profesionālam skriešanas treningam - 
              personalizēti plāni, GPS izsekošana un detalizēta progresa analīze.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index}
                  className={`card hover-lift relative overflow-hidden ${
                    feature.highlight ? 'border-coral/30 bg-gradient-to-br from-gray-900/80 to-gray-800/80' : ''
                  }`}
                >
                  
                  <div className="p-6">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                      feature.highlight 
                        ? 'bg-gray-800 border border-coral' 
                        : 'bg-gray-800/50 border border-gray-700'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        feature.highlight ? 'text-coral' : 'text-gray-400'
                      }`} />
                    </div>
                    
                    <h3 className={`text-xl font-semibold mb-3 ${
                      feature.highlight ? 'gradient-text' : 'text-white'
                    }`}>
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-400 leading-relaxed text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Kā tas <span className="gradient-text">darbojas</span>?
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Tikai 3 vienkārši soļi, lai sāktu savu profesionālo skrējiena ceļojumu
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 border border-coral rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-coral">
                1
              </div>
              <h3 className="text-2xl font-semibold mb-4">Reģistrējies</h3>
              <p className="text-gray-400 leading-relaxed">
                Izveido savu profilu un pastāsti mums par saviem skrējiena mērķiem un pieredzi.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 border border-coral rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-coral">
                2
              </div>
              <h3 className="text-2xl font-semibold mb-4">Saņem plānu</h3>
              <p className="text-gray-400 leading-relaxed">
                Mūsu sistēma izstrādā personalizētu treniņu plānu, kas atbilst tavam līmenim un mērķiem.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 border border-coral rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-coral">
                3
              </div>
              <h3 className="text-2xl font-semibold mb-4">Sāc skriet!</h3>
              <p className="text-gray-400 leading-relaxed">
                Seko savam plānam, izseko progresu un sasniedz savus mērķus kopā ar mūsu kopienu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32 relative">
        {/* Modern Dark Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-transparent to-gray-800/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Ko saka mūsu <span className="gradient-text">lietotāji</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Īstās atsauksmes no cilvēkiem, kuri jau izmanto Skriešanas Akadēmiju
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="card hover-lift backdrop-blur-sm bg-surface/80 border-gray-700/50"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-gray-400 text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="py-20 lg:py-32 relative">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 bg-coral/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-coral/8 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Available <span className="gradient-text">visur</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Izmanto Skriešanas Akadēmiju gan datorā, gan mobilajā ierīcē - vienmēr un visur
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-6">
                <ComputerDesktopIcon className="w-8 h-8 text-coral mr-3" />
                <h3 className="text-2xl font-semibold">Web aplikācija</h3>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span>Detalizēta statistika un analīze</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span>Treniņu plānu izveide un pārvaldība</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span>Kopienas funkcijas un ziņojumi</span>
                </li>
              </ul>

              <div className="flex items-center mb-6">
                <DevicePhoneMobileIcon className="w-8 h-8 text-coral mr-3" />
                <h3 className="text-2xl font-semibold">Mobilā aplikācija</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span>GPS izsekošana reāllaikā</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span>Offline režīms treniņu laikā</span>
                </li>
                <li className="flex items-center">
                  <CheckIcon className="w-5 h-5 text-green-400 mr-3" />
                  <span>Push paziņojumi un atgādinājumi</span>
                </li>
              </ul>
            </div>

            <div className="relative">
              <div className="card hover-lift bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 border-coral/30">
                <div className="p-8">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-800 border-2 border-coral rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-coral/25">
                      <PlayIcon className="w-12 h-12 text-coral" />
                    </div>
                    <h4 className="text-2xl font-bold gradient-text mb-3">Mobilā aplikācija</h4>
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-coral/20 border border-coral/30 mb-4">
                      <span className="text-coral text-sm font-medium">Drīzumā pieejama</span>
                    </div>
                    <div className="text-4xl mb-4">📱</div>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      Mobilā aplikācija ar moderno coral orange dizainu un pilnu funkcionalitāti:
                    </p>
                    <div className="text-left space-y-2">
                      <div className="flex items-center text-sm text-gray-300">
                        <CheckIcon className="w-4 h-4 text-coral mr-2" />
                        <span>GPS izsekošana ar maršruta kartēm</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <CheckIcon className="w-4 h-4 text-coral mr-2" />
                        <span>Treniņu plānu izpilde un progresa izsekošana</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <CheckIcon className="w-4 h-4 text-coral mr-2" />
                        <span>Push paziņojumi un motivācijas ziņojumi</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <CheckIcon className="w-4 h-4 text-coral mr-2" />
                        <span>Offline režīms bez interneta savienojuma</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <CheckIcon className="w-4 h-4 text-coral mr-2" />
                        <span>Sinhronizācija ar web platformu</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-900/20 via-gray-800/10 to-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Gatavs sākt savu <span className="gradient-text">skrējiena ceļojumu</span>?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto">
            Sāc savu profesionālo skrējiena ceļojumu ar Skriešanas Akadēmiju - 
            moderna platforma taviem treniņu mērķiem.
          </p>

          {!isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/register"
                className="btn-primary text-lg px-8 py-4 group"
              >
                Sākt bez maksas
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/auth/login"
                className="btn-secondary text-lg px-8 py-4"
              >
                Jau ir konts? Ielogoties
              </Link>
            </div>
          ) : (
            <Link 
              href="/dashboard"
              className="btn-primary text-lg px-8 py-4 group inline-flex items-center"
            >
              Turpināt treniņus
              <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          <p className="text-gray-400 text-sm mt-6">
            ✓ Bez maksas reģistrācija  ✓ Nav nepieciešama kredītkarte  ✓ Atcelt jebkurā laikā
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
      </div>
    </>
  )
}