import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { logger } from '../lib/productionLogger'

export default function EmailVerificationBanner() {
  const { user } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')
  const [isVisible, setIsVisible] = useState(true)

  if (!user || user.isEmailVerified || !isVisible) {
    return null
  }

  const resendVerification = async () => {
    setIsResending(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      })

      const data = await response.json()

      if (data.success) {
        setMessage('Verifikācijas e-pasts nosūtīts atkārtoti! Pārbaudiet savu e-pastu.')
      } else {
        setMessage(data.message || 'Neizdevās nosūtīt verifikācijas e-pastu.')
      }
    } catch (error) {
      logger.error('ERROR', 'Resend verification error:', { error: error })
      setMessage('Radās tehnoloģiska kļūda.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-300">
            E-pasts nav apstiprināts
          </h3>
          <div className="mt-2 text-sm text-yellow-200">
            <p>
              Lūdzu apstiprināt savu e-pasta adresi <strong className="text-yellow-100">{user.email}</strong>, lai piekļūtu visām funkcijām.
              Pārbaudiet savu e-pastu un noklikšķiniet uz apstiprinājuma saites.
            </p>
            {message && (
              <p className={`mt-2 ${message.includes('Neizdevās') || message.includes('kļūda') ? 'text-red-300' : 'text-green-300'}`}>
                {message}
              </p>
            )}
          </div>
          <div className="mt-4">
            <div className="flex space-x-3">
              <button
                onClick={resendVerification}
                disabled={isResending}
                className="bg-yellow-500/20 px-3 py-2 text-sm leading-4 font-medium text-yellow-300 rounded-md hover:bg-yellow-500/30 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isResending ? 'Nosūta...' : 'Nosūtīt atkārtoti'}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="bg-gray-500/20 px-3 py-2 text-sm leading-4 font-medium text-gray-300 rounded-md hover:bg-gray-500/30 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Paslēpt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}