import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth, withAuth } from '../../contexts/AuthContext'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { getAuthToken } from '../../utils/auth'

interface GoalsFormData {
  weeklyGoal: string
  preferredDistance: string
  targetEventType: string
  targetEventDate: string
  trainingIntensityPref: string
  hasRunningExperience: boolean
  runningExperience: string
  longestRunEver: string
  personalBest5k: string
  personalBest10k: string
}

function ProfileGoals() {
  const router = useRouter()
  const { user } = useAuth()
  const { onboarding } = router.query
  const isOnboarding = onboarding === 'true'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState<GoalsFormData>({
    weeklyGoal: '',
    preferredDistance: '',
    targetEventType: '',
    targetEventDate: '',
    trainingIntensityPref: '',
    hasRunningExperience: false,
    runningExperience: '',
    longestRunEver: '',
    personalBest5k: '',
    personalBest10k: ''
  })

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        weeklyGoal: user.weeklyGoal?.toString() || '',
        preferredDistance: user.preferredDistance || '',
        targetEventType: '',
        targetEventDate: '',
        trainingIntensityPref: '',
        hasRunningExperience: false,
        runningExperience: '',
        longestRunEver: '',
        personalBest5k: '',
        personalBest10k: ''
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
    if (!formData.weeklyGoal || !formData.preferredDistance) {
      setError('Nedēļas mērķis un vēlamā distance ir obligāti')
      setLoading(false)
      return
    }

    try {
      const updateData = {
        weeklyGoal: parseInt(formData.weeklyGoal),
        preferredDistance: formData.preferredDistance
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
        setMessage('Mērķi saglabāti veiksmīgi!')
        
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
        setError(errorData.message || 'Neizdevās saglabāt mērķus')
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
            Treniņu mērķi
          </h1>
          <p className="text-gray-400 mt-2">
            {isOnboarding 
              ? 'Iestatiet savus skriešanas mērķus un preferences personalizētiem treniņu plāniem'
              : 'Atjauniniet savus treniņu mērķus'
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
            <h3 className="text-lg font-semibold text-white mb-4">Treniņu mērķi</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nedēļas mērķis (km) *
                </label>
                <select
                  name="weeklyGoal"
                  required
                  value={formData.weeklyGoal}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  <option value="">Izvēlieties...</option>
                  <option value="5">5 km nedēļā</option>
                  <option value="10">10 km nedēļā</option>
                  <option value="15">15 km nedēļā</option>
                  <option value="20">20 km nedēļā</option>
                  <option value="25">25 km nedēļā</option>
                  <option value="30">30 km nedēļā</option>
                  <option value="40">40 km nedēļā</option>
                  <option value="50">50+ km nedēļā</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mērķa distance *
                </label>
                <select
                  name="preferredDistance"
                  required
                  value={formData.preferredDistance}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  <option value="">Izvēlieties...</option>
                  <option value="5k">5 km</option>
                  <option value="10k">10 km</option>
                  <option value="half-marathon">Pusmaratons (21 km)</option>
                  <option value="marathon">Maratons (42 km)</option>
                  <option value="ultramarathon">Ultramaratons (50+ km)</option>
                  <option value="general">Vispārējā forma</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mērķa sacensību veids
                </label>
                <select
                  name="targetEventType"
                  value={formData.targetEventType}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  <option value="">Nav konkrēta mērķa</option>
                  <option value="5k-race">5km sacensības</option>
                  <option value="10k-race">10km sacensības</option>
                  <option value="half-marathon-race">Pusmaratona sacensības</option>
                  <option value="marathon-race">Maratona sacensības</option>
                  <option value="trail-run">Trail skriešana</option>
                  <option value="obstacle-race">Šķēršļu skriešana</option>
                  <option value="general-fitness">Vispārējā fiziskā forma</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mērķa datums
                </label>
                <input
                  name="targetEventDate"
                  type="date"
                  value={formData.targetEventDate}
                  onChange={handleChange}
                  className="input-field w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-4">Treniņa intensitāte</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vēlamā treniņa intensitāte
              </label>
              <select
                name="trainingIntensityPref"
                value={formData.trainingIntensityPref}
                onChange={handleChange}
                className="input-field w-full"
              >
                <option value="">Izvēlieties...</option>
                <option value="low">Zema - ērti treniņi, fokuss uz izturību</option>
                <option value="moderate">Vidēja - līdzsvarots treniņu plāns</option>
                <option value="high">Augsta - intensīvi treniņi, ātra progresa</option>
                <option value="variable">Mainīga - atkarībā no pašsajūtas</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-600">
            <h3 className="text-lg font-semibold text-white mb-4">Skriešanas pieredze</h3>
            
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Pieredzes līmenis
                    </label>
                    <select
                      name="runningExperience"
                      value={formData.runningExperience}
                      onChange={handleChange}
                      className="input-field w-full"
                    >
                      <option value="">Izvēlieties...</option>
                      <option value="beginner">Sācējs (skrien mazāk par 6 mēnešiem)</option>
                      <option value="novice">Iesācējs (skrien 6-12 mēnešus)</option>
                      <option value="recreational">Rekreatīvs (skrien 1-3 gadus)</option>
                      <option value="competitive">Sacensību (piedalos sacensībās)</option>
                      <option value="advanced">Pokročilý (skrien 3+ gadus regulāri)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Garākā noskrietā distance (km)
                    </label>
                    <input
                      name="longestRunEver"
                      type="number"
                      step="0.1"
                      min="0"
                      max="200"
                      value={formData.longestRunEver}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Labākais 5km rezultāts (mm:ss)
                    </label>
                    <input
                      name="personalBest5k"
                      type="text"
                      value={formData.personalBest5k}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="25:00"
                      pattern="[0-9]{1,2}:[0-9]{2}"
                      title="Formāts: mm:ss (piemēram, 25:30)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Labākais 10km rezultāts (mm:ss)
                    </label>
                    <input
                      name="personalBest10k"
                      type="text"
                      value={formData.personalBest10k}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="55:00"
                      pattern="[0-9]{1,2}:[0-9]{2}"
                      title="Formāts: mm:ss (piemēram, 55:30)"
                    />
                  </div>
                </div>
              )}
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
                'Saglabāt mērķus'
              )}
            </button>
          </div>
        </form>

        {/* Help text for onboarding */}
        {isOnboarding && (
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>Kāpēc šī informācija ir nepieciešama?</strong><br />
              Mērķi palīdz izveidot strukturētu treniņu plānu ar progresīvu slodzes palielināšanu. 
              Pieredzes informācija ļauj noteikt sākuma līmeni un izvairīties no traumām.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(ProfileGoals)