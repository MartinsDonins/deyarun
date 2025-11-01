import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'
import Link from 'next/link'
import { DocumentTextIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

function TermsOfService() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-adaptive relative overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/20 via-transparent to-red-900/20"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(251, 146, 60, 0.1) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)`
      }}></div>

      {/* Navigation */}
      <nav className="glass-card rounded-none border-x-0 border-t-0 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-adaptive-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-adaptive-white">DeyaRun</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link href="/dashboard" className="glass-button-primary">
                  Pārskats
                </Link>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link href="/auth/login" className="text-adaptive-light hover:text-adaptive-white transition-colors">
                    Ielogoties
                  </Link>
                  <Link href="/auth/register" className="glass-button-primary">
                    Reģistrēties
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        {/* Header */}
        <section className="py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <DocumentTextIcon className="w-8 h-8 text-adaptive-white" />
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-adaptive-white">
                Lietošanas <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">noteikumi</span>
              </h1>
              <p className="text-xl text-adaptive-light max-w-2xl mx-auto">
                Iepazīstieties ar noteikumiem un nosacījumiem, kas regulē mūsu platformas izmantošanu.
              </p>
              <p className="text-adaptive-muted mt-4">
                Pēdējā atjaunošana: 2025. gada 28. jūlijs
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            
            {/* Acceptance */}
            <div className="glass-card p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mr-3">
                  <CheckCircleIcon className="w-5 h-5 text-adaptive-white" />
                </div>
                <h2 className="text-2xl font-bold text-adaptive-white">1. Noteikumu pieņemšana</h2>
              </div>
              <p className="text-adaptive-light leading-relaxed mb-4">
                Izmantojot mūsu platformu, jūs piekrītat šiem lietošanas noteikumiem. 
                Ja jūs nepiekrītat kādam no nosacījumiem, lūdzu, neizmantojiet mūsu pakalpojumus.
              </p>
              <p className="text-adaptive-light leading-relaxed">
                Šie noteikumi ir juridiski saistošs līgums starp jums un Sporta klubu "Skriešanas Akademija", biedrību ar reģ. nr. 40008260404.
              </p>
            </div>

            {/* Service Description */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-adaptive-white mb-4">2. Pakalpojuma apraksts</h2>
              <p className="text-adaptive-light mb-4">DeyaRun nodrošina:</p>
              <ul className="text-adaptive-light space-y-2">
                <li>• Personalizētus skriešanas treniņu plānus</li>
                <li>• GPS izsekošanas un progresa analīzes rīkus</li>
                <li>• Kopienas funkcijas un sociālo mijiedarbību</li>
                <li>• Veselības un aktivitāšu monitoringu</li>
                <li>• Izglītojošu saturu par skriešanu</li>
              </ul>
            </div>

            {/* User Accounts */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-adaptive-white mb-4">3. Lietotāja konti</h2>
              
              <h3 className="text-xl font-semibold text-adaptive-white mb-3">Reģistrācija</h3>
              <ul className="text-adaptive-light space-y-2 mb-6">
                <li>• Jums jābūt vismaz 13 gadus vecam</li>
                <li>• Sniedzamā informācija ir precīza un pilnīga</li>
                <li>• Katra persona var izveidot tikai vienu kontu</li>
                <li>• Jūs esat atbildīgs par sava konta drošību</li>
              </ul>

              <h3 className="text-xl font-semibold text-adaptive-white mb-3">Konta drošība</h3>
              <ul className="text-adaptive-light space-y-2">
                <li>• Izmantojiet drošu paroli</li>
                <li>• Neatklājiet savu paroli citiem</li>
                <li>• Nekavējoties ziņojiet par aizdomīgām darbībām</li>
                <li>• Jūs esat atbildīgs par visām darbībām savā kontā</li>
              </ul>
            </div>

            {/* Health Disclaimer */}
            <div className="glass-card p-6 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-500/30">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center mr-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-adaptive-white">4. Veselības atruna</h2>
              </div>
              <ul className="text-adaptive-light space-y-3">
                <li>• DeyaRun nav medicīnas pakalpojums</li>
                <li>• Pirms jauna treniņu režīma uzsākšanas konsultējieties ar ārstu</li>
                <li>• Mēs neuzņemamies atbildību par veselības problēmām</li>
                <li>• Klausieties uz savu ķermeni un pārtrauciet treniņus, ja rodas sāpes</li>
                <li>• Mūsu ieteikumi nav medicīniskas konsultācijas</li>
              </ul>
            </div>

            {/* Privacy */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-adaptive-white mb-4">5. Privātums</h2>
              <p className="text-adaptive-light mb-4">
                Jūsu privātums ir svarīgs. Detalizēta informācija par datu vākšanu un izmantošanu 
                ir pieejama mūsu <Link href="/privacy" className="text-orange-400 hover:underline">Privātuma politikā</Link>.
              </p>
              <ul className="text-adaptive-light space-y-2">
                <li>• Mēs neizpaužam personas datus bez atļaujas</li>
                <li>• Izmantojam datus pakalpojumu uzlabošanai</li>
                <li>• Ievērojam GDPR un citus datu aizsardzības likumus</li>
              </ul>
            </div>

            {/* Governing Law */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-adaptive-white mb-4">6. Piemērojamie tiesību akti</h2>
              <p className="text-adaptive-light mb-4">
                Šie noteikumi tiek regulēti ar Latvijas Republikas tiesību aktiem. 
                Strīdu gadījumā kompetentās ir Latvijas tiesas.
              </p>
              <div className="glass-card p-6 bg-gradient-to-r from-orange-500/5 to-red-500/5 border-orange-500/20">
                <p className="text-adaptive-white font-semibold mb-2">Juridiskā adrese</p>
                <p className="text-adaptive-light">Sporta klubs "Skriešanas Akademija"</p>
                <p className="text-adaptive-light">Reģ. Nr.: 40008260404</p>
                <p className="text-adaptive-light">Prūšu iela 4, Rīga, LV-1057</p>
                <p className="text-adaptive-light">E-pasts: info@deyarun.com</p>
                <p className="text-adaptive-light">Telefons: +371 20193143</p>
              </div>
            </div>

          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}

export default TermsOfService
