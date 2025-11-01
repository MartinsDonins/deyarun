import { useState } from 'react'
import { 
  ChevronDownIcon,
  TrophyIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  CogIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import Footer from '../components/Footer'

const faqCategories = [
  {
    id: 'general',
    name: 'Vispārīgi jautājumi',
    icon: QuestionMarkCircleIcon,
    color: 'text-blue-400'
  },
  {
    id: 'account',
    name: 'Konts un profils',
    icon: UserIcon,
    color: 'text-green-400'
  },
  {
    id: 'features',
    name: 'Funkcijas',
    icon: CogIcon,
    color: 'text-purple-400'
  },
  {
    id: 'mobile',
    name: 'Mobilā aplikācija',
    icon: DevicePhoneMobileIcon,
    color: 'text-orange-400'
  },
  {
    id: 'billing',
    name: 'Norēķini',
    icon: CreditCardIcon,
    color: 'text-yellow-400'
  },
  {
    id: 'privacy',
    name: 'Privātums un drošība',
    icon: ShieldCheckIcon,
    color: 'text-red-400'
  }
]

const faqData = [
  {
    category: 'general',
    question: 'Kas ir DeyaRun?',
    answer: 'DeyaRun ir vispusīga skriešanas platforma, kas piedāvā GPS izsekošanu, treniņu plānu izveidi, progresa analīzi un kopienas funkcijas. Mūsu mērķis ir palīdzēt skrējējiem visā līmeņā sasniegt savus mērķus.'
  },
  {
    category: 'general',
    question: 'Vai DeyaRun ir bezmaksas?',
    answer: 'Jā, DeyaRun piedāvā bezmaksas plānu ar pamata funkcijām. Tas ietver GPS izsekošanu līdz 5 treniņiem mēnesī, pamata statistiku un kopienas piekļuvi. Pro plānā ir pieejamas visas funkcijas bez ierobežojumiem.'
  },
  {
    category: 'general',
    question: 'Kā sākt lietot DeyaRun?',
    answer: 'Reģistrējieties mūsu platformā, izveidojiet savu profilu un ievadiet pamatinformāciju par savu skriešanas pieredzi. Pēc tam varat sākt izmantot visas pieejamās funkcijas - izveidot treniņu plānu, sākt GPS izsekošanu vai pievienoties kopienai.'
  },
  {
    category: 'general',
    question: 'Vai DeyaRun ir piemērots iesācējiem?',
    answer: 'Noteikti! DeyaRun ir izstrādāts visiem skriešanas līmeņiem - no iesācējiem līdz pieredzējušiem skrējējiem. Mūsu sistēma izveidos personalizētu plānu atbilstoši jūsu līmenim un mērķiem.'
  },
  {
    category: 'account',
    question: 'Kā izveidot kontu?',
    answer: 'Noklikšķiniet uz "Reģistrēties", ievadiet savu e-pasta adresi, izveidojiet drošu paroli un apstipriniet savu e-pastu. Pēc tam varēsiet pilnībā izmantot platformu.'
  },
  {
    category: 'account',
    question: 'Kā mainīt paroli?',
    answer: 'Dodieties uz Profila iestatījumiem, izvēlieties "Drošība" un noklikšķiniet uz "Mainīt paroli". Ievadiet pašreizējo paroli un jauno paroli divreiz apstiprināšanai.'
  },
  {
    category: 'account',
    question: 'Kā dzēst savu kontu?',
    answer: 'Ja vēlaties dzēst kontu, dodieties uz Profila iestatījumiem un izvēlieties "Dzēst kontu". Ņemiet vērā, ka visi jūsu dati tiks neatgriezeniski dzēsti.'
  },
  {
    category: 'account',
    question: 'Vai varu mainīt savu e-pasta adresi?',
    answer: 'Jā, e-pasta adresi var mainīt Profila iestatījumos. Jums būs jāapstiprina jaunā e-pasta adrese, pirms izmaiņas stāsies spēkā.'
  },
  {
    category: 'features',
    question: 'Kā darbojas GPS izsekošana?',
    answer: 'GPS izsekošana izmanto jūsu ierīces GPS sensoru, lai precīzi reģistrētu maršrutu, distanci, tempu un ātrumu. Dati tiek automātiski sinhronizēti ar jūsu profilu pēc treniņa beigām.'
  },
  {
    category: 'features',
    question: 'Vai GPS darbojas bez interneta savienojuma?',
    answer: 'Jā, GPS izsekošana darbojas arī bez interneta savienojuma. Dati tiek saglabāti ierīcē un automātiski sinhronizēti, kad atjaunojas interneta savienojums.'
  },
  {
    category: 'features',
    question: 'Kā izveidot treniņu plānu?',
    answer: 'Dodieties uz "Treniņu plāni" sadaļu, izvēlieties "Izveidot jaunu plānu" un ievadiet savu mērķi, pašreizējo līmeni un pieejamo laiku. Mūsu sistēma izveidos personalizētu plānu.'
  },
  {
    category: 'features',
    question: 'Vai varu pielāgot treniņu plānus?',
    answer: 'Jā, visus ģenerētos plānus var pilnībā pielāgot. Varat mainīt treniņu intensitāti, ilgumu, biežumu un pievienot savus treniņus.'
  },
  {
    category: 'features',
    question: 'Kā apskatīt savu progresu?',
    answer: 'Progresa analīze ir pieejama "Statistika" sadaļā. Tur var apskatīt detalizētus grafikus par distanci, tempu, kaloriju sadedzināšanu un citiem rādītājiem dažādos laika periodos.'
  },
  {
    category: 'mobile',
    question: 'Vai ir pieejama mobilā aplikācija?',
    answer: 'Jā, DeyaRun mobilā aplikācija ir pieejama gan iOS, gan Android ierīcēm. Aplikācija nodrošina pilnu funkcionalitāti, ieskaitot GPS izsekošanu un offline režīmu.'
  },
  {
    category: 'mobile',
    question: 'Kā lejupielādēt mobilo aplikāciju?',
    answer: 'Meklējiet "DeyaRun" App Store (iOS) vai Google Play Store (Android). Aplikācija ir bezmaksas lejupielādēšanai ar iespēju piekļūt Pro funkcijām.'
  },
  {
    category: 'mobile',
    question: 'Vai mobilā aplikācija sinhronizējas ar web versiju?',
    answer: 'Jā, visi dati automātiski sinhronizējas starp mobilo aplikāciju un web platformu. Jūs varat sākt treniņu mobilajā aplikācijā un apskatīt detalizētu analīzi datorā.'
  },
  {
    category: 'mobile',
    question: 'Kāpēc GPS nav precīzs?',
    answer: 'GPS precizitāti var ietekmēt augstās ēkas, koki vai slikti laika apstākļi. Ieteicam sākt GPS izsekošanu atklātā vietā un uzgaidīt, kamēr signals kļūst stabils pirms skriešanas sākšanas.'
  },
  {
    category: 'billing',
    question: 'Cik maksā Pro plāns?',
    answer: 'Pro plāns maksā €9.99 mēnesī vai €99.99 gadā (ekonomējot 17%). Pro plāns ietver neierobežotu GPS izsekošanu, personalizētus treniņu plānus, detalizētu analīzi un prioritāro atbalstu.'
  },
  {
    category: 'billing',
    question: 'Kādi ir maksājumu veidi?',
    answer: 'Mēs pieņemam visas galvenās kredītkartes (Visa, MasterCard), PayPal un bankas pārskaitījumus. Visi maksājumi tiek apstrādāti droši caur šifrētiem kanāliem.'
  },
  {
    category: 'billing',
    question: 'Vai varu atcelt abonementu?',
    answer: 'Jā, abonementu var atcelt jebkurā laikā no Profila iestatījumiem. Atcelšana stāsies spēkā nākamajā norēķinu ciklā, bet jūs turpināsiet izmantot Pro funkcijas līdz perioda beigām.'
  },
  {
    category: 'billing',
    question: 'Vai ir naudas atmaksa?',
    answer: 'Mēs piedāvājam 14 dienu naudas atmaksas garantiju jauniem Pro lietotājiem. Ja neesat apmierināti ar pakalpojumu, sazinajieties ar atbalstu un saņemsiet pilnu naudas atmaksu.'
  },
  {
    category: 'billing',
    question: 'Kas notiek, ja atceļu Pro plānu?',
    answer: 'Pēc Pro plāna atcelšanas jūs automātiski pāriesiet uz bezmaksas plānu. Jūsu iepriekšējie dati saglabāsies, bet būs ierobežota piekļuve dažām funkcijām.'
  },
  {
    category: 'privacy',
    question: 'Kā tiek aizsargāti mani dati?',
    answer: 'Visi dati tiek šifrēti gan pārsūtīšanas, gan glabāšanas laikā. Mēs izmantojam 256-bit SSL šifrēšanu un atbilstam ES GDPR prasībām. Jūsu dati netiek pārdoti trešajām personām.'
  },
  {
    category: 'privacy',
    question: 'Kur tiek glabāti mani dati?',
    answer: 'Visi dati tiek glabāti drošos Eiropas Savienības datu centros, kas atbilst visām ES datu aizsardzības prasībām un standartiem.'
  },
  {
    category: 'privacy',
    question: 'Vai varu lejupielādēt savus datus?',
    answer: 'Jā, saskaņā ar GDPR jums ir tiesības lejupielādēt visus savus datus. Dodieties uz Profila iestatījumiem un izvēlieties "Eksportēt datus".'
  },
  {
    category: 'privacy',
    question: 'Kāda ir jūsu privātuma politika?',
    answer: 'Mūsu privātuma politika detalizēti apraksta, kā mēs vācam, izmantojam un aizsargājam jūsu datus. Tā ir pieejama mūsu mājas lapas apakšdaļā.'
  }
]

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>('general')
  const [searchTerm, setSearchTerm] = useState('')
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="min-h-screen bg-adaptive relative overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-teal-900/20"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, rgba(20, 184, 166, 0.1) 0%, transparent 50%)`
      }}></div>

      {/* Navigation */}
      <nav className="glass-card rounded-none border-x-0 border-t-0 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                <TrophyIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-adaptive-white">DeyaRun</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-adaptive-light hover:text-adaptive-white transition-colors">
                Ielogoties
              </Link>
              <Link href="/auth/register" className="glass-button-primary">
                Reģistrēties
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-card p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                  <QuestionMarkCircleIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-adaptive-white">
                Biežāk <span className="bg-gradient-to-r from-indigo-500 to-teal-500 bg-clip-text text-transparent">uzdotie</span> jautājumi
              </h1>
              <p className="text-lg text-adaptive-light mb-8">
                Atrodiet atbildes uz visbiežākajiem jautājumiem par DeyaRun
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-adaptive-muted" />
                  <input
                    type="text"
                    placeholder="Meklēt jautājumus..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="glass-input w-full pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Category Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 text-adaptive-white">
                      <span className="bg-gradient-to-r from-indigo-500 to-teal-500 bg-clip-text text-transparent">Kategorijas</span>
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveCategory('all')}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center space-x-3 ${
                          activeCategory === 'all' 
                            ? 'bg-gradient-to-r from-indigo-500 to-teal-500 text-white shadow-lg' 
                            : 'glass-card hover:scale-105 text-adaptive-light hover:text-adaptive-white'
                        }`}
                      >
                        <QuestionMarkCircleIcon className="w-5 h-5" />
                        <span>Visi jautājumi</span>
                      </button>
                  
                      {faqCategories.map((category) => {
                        const Icon = category.icon
                        return (
                          <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center space-x-3 ${
                              activeCategory === category.id 
                                ? 'bg-gradient-to-r from-indigo-500 to-teal-500 text-white shadow-lg' 
                                : 'glass-card hover:scale-105 text-adaptive-light hover:text-adaptive-white'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${activeCategory === category.id ? 'text-white' : category.color}`} />
                            <span className="text-sm">{category.name}</span>
                          </button>
                    )
                  })}
                </div>

                    {/* Contact Card */}
                    <div className="glass-card p-6 mt-6 bg-gradient-to-r from-indigo-500/5 to-teal-500/5 border-indigo-500/20">
                      <h4 className="font-semibold mb-3 text-adaptive-white">
                        <span className="bg-gradient-to-r from-indigo-500 to-teal-500 bg-clip-text text-transparent">Neatradāt atbildi?</span>
                      </h4>
                      <p className="text-adaptive-light text-sm mb-4">
                        Mūsu atbalsta komanda labprāt palīdzēs!
                      </p>
                      <div className="space-y-2">
                        <Link 
                          href="/contact" 
                          className="glass-button-primary text-sm w-full text-center block py-2"
                        >
                          Sazināties
                        </Link>
                        <Link 
                          href="/help" 
                          className="glass-card text-sm w-full text-center block py-2 text-adaptive-light hover:text-adaptive-white transition-colors"
                        >
                          Palīdzības centrs
                        </Link>
                      </div>
                    </div>
                  </div>
              </div>
            </div>

              {/* FAQ Content */}
              <div className="lg:col-span-3">
                {searchTerm && (
                  <div className="glass-card p-4 mb-6">
                    <p className="text-adaptive-light">
                      Atrasti <span className="text-adaptive-white font-semibold">{filteredFAQs.length}</span> rezultāti meklēšanai: 
                      <span className="text-indigo-400 ml-1">"{searchTerm}"</span>
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {filteredFAQs.map((faq, index) => {
                    const isOpen = openItems.has(index)
                    const categoryInfo = faqCategories.find(cat => cat.id === faq.category)
                    
                    return (
                      <div key={index} className="glass-card overflow-hidden">
                        <button
                          onClick={() => toggleItem(index)}
                          className="w-full px-6 py-4 text-left hover:bg-white/5 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                {categoryInfo && (
                                  <span className={`text-xs px-2 py-1 rounded-full glass-card ${categoryInfo.color}`}>
                                    {categoryInfo.name}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-lg font-medium text-adaptive-white pr-4">
                                {faq.question}
                              </h4>
                            </div>
                            <ChevronDownIcon 
                              className={`w-5 h-5 text-adaptive-muted transition-transform ${
                                isOpen ? 'transform rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        
                        {isOpen && (
                          <div className="px-6 pb-4">
                            <div className="border-t border-white/10 pt-4">
                              <p className="text-adaptive-light leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  )
                })}
              </div>

                {filteredFAQs.length === 0 && (
                  <div className="glass-card p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
                      <QuestionMarkCircleIcon className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-medium text-adaptive-white mb-2">
                      Nekas nav atrasts
                    </h3>
                    <p className="text-adaptive-light mb-6">
                      Mēģiniet izmainīt meklēšanas nosacījumus vai izvēlēties citu kategoriju.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button
                        onClick={() => {
                          setSearchTerm('')
                          setActiveCategory('general')
                        }}
                        className="glass-card px-4 py-2 text-adaptive-light hover:text-adaptive-white transition-colors"
                      >
                        Notīrīt filtrus
                      </button>
                      <Link href="/contact" className="glass-button-primary">
                        Uzdot jautājumu
                      </Link>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </section>
      </div>

      <Footer />
    </div>
  )
}
