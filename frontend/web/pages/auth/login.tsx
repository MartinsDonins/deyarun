import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { apiService } from '../../lib/api'
// Supabase removed - using backend auth only
import { useAuth } from '../../contexts/AuthContext'

import { logger } from '../../lib/productionLogger';

const ThemeToggle = dynamic(() => import('../../components/ThemeToggle'), {
  ssr: false,
  loading: () => <div className="w-8 h-8 bg-gray-700 rounded-lg animate-pulse" />
})

function Login() {
  const router = useRouter()
  const { login, loginWithGoogle } = useAuth()
  const { verified, registered, verify } = router.query
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useSupabase, setUseSupabase] = useState(true) // Toggle for auth method
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = await login(formData.email, formData.password)
      
      if (success) {
        // Check if user needs onboarding
        try {
          const token = localStorage.getItem('token')
          const onboardingResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/user/onboarding/status`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (onboardingResponse.ok) {
            const onboardingData = await onboardingResponse.json()
            if (onboardingData.needsOnboarding) {
              router.push('/onboarding')
            } else {
              router.push('/dashboard')
            }
          } else {
            // Default to dashboard if onboarding check fails
            router.push('/dashboard')
          }
        } catch (onboardingError) {
          logger.error('ERROR', 'Onboarding check failed:', { error: onboardingError })
          // Default to dashboard if onboarding check fails
          router.push('/dashboard')
        }
      } else {
        setError('Nepareizs e-pasts vai parole')
      }
    } catch (err: any) {
      setError(err.message || 'Network error. Lūdzu mēģiniet vēlreiz.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-adaptive flex relative">
      {/* Theme Toggle - Fixed position in top right */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle size="sm" />
      </div>
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface/30 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--deyarun-primary)]/20 border border-[var(--deyarun-primary)] flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[var(--deyarun-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-adaptive-white mb-4">DeyaRun</h1>
          <p className="text-adaptive-light text-lg">
            Sāc savu skrējiena ceļojumu ar profesionālu treneri un personalizētiem treniņu plāniem
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="glass-card rounded-2xl p-8 w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-[var(--deyarun-primary)]/20 border border-[var(--deyarun-primary)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[var(--deyarun-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--deyarun-primary)] mb-2">DeyaRun</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-adaptive-white">Pieslēgties</h2>
            <p className="mt-2 text-adaptive-light">
              Vai nepieciešams konts?{' '}
              <Link href="/auth/register" className="text-[var(--deyarun-primary)] hover:text-[var(--deyarun-primary)]/80 font-medium transition-colors">
                Reģistrēties šeit
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {verified && (
              <div className="bg-[var(--deyarun-success)]/10 border border-[var(--deyarun-success)]/20 rounded-xl p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-[var(--deyarun-success)] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[var(--deyarun-success)] text-sm">E-pasts veiksmīgi apstiprināts! Tagad varat pieteikties savā kontā.</p>
                </div>
              </div>
            )}
            
            {registered && (
              <div className="bg-[var(--deyarun-success)]/10 border border-[var(--deyarun-success)]/20 rounded-xl p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-[var(--deyarun-success)] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-[var(--deyarun-success)] text-sm">Konts izveidots veiksmīgi! Tagad varat pieslēgties.</p>
                </div>
              </div>
            )}
            
            {verify && (
              <div className="bg-[var(--deyarun-warning)]/10 border border-[var(--deyarun-warning)]/20 rounded-xl p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-[var(--deyarun-warning)] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[var(--deyarun-warning)] text-sm">Konts izveidots! Pārbaudiet savu e-pastu un apstipriniet e-pasta adresi, lai turpinātu.</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-[var(--deyarun-error)]/10 border border-[var(--deyarun-error)]/20 rounded-xl p-4">
                <p className="text-[var(--deyarun-error)] text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-adaptive-light mb-2">
                  E-pasta adrese
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-surface/50 border border-surface-light rounded-xl px-4 py-3 text-adaptive-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-[var(--deyarun-primary)] focus:border-transparent transition-all"
                  placeholder="tavs@epasts.lv"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-adaptive-light mb-2">
                  Parole
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-surface/50 border border-surface-light rounded-xl px-4 py-3 pr-12 text-adaptive-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-[var(--deyarun-primary)] focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-adaptive-light hover:text-adaptive-white transition-colors focus:outline-none"
                    aria-label={showPassword ? "Paslēpt paroli" : "Rādīt paroli"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-coral focus:ring-coral border-gray-600 rounded bg-surface"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Atcerēties mani
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="text-coral hover:text-coral-light">
                  Aizmirsi paroli?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full relative"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Pieslēdzas...
                </div>
              ) : (
                'Pieslēgties'
              )}
            </button>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-bg text-gray-400">Vai</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  disabled={loading}
                  className="btn-secondary justify-center hover:bg-surface/80 transition-all"
                  title="Pieslēgties ar Google kontu"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>

                <button
                  type="button"
                  onClick={() => alert('Facebook ielogošanās drīzumā būs pieejama!')}
                  className="btn-secondary justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login