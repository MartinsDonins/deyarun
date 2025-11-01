// Usage Limits Component
// Shows current usage against subscription limits with upgrade prompts

import React, { useState, useEffect } from 'react';
import { logger } from '../../lib/productionLogger';
import { 
  ExclamationTriangleIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  PlayIcon,
  ArrowUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

interface UsageLimitsProps {
  showUpgradePrompts?: boolean;
  className?: string;
}

interface SubscriptionData {
  subscription: {
    plan: string;
    level: string;
    isActive: boolean;
    expiresAt?: string;
    daysUntilRenewal?: number;
    features: {
      maxTrainingPlans: number;
      maxWorkoutsPerMonth: number;
      dataRetention: number;
      aiCoaching: boolean;
      advancedAnalytics: boolean;
      personalCoach: boolean;
      prioritySupport: boolean;
    };
  };
  usage: {
    trainingPlans: {
      current: number;
      limit: number;
      percentage: number;
      unlimited: boolean;
    };
    workouts: {
      monthly: number;
      limit: number;
      percentage: number;
      unlimited: boolean;
      resetsOn: string;
    };
    dataRetention: {
      days: number;
      unlimited: boolean;
      cutoffDate?: string;
    };
  };
  limits: {
    approaching: boolean;
    trainingPlansLimitReached: boolean;
    workoutsLimitReached: boolean;
  };
  recommendations: Array<{
    feature: string;
    reason: string;
    requiredPlan: string;
  }>;
  featureAccess: {
    aiCoaching: boolean;
    personalCoach: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    unlimitedPlans: boolean;
    unlimitedWorkouts: boolean;
    fullDataHistory: boolean;
  };
}

const UsageLimits: React.FC<UsageLimitsProps> = ({ 
  showUpgradePrompts = true, 
  className = '' 
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com';
        const response = await fetch(`${apiUrl}/api/user/subscription-status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch subscription status');
        }

        const data = await response.json();
        setSubscriptionData(data);
      } catch (err) {
        logger.error('ERROR', 'Error fetching subscription status:', { error: err });
        setError('Failed to load subscription information');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [user]);

  const getUsageBarColor = (percentage: number, isLimitReached: boolean) => {
    if (isLimitReached) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUsageTextColor = (percentage: number, isLimitReached: boolean) => {
    if (isLimitReached) return 'text-red-400';
    if (percentage >= 80) return 'text-yellow-400';
    return 'text-green-400';
  };

  const handleUpgrade = () => {
    router.push('/subscription?upgrade=true');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-4">
          <div className="h-4 w-32 bg-slate-700 rounded"></div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-700 rounded"></div>
            <div className="h-3 w-3/4 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !subscriptionData) {
    return (
      <div className={`text-red-400 text-sm ${className}`}>
        {error || 'Failed to load usage information'}
      </div>
    );
  }

  const { subscription, usage, limits, recommendations, featureAccess } = subscriptionData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Plan Overview */}
      <div className="bg-surface border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white capitalize">{subscription.plan} plāns</h3>
          {subscription.level === 'free' && showUpgradePrompts && (
            <button
              onClick={handleUpgrade}
              className="inline-flex items-center px-3 py-1.5 bg-coral hover:bg-coral/80 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ArrowUpIcon className="w-4 h-4 mr-1" />
              Uzlabot
            </button>
          )}
        </div>

        {/* Usage Bars */}
        <div className="space-y-4">
          {/* Training Plans Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Treniņa plāni</span>
              </div>
              <span className={`text-sm font-medium ${getUsageTextColor(usage.trainingPlans.percentage, limits.trainingPlansLimitReached)}`}>
                {usage.trainingPlans.unlimited ? 
                  `${usage.trainingPlans.current} (neierobežoti)` :
                  `${usage.trainingPlans.current}/${usage.trainingPlans.limit}`
                }
              </span>
            </div>
            
            {!usage.trainingPlans.unlimited && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getUsageBarColor(usage.trainingPlans.percentage, limits.trainingPlansLimitReached)}`}
                  style={{ width: `${Math.min(usage.trainingPlans.percentage, 100)}%` }}
                />
              </div>
            )}
            
            {limits.trainingPlansLimitReached && (
              <p className="text-xs text-red-400 mt-1 flex items-center">
                <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                Limits sasniegts
              </p>
            )}
          </div>

          {/* Monthly Workouts Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <PlayIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Mēneša treniņi</span>
              </div>
              <span className={`text-sm font-medium ${getUsageTextColor(usage.workouts.percentage, limits.workoutsLimitReached)}`}>
                {usage.workouts.unlimited ? 
                  `${usage.workouts.monthly} (neierobežoti)` :
                  `${usage.workouts.monthly}/${usage.workouts.limit}`
                }
              </span>
            </div>
            
            {!usage.workouts.unlimited && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getUsageBarColor(usage.workouts.percentage, limits.workoutsLimitReached)}`}
                  style={{ width: `${Math.min(usage.workouts.percentage, 100)}%` }}
                />
              </div>
            )}
            
            {limits.workoutsLimitReached && (
              <p className="text-xs text-red-400 mt-1 flex items-center">
                <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                Mēneša limits sasniegts
              </p>
            )}
            
            {!usage.workouts.unlimited && (
              <p className="text-xs text-gray-500 mt-1">
                Atjaunojas: {formatDate(usage.workouts.resetsOn)}
              </p>
            )}
          </div>

          {/* Data Retention */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Datu saglabāšana</span>
              </div>
              <span className="text-sm font-medium text-gray-300">
                {usage.dataRetention.unlimited ? 
                  'Neierobežota' :
                  `${usage.dataRetention.days} dienas`
                }
              </span>
            </div>
            
            {!usage.dataRetention.unlimited && usage.dataRetention.cutoffDate && (
              <p className="text-xs text-gray-500">
                Dati vecāki par {formatDate(usage.dataRetention.cutoffDate)} nav pieejami
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Feature Access */}
      <div className="bg-surface border border-gray-700 rounded-xl p-6">
        <h4 className="text-md font-semibold text-white mb-4">Funkcionalitātes</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className={`flex items-center space-x-2 ${featureAccess.aiCoaching ? 'text-green-400' : 'text-gray-500'}`}>
            <CheckCircleIcon className={`w-4 h-4 ${featureAccess.aiCoaching ? 'text-green-400' : 'text-gray-500'}`} />
            <span className="text-sm">AI treneru vadība</span>
          </div>
          <div className={`flex items-center space-x-2 ${featureAccess.personalCoach ? 'text-green-400' : 'text-gray-500'}`}>
            <CheckCircleIcon className={`w-4 h-4 ${featureAccess.personalCoach ? 'text-green-400' : 'text-gray-500'}`} />
            <span className="text-sm">Personīgais treners</span>
          </div>
          <div className={`flex items-center space-x-2 ${featureAccess.advancedAnalytics ? 'text-green-400' : 'text-gray-500'}`}>
            <CheckCircleIcon className={`w-4 h-4 ${featureAccess.advancedAnalytics ? 'text-green-400' : 'text-gray-500'}`} />
            <span className="text-sm">Uzlabota analītika</span>
          </div>
          <div className={`flex items-center space-x-2 ${featureAccess.prioritySupport ? 'text-green-400' : 'text-gray-500'}`}>
            <CheckCircleIcon className={`w-4 h-4 ${featureAccess.prioritySupport ? 'text-green-400' : 'text-gray-500'}`} />
            <span className="text-sm">Prioritārs atbalsts</span>
          </div>
        </div>
      </div>

      {/* Upgrade Recommendations */}
      {showUpgradePrompts && recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-coral/10 to-coral/5 border border-coral/30 rounded-xl p-6">
          <h4 className="text-md font-semibold text-coral mb-4">Ieteikumi uzlabošanai</h4>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3">
                <ArrowUpIcon className="w-4 h-4 text-coral mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white">{rec.reason}</p>
                  <p className="text-xs text-coral capitalize">
                    Nepieciešams: {rec.requiredPlan} plāns
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpgrade}
            className="w-full mt-4 bg-coral hover:bg-coral/80 text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
          >
            Uzlabot plānu
          </button>
        </div>
      )}

      {/* Expiry Warning */}
      {subscription.daysUntilRenewal && subscription.daysUntilRenewal <= 7 && subscription.daysUntilRenewal > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-400">
                Abonements beidzas pēc {subscription.daysUntilRenewal} dienām
              </p>
              <p className="text-xs text-yellow-400/80">
                Atjaunojiet, lai saglabātu piekļuvi visām funkcijām
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageLimits;