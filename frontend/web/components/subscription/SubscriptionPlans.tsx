// Subscription Plans Component
// Display available subscription plans with upgrade/downgrade options

import React, { useState, useEffect } from 'react';
import { logger } from '../../lib/productionLogger';
import { 
  CheckIcon,
  StarIcon,
  CurrencyEuroIcon,
  SparklesIcon,
  UsersIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BoltIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
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
  isActive: boolean;
  discount?: {
    percentage: number;
    validUntil: string;
    description: string;
  };
}

interface CurrentSubscription {
  planType: string;
  status: string;
  billingCycle: string;
}

interface SubscriptionPlansProps {
  currentSubscription?: CurrentSubscription;
  onPlanSelect?: (plan: SubscriptionPlan, billingCycle: string) => void;
  showCurrentBadge?: boolean;
  className?: string;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ 
  currentSubscription,
  onPlanSelect,
  showCurrentBadge = true,
  className = '' 
}) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Fetch subscription plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedPlans = await apiService.getSubscriptionPlans();
      setPlans(fetchedPlans.sort((a, b) => a.tier - b.tier));

      analytics.trackEvent('subscription_plans_viewed', 'subscription', 'plans_page');
    } catch (err) {
      logger.error('ERROR', 'Failed to fetch subscription plans:', { error: err });
      setError('Neizdevās ielādēt abonementa plānus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Handle plan selection
  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    logger.info('COMPONENT', 'Selecting plan:', { type: plan.type });
    logger.info('COMPONENT', 'Current subscription:', { currentSubscription });
    logger.info('COMPONENT', 'Selected billing cycle:', { selectedBillingCycle });
    
    if (!user) {
      logger.info('COMPONENT', 'No user, redirecting to login');
      window.location.href = '/login';
      return;
    }

    if (processingPlan) {
      logger.info('COMPONENT', 'Already processing, returning');
      return;
    }

    try {
      setProcessingPlan(plan.type);

      // Check if this is current plan
      if (currentSubscription?.planType === plan.type) {
        return;
      }

      if (onPlanSelect) {
        onPlanSelect(plan, selectedBillingCycle);
      } else {
        // Default handling - create or upgrade subscription
        const action = !currentSubscription || currentSubscription.planType === 'free' ? 'create' : 'upgrade';
        
        if (action === 'create') {
          await apiService.createSubscription(plan.type, selectedBillingCycle);
        } else {
          await apiService.upgradeSubscription(plan.type, selectedBillingCycle);
        }

        // Redirect to success page or reload
        window.location.reload();
      }

      analytics.trackEvent('subscription_plan_selected', 'subscription', plan.type);
    } catch (err) {
      logger.error('ERROR', 'Failed to select plan:', { error: err });
      setError('Neizdevās izvēlēties plānu');
    } finally {
      setProcessingPlan(null);
    }
  };

  // Get plan features for display
  const getPlanFeatures = (plan: SubscriptionPlan): string[] => {
    const features: string[] = [];
    
    if (plan.features.maxCoursesPerMonth === -1) {
      features.push('Neierobežots kursu skaits');
    } else {
      features.push(`${plan.features.maxCoursesPerMonth} kursi mēnesī`);
    }
    
    if (plan.features.maxWorkoutsPerWeek === -1) {
      features.push('Neierobežots treniņu skaits');
    } else {
      features.push(`${plan.features.maxWorkoutsPerWeek} treniņi nedēļā`);
    }

    if (plan.features.advancedAnalytics) {
      features.push('Detalizēta analītika');
    }
    
    if (plan.features.personalizedPlans) {
      features.push('Personalizēti treniņu plāni');
    }
    
    if (plan.features.downloadableContent) {
      features.push('Lejuplādējams saturs');
    }
    
    if (plan.features.offlineMode) {
      features.push('Bezsaistes režīms');
    }
    
    if (plan.features.prioritySupport) {
      features.push('Prioritārs atbalsts');
    }
    
    if (plan.features.personalCoaching) {
      features.push('Personīgais treneres');
    }
    
    if (plan.features.exclusiveEvents) {
      features.push('Ekskluzīvi notikumi');
    }

    return features;
  };

  // Calculate discount price
  const getDiscountedPrice = (plan: SubscriptionPlan, cycle: 'monthly' | 'yearly'): number => {
    const originalPrice = plan.price[cycle];
    if (!plan.discount || !plan.discount.percentage) return parseFloat(originalPrice.toFixed(2));
    
    const discountAmount = (originalPrice * plan.discount.percentage) / 100;
    const finalPrice = originalPrice - discountAmount;
    return parseFloat(finalPrice.toFixed(2));
  };

  // Get plan color theme
  const getPlanTheme = (planType: string) => {
    switch (planType) {
      case 'free':
        return {
          border: 'border-surface-light',
          bg: 'glass-card',
          accent: 'text-adaptive-light',
          button: 'bg-surface/50 hover:bg-surface/70 text-adaptive-white border border-surface-light'
        };
      case 'premium':
        return {
          border: 'border-[var(--deyarun-primary)]',
          bg: 'glass-card bg-gradient-to-br from-[var(--deyarun-primary)]/5 to-[var(--deyarun-secondary)]/5',
          accent: 'text-[var(--deyarun-primary)]',
          button: 'bg-gradient-to-r from-[var(--deyarun-primary)] to-[var(--deyarun-secondary)] hover:shadow-lg text-white'
        };
      case 'pro':
        return {
          border: 'border-[var(--deyarun-secondary)]',
          bg: 'glass-card bg-gradient-to-br from-[var(--deyarun-secondary)]/5 to-[var(--deyarun-primary)]/5',
          accent: 'text-[var(--deyarun-secondary)]',
          button: 'bg-gradient-to-r from-[var(--deyarun-secondary)] to-[var(--deyarun-primary)] hover:shadow-lg text-white'
        };
      case 'enterprise':
        return {
          border: 'border-[var(--deyarun-warning)]',
          bg: 'glass-card bg-gradient-to-br from-[var(--deyarun-warning)]/5 to-[var(--deyarun-primary)]/5',
          accent: 'text-[var(--deyarun-warning)]',
          button: 'bg-gradient-to-r from-[var(--deyarun-warning)] to-[var(--deyarun-primary)] hover:shadow-lg text-white'
        };
      default:
        return {
          border: 'border-surface-light',
          bg: 'glass-card',
          accent: 'text-adaptive-light',
          button: 'bg-surface/50 hover:bg-surface/70 text-adaptive-white border border-surface-light'
        };
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-surface/50 rounded-xl w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-surface/30 rounded-lg w-2/3 mx-auto"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center max-w-7xl mx-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-surface/50 rounded-xl w-2/3 mb-4"></div>
              <div className="h-8 bg-surface/30 rounded-lg w-1/2 mb-6"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-4 bg-surface/20 rounded-lg w-full"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <ExclamationTriangleIcon className="w-12 h-12 text-[var(--deyarun-error)] mx-auto mb-4" />
        <p className="text-[var(--deyarun-error)] mb-4">{error}</p>
        <button
          onClick={fetchPlans}
          className="bg-gradient-to-r from-[var(--deyarun-primary)] to-[var(--deyarun-secondary)] hover:shadow-lg text-white px-6 py-3 rounded-xl transition-all inline-flex items-center space-x-2"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Mēģināt vēlreiz</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Izvēlieties savu plānu</h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Sāciet ar bezmaksas plānu vai izvēlieties Premium, lai piekļūtu visām funkcijām
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center">
        <div className="glass-card rounded-2xl p-1 border border-surface-light">
          <button
            onClick={() => setSelectedBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md transition-colors ${
              selectedBillingCycle === 'monthly' 
                ? 'bg-coral-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mēnesī
          </button>
          <button
            onClick={() => setSelectedBillingCycle('yearly')}
            className={`px-6 py-2 rounded-md transition-colors relative ${
              selectedBillingCycle === 'yearly' 
                ? 'bg-coral-500 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Gadā
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center max-w-7xl mx-auto">
        {plans.map((plan) => {
          const theme = getPlanTheme(plan.type);
          const features = getPlanFeatures(plan);
          const isCurrentPlan = currentSubscription?.planType === plan.type;
          const price = parseFloat(plan.price[selectedBillingCycle].toFixed(2));
          const discountedPrice = getDiscountedPrice(plan, selectedBillingCycle);
          const hasDiscount = plan.discount && discountedPrice < price;
          
          logger.info('COMPONENT', `Plan ${plan.type}: isCurrentPlan=${isCurrentPlan}, currentSubscription.planType=${currentSubscription?.planType}`);
          
          return (
            <div
              key={plan._id }
              className={`relative rounded-xl p-6 border-2 transition-all hover:shadow-xl ${theme.border } ${theme.bg } ${
                plan.isPopular ? 'ring-2 ring-coral-500/50' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-coral-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <StarIconSolid className="w-4 h-4 mr-1" />
                    Populārākais
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {showCurrentBadge && isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Pašreizējais
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.displayName}</h3>
                <p className="text-gray-300 text-sm mb-4">{plan.description}</p>
                
                {/* Price */}
                <div className="mb-4">
                  {price === 0 ? (
                    <div className="text-3xl font-bold text-white">Bezmaksas</div>
                  ) : (
                    <div>
                      {hasDiscount && (
                        <div className="text-lg text-gray-400 line-through mb-1">
                          €{price.toFixed(2)}/{selectedBillingCycle === 'yearly' ? 'gadā' : 'mēnesī'}
                        </div>
                      )}
                      <div className="flex items-center justify-center">
                        <CurrencyEuroIcon className="w-6 h-6 text-white" />
                        <span className="text-3xl font-bold text-white">
                          {discountedPrice.toFixed(2)}
                        </span>
                        <span className="text-gray-400 ml-2">
                          /{selectedBillingCycle === 'yearly' ? 'gadā' : 'mēnesī'}
                        </span>
                      </div>
                      {hasDiscount && plan.discount && (
                        <div className="text-green-400 text-sm mt-1">
                          Ietaupījums {plan.discount.percentage}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckIcon className={`w-4 h-4 ${theme.accent }`} />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrentPlan || processingPlan === plan.type}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme.button }`}
              >
                {processingPlan === plan.type ? (
                  <div className="flex items-center justify-center space-x-2">
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    <span>Apstrādā...</span>
                  </div>
                ) : isCurrentPlan ? (
                  'Pašreizējais plāns'
                ) : !currentSubscription || currentSubscription.planType === 'free' ? (
                  plan.type === 'free' ? 'Sākt bez maksas' : 'Izvēlēties plānu'
                ) : (
                  'Uzlabot plānu'
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="text-center text-gray-400 text-sm">
        <p>Visi plāni iekļauj 7 dienu bezmaksas izmēģinājuma periodu</p>
        <p>Jūs varat atcelt abonemanu jebkurā laikā</p>
      </div>
    </div>
  );
};

export default SubscriptionPlans;