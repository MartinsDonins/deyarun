import { useState } from 'react'
import { 
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrophyIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import Footer from '../components/Footer'

const helpCategories = [
  {
    icon: QuestionMarkCircleIcon,
    title: 'Pamata jautājumi',
    description: 'Atbildes uz biežāk uzdotajiem jautājumiem',
    articles: [
      'Kā sākt lietot DeyaRun?',
      'Kā darbojas GPS izsekošana?',
      'Kā izveidot treniņu plānu?',
      'Kā apskatīt savu progresu?'
    ]
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Konta pārvaldība',
    description: 'Profila iestatījumi un drošība',
    articles: [
      'Kā mainīt paroli?',
      'Kā dzēst kontu?',
      'Kā pievienot profila bildi?',
      'Privātuma iestatījumi'
    ]
  },
  {
    icon: ExclamationTriangleIcon,
    title: 'Tehniskais atbalsts',
    description: 'Problēmu risinājumi un kļūdu labošana',
    articles: [
      'GPS nedarbojas precīzi',
      'Aplikācija neielādējas',
      'Dati nepareizi sinhronizējas',
      'Mobilo aplikāciju problēmas'
    ]
  }
]

interface SupportFormData {
  name: string
  email: string
  subject: string
  message: string
  type: 'question' | 'bug' | 'feature' | 'other'
}

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'contact'>('browse')
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState<SupportFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'question'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      const response = await fetch('/api/support/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setSubmitStatus({ type: 'success', message: data.message })
        setFormData({ name: '', email: '', subject: '', message: '', type: 'question' })
      } else {
        setSubmitStatus({ type: 'error', message: data.message })
      }
    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        message: 'Radās kļūda nosūtot ziņojumu. Lūdzu mēģiniet vēlāk.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof SupportFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-adaptive relative overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)`
      }}></div>

      {/* Navigation */}
      <nav className="glass-card rounded-none border-x-0 border-t-0 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
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
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <QuestionMarkCircleIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-adaptive-white">
                <span className="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">Palīdzības</span> centrs
              </h1>
              <p className="text-lg text-adaptive-light mb-8">
                Atrod atbildes uz saviem jautājumiem vai sazinājies ar mūsu atbalsta komandu
              </p>

              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-adaptive-muted" />
                  <input
                    type="text"
                    placeholder="Meklēt palīdzības rakstus..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="glass-input w-full pl-10"
                  />
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex justify-center">
                <div className="glass-card p-1 bg-white/5">
                  <button
                    onClick={() => setActiveTab('browse')}
                    className={`px-6 py-2 rounded font-medium transition-colors ${
                      activeTab === 'browse'
                        ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                        : 'text-adaptive-light hover:text-adaptive-white'
                    }`}
                  >
                    Pārlūkot rakstus
                  </button>
                  <button
                    onClick={() => setActiveTab('contact')}
                    className={`px-6 py-2 rounded font-medium transition-colors ${
                      activeTab === 'contact'
                        ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                        : 'text-adaptive-light hover:text-adaptive-white'
                    }`}
                  >
                    Sazināties
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {activeTab === 'browse' ? (
              <div className="space-y-8">
                <div className="glass-card p-6 text-center">
                  <h2 className="text-2xl font-bold text-adaptive-white">
                    Palīdzības <span className="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">kategorijas</span>
                  </h2>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {helpCategories.map((category, index) => {
                    const Icon = category.icon
                    return (
                      <div key={index} className="glass-card p-6 hover:scale-105 transition-transform">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4 shadow-lg">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        
                        <h3 className="text-xl font-semibold mb-3 text-adaptive-white">
                          {category.title}
                        </h3>
                        
                        <p className="text-adaptive-light mb-4 text-sm">
                          {category.description}
                        </p>

                        <ul className="space-y-2">
                          {category.articles.map((article, idx) => (
                            <li key={idx}>
                              <a 
                                href="#" 
                                className="text-adaptive-light hover:text-purple-400 transition-colors text-sm flex items-center"
                              >
                                <span className="w-1 h-1 bg-purple-400 rounded-full mr-3"></span>
                                {article}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>

                {/* Popular Articles */}
                <div className="glass-card p-6">
                  <h3 className="text-xl font-semibold mb-6 text-center text-adaptive-white">
                    <span className="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">Populārākie</span> raksti
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                    {[
                      'Kā sākt izmantot DeyaRun?',
                      'GPS izsekošanas precizitāte',
                      'Treniņu plānu personalizācija',
                      'Kā sinhronizēt datus starp ierīcēm?',
                      'Profila iestatījumu maiņa',
                      'Konta drošības uzlabošana'
                    ].map((article, index) => (
                      <a
                        key={index}
                        href="#"
                        className="glass-card p-4 hover:scale-105 transition-transform bg-white/5 border-purple-500/20"
                      >
                        <span className="text-adaptive-light hover:text-adaptive-white transition-colors">{article}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="glass-card p-6 text-center">
                  <h2 className="text-2xl font-bold text-adaptive-white">
                    <span className="bg-gradient-to-r from-purple-500 to-cyan-500 bg-clip-text text-transparent">Sazināties</span> ar mums
                  </h2>
                </div>

                {/* Contact Form */}
                <div className="glass-card">
                <form onSubmit={handleFormSubmit} className="p-8">
                  {submitStatus.type && (
                    <div className={`mb-6 p-4 rounded-lg border ${
                      submitStatus.type === 'success' 
                        ? 'bg-green-900/50 border-green-700 text-green-300' 
                        : 'bg-red-900/50 border-red-700 text-red-300'
                    }`}>
                      <div className="flex items-center">
                        {submitStatus.type === 'success' ? (
                          <CheckCircleIcon className="w-5 h-5 mr-2" />
                        ) : (
                          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                        )}
                        {submitStatus.message}
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-adaptive-light mb-2">
                        Vārds *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="glass-input w-full"
                        placeholder="Tavs vārds"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-adaptive-light mb-2">
                        E-pasts *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="glass-input w-full"
                        placeholder="tavs@epasts.lv"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-adaptive-light mb-2">
                      Ziņojuma veids *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value as any)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                    >
                      <option value="question">Jautājums</option>
                      <option value="bug">Errors ziņojums</option>
                      <option value="feature">Funkcionalitātes ieteikums</option>
                      <option value="other">Cits</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-adaptive-light mb-2">
                      Tēma *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                      placeholder="Īss apraksts par jautājumu"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-adaptive-light mb-2">
                      Ziņojums *
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none resize-none"
                      placeholder="Detalizēts apraksts par jautājumu vai problēmu..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="glass-button-primary w-full flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Nosūta...
                      </>
                    ) : (
                      'Nosūtīt ziņojumu'
                    )}
                  </button>

                  <p className="text-adaptive-muted text-sm mt-4 text-center">
                    Mēs atbildēsim 24 stundu laikā. Steidzamos gadījumos rakstiet uz{' '}
                    <a href="mailto:info@deyarun.com" className="text-purple-400 hover:underline">
                      info@deyarun.com
                    </a>
                  </p>
                </form>
              </div>
            </div>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
