import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { logger } from '../../lib/productionLogger'
// Supabase removed - using backend auth only

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Backend-only OAuth callback handling
        // Get auth code or token from URL parameters
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const token = urlParams.get('token')
        const error = urlParams.get('error')

        if (error) {
          throw new Error(decodeURIComponent(error))
        }

        if (token) {
          // Direct token from backend OAuth
          localStorage.setItem('authToken', token)
          
          setStatus('success')
          setMessage('Veiksmīgi pieslēdzieties!')
          
          // Redirect to dashboard after short delay
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        } else if (code) {
          // Exchange code for token via backend
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          })

          const data = await response.json()

          if (response.ok && data.success) {
            localStorage.setItem('authToken', data.token)
            
            setStatus('success')
            setMessage('Veiksmīgi pieslēdzieties!')
            
            setTimeout(() => {
              router.push('/dashboard')
            }, 1500)
          } else {
            throw new Error(data.message || 'Authentication failed')
          }
        } else {
          throw new Error('No authentication data found')
        }
      } catch (error: any) {
        logger.error('ERROR', 'Auth callback error:', { error: error })
        setStatus('error')
        setMessage(error.message || 'Autentifikācijas kļūda')
        
        // Redirect to login page after short delay
        setTimeout(() => {
          router.push('/auth/login?error=oauth_failed')
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="card text-center p-8">
          {status === 'loading' && (
            <>
              <div className="animate-spin w-12 h-12 border-4 border-coral border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-white mb-2">Apstrādā autentifikāciju...</h2>
              <p className="text-gray-400">Lūdzu uzgaidiet</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Veiksmīgi!</h2>
              <p className="text-gray-400">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
              <p className="text-gray-400 mb-4">{message}</p>
              <p className="text-gray-500 text-sm">Pārsūtām uz pieslēgšanās lapu...</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}