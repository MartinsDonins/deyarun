import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { logger } from '../../../lib/productionLogger'

export default function VerifyEmailToken() {
  const router = useRouter()
  const { token } = router.query
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    if (token && typeof token === 'string') {
      verifyEmail(token)
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/verify-email/${verificationToken}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setMessage('E-pasts veiksmīgi apstiprināts!')
        setUserEmail(data.user?.email || '')
        
        // Update local storage with verification status if user is logged in
        const existingToken = localStorage.getItem('token')
        if (existingToken) {
          // Refresh the page or trigger a re-fetch of user data
          window.location.reload()
        }
        
        // Redirect to dashboard or login after 3 seconds
        setTimeout(() => {
          if (existingToken) {
            router.push('/dashboard?verified=true')
          } else {
            router.push('/auth/login?verified=true')
          }
        }, 3000)
      } else {
        if (data.message?.includes('expired')) {
          setStatus('expired')
          setMessage('Verifikācijas saite ir novecojusi. Lūdzu pieprasiet jaunu verifikācijas e-pastu.')
        } else {
          setStatus('error')
          setMessage(data.message || 'Neizdevās apstiprināt e-pastu. Iespējams, saite ir nederīga.')
        }
      }
    } catch (error) {
      logger.error('ERROR', 'Email verification error:', { error: error })
      setStatus('error')
      setMessage('Radās tehnoloģiska kļūda. Lūdzu mēģiniet vēlāk vai sazinieties ar atbalsta dienestu.')
    }
  }

  const resendVerification = async () => {
    try {
      setMessage('Nosūta verifikācijas e-pastu...')
      
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Verifikācijas e-pasts nosūtīts atkārtoti! Lūdzu pārbaudiet savu e-pasta kastīti.')
        setStatus('success')
      } else {
        setMessage(data.message || 'Neizdevās nosūtīt verifikācijas e-pastu. Lūdzu mēģiniet vēlāk.')
      }
    } catch (error) {
      logger.error('ERROR', 'Resend verification error:', { error: error })
      setMessage('Radās tehnoloģiska kļūda nosūtot e-pastu.')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-coral/20 border border-coral flex items-center justify-center">
            <svg className="w-8 h-8 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-white">
          E-pasta apstiprinājums
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          DeyaRun konta verifikācija
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow-xl border border-gray-700 sm:rounded-lg sm:px-10">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto"></div>
              <p className="mt-4 text-gray-400">Apstrādā verifikāciju...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 border border-green-500 mb-4">
                <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Apsveicam! 🎉
              </h3>
              <p className="text-gray-300 mb-4">{message}</p>
              {userEmail && (
                <p className="text-sm text-gray-400 mb-4">
                  E-pasts <strong className="text-coral">{userEmail}</strong> ir apstiprināts.
                </p>
              )}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-400">
                  ✓ Jūsu konts ir pilnībā aktivizēts<br/>
                  ✓ Tagad varat izmantot visas platformas funkcijas<br/>
                  ✓ Jūs tiksiet automātiski pārvirzīts...
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-500/20 border border-red-500 mb-4">
                <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Verifikācijas kļūda
              </h3>
              <p className="text-gray-300 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={resendVerification}
                  className="w-full btn-secondary"
                >
                  Nosūtīt jaunu verifikācijas e-pastu
                </button>
                <Link
                  href="/auth/login"
                  className="w-full btn-primary text-center block"
                >
                  Atgriezties uz pieteikšanos
                </Link>
              </div>
            </div>
          )}

          {status === 'expired' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-500/20 border border-yellow-500 mb-4">
                <svg className="h-8 w-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Saite novecojusi
              </h3>
              <p className="text-gray-300 mb-6">{message}</p>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-300">
                  Verifikācijas saites ir derīgas 24 stundas. Lūdzu pieprasiet jaunu saiti.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={resendVerification}
                  className="w-full btn-primary"
                >
                  Nosūtīt jaunu verifikācijas e-pastu
                </button>
                <Link
                  href="/auth/login"
                  className="w-full btn-secondary text-center block"
                >
                  Atgriezties uz pieteikšanos
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Nepieciešama palīdzība?{' '}
            <a 
              href="mailto:support@runacademy.com" 
              className="font-medium text-coral hover:text-coral-light transition-colors"
            >
              Sazinieties ar atbalsta dienestu
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}