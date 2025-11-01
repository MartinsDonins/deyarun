// Subscription Details Modal Component
// Shows detailed information about a user's subscription

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CreditCardIcon, CalendarIcon, UserIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { getAuthToken } from '../../utils/auth';
import { logger } from '../../lib/productionLogger'

interface SubscriptionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId: string;
}

interface SubscriptionDetails {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  nextPaymentDate?: string;
  cancelledAt?: string;
  lastPaymentAmount?: number;
  lastPaymentDate?: string;
  daysUntilExpiry: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    country?: string;
  };
  plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    interval: string;
    features: string[];
  };
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    paidAt: string;
    description: string;
    paymentMethod?: string;
    transactionId?: string;
  }>;
  usage?: {
    workoutsThisMonth: number;
    trainingPlansUsed: number;
    lastActivity: string;
  };
}

const SubscriptionDetailsModal: React.FC<SubscriptionDetailsModalProps> = ({
  isOpen,
  onClose,
  subscriptionId
}) => {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'usage'>('overview');

  useEffect(() => {
    if (isOpen && subscriptionId) {
      loadSubscriptionDetails();
    }
  }, [isOpen, subscriptionId]);

  const loadSubscriptionDetails = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/admin/subscriptions/${subscriptionId}/details`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        const apiResponse = await response.json();
        if (apiResponse.success && apiResponse.data) {
          // Transform the backend data to match frontend interface
          const backendData = apiResponse.data;
          const transformedData: SubscriptionDetails = {
            id: backendData.subscription.id,
            status: backendData.subscription.status,
            startDate: backendData.subscription.startDate,
            endDate: backendData.subscription.endDate,
            nextPaymentDate: backendData.subscription.endDate, // Assuming next payment is at end date
            daysUntilExpiry: Math.max(0, Math.ceil((new Date(backendData.subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
            isExpiringSoon: Math.ceil((new Date(backendData.subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 30,
            isExpired: new Date(backendData.subscription.endDate) < new Date(),
            user: {
              id: backendData.user?.id || 'unknown',
              firstName: backendData.user?.firstName || 'N/A',
              lastName: backendData.user?.lastName || 'N/A',
              email: backendData.user?.email || 'N/A',
              phoneNumber: backendData.user?.phoneNumber,
              country: backendData.user?.country
            },
            plan: {
              id: backendData.plan?.id || 'unknown',
              name: backendData.plan?.name || 'Unknown Plan',
              description: backendData.plan?.description || '',
              price: backendData.subscription.amount || 0,
              currency: backendData.subscription.currency || 'EUR',
              interval: backendData.subscription.billingCycle || 'monthly',
              features: backendData.plan?.features || []
            },
            payments: backendData.history?.payments || [],
            usage: {
              workoutsThisMonth: backendData.usage?.workoutsCompleted || 0,
              trainingPlansUsed: backendData.usage?.coursesCompleted || 0,
              lastActivity: backendData.usage?.lastActivityDate || new Date().toISOString()
            }
          };
          setSubscription(transformedData);
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        // No fallback to mock data - throw proper error
        const errorMessage = response.status === 404 
          ? 'Subscription not found'
          : `Failed to load subscription details (${response.status})`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      logger.error('ERROR', 'Error loading subscription details:', { error: error });
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/30 text-green-300 border-green-700';
      case 'trialing':
        return 'bg-blue-900/30 text-blue-300 border-blue-700';
      case 'cancelled':
        return 'bg-gray-900/30 text-gray-300 border-gray-700';
      case 'expired':
        return 'bg-red-900/30 text-red-300 border-red-700';
      case 'past_due':
        return 'bg-yellow-900/30 text-yellow-300 border-yellow-700';
      default:
        return 'bg-gray-900/30 text-gray-300 border-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      active: 'Aktīvs',
      trialing: 'Izmēģina',
      cancelled: 'Atcelts',
      expired: 'Beidzies',
      past_due: 'Kavē maksājumu'
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircleIcon className="w-4 h-4 text-red-400" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-400" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('lv');
  };

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('lv', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Abonements detalizēti</h2>
            {subscription && (
              <p className="text-sm text-gray-400 mt-1">
                {subscription.user.firstName} {subscription.user.lastName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-coral-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-400">Ielādē datus...</p>
          </div>
        ) : subscription ? (
          <div className="flex flex-col h-full max-h-[calc(90vh-80px)]">
            {/* Tabs */}
            <div className="flex border-b border-gray-700 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-4 border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-coral-500 text-coral-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Pārskats
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`pb-3 px-4 border-b-2 transition-colors ${
                  activeTab === 'payments'
                    ? 'border-coral-500 text-coral-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Maksājumi
              </button>
              <button
                onClick={() => setActiveTab('usage')}
                className={`pb-3 px-4 border-b-2 transition-colors ${
                  activeTab === 'usage'
                    ? 'border-coral-500 text-coral-500'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Lietošana
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                      <UserIcon className="w-5 h-5 mr-2" />
                      Lietotāja informācija
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Vārds, uzvārds</p>
                        <p className="text-white">{subscription.user.firstName} {subscription.user.lastName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">E-pasts</p>
                        <p className="text-white">{subscription.user.email}</p>
                      </div>
                      {subscription.user.phoneNumber && (
                        <div>
                          <p className="text-sm text-gray-400">Telefons</p>
                          <p className="text-white">{subscription.user.phoneNumber}</p>
                        </div>
                      )}
                      {subscription.user.country && (
                        <div>
                          <p className="text-sm text-gray-400">Valsts</p>
                          <p className="text-white">{subscription.user.country}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subscription Status */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-3">Abonements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Status</p>
                        <span className={`inline-block px-2 py-1 rounded border text-xs font-medium ${getStatusBadgeColor(subscription.status)}`}>
                          {getStatusText(subscription.status)}
                        </span>
                        {subscription.isExpiringSoon && (
                          <p className="text-xs text-yellow-400 mt-1">
                            Beidzas {subscription.daysUntilExpiry} dienās
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Plāns</p>
                        <p className="text-white font-medium">{subscription.plan.name}</p>
                        <p className="text-sm text-gray-400">{formatCurrency(subscription.plan.price)}/{subscription.plan.interval === 'monthly' ? 'mēn' : 'gads'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Sākuma datums</p>
                        <p className="text-white">{formatDate(subscription.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Beigu datums</p>
                        <p className="text-white">{formatDate(subscription.endDate)}</p>
                      </div>
                      {subscription.nextPaymentDate && (
                        <div>
                          <p className="text-sm text-gray-400">Nākošais maksājums</p>
                          <p className="text-white">{formatDate(subscription.nextPaymentDate)}</p>
                        </div>
                      )}
                      {subscription.cancelledAt && (
                        <div>
                          <p className="text-sm text-gray-400">Atcelts</p>
                          <p className="text-white">{formatDate(subscription.cancelledAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Plan Features */}
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-white mb-3">Plāna funkcionalitātes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Array.isArray(subscription.plan.features) && subscription.plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white flex items-center">
                    <CreditCardIcon className="w-5 h-5 mr-2" />
                    Maksājumu vēsture
                  </h3>
                  
                  {subscription.payments.length > 0 ? (
                    <div className="space-y-3">
                      {subscription.payments.map((payment) => (
                        <div key={payment.id} className="bg-slate-700/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              {getPaymentStatusIcon(payment.status)}
                              <span className="ml-2 font-medium text-white">
                                {formatCurrency(payment.amount)}
                              </span>
                              <span className="ml-2 text-sm text-gray-400">
                                ({payment.status})
                              </span>
                            </div>
                            <span className="text-sm text-gray-400">
                              {formatDateTime(payment.paidAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-1">{payment.description}</p>
                          {payment.transactionId && (
                            <p className="text-xs text-gray-500">ID: {payment.transactionId}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">Nav maksājumu vēstures</p>
                  )}
                </div>
              )}

              {activeTab === 'usage' && subscription.usage && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-white">Lietošanas statistika</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-coral-500">{subscription.usage.workoutsThisMonth}</div>
                      <div className="text-sm text-gray-400">Treniņi šajā mēnesī</div>
                    </div>
                    
                    <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">{subscription.usage.trainingPlansUsed}</div>
                      <div className="text-sm text-gray-400">Izmantotie plāni</div>
                    </div>
                    
                    <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {subscription.usage.lastActivity ? formatDate(subscription.usage.lastActivity) : 'Nav datu'}
                      </div>
                      <div className="text-sm text-gray-400">Pēdējā aktivitāte</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-400">Neizdevās ielādēt abonements datus</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionDetailsModal;