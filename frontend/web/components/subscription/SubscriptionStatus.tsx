// Subscription Status Component
// Small component to show current subscription status in header/sidebar

import React, { useState, useEffect } from 'react';
import { logger } from '../../lib/productionLogger';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../lib/api';
import { useRouter } from 'next/router';

interface SubscriptionStatusProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ 
  showDetails = true, 
  compact = false,
  className = '' 
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const data = await apiService.getCurrentSubscription();
        setSubscription(data.subscription);
      } catch (error) {
        logger.error('ERROR', 'Failed to fetch subscription status:', { error: error });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  // Get status display info
  const getStatusInfo = (planType: string, status: string) => {
    if (planType === 'free') {
      return {
        icon: ClockIcon,
        color: 'text-gray-400',
        bg: 'bg-gray-500/10',
        label: 'Bezmaksas',
        description: 'Uzlabojiet uz Premium'
      };
    }

    switch (status) {
      case 'active':
        return {
          icon: CheckCircleIconSolid,
          color: planType === 'premium' ? 'text-coral-400' : 'text-purple-400',
          bg: planType === 'premium' ? 'bg-coral-500/10' : 'bg-purple-500/10',
          label: planType === 'premium' ? 'Premium' : 'Pro',
          description: 'Aktīvs'
        };
      case 'trial':
        return {
          icon: ClockIcon,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          label: 'Izmēģinājums',
          description: 'Bezmaksas periods'
        };
      case 'expired':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-red-400',
          bg: 'bg-red-500/10',
          label: 'Beidzies',
          description: 'Atjaunojiet abonemenu'
        };
      default:
        return {
          icon: ClockIcon,
          color: 'text-gray-400',
          bg: 'bg-gray-500/10',
          label: status,
          description: ''
        };
    }
  };

  const handleClick = () => {
    router.push('/subscription');
  };

  if (loading || !subscription) {
    if (compact) {
      return (
        <div className={`animate-pulse ${className}`}>
          <div className="h-8 w-20 bg-slate-700 rounded"></div>
        </div>
      );
    }
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-12 w-32 bg-slate-700 rounded-lg"></div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(subscription.planType, subscription.status);
  const StatusIcon = statusInfo.icon;

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 ${statusInfo.bg} ${statusInfo.color} ${className}`}
      >
        <StatusIcon className="w-3 h-3 mr-1" />
        <span>{statusInfo.label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center space-x-3 p-3 rounded-lg transition-all hover:bg-slate-700/50 group ${className}`}
    >
      <div className={`p-2 rounded-lg ${statusInfo.bg}`}>
        <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
      </div>
      
      {showDetails && (
        <div className="flex-1 text-left">
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
            {subscription.planType === 'premium' && (
              <StarIcon className="w-4 h-4 text-coral-400" />
            )}
          </div>
          
          {statusInfo.description && (
            <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
              {statusInfo.description}
            </p>
          )}
          
          {subscription.daysRemaining > 0 && subscription.status === 'active' && (
            <p className="text-xs text-gray-500">
              {subscription.daysRemaining} dienas atlikušas
            </p>
          )}
        </div>
      )}
    </button>
  );
};

export default SubscriptionStatus;