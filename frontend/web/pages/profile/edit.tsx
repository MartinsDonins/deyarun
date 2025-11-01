import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth, withAuth } from '../../contexts/AuthContext'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { getAuthToken } from '../../utils/auth'

interface ProfileFormData {
  firstName: string
  lastName: string
  height: string
  weight: string
  birthDate: string
  gender: string
}

function ProfileEdit() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const { onboarding } = router.query
  const isOnboarding = onboarding === 'true'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    height: '',
    weight: '',
    birthDate: '',
    gender: ''
  })

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        height: user.height?.toString() || '',
        weight: user.weight?.toString() || '',
        birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
        gender: user.gender || ''
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.birthDate || !formData.gender) {
      setError('Vārds, uzvārds, dzimšanas datums un dzimums ir obligāti')
      setLoading(false)
      return
    }

    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        birthDate: formData.birthDate,
        gender: formData.gender
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
        setMessage('Profils saglabāts veiksmīgi!')
        
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
        setError(errorData.message || 'Neizdevās saglabāt profilu')
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
            {isOnboarding ? 'Pabeigt profilu' : 'Rediģēt profilu'}
          </h1>
          <p className="text-gray-400 mt-2">
            {isOnboarding 
              ? 'Pievienojiet savu pamata informāciju, lai izveidotu personalizētus treniņu plānus'
              : 'Atjauniniet savu profila informāciju'
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
            <h3 className="text-lg font-semibold text-white mb-4">Pamata informācija</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vārds *
                </label>
                <input
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="Tavs vārds"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Uzvārds *
                </label>
                <input
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="Tavs uzvārds"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dzimšanas datums *
                </label>
                <input
                  name="birthDate"
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="input-field w-full"
                  max={new Date(new Date().getFullYear() - 13, 11, 31).toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dzimums *
                </label>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Augums (cm)
                </label>
                <input
                  name="height"
                  type="number"
                  step="1"
                  min="100"
                  max="250"
                  value={formData.height}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="175"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Svars (kg)
                </label>
                <input
                  name="weight"
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  value={formData.weight}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="70"
                />
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
                'Saglabāt profilu'
              )}
            </button>
          </div>
        </form>

        {/* Help text for onboarding */}
        {isOnboarding && (
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>Kāpēc šī informācija ir nepieciešama?</strong><br />
              Augums un svars palīdz aprēķināt jūsu BMI un izveidot personalizētus treniņu plānus. 
              Dzimšanas datums ļauj noteikt jūsu vecuma grupu un piemērotas slodzes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(ProfileEdit)