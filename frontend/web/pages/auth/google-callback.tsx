import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { logger } from '../../lib/productionLogger'

function GoogleCallback() {
  const router = useRouter()
  const { login } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Apstrādājam Google autentifikāciju...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get('token')
        const userDataEncoded = urlParams.get('user')

        if (!token || !userDataEncoded) {
          throw new Error('Trūkst autentifikācijas datu')
        }

        // Decode user data from Base64
        const userData = JSON.parse(atob(userDataEncoded))

        // Store token and user data in localStorage
        console.log('🔑 Storing auth token and user data')
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('user_backup', JSON.stringify(userData))
        console.log('✅ Auth data stored successfully')

        // Update auth context (this will trigger a re-render)
        setStatus('success')
        setMessage('Google autentifikācija veiksmīga! Pārvirzām...')

        // Trigger a page reload to initialize AuthContext with new user data
        // This ensures the user state is properly set before navigation
        // Skip onboarding for admin users or if onboarding is completed
        const skipOnboarding = userData.onboardingCompleted ||
                               userData.role === 'admin' ||
                               userData.role === 'super_admin'

        console.log('🚀 Redirect decision:', {
          onboardingCompleted: userData.onboardingCompleted,
          role: userData.role,
          skipOnboarding
        })

        window.location.href = skipOnboarding ? '/dashboard' : '/onboarding'

      } catch (error) {
        logger.error('ERROR', 'Google callback error:', { error: error })
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Autentifikācijas kļūda')
        
        // Redirect to login page after error
        setTimeout(() => {
          router.push('/auth/login?error=google_callback_failed')
        }, 2000)
      }
    }

    // Handle callback when router is ready
    if (router.isReady) {
      handleCallback()
    }
  }, [router.isReady, router, login])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        {status === 'loading' && (
          <>
            <div className="loading-spinner w-12 h-12 mx-auto mb-6"></div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Apstrādājam autentifikāciju
            </h2>
            <p className="text-gray-400">
              Lūdzu uzgaidiet, kamēr mēs pārbaudām jūsu Google kontu...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Autentifikācija veiksmīga!
            </h2>
            <p className="text-gray-400">
              Pārvirzām jūs uz galveno lapu...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Autentifikācijas kļūda
            </h2>
            <p className="text-gray-400 mb-4">
              {message}
            </p>
            <button 
              onClick={() => router.push('/auth/login')}
              className="btn-primary"
            >
              Atgriezties pie pieteikšanās
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default GoogleCallback