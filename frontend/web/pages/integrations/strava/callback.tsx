import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
// Removed deprecated getAuthToken import - now using httpOnly cookies
import { logger } from '../../../lib/productionLogger'

export default function StravaCallback() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { code, state, error } = router.query

        if (error) {
          throw new Error(`Strava autentifikācijas kļūda: ${error}`)
        }

        if (!code) {
          throw new Error('Nav saņemts autentifikācijas kods')
        }

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'

        const response = await fetch(`${API_BASE_URL}/api/integrations/strava/callback`, {
          method: 'POST',
          credentials: 'include', // Use httpOnly cookies instead of Authorization header
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code,
            state
          })
        })

        if (response.ok) {
          const data = await response.json()
          setStatus('success')
          setMessage(`Veiksmīgi savienots ar Strava kontu: ${data.athlete?.username || data.athlete?.firstname || 'Nezināms'}`)
          
          // Redirect to settings after 3 seconds
          setTimeout(() => {
            router.push('/settings?tab=integrations')
          }, 3000)
        } else {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Error savienojot ar Strava')
        }
      } catch (error) {
        logger.error('ERROR', 'Strava callback error:', { error: error })
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Unknown error')
        
        // Redirect to settings after 5 seconds
        setTimeout(() => {
          router.push('/settings?tab=integrations')
        }, 5000)
      }
    }

    if (router.isReady) {
      handleCallback()
    }
  }, [router.isReady, router.query])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="card max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin w-12 h-12 border-2 border-coral border-t-transparent rounded-full mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-white mb-2">Apstrādā Strava savienojumu</h2>
              <p className="text-gray-400">Lūdzu uzgaidiet...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-green-400 mb-2">Savienojums veiksmīgs!</h2>
              <p className="text-gray-400 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Pārsūtām uz iestatījumiem...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-400 mb-2">Savienojuma kļūda</h2>
              <p className="text-gray-400 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Pārsūtām uz iestatījumiem...</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}