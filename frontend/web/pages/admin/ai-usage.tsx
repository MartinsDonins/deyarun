// AI Resource Usage Analytics Dashboard
// Monitor ChatGPT/OpenAI consumption for course generation and training plans

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { withAdminAuth } from '../../contexts/AuthContext';
import { apiService } from '../../lib/api';
import { getAuthHeaders } from '../../utils/auth';
import { logger } from '../../lib/productionLogger';
import { 
  CpuChipIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChartBarIcon,
  BookOpenIcon,
  MapIcon,
  UsersIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface AIUsageOverview {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  uniqueUserCount: number;
}

interface ContextBreakdown {
  _id: string;
  requests: number;
  tokens: number;
  cost: number;
  avgLatency: number;
}

interface CourseUsage {
  courseName: string;
  courseId: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  avgCostPerRequest: number;
  firstGenerated: string;
  lastGenerated: string;
}

interface TrainingPlanUsage {
  planName: string;
  planId: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  uniqueUserCount: number;
  avgCostPerRequest: number;
}

interface DailyUsage {
  _id: { date: string };
  requests: number;
  tokens: number;
  cost: number;
}

const AIUsageDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AIUsageOverview | null>(null);
  const [contextBreakdown, setContextBreakdown] = useState<ContextBreakdown[]>([]);
  const [courseUsage, setCourseUsage] = useState<CourseUsage[]>([]);
  const [trainingPlanUsage, setTrainingPlanUsage] = useState<TrainingPlanUsage[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAIUsageData();
  }, [period]);

  const loadAIUsageData = async () => {
    try {
      setLoading(true);
      
      // Load overview data
      const overviewResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/ai-usage/overview?period=${period}`, {
        headers: getAuthHeaders()
      });
      
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setOverview(overviewData.data.overview);
        setContextBreakdown(overviewData.data.contextBreakdown);
        setDailyUsage(overviewData.data.dailyTrend);
      }

      // Load course-specific usage
      const courseResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/ai-usage/courses?limit=10`, {
        headers: getAuthHeaders()
      });
      
      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        setCourseUsage(courseData.data.courses);
      }

      // Load training plan usage
      const planResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/ai-usage/training-plans?limit=10`, {
        headers: getAuthHeaders()
      });
      
      if (planResponse.ok) {
        const planData = await planResponse.json();
        setTrainingPlanUsage(planData.data.trainingPlans);
      }

    } catch (error) {
      logger.error('ERROR', 'Error loading AI usage data:', { error: error });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string = 'csv') => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/ai-usage/export?format=${format}&limit=1000`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-usage-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      logger.error('ERROR', 'Error exporting data:', { error: error });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatLatency = (ms: number) => {
    return `${Math.round(ms)}ms`;
  };

  const getContextIcon = (context: string) => {
    switch (context) {
      case 'course_generation':
        return <BookOpenIcon className="w-5 h-5" />;
      case 'training_plan_creation':
        return <MapIcon className="w-5 h-5" />;
      case 'coaching_advice':
        return <UsersIcon className="w-5 h-5" />;
      default:
        return <SparklesIcon className="w-5 h-5" />;
    }
  };

  const getContextDisplayName = (context: string) => {
    const names: Record<string, string> = {
      'course_generation': 'Kursu ģenerēšana',
      'training_plan_creation': 'Treniņplānu izveidošana',
      'coaching_advice': 'Trenera padoml',
      'workout_generation': 'Treniņu ģenerēšana',
      'exercise_generation': 'Vingrinājumu ģenerēšana',
      'content_optimization': 'Satura optimizācija',
      'user_recommendation': 'Lietotāju ieteikumi',
      'admin_task': 'Admin uzdevumi',
      'other': 'Citi'
    };
    return names[context] || context;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-bg text-white p-6">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Ielādē AI patēriņa datus...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-bg text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">AI Resursu Patēriņš</h1>
              <p className="text-gray-400">ChatGPT/OpenAI izmantošana kursu un treniņplānu ģenerēšanai</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 bg-surface border border-gray-700 rounded-lg text-white focus:border-coral focus:outline-none"
              >
                <option value="7d">Pēdējās 7 dienas</option>
                <option value="30d">Pēdējās 30 dienas</option>
                <option value="90d">Pēdējās 90 dienas</option>
              </select>
              <button
                onClick={() => handleExport('csv')}
                className="btn-primary flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Eksportēt
              </button>
            </div>
          </div>

          {/* Overview Stats */}
          {overview && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <ChartBarIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300">Kopā pieprasījumi</h3>
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(overview.totalRequests)}</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CpuChipIcon className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300">Kopā tokeni</h3>
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(overview.totalTokens)}</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-coral/20 rounded-lg">
                    <CurrencyDollarIcon className="w-5 h-5 text-coral" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300">Kopējās izmaksas</h3>
                </div>
                <p className="text-2xl font-bold text-white">{formatCurrency(overview.totalCost)}</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300">Vidējais laiks</h3>
                </div>
                <p className="text-2xl font-bold text-white">{formatLatency(overview.avgLatency)}</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <UsersIcon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-300">Aktīvi lietotāji</h3>
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(overview.uniqueUserCount)}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 mb-8">
            {[
              { key: 'overview', label: 'Pārskats', icon: ChartBarIcon },
              { key: 'courses', label: 'Kursi', icon: BookOpenIcon },
              { key: 'plans', label: 'Treniņplāni', icon: MapIcon },
              { key: 'context', label: 'Konteksts', icon: SparklesIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.key
                    ? 'bg-coral text-white'
                    : 'bg-surface text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Daily Usage Chart placeholder */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Dienas patēriņš</h3>
                <div className="h-64 flex items-center justify-center bg-surface/50 rounded-lg border border-gray-700">
                  <p className="text-gray-400">Grafiks parādīs dienas AI patēriņu (īstenošana sekos)</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="card">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">AI patēriņš pa kursiem</h3>
                <p className="text-gray-400 text-sm mt-1">Kursu ģenerēšanai izlietotie resursi</p>
              </div>
              
              {courseUsage.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface/50">
                      <tr>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-300">Kursa nosaukums</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-300">Pieprasījumi</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-300">Tokeni</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-300">Izmaksas</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-300">Vidēji/pieprasījums</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-300">Pēdējoreiz</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseUsage.map((course, index) => (
                        <tr key={course.courseId || index} className="border-t border-gray-700 hover:bg-surface/30">
                          <td className="py-4 px-6">
                            <div className="font-medium text-white">{course.courseName || 'Nezināms kurss'}</div>
                            <div className="text-xs text-gray-400">ID: {course.courseId || 'N/A'}</div>
                          </td>
                          <td className="py-4 px-6 text-gray-300">{formatNumber(course.totalRequests)}</td>
                          <td className="py-4 px-6 text-gray-300">{formatNumber(course.totalTokens)}</td>
                          <td className="py-4 px-6 text-coral font-medium">{formatCurrency(course.totalCost)}</td>
                          <td className="py-4 px-6 text-gray-300">{formatCurrency(course.avgCostPerRequest)}</td>
                          <td className="py-4 px-6 text-gray-300">
                            {course.lastGenerated ? new Date(course.lastGenerated).toLocaleDateString('en-US') : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <BookOpenIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Nav kursu ģenerēšanas datu</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="card">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">AI patēriņš pa treniņplāniem</h3>
                <p className="text-gray-400 text-sm mt-1">Treniņplānu ģenerēšanai izlietotie resursi</p>
              </div>
              
              {trainingPlanUsage.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface/50">
                      <tr>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-300">Plāna nosaukums</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-300">Pieprasījumi</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-300">Tokeni</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-300">Izmaksas</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-300">Lietotāji</th>
                        <th className="text-left py-3 px-6 text-sm font-medium text-gray-300">Vidēji/pieprasījums</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainingPlanUsage.map((plan, index) => (
                        <tr key={plan.planId || index} className="border-t border-gray-700 hover:bg-surface/30">
                          <td className="py-4 px-6">
                            <div className="font-medium text-white">{plan.planName || 'Nezināms plāns'}</div>
                            <div className="text-xs text-gray-400">ID: {plan.planId || 'N/A'}</div>
                          </td>
                          <td className="py-4 px-6 text-gray-300">{formatNumber(plan.totalRequests)}</td>
                          <td className="py-4 px-6 text-gray-300">{formatNumber(plan.totalTokens)}</td>
                          <td className="py-4 px-6 text-coral font-medium">{formatCurrency(plan.totalCost)}</td>
                          <td className="py-4 px-6 text-gray-300">{formatNumber(plan.uniqueUserCount)}</td>
                          <td className="py-4 px-6 text-gray-300">{formatCurrency(plan.avgCostPerRequest)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <MapIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Nav treniņplānu ģenerēšanas datu</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'context' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contextBreakdown.map((context, index) => (
                <div key={context._id || index} className="card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-coral/20 rounded-lg">
                      {getContextIcon(context._id)}
                    </div>
                    <h3 className="font-medium text-white">{getContextDisplayName(context._id)}</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Pieprasījumi:</span>
                      <span className="text-white font-medium">{formatNumber(context.requests)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Tokeni:</span>
                      <span className="text-white font-medium">{formatNumber(context.tokens)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Izmaksas:</span>
                      <span className="text-coral font-medium">{formatCurrency(context.cost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">Vidējais laiks:</span>
                      <span className="text-white font-medium">{formatLatency(context.avgLatency)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default withAdminAuth(AIUsageDashboard);