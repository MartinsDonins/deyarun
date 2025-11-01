// Subscription Details Component
// Shows current subscription information and management options

import React, { useState, useEffect } from 'react';
import { logger } from '../../lib/productionLogger';
import { 
  CreditCardIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CurrencyEuroIcon,
  ArrowPathIcon,
  StarIcon,
  ClockIcon,
  ShieldCheckIcon,
  BoltIcon,
  UsersIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  StarIcon as StarIconSolid 
} from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../lib/api';
import { analytics } from '../../utils/analytics';

interface SubscriptionPlan {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  type: 'free' | 'premium' | 'pro' | 'enterprise';
  tier: number;
  price: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  features: {
    courseAccess: string;
    maxCoursesPerMonth: number;
    maxWorkoutsPerWeek: number;
    advancedAnalytics: boolean;
    personalizedPlans: boolean;
    downloadableContent: boolean;
    offlineMode: boolean;
    prioritySupport: boolean;
    personalCoaching: boolean;
    communityAccess: boolean;
    exclusiveEvents: boolean;
  };
  isPopular: boolean;
}

interface UserSubscription {
  planType: string;
  status: string;
  daysRemaining: number;
  amount: number;
  currency: string;
  billingCycle: string;
  willRenew: boolean;
  renewalDate: string;
}

interface SubscriptionUsage {
  coursesCompleted: number;
  workoutsCompleted: number;
  lastActivityDate: string;
  monthlyUsage: Array<{
    month: string;
    coursesAccessed: number;
    workoutsCompleted: number;
    totalTimeSpent: number;
  }>;
}

interface SubscriptionDetailsProps {
  className?: string;
}

const SubscriptionDetails: React.FC<SubscriptionDetailsProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch subscription data
  const fetchSubscriptionData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const data = await apiService.getCurrentSubscription();
      setSubscription(data.subscription);
      setPlan(data.plan);
      setUsage(data.usage);

      analytics.trackEvent('subscription_details_viewed', 'subscription', data.subscription?.planType);
    } catch (err) {
      logger.error('ERROR', 'Failed to fetch subscription data:', { error: err });
      setError('Neizdevās ielādēt abonēšanas informāciju');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      setCanceling(true);
      await apiService.cancelSubscription(cancelReason);
      
      // Refresh data
      await fetchSubscriptionData();
      
      setShowCancelModal(false);
      setCancelReason('');
      
      analytics.trackEvent('subscription_cancelled', 'subscription', subscription.planType);
    } catch (err) {
      logger.error('ERROR', 'Failed to cancel subscription:', { error: err });
      setError('Neizdevās atcelt abonēšanu');
    } finally {
      setCanceling(false);
    }
  };

  // Get status display info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircleIconSolid,
          color: 'text-[var(--deyarun-success)]',
          bg: 'bg-[var(--deyarun-success)]/10',
          label: 'Aktīvs'
        };
      case 'trial':
        return {
          icon: ClockIcon,
          color: 'text-[var(--deyarun-info)]',
          bg: 'bg-[var(--deyarun-info)]/10',
          label: 'Izmēģinājuma periods'
        };
      case 'expired':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-[var(--deyarun-error)]',
          bg: 'bg-[var(--deyarun-error)]/10',
          label: 'Beidzies'
        };
      case 'cancelled':
        return {
          icon: XCircleIcon,
          color: 'text-[var(--deyarun-warning)]',
          bg: 'bg-[var(--deyarun-warning)]/10',
          label: 'Atcelts'
        };
      default:
        return {
          icon: ClockIcon,
          color: 'text-muted',
          bg: 'bg-surface/20',
          label: status
        };
    }
  };

  // Get feature icon
  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'advancedAnalytics':
        return BoltIcon;
      case 'personalizedPlans':
        return StarIcon;
      case 'prioritySupport':
        return ShieldCheckIcon;
      case 'personalCoaching':
        return UsersIcon;
      default:
        return CheckCircleIcon;
    }
  };

  // Format features for display
  const formatFeatureLabel = (key: string, value: any): string => {
    switch (key) {
      case 'courseAccess':
        return `Kursu piekļuve: ${value}`;
      case 'maxCoursesPerMonth':
        return `Kursi mēnesī: ${value === -1 ? 'Neierobežots' : value}`;
      case 'maxWorkoutsPerWeek':
        return `Treniņi nedēļā: ${value === -1 ? 'Neierobežots' : value}`;
      case 'advancedAnalytics':
        return 'Detalizēta analītika';
      case 'personalizedPlans':
        return 'Personalizēti plāni';
      case 'downloadableContent':
        return 'Lejuplādējams saturs';
      case 'offlineMode':
        return 'Bezsaistes režīms';
      case 'prioritySupport':
        return 'Prioritārs atbalsts';
      case 'personalCoaching':
        return 'Personīgais treneres';
      case 'communityAccess':
        return 'Kopienas piekļuve';
      case 'exclusiveEvents':
        return 'Ekskluzīvi notikumi';
      default:
        return key;
    }
  };

  if (loading) {
    return (
      <div className={`glass-card rounded-2xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-surface/50 rounded-xl w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-surface/30 rounded-lg w-full"></div>
            <div className="h-4 bg-surface/30 rounded-lg w-3/4"></div>
            <div className="h-4 bg-surface/30 rounded-lg w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !subscription || !plan) {
    return (
      <div className={`glass-card rounded-2xl p-6 border border-[var(--deyarun-error)]/20 ${className}`}>
        <div className="flex items-center space-x-3 text-[var(--deyarun-error)]">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <p>{error || 'Nav atrasta abonēšanas informācija'}</p>
        </div>
        <button
          onClick={fetchSubscriptionData}
          className="mt-4 text-[var(--deyarun-primary)] hover:text-[var(--deyarun-primary)]/80 text-sm transition-colors"
        >
          Mēģināt vēlreiz
        </button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(subscription.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Subscription Overview */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-adaptive-white mb-2">Jūsu abonementa plāns</h3>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4 mr-2" />
                {statusInfo.label}
              </span>
              {plan.isPopular && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[var(--deyarun-primary)]/10 text-[var(--deyarun-primary)]">
                  <StarIconSolid className="w-4 h-4 mr-2" />
                  Populārākais
                </span>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-adaptive-white">
              {subscription.amount === 0 ? 'Bezmaksas' : (
                <>
                  <CurrencyEuroIcon className="w-6 h-6 inline mr-1" />
                  {subscription.amount}
                  <span className="text-sm text-adaptive-light ml-1">
                    /{subscription.billingCycle === 'yearly' ? 'gadā' : 'mēnesī'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Plan Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-lg font-semibold text-adaptive-white mb-2">{plan.displayName}</h4>
            <p className="text-adaptive-light mb-4">{plan.description}</p>
            
            {subscription.status === 'active' && subscription.daysRemaining > 0 && (
              <div className="flex items-center space-x-2 text-adaptive-light">
                <CalendarDaysIcon className="w-4 h-4" />
                <span>
                  {subscription.daysRemaining} dienas atlikušas
                  {subscription.willRenew ? ' (atjaunosies automātiski)' : ' (neatjaunosies)'}
                </span>
              </div>
            )}
          </div>

          {/* Usage Stats */}
          {usage && (
            <div className="bg-surface/30 rounded-xl p-4 border border-surface-light">
              <h5 className="font-medium text-adaptive-white mb-3">Jūsu aktivitāte</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-adaptive-light">Pabeigti kursi:</span>
                  <span className="text-adaptive-white">{usage.coursesCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-adaptive-light">Pabeigti treniņi:</span>
                  <span className="text-adaptive-white">{usage.workoutsCompleted}</span>
                </div>
                {usage.lastActivityDate && (
                  <div className="flex justify-between">
                    <span className="text-adaptive-light">Pēdējā aktivitāte:</span>
                    <span className="text-adaptive-white">
                      {new Date(usage.lastActivityDate).toLocaleDateString('en-US')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Features List */}
        <div className="mb-6">
          <h5 className="font-medium text-adaptive-white mb-3">Iekļautās funkcijas:</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(plan.features).map(([key, value]) => {
              if (typeof value === 'boolean' && !value) return null;
              
              const FeatureIcon = getFeatureIcon(key);
              const label = formatFeatureLabel(key, value);
              
              return (
                <div key={key} className="flex items-center space-x-2 text-adaptive-light">
                  <FeatureIcon className="w-4 h-4 text-[var(--deyarun-primary)]" />
                  <span className="text-sm">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-surface-light">
          {subscription.planType === 'free' && (
            <button
              onClick={() => window.location.href = '/subscription'}
              className="bg-gradient-to-r from-[var(--deyarun-primary)] to-[var(--deyarun-secondary)] hover:shadow-lg text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
            >
              Uzlabot plānu
            </button>
          )}
          
          {subscription.planType !== 'free' && subscription.status === 'active' && (
            <>
              <button
                onClick={() => window.location.href = '/subscription'}
                className="bg-gradient-to-r from-[var(--deyarun-primary)] to-[var(--deyarun-secondary)] hover:shadow-lg text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
              >
                Mainīt plānu
              </button>
              
              <button
                onClick={() => setShowCancelModal(true)}
                className="bg-surface/50 hover:bg-surface/70 text-adaptive-white px-6 py-3 rounded-xl font-medium transition-all border border-surface-light hover:border-[var(--deyarun-warning)]"
              >
                Atcelt abonēšanu
              </button>
            </>
          )}
          
          <button
            onClick={fetchSubscriptionData}
            className="bg-surface/50 hover:bg-surface/70 text-adaptive-white px-4 py-3 rounded-xl transition-all flex items-center space-x-2 border border-surface-light"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-[var(--deyarun-warning)]" />
              <h3 className="text-lg font-semibold text-adaptive-white">Atcelt abonēšanu?</h3>
            </div>
            
            <p className="text-adaptive-light mb-4">
              Jūs zaudēsiet piekļuvi Premium funkcijām pēc abonementa perioda beigām.
              Vai tiešām vēlaties turpināt?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-adaptive-light mb-2">
                Atcelšanas iemesls (neobligāts):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-surface/50 border border-surface-light rounded-xl text-adaptive-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-[var(--deyarun-primary)] focus:border-transparent"
                rows={3}
                placeholder="Pastāstiet, kāpēc atceļat abonemanu..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-surface/50 hover:bg-surface/70 text-adaptive-white px-4 py-3 rounded-xl transition-all border border-surface-light"
                disabled={canceling}
              >
                Atcelt
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="flex-1 bg-[var(--deyarun-error)] hover:bg-[var(--deyarun-error)]/80 text-white px-4 py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {canceling ? 'Atceļ...' : 'Apstiprināt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDetails;