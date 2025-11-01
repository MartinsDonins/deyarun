import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth, withAuth } from '../../contexts/AuthContext'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { getAuthToken } from '../../utils/auth'

interface HealthFormData {
  fitnessLevel: string
  sleepHours: string
  stressLevel: string
  medicalConditions: string
  currentInjuries: string
  currentPain: string
  hasExcessWeight: boolean
  nutritionQuality: string
}

function ProfileHealth() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const { onboarding } = router.query
  const isOnboarding = onboarding === 'true'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState<HealthFormData>({
    fitnessLevel: '',
    sleepHours: '',
    stressLevel: '',
    medicalConditions: '',
    currentInjuries: '',
    currentPain: '',
    hasExcessWeight: false,
    nutritionQuality: ''
  })

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        fitnessLevel: user.fitnessLevel || '',
        sleepHours: user.sleepHours?.toString() || '',
        stressLevel: user.stressLevel?.toString() || '',
        medicalConditions: '',
        currentInjuries: '',
        currentPain: '',
        hasExcessWeight: false,
        nutritionQuality: user.nutritionQuality?.toString() || ''
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.fitnessLevel || !formData.stressLevel) {
      setError('Fitness līmenis un stresa līmenis ir obligāti')
      setLoading(false)
      return
    }

    try {
      const updateData = {
        fitnessLevel: formData.fitnessLevel,
        sleepHours: formData.sleepHours ? parseInt(formData.sleepHours) : null,
        stressLevel: parseInt(formData.stressLevel),
        nutritionQuality: formData.nutritionQuality ? parseInt(formData.nutritionQuality) : null
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/user/profile`, {
        method: 'PUT',
        credentials: 'include', // Use httpOnly cookie auth
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setMessage('Veselības informācija saglabāta veiksmīgi!')
        
        // Refresh user data in AuthContext so onboarding can see updated info
        await refreshUser()
        
        // Redirect after 1 second
        setTimeout(() => {
          if (isOnboarding) {
            router.push('/onboarding')
          } else {
            router.push('/dashboard')
          }
        }, 1000)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Neizdevās saglabāt informāciju')
      }
    } catch (err: any) {
      setError('Network error. Lūdzu mēģiniet vēlreiz.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (isOnboarding) {
      router.push('/onboarding')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            {isOnboarding ? 'Atpakaļ uz onboarding' : 'Atpakaļ uz dashboard'}
          </button>
          
          <h1 className="text-3xl font-bold text-white">
            Veselības informācija
          </h1>
          <p className="text-gray-400 mt-2">
            {isOnboarding 
              ? 'Norādiet savu fitness līmeni un veselības stāvokli personalizētiem treniņu plāniem'
              : 'Atjauniniet savu veselības informāciju'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-400 text-sm">{message}</p>
            </div>
          )}

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-4">Fitness un veselība</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fitness līmenis *
                </label>
                <select
                  name="fitnessLevel"
                  required
                  value={formData.fitnessLevel}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  <option value="">Izvēlieties...</option>
                  <option value="beginner">Sācējs - reti sportoju</option>
                  <option value="novice">Iesācējs - sportoju 1-2 reizes nedēļā</option>
                  <option value="intermediate">Vidējais - sportoju 3-4 reizes nedēļā</option>
                  <option value="advanced">Pokročilý - sportoju 5+ reizes nedēļā</option>
                  <option value="expert">Ekspertlīmenis - regulāra fiziskā aktivitāte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Miega stundas naktī
                </label>
                <select
                  name="sleepHours"
                  value={formData.sleepHours}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  <option value="">Nav norādīts</option>
                  <option value="5">Mazāk par 6 stundām</option>
                  <option value="6">6 stundas</option>
                  <option value="7">7 stundas</option>
                  <option value="8">8 stundas</option>
                  <option value="9">9 vai vairāk stundas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stresa līmenis (1-10) *
                </label>
                <select
                  name="stressLevel"
                  required
                  value={formData.stressLevel}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  <option value="">Izvēlieties...</option>
                  <option value="1">1 - Ļoti zems</option>
                  <option value="2">2</option>
                  <option value="3">3 - Zems</option>
                  <option value="4">4</option>
                  <option value="5">5 - Vidējs</option>
                  <option value="6">6</option>
                  <option value="7">7 - Augsts</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10 - Ļoti augsts</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Uzturas kvalitāte (1-10)
                </label>
                <select
                  name="nutritionQuality"
                  value={formData.nutritionQuality}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  <option value="">Nav norādīts</option>
                  <option value="1">1 - Ļoti slikta</option>
                  <option value="2">2</option>
                  <option value="3">3 - Slikta</option>
                  <option value="4">4</option>
                  <option value="5">5 - Vidēja</option>
                  <option value="6">6</option>
                  <option value="7">7 - Laba</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10 - Ļoti laba</option>
                </select>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Slimības vai veselības problēmas
                </label>
                <textarea
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleChange}
                  className="input-field w-full"
                  rows={3}
                  placeholder="Aprakstiet jebkādas hroniskas slimības, kardiovaskulārās problēmas vai citus apstākļus..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pašreizējās traumas
                </label>
                <textarea
                  name="currentInjuries"
                  value={formData.currentInjuries}
                  onChange={handleChange}
                  className="input-field w-full"
                  rows={2}
                  placeholder="Aprakstiet jebkādas pašreizējās traumas..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pašreizējās sāpes vai diskomforts
                </label>
                <textarea
                  name="currentPain"
                  value={formData.currentPain}
                  onChange={handleChange}
                  className="input-field w-full"
                  rows={2}
                  placeholder="Vai šobrīd kaut kas sāp vai rada diskomfortu?"
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

          {/* Action buttons */}
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary"
            >
              Atcelt
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Saglabā...
                </div>
              ) : (
                'Saglabāt informāciju'
              )}
            </button>
          </div>
        </form>

        {/* Help text for onboarding */}
        {isOnboarding && (
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>Kāpēc šī informācija ir nepieciešama?</strong><br />
              Fitness līmenis palīdz noteikt piemērotas slodzes, miega un stresa informācija ļauj 
              izveidot atbilstošus atpūtas periodus. Šie dati palīdz izvairīties no pārslodzes un traumām.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(ProfileHealth)