// Goal Tracking and Progress Visualization Component
// Shows user goals, progress bars, and milestone tracking

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { analytics } from '../../utils/analytics';
import AddGoalModal from './AddGoalModal';
import { logger } from '../../lib/productionLogger'
import {
  TrophyIcon,
  ClockIcon,
  MapPinIcon,
  FireIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import {
  TrophyIcon as TrophySolidIcon,
  FireIcon as FireSolidIcon
} from '@heroicons/react/24/solid';

interface Goal {
  id: string;
  title: string;
  type: 'distance' | 'workouts' | 'pace' | 'streak';
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
}

interface WeeklyProgress {
  weekStart: string;
  weekEnd: string;
  targetKm: number;
  currentKm: number;
  workoutCount: number;
  targetWorkouts: number;
}

interface GoalTrackingProps {
  className?: string;
}

const GoalTracking: React.FC<GoalTrackingProps> = ({ className = '' }) => {
  const { user } = useAuth();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddGoal, setShowAddGoal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchWeeklyProgress();
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/user/goals`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      } else {
        setGoals([]);
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching goals:', { error: error });
      setGoals([]);
    }
  };

  const fetchWeeklyProgress = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/user/progress/weekly`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWeeklyProgress(data.progress || null);
      } else {
        setWeeklyProgress(null);
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching weekly progress:', { error: error });
      setWeeklyProgress(null);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress percentage
  const calculateProgress = (current: number, target: number): number => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  // Get progress color
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get goal type icon
  const getGoalTypeIcon = (type: string, isCompleted: boolean = false) => {
    const iconClass = `w-6 h-6 ${isCompleted ? 'text-green-500' : 'text-coral-500'}`;
    
    switch (type) {
      case 'distance':
        return <MapPinIcon className={iconClass} />;
      case 'workouts':
        return <CalendarDaysIcon className={iconClass} />;
      case 'pace':
        return <ClockIcon className={iconClass} />;
      case 'streak':
        return isCompleted ? <FireSolidIcon className={iconClass} /> : <FireIcon className={iconClass} />;
      default:
        return <TrophyIcon className={iconClass} />;
    }
  };

  // Format deadline
  const formatDeadline = (deadline: string): string => {
    const date = new Date(deadline);
    const now = new Date();
    const diffInMs = date.getTime() - now.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) return 'Beigusies';
    if (diffInDays === 0) return 'Šodien';
    if (diffInDays === 1) return 'Rīt';
    if (diffInDays < 7) return `${diffInDays} dienas`;
    if (diffInDays < 30) return `${Math.ceil(diffInDays / 7)} nedēļas`;
    return date.toLocaleDateString('en-US');
  };

  // Handle add goal
  const handleAddGoal = () => {
    setShowAddGoal(true);
    analytics.trackEvent('add_goal_click', 'dashboard', 'goal_tracking');
  };

  // Handle goal success
  const handleGoalSuccess = () => {
    fetchGoals(); // Refresh goals list
    setShowAddGoal(false);
  };

  // Handle goal click
  const handleGoalClick = (goalId: string) => {
    analytics.trackEvent('goal_view_click', 'dashboard', goalId);
    // Navigate to goal details or edit
  };

  return (
    <div className={`bg-slate-800 rounded-lg border border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <TrophySolidIcon className="w-6 h-6 text-coral-500" />
          <h2 className="text-xl font-bold text-white">Mērķi un progress</h2>
        </div>
        
        <button
          onClick={handleAddGoal}
          className="flex items-center space-x-2 px-3 py-2 bg-coral-500 text-white text-sm rounded-lg hover:bg-coral-600 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Jauns mērķis</span>
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Weekly Progress Overview */}
            {weeklyProgress && (
              <div className="bg-gradient-to-r from-coral-500/10 to-orange-500/10 border border-coral-500/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Šīs nedēļas progress</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Distance Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Distance</span>
                      <span className="text-white font-medium">
                        {weeklyProgress.currentKm}/{weeklyProgress.targetKm} km
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(
                          calculateProgress(weeklyProgress.currentKm, weeklyProgress.targetKm)
                        )}`}
                        style={{
                          width: `${calculateProgress(weeklyProgress.currentKm, weeklyProgress.targetKm)}%`
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {calculateProgress(weeklyProgress.currentKm, weeklyProgress.targetKm)}% pabeigts
                    </div>
                  </div>

                  {/* Workouts Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">Treniņi</span>
                      <span className="text-white font-medium">
                        {weeklyProgress.workoutCount}/{weeklyProgress.targetWorkouts}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(
                          calculateProgress(weeklyProgress.workoutCount, weeklyProgress.targetWorkouts)
                        )}`}
                        style={{
                          width: `${calculateProgress(weeklyProgress.workoutCount, weeklyProgress.targetWorkouts)}%`
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {calculateProgress(weeklyProgress.workoutCount, weeklyProgress.targetWorkouts)}% pabeigts
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Goals List */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Aktīvie mērķi</h3>
              
              {goals.length === 0 ? (
                <div className="text-center py-8">
                  <TrophyIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400 mb-2">Nav izveidotu mērķu</p>
                  <p className="text-gray-500 text-sm">Izveidojiet savu pirmo mērķi, lai sāktu izsekošanu!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {goals.map((goal) => {
                    const progress = calculateProgress(goal.currentValue, goal.targetValue);
                    const isCompleted = progress >= 100;
                    const isExpired = new Date(goal.deadline) < new Date() && !isCompleted;
                    
                    return (
                      <div
                        key={goal.id}
                        onClick={() => handleGoalClick(goal.id)}
                        className={`bg-slate-700/50 rounded-lg p-4 border cursor-pointer transition-all duration-200 hover:bg-slate-700 ${
                          isCompleted 
                            ? 'border-green-500/50 bg-green-500/10' 
                            : isExpired 
                            ? 'border-red-500/50 bg-red-500/10' 
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              {getGoalTypeIcon(goal.type, isCompleted)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="text-lg font-semibold text-white truncate">
                                  {goal.title}
                                </h4>
                                
                                {isCompleted && (
                                  <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                )}
                                
                                {isExpired && (
                                  <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                                )}
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-300">Progress</span>
                                  <span className="text-sm font-medium text-white">
                                    {goal.currentValue}/{goal.targetValue} {goal.unit}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-600 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      isCompleted ? 'bg-green-500' : getProgressColor(progress)
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <div className="flex items-center justify-between mt-1 text-xs">
                                  <span className="text-gray-400">{progress}% pabeigts</span>
                                  <span className={`${
                                    isExpired ? 'text-red-400' : isCompleted ? 'text-green-400' : 'text-gray-400'
                                  }`}>
                                    {isCompleted ? 'Pabeigts!' : isExpired ? 'Beigusies' : formatDeadline(goal.deadline)}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Additional Info */}
                              <div className="text-xs text-gray-500">
                                Created {new Date(goal.createdAt).toLocaleDateString('en-US')}
                              </div>
                            </div>
                          </div>
                          
                          <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="border-t border-slate-700 pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-coral-500">
                    {goals.filter(g => g.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-400">Aktīvi mērķi</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {goals.filter(g => g.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-400">Pabeigti</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">
                    {Math.round(goals.reduce((sum, goal) => sum + calculateProgress(goal.currentValue, goal.targetValue), 0) / (goals.length || 1))}%
                  </div>
                  <div className="text-sm text-gray-400">Vidējais progress</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {weeklyProgress?.currentKm.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-sm text-gray-400">Km šonedēļ</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      <AddGoalModal
        isOpen={showAddGoal}
        onClose={() => setShowAddGoal(false)}
        onSuccess={handleGoalSuccess}
      />
    </div>
  );
};

export default GoalTracking;