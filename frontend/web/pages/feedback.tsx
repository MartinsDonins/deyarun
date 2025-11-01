import { useState } from 'react'
import ProtectedLayout from '../components/layout/ProtectedLayout'
import FeedbackForm from '../components/FeedbackForm'
import { withAuth } from '../contexts/AuthContext'

function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    setSubmitted(true)
  }

  return (
    <ProtectedLayout title="Atsauksmes">
      {submitted ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Paldies par atsauksmi!</h3>
          <p className="text-gray-400">Jūsu atsauksme ir svarīga mums DeyaRun uzlabošanai.</p>
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold text-white mb-4">Atsauksmes</h1>
          <p className="text-gray-400 mb-8">Dalieties ar savu pieredzi un palīdziet mums uzlabot DeyaRun</p>
          <FeedbackForm onSubmit={handleSubmit} />
        </div>
      )}
    </ProtectedLayout>
  )
}

export default withAuth(FeedbackPage)
