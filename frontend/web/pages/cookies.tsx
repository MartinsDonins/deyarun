import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'
import Link from 'next/link'
import { CogIcon, ChartBarIcon, PuzzlePieceIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

function CookiesPolicy() {
  const { isAuthenticated } = useAuth()

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
              <CogIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Sīkdatņu <span className="gradient-text">politika</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Uzziniet, kā DeyaRun izmanto sīkdatnes, lai uzlabotu jūsu pieredzi un nodrošinātu mūsu pakalpojumu darbību.
          </p>
          <p className="text-gray-400 mt-4">
            Pēdējā atjaunošana: 2025. gada 28. jūlijs
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* What are Cookies */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Kas ir sīkdatnes?</h2>
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
              <p className="text-gray-300 leading-relaxed mb-4">
                Sīkdatnes ir mazi teksta faili, kas tiek saglabāti jūsu ierīcē (datorā, planšetdatorā vai mobilajā tālrunī), 
                kad jūs apmeklējat tīmekļa vietni. Tās palīdz vietnei atcerēties informāciju par jūsu vizīti.
              </p>
              <p className="text-gray-300 leading-relaxed">
                DeyaRun izmanto sīkdatnes, lai nodrošinātu labāku lietošanas pieredzi, analizētu vietnes darbības 
                un pielāgotu saturu jūsu vajadzībām.
              </p>
            </div>
          </div>

          {/* Types of Cookies */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Sīkdatņu veidi</h2>
            
            <div className="space-y-6">
              {/* Essential Cookies */}
              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
                <div className="flex items-center mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-400 mr-3" />
                  <h3 className="text-2xl font-semibold text-white">Nepieciešamās sīkdatnes</h3>
                  <span className="ml-auto bg-red-600 text-white px-3 py-1 rounded-full text-sm">Obligātas</span>
                </div>
                <p className="text-gray-300 mb-4">
                  Šīs sīkdatnes ir nepieciešamas vietnes pamata funkciju darbībai un nevar tikt atspējotas.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Sesijas pārvaldība</h4>
                    <p className="text-gray-400 text-sm">Nodrošina drošu pieslēgšanos un autentifikāciju</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Drošība</h4>
                    <p className="text-gray-400 text-sm">Aizsargā pret CSRF uzbrukumiem un citām drošības problēmām</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Formu dati</h4>
                    <p className="text-gray-400 text-sm">Saglabā formu stāvokli, lai nepazustu ievadītā informācija</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Language Selection</h4>
                    <p className="text-gray-400 text-sm">Remembers your chosen language</p>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
                <div className="flex items-center mb-4">
                  <ChartBarIcon className="w-6 h-6 text-blue-400 mr-3" />
                  <h3 className="text-2xl font-semibold text-white">Analītikas sīkdatnes</h3>
                  <span className="ml-auto bg-blue-600 text-white px-3 py-1 rounded-full text-sm">Izvēles</span>
                </div>
                <p className="text-gray-300 mb-4">
                  Šīs sīkdatnes palīdz mums saprast, kā lietotāji izmanto mūsu vietni, lai to uzlabotu.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Google Analytics</h4>
                    <p className="text-gray-400 text-sm">Anonīmi mēra vietnes apmeklējumus un lietošanas statistiku</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Veiktspējas mērīšana</h4>
                    <p className="text-gray-400 text-sm">Analizē lapas ielādes ātrumu un tehnisko veiktspēju</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Kļūdu izsekošana</h4>
                    <p className="text-gray-400 text-sm">Palīdz identificēt un novērst tehniskās problēmas</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">A/B testēšana</h4>
                    <p className="text-gray-400 text-sm">Testē dažādas vietnes versijas lietošanas uzlabošanai</p>
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
                <div className="flex items-center mb-4">
                  <PuzzlePieceIcon className="w-6 h-6 text-green-400 mr-3" />
                  <h3 className="text-2xl font-semibold text-white">Funkcionālās sīkdatnes</h3>
                  <span className="ml-auto bg-green-600 text-white px-3 py-1 rounded-full text-sm">Izvēles</span>
                </div>
                <p className="text-gray-300 mb-4">
                  Šīs sīkdatnes uzlabo jūsu pieredzi, atceroties jūsu izvēles un preferences.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Lietotāja preferences</h4>
                    <p className="text-gray-400 text-sm">Atceras jūsu iestatījumus (mērVienības, laika zona)</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Dizaina izvēle</h4>
                    <p className="text-gray-400 text-sm">Saglabā izvēlēto dizaina motīvu (tumšs/gaišs režīms)</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Navigācijas vēsture</h4>
                    <p className="text-gray-400 text-sm">Atceras pēdējās apmeklētās lapas ērtākai navigācijai</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Forma palīgi</h4>
                    <p className="text-gray-400 text-sm">Saglabā formu datus, lai atkārtoti aizpildītu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Third Party Cookies */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Trešo pušu sīkdatnes</h2>
            
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-8">
              <p className="text-gray-300 mb-6">
                Dažas sīkdatnes tiek uzstādītas ar mūsu partneriem un pakalpojumu sniedzējiem:
              </p>
              
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-2">Google Analytics</h3>
                  <p className="text-gray-300 text-sm mb-2">
                    Mēra vietnes apmeklējumus un sniedz anonīmu statistiku par lietošanas paradumiem.
                  </p>
                  <p className="text-gray-400 text-xs">
                    Privātuma politika: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" 
                    className="text-primary hover:underline">policies.google.com/privacy</a>
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-2">Cloudflare</h3>
                  <p className="text-gray-300 text-sm mb-2">
                    Nodrošina drošību un veiktspēju, aizsargājot vietni no uzbrukumiem.
                  </p>
                  <p className="text-gray-400 text-xs">
                    Privātuma politika: <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" 
                    className="text-primary hover:underline">cloudflare.com/privacypolicy</a>
                  </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-2">Sociālie tīkli</h3>
                  <p className="text-gray-300 text-sm mb-2">
                    Facebook, Google+ pogas var uzstādīt savas sīkdatnes.
                  </p>
                  <p className="text-gray-400 text-xs">
                    Šīs sīkdatnes tiek uzstādītas tikai tad, ja mijiedarbojaties ar pogām.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cookie Duration */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Sīkdatņu glabāšanas ilgums</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">Sesijas sīkdatnes</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Tiek dzēstas, kad aizverat pārlūkprogrammu.
                </p>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>• Autentifikācijas tokens</li>
                  <li>• Sesijas ID</li>
                  <li>• Drošības marķieri</li>
                </ul>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">Pastāvīgās sīkdatnes</h3>
                <p className="text-gray-300 text-sm mb-3">
                  Paliek jūsu ierīcē noteiktu laiku.
                </p>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>• Preferences: 1 gads</li>
                  <li>• Analytics: 2 gadi</li>
                  <li>• "Atcerēties mani": 30 dienas</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cookie Management */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Sīkdatņu pārvaldība</h2>
            
            <div className="bg-gradient-to-br from-primary/10 to-coral/10 rounded-xl p-8 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Kā pārvaldīt sīkdatnes</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-white font-medium mb-2">Pārlūkprogrammas iestatījumi</h4>
                  <p className="text-gray-300 text-sm mb-3">
                    Vairums pārlūkprogrammu ļauj pārvaldīt sīkdatnes to iestatījumos:
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-white text-sm font-medium">Chrome</p>
                      <p className="text-gray-400 text-xs">Iestatījumi → Privātums → Sīkdatnes</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-white text-sm font-medium">Firefox</p>
                      <p className="text-gray-400 text-xs">Iestatījumi → Privātums → Sīkdatnes</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-white text-sm font-medium">Safari</p>
                      <p className="text-gray-400 text-xs">Preferences → Privacy → Cookies</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-white text-sm font-medium">Edge</p>
                      <p className="text-gray-400 text-xs">Iestatījumi → Privātums → Sīkdatnes</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
                  <h4 className="text-white font-medium mb-2">Svarīga informācija</h4>
                  <p className="text-blue-300 text-sm">
                    <strong>Piezīme:</strong> Atspējojot nepieciešamās sīkdatnes, var tikt ietekmēta vietnes funkcionalitāte. 
                    Jūs varat nespēt pieslēgties kontam vai izmantot dažas funkcijas.
                  </p>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-3">Sīkdatņu piekrišanas pārvaldība</h4>
                  <p className="text-gray-300 text-sm mb-4">
                    Jūs varat jebkurā laikā mainīt savu piekrišanu sīkdatņu izmantošanai:
                  </p>
                  <button className="btn-primary">
                    Pārvaldīt sīkdatņu iestatījumus
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Impact of Disabling */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Sīkdatņu atspējošanas ietekme</h2>
            
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-8">
              <h3 className="text-yellow-200 font-semibold mb-4">Ko nozīmē sīkdatņu atspējošana:</h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white font-medium">Login issues</p>
                    <p className="text-gray-300 text-sm">Jums katru reizi būs jāievada lietotājvārds un parole</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white font-medium">Preferences netiek saglabātas</p>
                    <p className="text-gray-300 text-sm">Iestatījumi atgriezīsies uz noklusējuma vērtībām</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white font-medium">Personalizācijas trūkums</p>
                    <p className="text-gray-300 text-sm">Saturs nebūs pielāgots jūsu vajadzībām</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <div>
                    <p className="text-white font-medium">Analītikas trūkums</p>
                    <p className="text-gray-300 text-sm">Mēs nevarēsim uzlabot vietni, balstoties uz lietošanas datiem</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Updates */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Izmaiņas sīkdatņu politikā</h2>
            
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
              <p className="text-gray-300 leading-relaxed mb-4">
                Mēs paturam tiesības atjaunināt šo sīkdatņu politiku, lai atspoguļotu izmaiņas mūsu praksē 
                vai juridiskajās prasībās.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                Par būtiskām izmaiņām mēs informēsim jūs ar paziņojumu vietnē vai nosūtot e-pastu.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Iesakām regulāri pārbaudīt šo lapu, lai būtu informēti par jaunākajām izmaiņām.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Jautājumi par sīkdatnēm</h2>
            
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
              <p className="text-gray-300 mb-6">
                Ja jums ir jautājumi par mūsu sīkdatņu izmantošanu, sazinieties ar mums:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-white font-medium mb-1">E-pasts</p>
                  <p className="text-primary">privacy@runacademy.app</p>
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Telefons</p>
                  <p className="text-gray-300">+371 20 123 456</p>
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Adrese</p>
                  <p className="text-gray-300">Brīvības iela 123, Rīga, LV-1010</p>
                </div>
                <div>
                  <p className="text-white font-medium mb-1">Darba laiks</p>
                  <p className="text-gray-300">Pirmdiena - Piektdiena, 9:00 - 17:00</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  )
}

export default CookiesPolicy