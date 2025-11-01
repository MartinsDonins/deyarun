import { useState, useEffect } from 'react'
import AdminLayout from '../../components/layout/AdminLayout'
import { useAuth, withAdminAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/router'
import SubscriptionDetailsModal from '../../components/subscription/SubscriptionDetailsModal'
import { apiService } from '../../lib/api'
import { getAuthToken } from '../../utils/auth'
import { logger } from '../../lib/productionLogger'

interface PlanFeatures {
  courseAccess?: string
  maxCoursesPerMonth?: number
  maxWorkoutsPerWeek?: number
  advancedAnalytics?: boolean
  personalizedPlans?: boolean
  downloadableContent?: boolean
  offlineMode?: boolean
  prioritySupport?: boolean
  personalCoaching?: boolean
  communityAccess?: boolean
  exclusiveEvents?: boolean
}

interface SubscriptionPlan {
  id: string
  _id?: string // MongoDB field, transformed to id
  name: string
  displayName?: string
  description: string
  type?: string
  tier?: number
  price: number | {
    monthly: number
    yearly: number
    currency: string
  }
  currency: string
  interval: string
  intervalCount: number
  trialDays: number
  features: string[] | PlanFeatures
  isActive: boolean
  isVisible?: boolean
  isPopular: boolean
  sortOrder?: number
  maxTrainingPlans?: number
  maxMonthlyWorkouts?: number
  hasAICoaching: boolean
  hasPersonalCoach: boolean
  hasAdvancedAnalytics: boolean
  hasPrioritySupport: boolean
  createdAt: string
  updatedAt?: string
  _count?: {
    subscriptions: number
  }
}

interface UserSubscription {
  id: string
  status: string
  startDate: string
  endDate: string
  nextPaymentDate?: string
  cancelledAt?: string
  lastPaymentAmount?: number
  lastPaymentDate?: string
  daysUntilExpiry: number
  isExpiringSoon: boolean
  isExpired: boolean
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  plan: SubscriptionPlan
  payments: Array<{
    id: string
    amount: number
    status: string
    paidAt: string
    description: string
  }>
}

interface SubscriptionStats {
  statusCounts: Record<string, number>
  totalRevenue: number
  monthlyRevenue: number
  planDistribution: Array<{
    name: string
    activeSubscriptions: number
  }>
}

function AdminSubscriptions() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'plans' | 'stats'>('subscriptions')
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([])
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    planId: 'all'
  })

  // Plan form state
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  
  // Subscription details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>('')
  
  // Subscription editing modal state
  const [showEditSubscriptionModal, setShowEditSubscriptionModal] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<UserSubscription | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [subscriptionFormData, setSubscriptionFormData] = useState({
    planType: '',
    billingCycle: 'monthly',
    status: 'active',
    startDate: '',
    endDate: ''
  })
  const [planFormData, setPlanFormData] = useState({
    name: '',
    description: '',
    price: 0,
    interval: 'monthly',
    intervalCount: 1,
    trialDays: 0,
    features: [''],
    maxTrainingPlans: null as number | null,
    maxMonthlyWorkouts: null as number | null,
    hasAICoaching: false,
    hasPersonalCoach: false,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false,
    isPopular: false
  })

  // Redirect if not admin
  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard')
    }
  }, [user, isAdmin, router])

  useEffect(() => {
    if (isAdmin) {
      loadData()
      // Always load plans for subscription editing
      if (activeTab === 'subscriptions') {
        loadPlans()
      }
    }
  }, [isAdmin, activeTab, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'subscriptions') {
        await loadSubscriptions()
      } else if (activeTab === 'plans') {
        await loadPlans()
      } else if (activeTab === 'stats') {
        await loadStats()
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading data:', { error: error })
    } finally {
      setLoading(false)
    }
  }

  const loadSubscriptions = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value && value !== 'all'))
      })
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${apiUrl}/api/admin/subscriptions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
      } else {
        setSubscriptions([])
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading subscriptions:', { error: error })
      // Fallback to empty array
      setSubscriptions([])
    }
  }

  const loadPlans = async () => {
    try {
      logger.info('COMPONENT', '🔄 Loading plans...');
      const response = await apiService.getAdminSubscriptionPlans();
      logger.info('COMPONENT', '✅ LoadPlans API response:', { response });
      logger.info('COMPONENT', '📦 Plans data from API:', { plans: response.data?.plans });
      let plansData = response.data?.plans || [];
      
      // Transform MongoDB _id to id for frontend compatibility
      plansData = plansData.map(plan => ({
        ...plan,
        id: plan._id || plan.id // Use _id if available, fallback to id
      }))
      
      logger.info('COMPONENT', '💾 Setting plans state to (after id transformation):', { plansData })
      logger.info('COMPONENT', '📊 Plans count:', { length: plansData.length })
      setPlans(plansData)
      
      if (plansData.length === 0) {
        logger.warn('WARNING', '⚠️ No plans loaded from API')
      }
    } catch (error) {
      logger.error('ERROR', '❌ Error loading plans via API service:', { error: error })
      setPlans([])
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/admin/subscription-stats`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setStats(null)
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading stats:', { error: error })
      setStats(null)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/30 text-green-300 border-green-700'
      case 'trialing':
        return 'bg-blue-900/30 text-blue-300 border-blue-700'
      case 'cancelled':
        return 'bg-gray-900/30 text-gray-300 border-gray-700'
      case 'expired':
        return 'bg-red-900/30 text-red-300 border-red-700'
      case 'past_due':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-700'
      default:
        return 'bg-gray-900/30 text-gray-300 border-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: 'Active',
      trialing: 'Izmēģina',
      cancelled: 'Cancels',
      expired: 'Beidzies',
      past_due: 'Kavē maksājumu'
    }
    return statusMap[status] || status
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US')
  }

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('lv', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getPlanPrice = (plan: SubscriptionPlan, billingType: 'monthly' | 'yearly' = 'monthly'): number => {
    if (typeof plan.price === 'number') {
      return plan.price
    } else if (typeof plan.price === 'object' && plan.price !== null) {
      return billingType === 'yearly' ? plan.price.yearly : plan.price.monthly
    }
    return 0
  }

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      logger.info('COMPONENT', '🚀 Submitting plan form...', { planFormData });
      logger.info('COMPONENT', '📋 Form checkbox values:', {
        hasAICoaching: planFormData.hasAICoaching,
        hasPersonalCoach: planFormData.hasPersonalCoach,
        hasAdvancedAnalytics: planFormData.hasAdvancedAnalytics,
        hasPrioritySupport: planFormData.hasPrioritySupport
      });
      
      // Transform form data to match backend expectations
      const transformedData = {
        name: planFormData.name,
        displayName: planFormData.name,
        description: planFormData.description,
        type: editingPlan?.type || (planFormData.price === 0 ? 'free' : planFormData.price < 25 ? 'premium' : planFormData.price < 50 ? 'pro' : 'enterprise'),
        tier: editingPlan?.tier || Date.now() % 10000, // Use timestamp-based unique tier
        price: {
          monthly: planFormData.price,
          yearly: planFormData.price * 10, // 2 months free on yearly
          currency: 'EUR'
        },
        features: {
          // Course access features
          courseAccess: planFormData.price === 0 ? 'basic' : planFormData.price < 25 ? 'premium' : 'unlimited',
          maxCoursesPerMonth: planFormData.price === 0 ? 1 : planFormData.price < 25 ? 5 : -1,
          
          // Workout features  
          maxWorkoutsPerWeek: planFormData.maxMonthlyWorkouts || (planFormData.price === 0 ? 3 : planFormData.price < 25 ? 10 : -1),
          advancedAnalytics: planFormData.hasAdvancedAnalytics,
          personalizedPlans: planFormData.hasAICoaching,
          
          // Content features
          downloadableContent: planFormData.price > 0,
          offlineMode: planFormData.price >= 25,
          
          // Support features
          prioritySupport: planFormData.hasPrioritySupport,
          personalCoaching: planFormData.hasPersonalCoach,
          
          // Community features
          communityAccess: true,
          exclusiveEvents: planFormData.price >= 25
        },
        isActive: true,
        isVisible: true,
        isPopular: planFormData.isPopular,
        sortOrder: planFormData.price === 0 ? 0 : planFormData.price < 25 ? 1 : 2
      }
      
      logger.info('COMPONENT', '✨ Using API service to', { action: editingPlan ? 'update' : 'create', target: 'plan' });
      logger.info('COMPONENT', 'Request data:', { data: JSON.stringify(transformedData, null, 2) });
      logger.info('COMPONENT', '🔍 Transformed checkbox values in features:', {
        advancedAnalytics: transformedData.features.advancedAnalytics,
        personalizedPlans: transformedData.features.personalizedPlans,
        personalCoaching: transformedData.features.personalCoaching,
        prioritySupport: transformedData.features.prioritySupport
      });
      logger.info('COMPONENT', 'EditingPlan object:', { editingPlan });
      logger.info('COMPONENT', 'EditingPlan ID:', { editingPlan: editingPlan?.id });
      
      let response;
      if (editingPlan && editingPlan.id) {
        response = await apiService.updateSubscriptionPlan(editingPlan.id, transformedData)
      } else {
        response = await apiService.createSubscriptionPlan(transformedData)
      }
      
      logger.info('COMPONENT', 'API service response:', { response })
      
      setShowPlanModal(false)
      resetPlanForm()
      await loadPlans()
      alert(editingPlan ? 'Plāns veiksmīgi atjaunināts!' : 'Plāns veiksmīgi izveidots!')
      
    } catch (error) {
      logger.error('ERROR', 'Error saving plan:', { error: error });
      logger.error('ERROR', 'Full error object:', { errorDetails: JSON.stringify(error, null, 2) });
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert('Error saglabājot plānu: ' + errorMessage)
    }
  }

  const resetPlanForm = () => {
    setPlanFormData({
      name: '',
      description: '',
      price: 0,
      interval: 'monthly',
      intervalCount: 1,
      trialDays: 0,
      features: [''],
      maxTrainingPlans: null,
      maxMonthlyWorkouts: null,
      hasAICoaching: false,
      hasPersonalCoach: false,
      hasAdvancedAnalytics: false,
      hasPrioritySupport: false,
      isPopular: false
    })
    setEditingPlan(null)
  }

  const addFeature = () => {
    const currentFeatures = Array.isArray(planFormData.features) ? planFormData.features : ['']
    setPlanFormData({
      ...planFormData,
      features: [...currentFeatures, '']
    })
  }

  const removeFeature = (index: number) => {
    const currentFeatures = Array.isArray(planFormData.features) ? planFormData.features : ['']
    setPlanFormData({
      ...planFormData,
      features: currentFeatures.filter((_, i) => i !== index)
    })
  }

  const updateFeature = (index: number, value: string) => {
    const currentFeatures = Array.isArray(planFormData.features) ? planFormData.features : ['']
    const newFeatures = [...currentFeatures]
    newFeatures[index] = value
    setPlanFormData({
      ...planFormData,
      features: newFeatures
    })
  }

  const handleSubscriptionAction = async (subscriptionId: string, action: 'cancel' | 'reactivate' | 'view') => {
    try {
      if (action === 'view') {
        setSelectedSubscriptionId(subscriptionId)
        setShowDetailsModal(true)
        return
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
      const response = await fetch(`${apiUrl}/api/admin/subscriptions/${subscriptionId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        await loadSubscriptions()
        const actionText = action === 'cancel' ? 'atcelts' : 'atjaunots'
        alert(`Abonements veiksmīgi ${actionText}!`)
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Error veicot darbību')
      }
    } catch (error) {
      logger.error('ERROR', 'Error handling subscription action:', { error: error })
      alert('Error veicot darbību: ' + (error as Error).message)
    }
  }
  
  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Vai tiešām vēlaties dzēst šo plānu? Šī darbība ir neatgriezeniska.')) {
      return
    }
    
    try {
      await apiService.deleteSubscriptionPlan(planId)
      await loadPlans()
      alert('Plāns veiksmīgi dzēsts!')
    } catch (error) {
      logger.error('ERROR', 'Error deleting plan:', { error: error })
      alert('Error dzēšot plānu: ' + (error as Error).message)
    }
  }
  
  const handleTogglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      logger.info('COMPONENT', 'Using API service to toggle plan status')
      await apiService.updateSubscriptionPlan(planId, { isActive: !currentStatus })
      await loadPlans()
      const statusText = currentStatus ? 'deaktivēts' : 'aktivēts'
      alert(`Plāns veiksmīgi ${statusText}!`)
    } catch (error) {
      logger.error('ERROR', 'Error toggling plan status:', { error: error })
      alert('Error mainīot plāna statusu: ' + (error as Error).message)
    }
  }

  const openEditSubscriptionModal = async (subscription: UserSubscription) => {
    logger.info('COMPONENT', '🔧 Opening subscription edit modal for:', { firstName: subscription.user.firstName, lastName: subscription.user.lastName });
    logger.info('COMPONENT', '📋 Current plans count:', { length: plans.length });
    
    setShowEditSubscriptionModal(true)
    setEditingSubscription(subscription)
    setModalLoading(true)
    
    try {
      // Ensure plans are loaded before opening modal
      if (plans.length === 0) {
        logger.info('COMPONENT', '🔄 Plans not loaded, loading them now...')
        await loadPlans()
      } else {
        logger.info('COMPONENT', '✅ Plans already loaded:', { length: plans.length })
      }
      
      const formData = {
        planType: subscription.plan.type || subscription.plan.name,
        billingCycle: subscription.plan.interval === 'month' ? 'monthly' : 'yearly',
        status: subscription.status,
        startDate: subscription.startDate ? new Date(subscription.startDate).toISOString().split('T')[0] : '',
        endDate: subscription.endDate ? new Date(subscription.endDate).toISOString().split('T')[0] : ''
      }
      
      logger.info('COMPONENT', '📝 Setting form data:', { formData })
      setSubscriptionFormData(formData)
    } catch (error) {
      logger.error('ERROR', '❌ Error loading plans for modal:', { error: error })
    } finally {
      setModalLoading(false)
    }
  }

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSubscription) return

    try {
      await apiService.updateUserSubscription(editingSubscription.user.id, subscriptionFormData)
      await loadSubscriptions()
      setShowEditSubscriptionModal(false)
      setEditingSubscription(null)
      alert('Abonements veiksmīgi atjaunināts!')
    } catch (error) {
      logger.error('ERROR', 'Error updating subscription:', { error: error })
      alert('Error atjauninot abonementu: ' + (error as Error).message)
    }
  }

  const resetSubscriptionForm = () => {
    setSubscriptionFormData({
      planType: '',
      billingCycle: 'monthly',
      status: 'active',
      startDate: '',
      endDate: ''
    })
    setEditingSubscription(null)
  }

  if (!user || !isAdmin) {
    return (
      <AdminLayout title="Abonementu pārvaldība">
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">Nav piekļuves tiesību</div>
          <p className="text-gray-400">Jums nav administratora tiesību šīs lapas skatīšanai.</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Abonementu pārvaldība">
      <div className="space-y-6">
        {/* Header with tabs */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Abonementu pārvaldība</h1>
            
            {activeTab === 'plans' && (
              <button
                onClick={() => {
                  resetPlanForm()
                  setShowPlanModal(true)
                }}
                className="btn-primary"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Izveidot plānu
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'subscriptions'
                  ? 'border-coral text-coral'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Abonementi
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'plans'
                  ? 'border-coral text-coral'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Plāni
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'stats'
                  ? 'border-coral text-coral'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Statistika
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="card">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Meklēt lietotājus..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="flex-1 px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-coral focus:outline-none"
                />
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                >
                  <option value="all">Visi statusi</option>
                  <option value="active">Aktīvi</option>
                  <option value="trialing">Izmēģina</option>
                  <option value="cancelled">Canceli</option>
                  <option value="expired">Beigušies</option>
                  <option value="past_due">Kavē maksājumu</option>
                </select>

                <select
                  value={filters.planId}
                  onChange={(e) => setFilters({ ...filters, planId: e.target.value })}
                  className="px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                >
                  <option value="all">Visi plāni</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subscriptions List */}
            <div className="card">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-gray-400">Ielādē abonementus...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 font-medium text-gray-300">Lietotājs</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-300">Plāns</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-300">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-300">Beidzas</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-300">Nākošais maksājums</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-300">Pēdējais maksājums</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-300">Darbības</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map((subscription) => (
                        <tr key={subscription.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <div className="font-medium text-white">
                                {subscription.user.firstName} {subscription.user.lastName}
                              </div>
                              <div className="text-sm text-gray-400">{subscription.user.email}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-white">{subscription.plan.name}</span>
                              {subscription.plan.isPopular && (
                                <span className="px-2 py-1 bg-coral/20 text-coral text-xs rounded">Populārs</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">
                              {formatCurrency(getPlanPrice(subscription.plan))}/{subscription.plan.interval === 'monthly' ? 'mēn' : 'gads'}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded border text-xs font-medium ${getStatusBadgeColor(subscription.status)}`}>
                              {getStatusText(subscription.status)}
                            </span>
                            {subscription.isExpiringSoon && (
                              <div className="text-xs text-yellow-400 mt-1">
                                Beidzas {subscription.daysUntilExpiry} dienās
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-gray-300 text-sm">
                            {formatDate(subscription.endDate)}
                          </td>
                          <td className="py-4 px-4 text-gray-300 text-sm">
                            {subscription.nextPaymentDate ? (
                              <>
                                {formatDate(subscription.nextPaymentDate)}
                                <div className="text-xs text-gray-500">
                                  {formatCurrency(getPlanPrice(subscription.plan))}
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-500">Nav nepieciešams</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-gray-300 text-sm">
                            {subscription.lastPaymentDate ? (
                              <>
                                {formatDate(subscription.lastPaymentDate)}
                                <div className="text-xs text-gray-500">
                                  {formatCurrency(subscription.lastPaymentAmount || 0)}
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-500">Nav maksājumu</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSubscriptionAction(subscription.id, 'view')}
                                className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                                title="View detaļas"
                              >
                                View
                              </button>
                              <button
                                onClick={() => openEditSubscriptionModal(subscription)}
                                className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm"
                                title="Edit"
                              >
                                Edit
                              </button>
                              {subscription.status === 'active' && (
                                <button
                                  onClick={() => handleSubscriptionAction(subscription.id, 'cancel')}
                                  className="text-red-400 hover:text-red-300 transition-colors text-sm"
                                  title="Cancel"
                                >
                                  Cancel
                                </button>
                              )}
                              {subscription.status === 'cancelled' && (
                                <button
                                  onClick={() => handleSubscriptionAction(subscription.id, 'reactivate')}
                                  className="text-green-400 hover:text-green-300 transition-colors text-sm"
                                  title="Refresh"
                                >
                                  Refresh
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="card">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-400">Ielādē plānus...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => {
                  logger.info('COMPONENT', '🎯 Rendering plan: ${plan.name }', {
                    id: plan.id,
                    features: plan.features,
                    hasAICoaching: plan.hasAICoaching,
                    hasPersonalCoach: plan.hasPersonalCoach,
                    hasAdvancedAnalytics: plan.hasAdvancedAnalytics,
                    hasPrioritySupport: plan.hasPrioritySupport
                  });
                  return (
                  <div key={plan.id} className="bg-surface border border-gray-700 rounded-xl p-6 hover:border-coral transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                          {plan.isPopular && (
                            <span className="px-2 py-1 bg-coral/20 text-coral text-xs rounded">Populārs</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{plan.description}</p>
                        
                        <div className="mb-4">
                          <div className="text-2xl font-bold text-white">
                            {formatCurrency(getPlanPrice(plan))}
                            <span className="text-sm font-normal text-gray-400">
                              /{plan.interval === 'month' ? 'mēnesī' : plan.interval === 'year' ? 'gadā' : plan.interval}
                            </span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Funkcionalitātes:</h4>
                          <ul className="space-y-1">
                            {/* Display MongoDB plan features */}
                            {plan.hasAdvancedAnalytics && (
                              <li className="text-xs text-gray-400 flex items-center">
                                <svg className="w-3 h-3 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Uzlabota analītika
                              </li>
                            )}
                            {plan.maxTrainingPlans && plan.maxTrainingPlans > 0 && (
                              <li className="text-xs text-gray-400 flex items-center">
                                <svg className="w-3 h-3 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Personalizēti plāni
                              </li>
                            )}
                            {plan.hasPersonalCoach && (
                              <li className="text-xs text-gray-400 flex items-center">
                                <svg className="w-3 h-3 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Personīgais treners
                              </li>
                            )}
                            {plan.hasAICoaching && (
                              <li className="text-xs text-gray-400 flex items-center">
                                <svg className="w-3 h-3 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                AI treneru vadība
                              </li>
                            )}
                            {plan.hasPrioritySupport && (
                              <li className="text-xs text-gray-400 flex items-center">
                                <svg className="w-3 h-3 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Prioritārs atbalsts
                              </li>
                            )}
                            {/* Display plan features as text */}
                            {Array.isArray(plan.features) && plan.features.length > 0 && plan.features.map((feature, index) => (
                              <li key={index} className="text-xs text-gray-400 flex items-center">
                                <svg className="w-3 h-3 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {feature}
                              </li>
                            ))}
                            {(!plan.maxMonthlyWorkouts || plan.maxMonthlyWorkouts === 0) && (
                              <li className="text-xs text-gray-400 flex items-center">
                                <svg className="w-3 h-3 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Neierobežoti treniņi
                              </li>
                            )}
                          </ul>
                        </div>

                        <div className="mb-4 space-y-1">
                          <div className="text-xs text-gray-500">
                            Aktīvi abonementi: {plan._count?.subscriptions || 0}
                          </div>
                          <div className="text-xs text-gray-500">
                            Created: {formatDate(plan.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <button
                        onClick={() => handleTogglePlanStatus(plan.id, plan.isActive)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          plan.isActive 
                            ? 'bg-green-900/30 text-green-300 border border-green-700 hover:bg-green-800/50'
                            : 'bg-red-900/30 text-red-300 border border-red-700 hover:bg-red-800/50'
                        }`}
                        title={plan.isActive ? 'Klikšķiet, lai deaktivētu' : 'Klikšķiet, lai aktivētu'}
                      >
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingPlan(plan)
                            setPlanFormData({
                              name: plan.name,
                              description: plan.description || '',
                              price: getPlanPrice(plan),
                              interval: plan.interval,
                              intervalCount: plan.intervalCount,
                              trialDays: plan.trialDays,
                              features: (() => {
                                if (Array.isArray(plan.features)) {
                                  return plan.features;
                                } else if (plan.features && typeof plan.features === 'object') {
                                  // Convert features object to array of strings for the form
                                  const featureList = [];
                                  const featuresObj = plan.features as PlanFeatures;
                                  if (featuresObj.courseAccess) featureList.push(`Course Access: ${featuresObj.courseAccess }`);
                                  if (featuresObj.advancedAnalytics) featureList.push('Advanced Analytics');
                                  if (featuresObj.personalCoaching) featureList.push('Personal Coaching');
                                  if (featuresObj.prioritySupport) featureList.push('Priority Support');
                                  return featureList.length > 0 ? featureList : [''];
                                } else {
                                  return [''];
                                }
                              })(),
                              maxTrainingPlans: plan.maxTrainingPlans ?? null,
                              maxMonthlyWorkouts: plan.maxMonthlyWorkouts ?? null,
                              hasAICoaching: plan.hasAICoaching || (typeof plan.features === 'object' && !Array.isArray(plan.features) ? plan.features?.personalizedPlans ?? false : false),
                              hasPersonalCoach: plan.hasPersonalCoach || (typeof plan.features === 'object' && !Array.isArray(plan.features) ? plan.features?.personalCoaching ?? false : false),
                              hasAdvancedAnalytics: plan.hasAdvancedAnalytics || (typeof plan.features === 'object' && !Array.isArray(plan.features) ? plan.features?.advancedAnalytics ?? false : false),
                              hasPrioritySupport: plan.hasPrioritySupport || (typeof plan.features === 'object' && !Array.isArray(plan.features) ? plan.features?.prioritySupport ?? false : false),
                              isPopular: plan.isPopular
                            })
                            setShowPlanModal(true)
                          }}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Kopējie ieņēmumi</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Šī mēneša ieņēmumi</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(stats.monthlyRevenue)}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Aktīvi abonementi</p>
                    <p className="text-2xl font-bold text-white">{stats.statusCounts.active || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-coral/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Abonementu statusi</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(stats.statusCounts).map(([status, count]) => (
                  <div key={status} className="text-center">
                    <div className="text-2xl font-bold text-white">{count}</div>
                    <div className={`text-sm px-2 py-1 rounded ${getStatusBadgeColor(status)}`}>
                      {getStatusText(status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Distribution */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Plānu sadalījums</h3>
              <div className="space-y-4">
                {stats.planDistribution.map((plan) => (
                  <div key={plan.name} className="flex items-center justify-between">
                    <span className="text-gray-300">{plan.name}</span>
                    <div className="flex items-center gap-4">
                      <div className="text-white font-medium">{plan.activeSubscriptions}</div>
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-coral h-2 rounded-full"
                          style={{ 
                            width: `${(plan.activeSubscriptions / Math.max(...stats.planDistribution.map(p => p.activeSubscriptions))) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plan Creation/Edit Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6">
                {editingPlan ? 'Edit plānu' : 'Izveidot jaunu plānu'}
              </h3>
              
              <form onSubmit={handleCreatePlan} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nosaukums</label>
                    <input
                      type="text"
                      value={planFormData.name}
                      onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Cena (EUR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={planFormData.price}
                      onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Apraksts</label>
                  <textarea
                    value={planFormData.description}
                    onChange={(e) => setPlanFormData({ ...planFormData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Periods</label>
                    <select
                      value={planFormData.interval}
                      onChange={(e) => setPlanFormData({ ...planFormData, interval: e.target.value })}
                      className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                    >
                      <option value="monthly">Mēnesī</option>
                      <option value="yearly">Gadā</option>
                      <option value="weekly">Nedēļā</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Ilgums</label>
                    <input
                      type="number"
                      value={planFormData.intervalCount}
                      onChange={(e) => setPlanFormData({ ...planFormData, intervalCount: parseInt(e.target.value) || 1 })}
                      min="1"
                      className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Izmēģinājuma dienas</label>
                    <input
                      type="number"
                      value={planFormData.trialDays}
                      onChange={(e) => setPlanFormData({ ...planFormData, trialDays: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                    />
                  </div>
                </div>

                {/* Features */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-300">Funkcionalitātes</label>
                    <button
                      type="button"
                      onClick={addFeature}
                      className="text-coral hover:text-white transition-colors text-sm"
                    >
                      + Pievienot
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {(planFormData.features || ['']).map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="Funkcionalitāte"
                          className="flex-1 px-3 py-2 bg-bg border border-gray-700 rounded text-white text-sm focus:border-coral focus:outline-none"
                        />
                        {(planFormData.features || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature toggles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="hasAICoaching"
                      checked={planFormData.hasAICoaching}
                      onChange={(e) => setPlanFormData({ ...planFormData, hasAICoaching: e.target.checked })}
                      className="w-4 h-4 text-coral bg-bg border-gray-700 rounded focus:ring-coral"
                    />
                    <label htmlFor="hasAICoaching" className="text-sm text-gray-300">AI Coaching</label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="hasPersonalCoach"
                      checked={planFormData.hasPersonalCoach}
                      onChange={(e) => setPlanFormData({ ...planFormData, hasPersonalCoach: e.target.checked })}
                      className="w-4 h-4 text-coral bg-bg border-gray-700 rounded focus:ring-coral"
                    />
                    <label htmlFor="hasPersonalCoach" className="text-sm text-gray-300">Personīgais treners</label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="hasAdvancedAnalytics"
                      checked={planFormData.hasAdvancedAnalytics}
                      onChange={(e) => setPlanFormData({ ...planFormData, hasAdvancedAnalytics: e.target.checked })}
                      className="w-4 h-4 text-coral bg-bg border-gray-700 rounded focus:ring-coral"
                    />
                    <label htmlFor="hasAdvancedAnalytics" className="text-sm text-gray-300">Uzlabota analītika</label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="hasPrioritySupport"
                      checked={planFormData.hasPrioritySupport}
                      onChange={(e) => setPlanFormData({ ...planFormData, hasPrioritySupport: e.target.checked })}
                      className="w-4 h-4 text-coral bg-bg border-gray-700 rounded focus:ring-coral"
                    />
                    <label htmlFor="hasPrioritySupport" className="text-sm text-gray-300">Prioritārs atbalsts</label>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={planFormData.isPopular}
                    onChange={(e) => setPlanFormData({ ...planFormData, isPopular: e.target.checked })}
                    className="w-4 h-4 text-coral bg-bg border-gray-700 rounded focus:ring-coral"
                  />
                  <label htmlFor="isPopular" className="text-sm text-gray-300">Iezīmēt kā populāru</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlanModal(false)
                      resetPlanForm()
                    }}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    {editingPlan ? 'Save izmaiņas' : 'Izveidot plānu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Editing Modal */}
      {showEditSubscriptionModal && editingSubscription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-gray-700 rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6">
                Edit abonementu - {editingSubscription.user.firstName} {editingSubscription.user.lastName}
              </h3>
              
              {modalLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-gray-400">Ielādē plānus...</p>
                </div>
              ) : (
                <form onSubmit={handleUpdateSubscription} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Plāna veids</label>
                  <select
                    value={subscriptionFormData.planType}
                    onChange={(e) => {
                      logger.info('COMPONENT', '🔄 Plan selected:', { selectedPlan: e.target.value });
                      setSubscriptionFormData({ ...subscriptionFormData, planType: e.target.value })
                    }}
                    className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                    required
                  >
                    <option value="">Izvēlēties plānu ({plans.length} pieejami)</option>
                    {plans.length === 0 ? (
                      <option value="" disabled>Ielādē plānus...</option>
                    ) : (
                      plans.map(plan => {
                        logger.info('COMPONENT', '🎯 Rendering plan option:', { id: plan.id, name: plan.name, type: plan.type });
                        return (
                          <option key={plan.id} value={plan.type || plan.name}>
                            {plan.name} - {formatCurrency(getPlanPrice(plan))}/{plan.interval === 'monthly' ? 'mēn' : 'gads'}
                          </option>
                        )
                      })
                    )}
                  </select>
                  {plans.length === 0 && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Nav ielādēti plāni. Pārejiet uz "Plāni" tabu, lai ielādētu plānus.
                    </p>
                  )}
                  {plans.length > 0 && (
                    <p className="text-xs text-green-400 mt-1">
                      ✅ Ielādēti {plans.length} plāni
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Norēķinu periods</label>
                  <select
                    value={subscriptionFormData.billingCycle}
                    onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, billingCycle: e.target.value })}
                    className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                  >
                    <option value="monthly">Mēnesī</option>
                    <option value="yearly">Gadā</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                  <select
                    value={subscriptionFormData.status}
                    onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="trialing">Izmēģina</option>
                    <option value="cancelled">Cancels</option>
                    <option value="expired">Beidzies</option>
                    <option value="past_due">Kavē maksājumu</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Sākuma datums</label>
                    <input
                      type="date"
                      value={subscriptionFormData.startDate}
                      onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Beigu datums</label>
                    <input
                      type="date"
                      value={subscriptionFormData.endDate}
                      onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-bg border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditSubscriptionModal(false)
                      resetSubscriptionForm()
                    }}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Save izmaiņas
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subscription Details Modal */}
      <SubscriptionDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedSubscriptionId('')
        }}
        subscriptionId={selectedSubscriptionId}
      />
    </AdminLayout>
  )
}

export default withAdminAuth(AdminSubscriptions)