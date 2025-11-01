import { 
  CheckIcon, 
  XMarkIcon,
  TrophyIcon,
  StarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import Footer from '../components/Footer'

const plans = [
  {
    name: 'Bezmaksas',
    price: '0',
    period: '/mēnesī',
    description: 'Perfekti iesācējiem un brīvā laika skrējējiem',
    popular: false,
    features: [
      { name: 'GPS izsekošana (5 treniņi/mēnesī)', included: true },
      { name: 'Pamata statistika', included: true },
      { name: 'Treniņu vēsture (30 dienas)', included: true },
      { name: 'Kopienas piekļuve', included: true },
      { name: 'Mobilo aplikācija', included: true },
      { name: 'Personalizēti treniņu plāni', included: false },
      { name: 'Detalizēta analīze', included: false },
      { name: 'Trenera atbalsts', included: false },
      { name: 'Datu eksports', included: false },
      { name: 'Prioritārais atbalsts', included: false }
    ],
    cta: 'Sākt bez maksas',
    ctaLink: '/auth/register'
  },
  {
    name: 'Pro',
    price: '9.99',
    period: '/mēnesī',
    description: 'Nopietniiem skrējējiem ar ambicioziem mērķiem',
    popular: true,
    features: [
      { name: 'Neierobežota GPS izsekošana', included: true },
      { name: 'Detalizēta statistika un analīze', included: true },
      { name: 'Neierobežota treniņu vēsture', included: true },
      { name: 'Personalizēti treniņu plāni', included: true },
      { name: 'Progresa prognozēšana', included: true },
      { name: 'Trenera atbalsts', included: true },
      { name: 'Datu eksports (CSV, GPX)', included: true },
      { name: 'Prioritārais atbalsts', included: true },
      { name: 'Sasniegumu sistēma', included: true },
      { name: 'Premium kopienas funkcijas', included: true }
    ],
    cta: 'Izvēlēties Pro',
    ctaLink: '/auth/register?plan=pro'
  },
  {
    name: 'Team',
    price: '49.99',
    period: '/mēnesī',
    description: 'Treneru un skriešanas grupu vajadzībām',
    popular: false,
    features: [
      { name: 'Līdz 20 komandas dalībniekiem', included: true },
      { name: 'Visas Pro funkcijas', included: true },
      { name: 'Komandas analīze un statistika', included: true },
      { name: 'Grupu treniņu plānošana', included: true },
      { name: 'Individuāls trenera atbalsts', included: true },
      { name: 'Pielāgotas atskaites', included: true },
      { name: 'API piekļuve', included: true },
      { name: 'Balts etiķetēšanas iespējas', included: true },
      { name: 'SLA garantija', included: true },
      { name: 'Dedicēts klientu menedžers', included: true }
    ],
    cta: 'Sazināties',
    ctaLink: '/contact?plan=team'
  }
]

const faqs = [
  {
    question: 'Vai es varu mainīt plānu jebkurā laikā?',
    answer: 'Jā, tu vari mainīt savu plānu jebkurā laikā. Izmaiņas stāsies spēkā nākamajā norēķinu ciklā.'
  },
  {
    question: 'Vai ir pieejama bezmaksas izmēģināšana?',
    answer: 'Pro plāna lietotāji var izmēģināt visas funkcijas 14 dienas bez maksas. Nav nepieciešama kredītkarte.'
  },
  {
    question: 'Kādi ir maksājumu veidi?',
    answer: 'Mēs pieņemam visas galvenās kredītkartes, PayPal un bankas pārskaitījumus uzņēmuma klientiem.'
  },
  {
    question: 'Vai mani dati ir droši?',
    answer: 'Jā, visi dati tiek šifrēti un glabāti drošos Eiropas datu centros. Mēs atbilstam GDPR prasībām.'
  },
  {
    question: 'Vai varu atcelt abonementu?',
    answer: 'Protams! Tu vari atcelt abonementu jebkurā laikā no sava profila iestatījumiem.'
  }
]

export default function PricingPage() {
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
            <span className="text-sm font-medium text-white">Caurspīdīgas Cenas</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-bold mb-8 leading-tight">
            <span className="gradient-text">Izvēlies</span> plānu
            <br />
            <span className="text-white">savām</span> <span className="gradient-text">vajadzībām</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Sāc bez maksas vai izvēlies Pro plānu pilnai funkcionalitātei. 
            Nav slēptu maksas, var atcelt jebkurā laikā.
          </p>

          <div className="inline-flex items-center space-x-2 bg-gray-800 p-1 rounded-lg">
            <button className="px-4 py-2 bg-coral text-white rounded text-sm font-medium">
              Mēneša
            </button>
            <button className="px-4 py-2 text-gray-400 text-sm font-medium">
              Gada (ekonomē 20%)
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`card hover-lift relative overflow-hidden ${
                  plan.popular ? 'border-coral bg-gradient-to-br from-gray-900/90 to-gray-800/90' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-coral text-white px-3 py-1 rounded-full text-xs font-bold flex items-center">
                      <StarIcon className="w-3 h-3 mr-1" />
                      POPULĀRS
                    </div>
                  </div>
                )}

                <div className="p-8">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold gradient-text">€{plan.price}</span>
                      <span className="text-gray-400 text-sm ml-2">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {Array.isArray(plan.features) && plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm">
                        {feature.included ? (
                          <CheckIcon className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                        ) : (
                          <XMarkIcon className="w-4 h-4 text-gray-600 mr-3 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-gray-300' : 'text-gray-500'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link 
                    href={plan.ctaLink}
                    className={`w-full block text-center py-3 px-6 rounded-lg font-medium transition-colors ${
                      plan.popular 
                        ? 'bg-coral hover:bg-coral-dark text-white' 
                        : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 text-sm mb-4">
              ✓ Nav slepenu maksu  ✓ Var atcelt jebkurā laikā  ✓ GDPR atbilstošs
            </p>
            <div className="inline-flex items-center space-x-4 text-xs text-gray-500">
              <span>💳 Visa, MasterCard</span>
              <span>🔒 256-bit šifrēšana</span>
              <span>🇪🇺 ES datu centri</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-900/30 via-transparent to-gray-800/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Biežāk <span className="gradient-text">uzdotie</span> jautājumi
            </h2>
            <p className="text-lg text-gray-300">
              Nevarēji atrast atbildi? Sazinājies ar mums!
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="card">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-3 text-white">
                    {faq.question}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 mb-6">
              Ir citi jautājumi? Mēs labprāt palīdzēsim!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="btn-primary">
                Sazināties
              </Link>
              <Link href="/help" className="btn-secondary">
                Palīdzības centrs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}