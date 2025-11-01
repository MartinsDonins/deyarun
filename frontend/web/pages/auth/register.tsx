import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useAuth, withPublicRoute } from '../../contexts/AuthContext'
import CountryCodeSelect from '../../components/CountryCodeSelect'
import DatePicker from '../../components/DatePicker'

const ThemeToggle = dynamic(() => import('../../components/ThemeToggle'), {
  ssr: false,
  loading: () => <div className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse" />
})

interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  birthDate: string
  gender: string
  phoneCountryCode: string
  phone: string
  weight: string
  height: string
  fitnessGoals: string
  currentActivity: string
  runningExperience: string
  weeklyMileage: string
  typicalRunningPace: string
  longestRun: string
  coreTrainingPerWeek: string
  medicalConditions: string
  currentPain: string
  hasExcessWeight: boolean
  preferredDistance: string
  trainingIntensityPref: string
  sleepHoursPerNight: string
  hasRunningShoes: boolean
  runningShoesBrand: string
  runningShoesModel: string
  hasHeartRateMonitor: boolean
  monitorsHeartRate: boolean
  hasRunningExperience: boolean
  longestRunEver: string
  longestRunLastMonth: string
  personalBest10k: string
  personalBest5k: string
  strengthTrainingPerWeek: string
  workoutsPerWeekCurrent: string
  workoutsPerWeekLastMonth: string
}

function Register() {
  const router = useRouter()
  const { login, loginWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState(1)
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    gender: '',
    phoneCountryCode: '+371',
    phone: '',
    weight: '',
    height: '',
    fitnessGoals: '',
    currentActivity: '',
    runningExperience: '',
    weeklyMileage: '',
    typicalRunningPace: '',
    longestRun: '',
    coreTrainingPerWeek: '',
    medicalConditions: '',
    currentPain: '',
    hasExcessWeight: false,
    preferredDistance: '',
    trainingIntensityPref: '',
    sleepHoursPerNight: '',
    hasRunningShoes: false,
    runningShoesBrand: '',
    runningShoesModel: '',
    hasHeartRateMonitor: false,
    monitorsHeartRate: false,
    hasRunningExperience: false,
    longestRunEver: '',
    longestRunLastMonth: '',
    personalBest10k: '',
    personalBest5k: '',
    strengthTrainingPerWeek: '',
    workoutsPerWeekCurrent: '',
    workoutsPerWeekLastMonth: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('Paroles nesakrīt')
      return
    }

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.birthDate || !formData.gender) {
      setError('Lūdzu aizpildiet visus obligātos laukus')
      return
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
    if (!passwordRegex.test(formData.password)) {
      setError('Parole jāsatur vismaz 8 simboli ar vismaz 1 burtu un 1 ciparu')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Send only required fields to backend
      const registrationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        birthDate: formData.birthDate,
        gender: formData.gender
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Reģistrācija neizdevās')
      }
      
      if (data.success) {
        // Show success message and redirect to email verification notice
        if (data.user?.isEmailVerified) {
          setSuccess('Konts izveidots veiksmīgi! Tagad varat pieslēgties.')
          setTimeout(() => {
            router.push('/auth/login?registered=true')
          }, 2000)
        } else {
          setSuccess('Konts izveidots veiksmīgi! Pārbaudiet savu e-pastu un apstipriniet e-pasta adresi, lai turpinātu.')
          setTimeout(() => {
            router.push('/auth/login?verify=true')
          }, 3000)
        }
      } else {
        setError(data.message || 'Reģistrācija neizdevās')
      }
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        setError('Lietotājs ar šo e-pasta adresi jau eksistē')
      } else {
        setError(err.message || 'Network error. Lūdzu mēģiniet vēlreiz.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const nextStep = () => {
    // Validate step 1 required fields before proceeding
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword || !formData.birthDate || !formData.gender) {
        setError('Lūdzu aizpildiet visus obligātos laukus ar zvaigznīti (*)')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Paroles nesakrīt')
        return
      }
      // Validate password strength
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
      if (!passwordRegex.test(formData.password)) {
        setError('Parole jāsatur vismaz 8 simboli ar vismaz 1 burtu un 1 ciparu')
        return
      }
    }
    
    setError('') // Clear any validation errors when moving to next step
    setStep(prev => Math.min(prev + 1, 4))
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Pamata informācija</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Vārds *</label>
            <input
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="input-field w-full"
              placeholder=""
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Uzvārds *</label>
            <input
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="input-field w-full"
              placeholder=""
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">E-pasts *</label>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="input-field w-full"
              placeholder=""
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Telefons</label>
            <div className="flex space-x-2">
              <div className="w-32">
                <CountryCodeSelect
                  value={formData.phoneCountryCode}
                  onChange={(dialCode) => setFormData(prev => ({ ...prev, phoneCountryCode: dialCode }))}
                />
              </div>
              <div className="flex-1">
                <input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder=""
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Dzimšanas datums *</label>
            <DatePicker
              value={formData.birthDate}
              onChange={(date) => setFormData(prev => ({ ...prev, birthDate: date }))}
              placeholder=""
              maxDate={new Date(new Date().getFullYear() - 13, 11, 31).toISOString().split('T')[0]} // Min 13 years old
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Dzimums *</label>
            <select
              name="gender"
              required
              value={formData.gender}
              onChange={handleChange}
              className="input-field w-full"
            >
              <option value="">Izvēlieties...</option>
              <option value="male">Vīrietis</option>
              <option value="female">Sieviete</option>
              <option value="other">Cits</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Svars (kg)</label>
            <input
              name="weight"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={handleChange}
              className="input-field w-full"
              placeholder=""
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Augums (cm)</label>
            <input
              name="height"
              type="number"
              value={formData.height}
              onChange={handleChange}
              className="input-field w-full"
              placeholder=""
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Parole *</label>
            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="input-field w-full"
              placeholder=""
            />
            <p className="text-xs text-gray-400 mt-1">
              Vismaz 8 simboli ar vismaz 1 burtu un 1 ciparu
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Apstiprināt paroli *</label>
            <input
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field w-full"
              placeholder=""
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Skriešanas pieredze</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              name="hasRunningExperience"
              type="checkbox"
              checked={formData.hasRunningExperience}
              onChange={handleChange}
              className="h-4 w-4 text-coral focus:ring-coral border-gray-600 rounded bg-surface"
            />
            <label className="text-gray-300">Man ir skriešanas pieredze</label>
          </div>
          
          {formData.hasRunningExperience && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Garākā distance (km)</label>
                <input
                  name="longestRunEver"
                  type="number"
                  step="0.1"
                  value={formData.longestRunEver}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder=""
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Garākā distance pēdējā mēnesī (km)</label>
                <input
                  name="longestRunLastMonth"
                  type="number"
                  step="0.1"
                  value={formData.longestRunLastMonth}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder=""
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Labākais 5km rezultāts (minūtes)</label>
                <input
                  name="personalBest5k"
                  type="number"
                  value={formData.personalBest5k}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder=""
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Labākais 10km rezultāts (minūtes)</label>
                <input
                  name="personalBest10k"
                  type="number"
                  value={formData.personalBest10k}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder=""
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Pieredzes līmenis</label>
            <select
              name="runningExperience"
              value={formData.runningExperience}
              onChange={handleChange}
              className="input-field w-full"
            >
              <option value="beginner">Sācējs</option>
              <option value="recreational">Rekreatīvs</option>
              <option value="competitive">Sacensībās</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Treniņi un veselība</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cik reizes nedēļā vēlās trenēties?</label>
            <select
              name="workoutsPerWeekCurrent"
              value={formData.workoutsPerWeekCurrent}
              onChange={handleChange}
              className="input-field w-full"
            >
              <option value="1">1 reizi</option>
              <option value="2">2 reizes</option>
              <option value="3">3 reizes</option>
              <option value="4">4 reizes</option>
              <option value="5">5 reizes</option>
              <option value="6">6 reizes</option>
              <option value="7">Katru dienu</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cik reizes nedēļā sportoja pēdējā mēnesī?</label>
            <select
              name="workoutsPerWeekLastMonth"
              value={formData.workoutsPerWeekLastMonth}
              onChange={handleChange}
              className="input-field w-full"
            >
              <option value="0">0 reizes</option>
              <option value="1">1 reizi</option>
              <option value="2">2 reizes</option>
              <option value="3">3 reizes</option>
              <option value="4">4 reizes</option>
              <option value="5">5+ reizes</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Spēka treniņi nedēļā</label>
            <select
              name="strengthTrainingPerWeek"
              value={formData.strengthTrainingPerWeek}
              onChange={handleChange}
              className="input-field w-full"
            >
              <option value="0">0 reizes</option>
              <option value="1">1 reizi</option>
              <option value="2">2 reizes</option>
              <option value="3">3+ reizes</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Dziļās muskulatūras treniņi nedēļā</label>
            <select
              name="coreTrainingPerWeek"
              value={formData.coreTrainingPerWeek}
              onChange={handleChange}
              className="input-field w-full"
            >
              <option value="0">0 reizes</option>
              <option value="1">1 reizi</option>
              <option value="2">2 reizes</option>
              <option value="3">3+ reizes</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Slimības vai veselības problēmas</label>
          <textarea
            name="medicalConditions"
            value={formData.medicalConditions}
            onChange={handleChange}
            className="input-field w-full"
            rows={3}
            placeholder=""
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Pašreizējās sāpes vai diskomforts</label>
          <textarea
            name="currentPain"
            value={formData.currentPain}
            onChange={handleChange}
            className="input-field w-full"
            rows={2}
            placeholder=""
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            name="hasExcessWeight"
            type="checkbox"
            checked={formData.hasExcessWeight}
            onChange={handleChange}
            className="h-4 w-4 text-coral focus:ring-coral border-gray-600 rounded bg-surface"
          />
          <label className="text-gray-300">Man ir liekais svars</label>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Mērķi un aprīkojums</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Mērķa distance</label>
            <select
              name="preferredDistance"
              value={formData.preferredDistance}
              onChange={handleChange}
              className="input-field w-full"
            >
              <option value="5k">5 km</option>
              <option value="10k">10 km</option>
              <option value="half-marathon">Pusmaratons (21 km)</option>
              <option value="marathon">Maratons (42 km)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Treniņa intensitāte</label>
            <select
              name="trainingIntensityPref"
              value={formData.trainingIntensityPref}
              onChange={handleChange}
              className="input-field w-full"
            >
              <option value="low">Zema</option>
              <option value="moderate">Vidēja</option>
              <option value="high">Augsta</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Miegs (stundas nakts)</label>
            <select
              name="sleepHoursPerNight"
              value={formData.sleepHoursPerNight}
              onChange={handleChange}
              className="input-field w-full"
            >
              <option value="5">5 stundas</option>
              <option value="6">6 stundas</option>
              <option value="7">7 stundas</option>
              <option value="8">8 stundas</option>
              <option value="9">9 stundas</option>
              <option value="10">10+ stundas</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              name="hasRunningShoes"
              type="checkbox"
              checked={formData.hasRunningShoes}
              onChange={handleChange}
              className="h-4 w-4 text-coral focus:ring-coral border-gray-600 rounded bg-surface"
            />
            <label className="text-gray-300">Man ir skriešanas apavi</label>
          </div>
          
          {formData.hasRunningShoes && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ražotājs</label>
                <input
                  name="runningShoesBrand"
                  type="text"
                  value={formData.runningShoesBrand}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder=""
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Modelis</label>
                <input
                  name="runningShoesModel"
                  type="text"
                  value={formData.runningShoesModel}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder=""
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            <input
              name="hasHeartRateMonitor"
              type="checkbox"
              checked={formData.hasHeartRateMonitor}
              onChange={handleChange}
              className="h-4 w-4 text-coral focus:ring-coral border-gray-600 rounded bg-surface"
            />
            <label className="text-gray-300">Man ir pulsometrs</label>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              name="monitorsHeartRate"
              type="checkbox"
              checked={formData.monitorsHeartRate}
              onChange={handleChange}
              className="h-4 w-4 text-coral focus:ring-coral border-gray-600 rounded bg-surface"
            />
            <label className="text-gray-300">Mēru pulsu treniņos</label>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-adaptive relative overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
                          radial-gradient(circle at 75% 75%, rgba(255, 107, 107, 0.1) 0%, transparent 50%)`
      }}></div>

      {/* Theme Toggle - Fixed position in top right */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle size="sm" />
      </div>
      
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative z-10">
        <div className="glass-card p-12 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-adaptive-white mb-4 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            DeyaRun
          </h1>
          <p className="text-adaptive-light text-lg mb-8">
            Sāc savu skrējiena ceļojumu ar profesionālu treneri un personalizētiem treniņu plāniem
          </p>
          <div className="space-y-3 text-adaptive-light">
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 mr-3"></div>
              <span>Personalizēti treniņu plāni</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 mr-3"></div>
              <span>AI-vadīta treneru palīdzība</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 mr-3"></div>
              <span>Detalizēta progresa analīze</span>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 mr-3"></div>
              <span>Strava integrācija</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="glass-card p-8 max-w-md w-full">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">
              DeyaRun
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-adaptive-white mb-3">Izveidot kontu</h2>
            <p className="text-adaptive-light">
              Jau ir konts?{' '}
              <Link href="/auth/login" className="text-orange-500 hover:text-orange-400 font-medium transition-colors">
                Pieslēgties šeit
              </Link>
            </p>
            <p className="mt-3 text-sm text-adaptive-muted">
              Pēc reģistrācijas varēsiet pabeigt savu profilu un sākt trenēties!
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="glass-card-error p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              </div>
            )}
            
            {success && (
              <div className="glass-card-success p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-adaptive-light mb-2">
                    Vārds *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="glass-input w-full"
                    placeholder="Jānis"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-adaptive-light mb-2">
                    Uzvārds *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="glass-input w-full"
                    placeholder="Bērziņš"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-adaptive-light mb-2">
                  E-pasta adrese *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="glass-input w-full"
                  placeholder="janis@epasts.lv"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="birthDate" className="block text-sm font-medium text-adaptive-light mb-2">
                    Dzimšanas datums *
                  </label>
                  <input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    required
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="glass-input w-full"
                    max={new Date(new Date().getFullYear() - 13, 11, 31).toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-adaptive-light mb-2">
                    Dzimums *
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="glass-input w-full"
                  >
                    <option value="">Izvēlieties...</option>
                    <option value="male">Vīrietis</option>
                    <option value="female">Sieviete</option>
                    <option value="other">Cits</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-adaptive-light mb-2">
                  Parole *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="glass-input w-full"
                  placeholder="••••••••"
                />
                <p className="text-xs text-adaptive-muted mt-1">
                  Vismaz 8 simboli ar vismaz 1 burtu un 1 ciparu
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-adaptive-light mb-2">
                  Apstiprināt paroli *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="glass-input w-full"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="glass-button-primary w-full"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Izveidoja kontu...
                </div>
              ) : (
                'Izveidot kontu'
              )}
            </button>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-light" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-bg text-adaptive-muted">Vai</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  disabled={loading}
                  className="btn-secondary w-full justify-center hover:bg-surface/80 transition-all"
                  title="Reģistrēties ar Google kontu"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Reģistrēties ar Google
                </button>
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-xs text-adaptive-muted">
                Izveidojot kontu, jūs piekrītat mūsu{' '}
                <Link href="/terms" className="text-orange-500 hover:text-orange-400 transition-colors">
                  Lietošanas noteikumiem
                </Link>{' '}
                un{' '}
                <Link href="/privacy" className="text-orange-500 hover:text-orange-400 transition-colors">
                  Privātuma politikai
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default withPublicRoute(Register)
