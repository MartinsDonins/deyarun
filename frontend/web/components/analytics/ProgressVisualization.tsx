import React, { useState, useEffect } from 'react';
import { logger } from '../../lib/productionLogger';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  MinusIcon,
  ChartBarIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface ProgressData {
  date: string;
  distance: number;
  pace: number;
  duration: number;
  calories?: number;
  heartRate?: number;
}

interface GoalProgress {
  id: string;
  title: string;
  current: number;
  target: number;
  progress: number;
  trend: 'improving' | 'declining' | 'stable';
  color: string;
}

interface ProgressVisualizationProps {
  userId: string;
  period?: '1week' | '1month' | '3months' | '6months' | '1year';
  showGoals?: boolean;
  showTrends?: boolean;
  showComparison?: boolean;
}

const ProgressVisualization: React.FC<ProgressVisualizationProps> = ({
  userId,
  period = '3months',
  showGoals = true,
  showTrends = true,
  showComparison = false
}) => {
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'detailed' | 'comparison'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<'distance' | 'pace' | 'duration'>('distance');

  useEffect(() => {
    fetchProgressData();
    if (showGoals) {
      fetchGoalProgress();
    }
  }, [userId, period]);

  const fetchProgressData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/advanced-analytics/progress-trends/${userId}?timeframe=${period}&metrics=pace,distance,duration`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Transform data for visualization
        const transformedData = transformProgressData(data.trends);
        setProgressData(transformedData);
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching progress data:', { error: error });
    }
  };

  const fetchGoalProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/goals?status=active&includeAnalytics=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const transformedGoals = data.goals.map((goal: any, index: number) => ({
          id: goal._id,
          title: goal.title,
          current: goal.current.value,
          target: goal.target.value,
          progress: goal.progress.percentage,
          trend: goal.progress.trend,
          color: getGoalColor(index)
        }));
        setGoalProgress(transformedGoals);
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching goal progress:', { error: error });
    } finally {
      setLoading(false);
    }
  };

  const transformProgressData = (trendsData: any): ProgressData[] => {
    // Transform API data into chart-friendly format
    if (!trendsData || !trendsData.pace || !trendsData.distance) {
      return [];
    }

    const dates = trendsData.pace.dataPoints?.map((point: any) => point.date) || [];
    
    return dates.map((date: string, index: number) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      distance: trendsData.distance.dataPoints?.[index]?.value || 0,
      pace: trendsData.pace.dataPoints?.[index]?.value || 0,
      duration: trendsData.duration?.dataPoints?.[index]?.value || 0,
      calories: trendsData.calories?.dataPoints?.[index]?.value || 0,
      heartRate: trendsData.heartRate?.dataPoints?.[index]?.value || 0
    })).slice(-20); // Last 20 data points
  };

  const getGoalColor = (index: number): string => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];
    return colors[index % colors.length];
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
      default:
        return <MinusIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatMetricValue = (metric: string, value: number): string => {
    switch (metric) {
      case 'distance':
        return `${(value / 1000).toFixed(1)} km`;
      case 'pace':
        const minutes = Math.floor(value);
        const seconds = Math.round((value - minutes) * 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
      case 'duration':
        return `${Math.round(value)} min`;
      default:
        return value.toString();
    }
  };

  const MetricSelector = () => (
    <div className="flex space-x-2 mb-4">
      {['distance', 'pace', 'duration'].map((metric) => (
        <button
          key={metric}
          onClick={() => setSelectedMetric(metric as any)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            selectedMetric === metric
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {metric.charAt(0).toUpperCase() + metric.slice(1)}
        </button>
      ))}
    </div>
  );

  const OverviewCharts = () => (
    <div className="space-y-6">
      {/* Progress Trend Chart */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2 text-blue-500" />
            Progress Trend
          </h3>
          <MetricSelector />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatMetricValue(selectedMetric, value)}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
              formatter={(value: any) => [formatMetricValue(selectedMetric, value), selectedMetric]}
            />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Multi-Metric Area Chart */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-green-500" />
          Multi-Metric Overview
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
            />
            <Area
              type="monotone"
              dataKey="distance"
              stackId="1"
              stroke="#3B82F6"
              fill="#3B82F680"
              name="Distance (m)"
            />
            <Area
              type="monotone"
              dataKey="duration"
              stackId="2"
              stroke="#10B981"
              fill="#10B98180"
              name="Duration (min)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const GoalProgressCharts = () => (
    <div className="space-y-4">
      {goalProgress.map((goal) => (
        <div key={goal.id} className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-white">{goal.title}</h4>
            {getTrendIcon(goal.trend)}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, goal.progress)}%`,
                backgroundColor: goal.color
              }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-400">
            <span>{goal.current} / {goal.target}</span>
            <span>{Math.round(goal.progress)}%</span>
          </div>
        </div>
      ))}
    </div>
  );

  const RadialProgressChart = () => (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Goal Completion</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={goalProgress}>
          <RadialBar
            dataKey="progress"
            cornerRadius={10}
            fill="#8884d8"
          />
          <Legend
            iconSize={10}
            wrapperStyle={{
              color: '#F3F4F6',
              fontSize: '12px'
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F3F4F6'
            }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
        {showGoals && (
          <div className="bg-gray-800 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex space-x-2">
        {(['overview', 'detailed', 'comparison'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            disabled={view === 'comparison' && !showComparison}
            className={`px-4 py-2 rounded font-medium text-sm transition-colors ${
              activeView === view
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      {/* Chart Content */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <OverviewCharts />
          </div>
          {showGoals && goalProgress.length > 0 && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Active Goals</h3>
                <GoalProgressCharts />
              </div>
              <RadialProgressChart />
            </div>
          )}
        </div>
      )}

      {activeView === 'detailed' && (
        <div className="space-y-6">
          <OverviewCharts />
          {showTrends && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <ClockIcon className="w-5 h-5 mr-2 text-purple-500" />
                Performance Trends
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['distance', 'pace', 'duration'].map((metric) => {
                  const trend = 'improving'; // This would come from API data
                  const change = '+12%'; // This would come from API data
                  
                  return (
                    <div key={metric} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300 capitalize">
                          {metric}
                        </span>
                        {getTrendIcon(trend)}
                      </div>
                      <div className="text-lg font-semibold text-white">{change}</div>
                      <div className="text-xs text-gray-400">vs. previous period</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'comparison' && showComparison && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Period Comparison</h3>
          <div className="text-gray-400 text-center py-8">
            Comparison view - Coming soon
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressVisualization;