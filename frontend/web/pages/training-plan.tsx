import { useEffect, useState } from 'react'
import ProtectedLayout from '../components/layout/ProtectedLayout'
import { withAuth } from '../contexts/AuthContext'
import { getAuthToken } from '../utils/auth'

interface Workout {
  id: string
  scheduledDate: string
  type: string
  name: string
  description: string
}

interface TrainingPlan {
  id: string
  name: string
  targetRace: { date: string; distance: string }
  upcomingWorkouts: Workout[]
}

function TrainingPlanPage() {
  const [plan, setPlan] = useState<TrainingPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getAuthToken()
    if (!token) {
      setLoading(false)
      return
    }
    fetch('https://api.deyarun.com/api/training-plans/active', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setPlan(data.plan || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <ProtectedLayout title="Treniņu plāns">
        <p>Notiek ielāde...</p>
      </ProtectedLayout>
    )
  }

  if (!plan) {
    return (
      <ProtectedLayout title="Treniņu plāns">
        <p>Nav aktīva treniņu plāna</p>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout title="Treniņu plāns">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{plan.name}</h2>
          <p className="text-sm text-gray-400">
            {new Date(plan.targetRace.date).toLocaleDateString()} • {plan.targetRace.distance}
          </p>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-medium">Nākamie treniņi</h3>
          <ul className="space-y-3">
            {plan.upcomingWorkouts.map(w => (
              <li key={w.id} className="rounded-xl bg-[#121212] p-4">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{new Date(w.scheduledDate).toLocaleDateString()}</span>
                  <span>{w.type}</span>
                </div>
                <p className="mt-1 font-semibold text-primary">{w.name}</p>
                <p className="text-sm text-gray-300">{w.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ProtectedLayout>
  )
}

export default withAuth(TrainingPlanPage)
