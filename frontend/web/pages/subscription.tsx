import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import ProtectedLayout from '../components/layout/ProtectedLayout'
import { useAuth, withAuth } from '../contexts/AuthContext'
import { analytics } from '../lib/analytics'
import SubscriptionDetails from '../components/subscription/SubscriptionDetails'
import SubscriptionPlans from '../components/subscription/SubscriptionPlans'
import { apiService } from '../lib/api'
import { logger } from '../lib/productionLogger'

interface CurrentSubscription {
  planType: string;
  status: string;
  billingCycle: string;
}

function Subscription() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'details' | 'plans'>('details')

  // Fetch current subscription on mount
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return

      try {
        const data = await apiService.getCurrentSubscription()
        logger.info('COMPONENT', 'Current subscription data:', { data })
        logger.info('COMPONENT', 'Subscription object:', { subscription: data.subscription })
        setCurrentSubscription(data.subscription)
        
        // If no subscription exists or it's free, show plans view
        if (!data.subscription || data.subscription.planType === 'free') {
          setView('plans')
        }
      } catch (error) {
        logger.error('ERROR', 'Failed to fetch subscription:', { error: error })
        setView('plans')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  // Handle plan selection
  const handlePlanSelect = async (plan: any, billingCycle: string) => {
    try {
      const action = !currentSubscription || currentSubscription.planType === 'free' ? 'create' : 'upgrade'
      
      if (action === 'create') {
        await apiService.createSubscription(plan.type, billingCycle)
      } else {
        await apiService.upgradeSubscription(plan.type, billingCycle)
      }

      // Refresh page to show updated subscription
      window.location.reload()
    } catch (error) {
      logger.error('ERROR', 'Failed to select plan:', { error: error })
      alert('Radās kļūda. Lūdzu mēģiniet vēlreiz.')
    }
  }

  if (loading) {
    return (
      <ProtectedLayout title="Abonements">
        <div className="min-h-screen bg-adaptive">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-surface/50 rounded-xl w-1/3 mx-auto mb-4"></div>
                <div className="h-4 bg-surface/30 rounded-lg w-2/3 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout title="Abonements">
      <div className="min-h-screen bg-adaptive">
        <div className="container mx-auto px-4 py-8">
          {/* Header with Navigation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-2 mb-4 rounded-xl bg-[var(--deyarun-primary)]20">
              <svg className="w-8 h-8 text-[var(--deyarun-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-adaptive-white mb-4">
              Abonementa pārvaldība
            </h1>
            <p className="text-lg text-adaptive-light max-w-2xl mx-auto mb-6">
              Pārvaldiet savu abonementu un piekļūstiet visām DeyaRun funkcijām
            </p>
            
            {/* View Toggle */}
            <div className="glass-card inline-flex rounded-2xl p-1 border border-surface-light">
              <button
                onClick={() => setView('details')}
                className={`px-6 py-3 rounded-xl transition-all font-medium ${
                  view === 'details' 
                    ? 'bg-gradient-to-r from-[var(--deyarun-primary)] to-[var(--deyarun-secondary)] text-white shadow-lg' 
                    : 'text-adaptive-light hover:text-adaptive-white hover:bg-surface/30'
                }`}
              >
                Mans abonements
              </button>
              <button
                onClick={() => setView('plans')}
                className={`px-6 py-3 rounded-xl transition-all font-medium ${
                  view === 'plans' 
                    ? 'bg-gradient-to-r from-[var(--deyarun-primary)] to-[var(--deyarun-secondary)] text-white shadow-lg' 
                    : 'text-adaptive-light hover:text-adaptive-white hover:bg-surface/30'
                }`}
              >
                Visi plāni
              </button>
            </div>
          </div>

          {/* Content */}
          {view === 'details' ? (
            <SubscriptionDetails className="max-w-4xl mx-auto" />
          ) : (
            <SubscriptionPlans 
              currentSubscription={currentSubscription}
              onPlanSelect={handlePlanSelect}
              showCurrentBadge={true}
              className="max-w-6xl mx-auto"
            />
          )}

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="glass-card rounded-2xl p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-2 mb-4 rounded-xl bg-[var(--deyarun-secondary)]20">
                  <svg className="w-6 h-6 text-[var(--deyarun-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-adaptive-white mb-2">Bieži uzdotie jautājumi</h2>
                <p className="text-adaptive-light">Atbildes uz populārākajiem jautājumiem par abonementiem</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-surface/20 rounded-xl p-6 border border-surface-light hover:bg-surface/30 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[var(--deyarun-primary)] rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="text-lg font-semibold text-adaptive-white mb-3">Vai varu mainīt plānu jebkurā laikā?</h3>
                      <p className="text-adaptive-light text-sm leading-relaxed">Jā, jūs varat uzlabot vai pazeminēt savu plānu jebkurā laikā. Izmaiņas stājas spēkā nākamajā norēķinu periodā.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-surface/20 rounded-xl p-6 border border-surface-light hover:bg-surface/30 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[var(--deyarun-secondary)] rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="text-lg font-semibold text-adaptive-white mb-3">Vai ir pieejams bezmaksas izmēģinājums?</h3>
                      <p className="text-adaptive-light text-sm leading-relaxed">Premium un Pro plāniem ir 7 dienu bezmaksas izmēģinājums. Jūs varat atcelt jebkurā laikā bez maksas.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-surface/20 rounded-xl p-6 border border-surface-light hover:bg-surface/30 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[var(--deyarun-warning)] rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="text-lg font-semibold text-adaptive-white mb-3">Kādi maksājumu veidi tiek atbalstīti?</h3>
                      <p className="text-adaptive-light text-sm leading-relaxed">Mēs pieņemam visas galvenās kredītkartes, PayPal un bankas pārskaitījumus.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-surface/20 rounded-xl p-6 border border-surface-light hover:bg-surface/30 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[var(--deyarun-success)] rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h3 className="text-lg font-semibold text-adaptive-white mb-3">Vai mani dati ir drošībā?</h3>
                      <p className="text-adaptive-light text-sm leading-relaxed">Jā, visi maksājumi tiek apstrādāti ar SSL šifrēšanu un mēs neglabājam jūsu maksājumu kartes datus.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}

export default withAuth(Subscription)