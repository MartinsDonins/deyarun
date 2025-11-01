import { useAuth } from '../contexts/AuthContext'
import Footer from '../components/Footer'
import Link from 'next/link'
import { ShieldCheckIcon, EyeIcon, DocumentTextIcon } from '@heroicons/react/24/outline'

function PrivacyPolicy() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-adaptive relative overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-transparent to-blue-900/20"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`
      }}></div>

      {/* Navigation */}
      <nav className="glass-card rounded-none border-x-0 border-t-0 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <ShieldCheckIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-adaptive-white">
                Privātuma <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">politika</span>
              </h1>
              <p className="text-xl text-adaptive-light max-w-2xl mx-auto">
                Mēs rūpējamies par jūsu privātumu un datu drošību. Uzziniet, kā mēs apkopojam, izmantojam un aizsargājam jūsu informāciju.
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
            
            {/* Introduction */}
            <div className="glass-card p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center mr-3">
                  <EyeIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-adaptive-white">1. Ievads</h2>
              </div>
              <p className="text-adaptive-light leading-relaxed">
                deyarun.com, biedrība, reģ. nr. 40008260404 (turpmāk - "mēs", "organizācija") apņemas aizsargāt jūsu privātumu. 
                Šī privātuma politika skaidro, kāda informācija tiek apkopota, kā tā tiek izmantota un 
                kādas ir jūsu tiesības attiecībā uz šo informāciju, izmantojot mūsu platformu.
              </p>
            </div>

            {/* Data Collection */}
            <div className="glass-card p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center mr-3">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-adaptive-white">2. Datu vākšana</h2>
              </div>
              
              <h3 className="text-xl font-semibold text-adaptive-white mb-3">Personas dati</h3>
              <p className="text-adaptive-light mb-4">Mēs apkopojam šādus personas datus:</p>
              <ul className="text-adaptive-light space-y-2 mb-6">
                <li>• Vārds, uzvārds un e-pasta adrese</li>
                <li>• Telefona numurs (ja norādīts)</li>
                <li>• Dzimšanas datums un dzimums</li>
                <li>• Fiziskās aktivitātes dati (svars, augums, treniņu rezultāti)</li>
                <li>• GPS atrašanās vietas dati skriešanas sesiju laikā</li>
              </ul>

              <h3 className="text-xl font-semibold text-adaptive-white mb-3">Tehniskie dati</h3>
              <ul className="text-adaptive-light space-y-2">
                <li>• IP adrese un ierīces informācija</li>
                <li>• Pārlūkprogrammas tips un versija</li>
                <li>• Operētājsistēmas informācija</li>
                <li>• Vietnes izmantošanas statistika</li>
              </ul>
            </div>

            {/* Data Usage */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-adaptive-white mb-4">3. Datu izmantošana</h2>
              <p className="text-adaptive-light mb-4">Jūsu datus izmantojam šādiem mērķiem:</p>
              <ul className="text-adaptive-light space-y-2">
                <li>• Konta izveidošana un pārvaldība</li>
                <li>• Personalizētu treniņu plānu izstrāde</li>
                <li>• Progresa izsekošana un analīze</li>
                <li>• Pakalpojumu uzlabošana</li>
                <li>• Klientu atbalsta nodrošināšana</li>
                <li>• Juridisko pienākumu izpilde</li>
              </ul>
            </div>

            {/* Data Sharing */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-adaptive-white mb-4">4. Datu kopīgošana</h2>
              <p className="text-adaptive-light mb-4">
                Mēs neizpaužam jūsu personas datus trešajām personām, izņemot šādos gadījumos:
              </p>
              <ul className="text-adaptive-light space-y-2">
                <li>• Ar jūsu skaidru piekrišanu</li>
                <li>• Juridisko prasību izpildei</li>
                <li>• Uzticamiem pakalpojumu sniedzējiem (mākonis, analītika)</li>
                <li>• Anonimizētā veidā statistikai un pētījumiem</li>
              </ul>
            </div>

            {/* User Rights */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-adaptive-white mb-4">5. Jūsu tiesības (GDPR)</h2>
              <p className="text-adaptive-light mb-4">Saskaņā ar GDPR jums ir šādas tiesības:</p>
              <ul className="text-adaptive-light space-y-2">
                <li>• <strong>Piekļuves tiesības</strong> - saņemt informāciju par saviem datiem</li>
                <li>• <strong>Labošanas tiesības</strong> - labot nepareizus datus</li>
                <li>• <strong>Dzēšanas tiesības</strong> - "tiesības tikt aizmirstam"</li>
                <li>• <strong>Ierobežošanas tiesības</strong> - ierobežot datu apstrādi</li>
                <li>• <strong>Pārnesamības tiesības</strong> - saņemt datus strukturētā formātā</li>
                <li>• <strong>Iebildumu tiesības</strong> - iebilst pret datu apstrādi</li>
              </ul>
            </div>

            {/* Data Security */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-adaptive-white mb-4">6. Datu drošība</h2>
              <p className="text-adaptive-light mb-4">
                Mēs izmantojam mūsdienīgas drošības tehnoloģijas:
              </p>
              <ul className="text-adaptive-light space-y-2">
                <li>• SSL šifrēšana datu pārraidei</li>
                <li>• Datu bāzes šifrēšana</li>
                <li>• Regulāras drošības audita pārbaudes</li>
                <li>• Ierobežota piekļuve datiem tikai atbildīgajiem darbiniekiem</li>
                <li>• Regulāras rezerves kopijas</li>
              </ul>
            </div>

            {/* Cookies */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-adaptive-white mb-4">7. Sīkdatnes (Cookies)</h2>
              <p className="text-adaptive-light mb-4">
                Mēs izmantojam sīkdatnes, lai uzlabotu jūsu pieredzi:
              </p>
              <ul className="text-adaptive-light space-y-2">
                <li>• <strong>Nepieciešamās sīkdatnes</strong> - pamata funkcionalitātei</li>
                <li>• <strong>Analītikas sīkdatnes</strong> - vietnes lietojuma analīzei</li>
                <li>• <strong>Funkcionālās sīkdatnes</strong> - uzlabotai pieredzei</li>
              </ul>
              <p className="text-adaptive-light mt-4">
                Jūs varat pārvaldīt sīkdatņu iestatījumus savā pārlūkprogrammā.
              </p>
            </div>

            {/* Data Retention */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-adaptive-white mb-4">8. Datu glabāšanas termiņi</h2>
              <ul className="text-adaptive-light space-y-2">
                <li>• Konta dati: kamēr konts ir aktīvs + 3 gadi pēc deaktivācijas</li>
                <li>• Treniņu dati: 7 gadi (vai līdz dzēšanas pieprasījumam)</li>
                <li>• Tehniskie logfaili: 2 gadi</li>
                <li>• Komunikācijas vēsture: 3 gadi</li>
              </ul>
            </div>

            {/* Contact */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-adaptive-white mb-4">9. Kontaktinformācija</h2>
              <p className="text-adaptive-light mb-4">
                Jautājumi par privātuma politiku vai datu aizsardzību:
              </p>
              <div className="glass-card p-6 bg-gradient-to-r from-green-500/5 to-blue-500/5 border-green-500/20">
                <p className="text-adaptive-white font-semibold mb-2">Datu aizsardzības speciālists</p>
                <p className="text-adaptive-light">E-pasts: privacy@runacademy.app</p>
                <p className="text-adaptive-light">Telefons: +371 20 123 456</p>
                <p className="text-adaptive-light">Adrese: Brīvības iela 123, Rīga, LV-1010</p>
              </div>
            </div>

            {/* Changes */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold text-adaptive-white mb-4">10. Izmaiņas politikā</h2>
              <p className="text-adaptive-light">
                Mēs paturam tiesības atjaunināt šo privātuma politiku. Par būtiskām izmaiņām 
                informēsim jūs pa e-pastu vai platformā. Regulāri pārbaudiet šo lapu jaunākajām izmaiņām.
              </p>
            </div>

          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}

export default PrivacyPolicy
