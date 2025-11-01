import { useState } from 'react'
import { 
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  TrophyIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import Footer from '../components/Footer'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  type: 'general' | 'support' | 'business' | 'feedback'
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
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
        setSubmitStatus({ 
          type: 'success', 
          message: 'Ziņojums sekmīgi nosūtīts! Mēs sazināsimies ar jums 24 stundu laikā.' 
        })
        setFormData({ name: '', email: '', subject: '', message: '', type: 'general' })
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

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const contactMethods = [
    {
      icon: PhoneIcon,
      title: 'Telefons',
      description: 'Zvaniet mums',
      contact: '+371 20193143',
      action: 'tel:+37120193143'
    },
    {
      icon: EnvelopeIcon,
      title: 'E-pasts',
      description: 'Sūtiet mums ziņojumu',
      contact: 'info@deyarun.com',
      action: 'mailto:info@deyarun.com'
    },
    {
      icon: MapPinIcon,
      title: 'Juridiskā adrese',
      description: 'Sporta klubs "Skriešanas Akademija"',
      contact: 'Prūšu iela 4, Rīga, LV-1057',
      action: 'https://maps.google.com/maps?q=Prūšu+iela+4,+Rīga,+LV-1057'
    },
    {
      icon: TrophyIcon,
      title: 'Reģistrācijas numurs',
      description: 'Sporta klubs',
      contact: '40008260404',
      action: null
    }
  ]

  const quickLinks = [
    {
      icon: ChatBubbleBottomCenterTextIcon,
      title: 'Palīdzības centrs',
      description: 'Atbildes uz biežākiem jautājumiem',
      link: '/help'
    },
    {
      icon: EnvelopeIcon,
      title: 'FAQ',
      description: 'Biežāk uzdotie jautājumi',
      link: '/faq'
    }
  ]

  return (
    <div className="min-h-screen bg-adaptive relative overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-900/20 via-transparent to-blue-900/20"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`
      }}></div>

      {/* Navigation */}
      <nav className="glass-card rounded-none border-x-0 border-t-0 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
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
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <EnvelopeIcon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-adaptive-white">
                <span className="bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">Sazināties</span> ar mums
              </h1>
              <p className="text-lg text-adaptive-light mb-8">
                Ir jautājumi? Vēlaties sniegt ieteikumus? Mēs labprāt palīdzēsim!
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactMethods.map((method, index) => {
              const Icon = method.icon
              const isClickable = method.action !== null
              
              const content = (
                <div className="glass-card text-center p-6 hover:scale-105 transition-transform">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2 text-adaptive-white">
                    {method.title}
                  </h3>
                  
                  <p className="text-adaptive-muted text-sm mb-3">
                    {method.description}
                  </p>
                  
                  <p className={`text-adaptive-light text-sm font-medium ${isClickable ? 'hover:text-pink-400 transition-colors' : ''}`}>
                    {method.contact}
                  </p>
                </div>
              )

              return (
                <div key={index}>
                  {isClickable ? (
                    <a href={method.action!} target={method.action!.startsWith('http') ? '_blank' : undefined} rel={method.action!.startsWith('http') ? 'noopener noreferrer' : undefined}>
                      {content}
                    </a>
                  ) : (
                    content
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="glass-card">
                <div className="p-8">
                  <h2 className="text-2xl font-bold mb-6 text-adaptive-white">
                    Nosūtīt <span className="bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">ziņojumu</span>
                  </h2>

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

                  <form onSubmit={handleFormSubmit}>
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
                        className="glass-input w-full"
                      >
                        <option value="general">Vispārīgs jautājums</option>
                        <option value="support">Tehniskais atbalsts</option>
                        <option value="business">Biznesa sadarbība</option>
                        <option value="feedback">Atsauksmes un ieteikumi</option>
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
                        className="glass-input w-full"
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
                        className="glass-input w-full resize-none"
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

                    <p className="text-adaptive-muted text-sm mt-4">
                      Mēs atbildēsim 24 stundu laikā. Jūsu dati tiks izmantoti tikai saziņai un netiks nodoti trešajām personām.
                    </p>
                  </form>
                </div>
              </div>
            </div>

            {/* Quick Links Sidebar */}
            <div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-adaptive-white">
                    <span className="bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">Ātrie risinājumi</span>
                  </h3>
                  <div className="space-y-4">
                    {quickLinks.map((link, index) => {
                      const Icon = link.icon
                      return (
                        <Link key={index} href={link.link} className="glass-card hover:scale-105 transition-transform block p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-blue-500 rounded flex items-center justify-center flex-shrink-0 shadow-lg">
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-adaptive-white mb-1">{link.title}</h4>
                              <p className="text-adaptive-muted text-sm">{link.description}</p>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Business Hours */}
                <div className="glass-card p-6">
                  <h4 className="font-semibold mb-4 text-adaptive-white">
                    <span className="bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent">Darba laiks</span>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-adaptive-muted">Pirmdiena - Piektdiena</span>
                      <span className="text-adaptive-white">09:00 - 18:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-adaptive-muted">Sestdiena</span>
                      <span className="text-adaptive-white">10:00 - 16:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-adaptive-muted">Svētdiena</span>
                      <span className="text-adaptive-muted">Slēgts</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-adaptive-muted text-xs">
                      Ārpus darba laika nosūtītos ziņojumus apstrādāsim nākamajā darba dienā.
                    </p>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="glass-card p-6 bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/30">
                  <h4 className="font-semibold mb-2 text-red-300">Steidzami gadījumi</h4>
                  <p className="text-red-200 text-sm mb-3">
                    Ja rodas kritiska problēma ar pakalpojumu
                  </p>
                  <a 
                    href="mailto:info@deyarun.com"
                    className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  >
                    info@deyarun.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      <Footer />
    </div>
  )
}
