// Activity Feed Component for Dashboard
// Shows recent workouts, achievements, and training history

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { analytics } from '../../utils/analytics';
import { getAuthToken } from '../../utils/auth';
import { logger } from '../../lib/productionLogger'
import {
  ClockIcon,
  MapPinIcon,
  FireIcon,
  BoltIcon,
  TrophyIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  HeartIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import {
  TrophyIcon as TrophySolidIcon,
  StarIcon as StarSolidIcon
} from '@heroicons/react/24/solid';

interface Workout {
  id: string;
  date: string;
  distance: number;
  duration: number;
  type: string;
  pace: number | string;
  calories: number;
  route?: string;
  startTime?: string;
  endTime?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt: string;
  type: 'distance' | 'speed' | 'streak' | 'milestone';
  icon: 'trophy' | 'star' | 'fire' | 'bolt';
}

interface ActivityFeedProps {
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ className = '' }) => {
  const { user } = useAuth();
  
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workouts' | 'achievements'>('workouts');

  // Fetch recent activity data
  useEffect(() => {
    if (user) {
      fetchRecentWorkouts();
      fetchRecentAchievements();
    }
  }, [user]);

  const fetchRecentWorkouts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/workouts/recent?limit=8`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentWorkouts(data.workouts || []);
      } else {
        setRecentWorkouts([]);
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching recent workouts:', { error: error });
      setRecentWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAchievements = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/user/achievements/recent?limit=5`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentAchievements(data.achievements || []);
      } else {
        setRecentAchievements([]);
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching achievements:', { error: error });
      setRecentAchievements([]);
    }
  };


  // Format pace - handle both string and number formats
  const formatPace = (pace: number | string): string => {
    if (typeof pace === 'string') {
      // If it's already formatted (e.g., "5:30"), return as is
      return pace.includes(':') ? pace : `${pace}:00`;
    }
    if (typeof pace === 'number' && !isNaN(pace) && pace > 0) {
      const minutes = Math.floor(pace);
      const seconds = Math.floor((pace - minutes) * 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return '--:--';
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Šodien';
    if (diffInDays === 1) return 'Vakar';
    if (diffInDays < 7) return `${diffInDays} dienas atpakaļ`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get workout type color
  const getWorkoutTypeColor = (type: string): string => {
    const colors = {
      'Viegls skrējiens': 'text-green-400 bg-green-500/20',
      'Ilgais skrējiens': 'text-blue-400 bg-blue-500/20',
      'Intervālu treniņš': 'text-red-400 bg-red-500/20',
      'Tempo skrējiens': 'text-yellow-400 bg-yellow-500/20',
      'Atjaunojošais skrējiens': 'text-purple-400 bg-purple-500/20'
    };
    return colors[type as keyof typeof colors] || 'text-gray-400 bg-gray-500/20';
  };

  // Get achievement icon
  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case 'trophy':
        return <TrophySolidIcon className="w-6 h-6 text-yellow-500" />;
      case 'star':
        return <StarSolidIcon className="w-6 h-6 text-yellow-500" />;
      case 'fire':
        return <FireIcon className="w-6 h-6 text-orange-500" />;
      case 'bolt':
        return <BoltIcon className="w-6 h-6 text-blue-500" />;
      default:
        return <TrophyIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  // Handle workout click
  const handleWorkoutClick = (workoutId: string) => {
    analytics.trackEvent('workout_view_click', 'dashboard', workoutId);
    // Navigate to workout details
    window.location.href = `/workouts/${workoutId}`;
  };

  // Handle view all click
  const handleViewAll = (type: 'workouts' | 'achievements') => {
    analytics.trackEvent(`view_all_${type}_click`, 'dashboard', 'activity_feed');
    
    if (type === 'workouts') {
      window.location.href = '/workouts';
    } else {
      window.location.href = '/profile#achievements';
    }
  };

  return (
    <div className={`bg-slate-800 rounded-lg border border-slate-700 ${className}`}>
      {/* Header with Tabs */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarDaysIcon className="w-6 h-6 text-coral-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Aktivitāšu plūsma</h2>
          </div>
          
          {/* Tab Switch */}
          <div className="flex bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('workouts')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeTab === 'workouts'
                  ? 'bg-coral-500 text-gray-900 dark:text-white'
                  : 'text-gray-400 hover:text-gray-900 dark:text-white'
              }`}
            >
              Treniņi
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeTab === 'achievements'
                  ? 'bg-coral-500 text-gray-900 dark:text-white'
                  : 'text-gray-400 hover:text-gray-900 dark:text-white'
              }`}
            >
              Sasniegumi
            </button>
          </div>
        </div>
        
        <button
          onClick={() => handleViewAll(activeTab)}
          className="flex items-center space-x-1 text-coral-400 hover:text-coral-300 text-sm transition-colors"
        >
          <span>Skatīt visu</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
          </div>
        ) : activeTab === 'workouts' ? (
          /* Recent Workouts */
          <div className="space-y-4">
            {recentWorkouts.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Nav veiktu treniņu</p>
                <p className="text-gray-500 text-sm">Sāciet savu pirmo treniņu jau šodien!</p>
              </div>
            ) : (
              recentWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  onClick={() => handleWorkoutClick(workout.id)}
                  className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-colors cursor-pointer border border-transparent hover:border-slate-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getWorkoutTypeColor(workout.type)}`}>
                          {workout.type}
                        </span>
                        <span className="text-sm text-gray-400">
                          {formatDate(workout.date)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <MapPinIcon className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-gray-900 dark:text-white font-medium">{workout.distance} km</div>
                            <div className="text-gray-400 text-xs">Distance</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-gray-900 dark:text-white font-medium">{formatDuration(workout.duration)}</div>
                            <div className="text-gray-400 text-xs">Laiks</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <BoltIcon className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-gray-900 dark:text-white font-medium">{formatPace(workout.pace)}</div>
                            <div className="text-gray-400 text-xs">Temps</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <FireIcon className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-gray-900 dark:text-white font-medium">{workout.calories}</div>
                            <div className="text-gray-400 text-xs">Kalorijas</div>
                          </div>
                        </div>
                      </div>
                      
                      {workout.route && (
                        <div className="mt-2 text-sm text-gray-300">
                          📍 {workout.route}
                        </div>
                      )}
                    </div>
                    
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 mt-2" />
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Recent Achievements */
          <div className="space-y-4">
            {recentAchievements.length === 0 ? (
              <div className="text-center py-8">
                <TrophyIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Nav sasniegumu</p>
                <p className="text-gray-500 text-sm">Turpiniet trenēties, lai iegūtu pirmo sasniegumu!</p>
              </div>
            ) : (
              recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getAchievementIcon(achievement.icon)}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {achievement.title}
                      </h4>
                      <p className="text-gray-300 text-sm mb-2">
                        {achievement.description}
                      </p>
                      <div className="text-xs text-gray-400">
                        {formatDate(achievement.earnedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;