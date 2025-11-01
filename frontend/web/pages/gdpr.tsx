import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'
import Link from 'next/link'
import { GlobeEuropeAfricaIcon, ShieldCheckIcon, UserIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'

function GDPRCompliance() {
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
              <GlobeEuropeAfricaIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            GDPR <span className="gradient-text">atbilstība</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            DeyaRun pilnībā atbilst Eiropas Savienības Vispārīgajai datu aizsardzības regulai (GDPR).
          </p>
          <div className="flex items-center justify-center mt-6">
            <ShieldCheckIcon className="w-6 h-6 text-green-400 mr-2" />
            <span className="text-green-400 font-medium">ES datu aizsardzības standartiem atbilstošs</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* GDPR Overview */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Kas ir GDPR?</h2>
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
              <p className="text-gray-300 leading-relaxed mb-4">
                Vispārīgā datu aizsardzības regula (GDPR) ir Eiropas Savienības likums, kas stājās spēkā 2018. gada 25. maijā. 
                Tā aizsargā ES pilsoņu personas datu privātumu un dod viņiem kontroli pār to, kā viņu dati tiek izmantoti.
              </p>
              <p className="text-gray-300 leading-relaxed">
                DeyaRun ievēro visas GDPR prasības un nodrošina, ka jūsu personas dati tiek apstrādāti likumīgi, 
                taisnīgi un caurspīdīgi.
              </p>
            </div>
          </div>

          {/* Your Rights */}
          <div className="mb-16">
            <div className="flex items-center mb-8">
              <UserIcon className="w-8 h-8 text-primary mr-4" />
              <h2 className="text-3xl font-bold text-white">Jūsu tiesības saskaņā ar GDPR</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Right to Information */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">1. Informācijas tiesības</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Jums ir tiesības zināt, kādi jūsu personas dati tiek apkopoti, kāpēc un kā tie tiek izmantoti.
                </p>
              </div>

              {/* Right of Access */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">2. Piekļuves tiesības</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Jūs varat pieprasīt piekļuvi visiem jūsu personas datiem, ko mēs apstrādājam.
                </p>
              </div>

              {/* Right to Rectification */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">3. Labošanas tiesības</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Jūs varat pieprasīt labot nepareizus vai nepilnīgus personas datus.
                </p>
              </div>

              {/* Right to Erasure */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">4. Dzēšanas tiesības</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  "Tiesības tikt aizmirstam" - jūs varat pieprasīt dzēst savus personas datus.
                </p>
              </div>

              {/* Right to Restrict Processing */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">5. Ierobežošanas tiesības</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Jūs varat pieprasīt ierobežot jūsu personas datu apstrādi noteiktos apstākļos.
                </p>
              </div>

              {/* Right to Data Portability */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">6. Pārnesamības tiesības</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Jūs varat saņemt savus datus strukturētā, mašīnlasāmā formātā.
                </p>
              </div>

              {/* Right to Object */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">7. Iebildumu tiesības</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Jūs varat iebilst pret savu personas datu apstrādi noteiktiem mērķiem.
                </p>
              </div>

              {/* Rights regarding Automated Decision-making */}
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-3">8. Automatizēto lēmumu tiesības</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Jums ir tiesības nepakļauties tikai uz automatizētu lēmumu pieņemšanu balstītiem lēmumiem.
                </p>
              </div>
            </div>
          </div>

          {/* How to Exercise Rights */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Kā izmantot savas tiesības</h2>
            
            <div className="bg-gradient-to-br from-primary/10 to-coral/10 rounded-xl p-8 border border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Pieprasījumu iesniegšana</h3>
              <p className="text-gray-300 mb-6">
                Lai izmantotu savas GDPR tiesības, sazinieties ar mūsu datu aizsardzības speciālistu:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-white font-medium">E-pasts</p>
                  <p className="text-primary">privacy@runacademy.app</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-white font-medium">Atbildes laiks</p>
                  <p className="text-gray-300">Līdz 30 dienām</p>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  <strong>Piezīme:</strong> Mēs varam pieprasīt papildu informāciju, lai verificētu jūsu identitāti 
                  pirms pieprasījuma izpildes, lai aizsargātu jūsu datu drošību.
                </p>
              </div>
            </div>
          </div>

          {/* Data Processing Principles */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">GDPR principi, ko mēs ievērojam</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">Likumība, taisnīgums un caurspīdīgums</h3>
                <p className="text-gray-300 text-sm">
                  Mēs apstrādājam datus tikai likumīgiem mērķiem un skaidri informējam par datu izmantošanu.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">Mērķa ierobežojums</h3>
                <p className="text-gray-300 text-sm">
                  Dati tiek apkopoti konkrētiem, skaidriem un likumīgiem mērķiem.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">Datu minimizācija</h3>
                <p className="text-gray-300 text-sm">
                  Mēs apkopojam tikai tos datus, kas nepieciešami mūsu pakalpojumu sniegšanai.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">Precizitāte</h3>
                <p className="text-gray-300 text-sm">
                  Mēs nodrošinām, ka personas dati ir precīzi un nepieciešamības gadījumā atjaunināti.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">Glabāšanas ierobežojums</h3>
                <p className="text-gray-300 text-sm">
                  Dati tiek glabāti tikai tik ilgi, cik nepieciešams mērķu sasniegšanai.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">Integritāte un konfidencialitāte</h3>
                <p className="text-gray-300 text-sm">
                  Mēs izmantojam atbilstošas tehniskās un organizatoriskās drošības metodes.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">Atbildība</h3>
                <p className="text-gray-300 text-sm">
                  Mēs varam pierādīt, ka ievērojam visus GDPR principus.
                </p>
              </div>
            </div>
          </div>

          {/* Legal Basis */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Juridiskais pamats datu apstrādei</h2>
            
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
              <p className="text-gray-300 mb-6">
                Mēs apstrādājam jūsu personas datus, balstoties uz šādiem juridiskajiem pamatiem:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="text-white font-medium">Piekrišana</p>
                    <p className="text-gray-300 text-sm">Jūs esat devuši skaidru piekrišanu datu apstrādei konkrētiem mērķiem.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="text-white font-medium">Līguma izpilde</p>
                    <p className="text-gray-300 text-sm">Datu apstrāde ir nepieciešama līguma izpildei ar jums.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="text-white font-medium">Likumīgās intereses</p>
                    <p className="text-gray-300 text-sm">Datu apstrāde ir nepieciešama mūsu vai trešo pušu likumīgo interešu vajadzībām.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="text-white font-medium">Juridiskās prasības</p>
                    <p className="text-gray-300 text-sm">Datu apstrāde ir nepieciešama, lai izpildītu likumīgas prasības.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Export */}
          <div className="mb-16">
            <div className="flex items-center mb-6">
              <DocumentArrowDownIcon className="w-8 h-8 text-primary mr-4" />
              <h2 className="text-3xl font-bold text-white">Datu eksports</h2>
            </div>
            
            <div className="bg-gradient-to-br from-primary/10 to-coral/10 rounded-xl p-8 border border-gray-700">
              <p className="text-gray-300 mb-6">
                Saskaņā ar GDPR pārnesamības tiesībām, jūs varat pieprasīt eksportēt savus datus 
                strukturētā, mašīnlasāmā formātā.
              </p>
              
              {isAuthenticated ? (
                <div className="space-y-4">
                  <p className="text-white font-medium">Pieejamie eksporta formāti:</p>
                  <ul className="text-gray-300 space-y-2">
                    <li>• JSON - strukturēti dati ar visu informāciju</li>
                    <li>• CSV - tabulu dati importēšanai citās sistēmās</li>
                    <li>• PDF - cilvēkam lasāms formāts</li>
                  </ul>
                  <button className="btn-primary mt-4">
                    Pieprasīt datu eksportu
                  </button>
                </div>
              ) : (
                <p className="text-gray-400">
                  Lai pieprasītu datu eksportu, lūdzu <Link href="/auth/login" className="text-primary hover:underline">ielogojieties</Link> savā kontā.
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8">Kontaktinformācija</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">Datu aizsardzības speciālists</h3>
                <div className="space-y-3">
                  <p className="text-gray-300">
                    <span className="text-white font-medium">E-pasts:</span> privacy@runacademy.app
                  </p>
                  <p className="text-gray-300">
                    <span className="text-white font-medium">Telefons:</span> +371 20 123 456
                  </p>
                  <p className="text-gray-300">
                    <span className="text-white font-medium">Darba laiks:</span> P-Pk 9:00-17:00
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">Uzraudzības iestāde</h3>
                <p className="text-gray-300 mb-4">
                  Ja jūs neesat apmierināts ar mūsu atbildi, varat vērsties pie:
                </p>
                <div className="space-y-2">
                  <p className="text-gray-300">
                    <span className="text-white font-medium">Datu valsts inspekcija</span>
                  </p>
                  <p className="text-gray-300">Blaumaņa iela 11/13-15, Rīga, LV-1011</p>
                  <p className="text-gray-300">E-pasts: info@dvi.gov.lv</p>
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

export default GDPRCompliance