import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProtectedLayout from './layout/ProtectedLayout';
import { useAuth } from '../contexts/AuthContext';
import { useTheme, useThemeClasses } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useApiOperations } from '../hooks/useAuthenticatedFetch';
import CalendarView from './calendar/CalendarView';
import CalendarControls from './calendar/CalendarControls';
import ActivityModal from './calendar/ActivityModal';
import Footer from './Footer';
import TrainingPlanModal from './calendar/TrainingPlanModal';

// Import new modern Calendar components
import CalendarMain from './calendar/CalendarMain';
import { logger } from '../lib/productionLogger';

// Types
interface CalendarActivity {
  _id: string;
  name: string;
  type: 'workout' | 'rest' | 'training' | 'competition';
  date: string;
  duration?: number;
  distance?: number;
  intensity?: 'low' | 'medium' | 'high';
  status: 'planned' | 'completed' | 'skipped';
  description?: string;
  exercises?: any[];
  metrics?: {
    averageHeartRate?: number;
    maxHeartRate?: number;
    calories?: number;
    pace?: string;
  };
  actualDuration?: number;
  actualDistance?: number;
  actualPace?: string;
  completedTime?: string;
  completionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface TrainingPlan {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  goal: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  weeklySchedule: {
    [key: string]: {
      type: string;
      duration: number;
      intensity: string;
      description: string;
    };
  };
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
}

export default function CalendarPageComponent() {
  const { user, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { t } = useLanguage();
  const { get, post, put, delete: deleteRequest } = useApiOperations();
  const router = useRouter();

  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedActivity, setSelectedActivity] = useState<CalendarActivity | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showTrainingPlanModal, setShowTrainingPlanModal] = useState(false);
  const [showNewActivityModal, setShowNewActivityModal] = useState(false);

  // View states
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showCompleted, setShowCompleted] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  // Load calendar data
  useEffect(() => {
    if (user && !authLoading) {
      loadCalendarData();
    }
  }, [user, authLoading, currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get month range for API call
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const queryParams = new URLSearchParams({
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
        includeTrainingPlan: 'true'
      });

      // Load activities and training plan
      const [activitiesResult, trainingPlanResult] = await Promise.all([
        get<{
          success: boolean;
          activities: CalendarActivity[];
          pagination?: any;
        }>(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/workouts/calendar?${queryParams}`),
        
        get<{
          success: boolean;
          trainingPlan: TrainingPlan;
        }>(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/training-plans/active`)
      ]);

      if (activitiesResult.success && activitiesResult.data) {
        setActivities(activitiesResult.data.activities || []);
      } else {
        logger.warn('WARNING', 'Failed to load activities:', activitiesResult.error);
      }

      if (trainingPlanResult.success && trainingPlanResult.data) {
        setTrainingPlan(trainingPlanResult.data.trainingPlan);
      } else {
        logger.info('COMPONENT', 'No active training plan found');
      }

    } catch (err) {
      logger.error('ERROR', 'Failed to load calendar data:', { error: err });
      setError(t('loading_calendar'));
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dayActivities = getActivitiesForDate(date);
    if (dayActivities.length === 1) {
      setSelectedActivity(dayActivities[0]);
      setShowActivityModal(true);
    } else if (dayActivities.length > 1) {
      // Show day view with multiple activities
      setShowNewActivityModal(true);
    } else {
      // No activities - option to create new
      setShowNewActivityModal(true);
    }
  };

  const handleActivityClick = (activity: CalendarActivity) => {
    setSelectedActivity(activity);
    setShowActivityModal(true);
  };

  const handleCreateActivity = (date: Date) => {
    setSelectedDate(date);
    setSelectedActivity(null);
    setShowNewActivityModal(true);
  };

  const handleUpdateActivity = async (activityId: string, updates: Partial<CalendarActivity>) => {
    try {
      const result = await put<{ success: boolean; activity: CalendarActivity }>(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/workouts/${activityId}`,
        updates
      );

      if (result.success && result.data) {
        setActivities(prev => 
          prev.map(activity => 
            activity._id === activityId 
              ? { ...activity, ...result.data.activity }
              : activity
          )
        );
        setShowActivityModal(false);
      } else {
        throw new Error(result.error || 'Failed to update activity');
      }
    } catch (err) {
      logger.error('ERROR', 'Failed to update activity:', { error: err });
      setError(t('error_updating_activity'));
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      const result = await deleteRequest<{ success: boolean }>(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/workouts/${activityId}`
      );

      if (result.success) {
        setActivities(prev => prev.filter(activity => activity._id !== activityId));
        setShowActivityModal(false);
      } else {
        throw new Error(result.error || 'Failed to delete activity');
      }
    } catch (err) {
      logger.error('ERROR', 'Failed to delete activity:', { error: err });
      setError(t('error_deleting_activity'));
    }
  };

  const getActivitiesForDate = (date: Date): CalendarActivity[] => {
    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    
    return activities.filter(activity => {
      // Parse activity date and format as local date string
      const activityDate = new Date(activity.date);
      const activityYear = activityDate.getFullYear();
      const activityMonth = String(activityDate.getMonth() + 1).padStart(2, '0');
      const activityDay = String(activityDate.getDate()).padStart(2, '0');
      const activityDateString = `${activityYear}-${activityMonth}-${activityDay}`;
      
      return activityDateString === localDateString;
    });
  };

  const getTrainingPlanForDate = (date: Date) => {
    if (!trainingPlan) return null;
    
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return trainingPlan.weeklySchedule[dayOfWeek] || null;
  };

  // Redirect if not authenticated
  if (authLoading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral mx-auto mb-4"></div>
            <p className={themeClasses.textSecondary}>{t('loading')}</p>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <ProtectedLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${themeClasses.textPrimary} mb-2`}>
            {t('calendar_title')}
          </h1>
          <p className={themeClasses.textSecondary}>
            {t('calendar_subtitle')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mb-6 ${theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-lg`}>
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-400 hover:text-red-300 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Calendar Controls */}
        <CalendarControls
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showCompleted={showCompleted}
          onShowCompletedChange={setShowCompleted}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          onRefresh={loadCalendarData}
          loading={loading}
        />

        {/* Training Plan Summary */}
        {trainingPlan && (
          <div className={`mb-6 rounded-lg p-4 ${
            theme === 'dark' 
              ? 'bg-blue-900/20 border border-blue-700' 
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-semibold ${
                  theme === 'dark' ? 'text-blue-300' : 'text-blue-900'
                }`}>
                  {t('active_training_plan')}: {trainingPlan.name}
                </h3>
                <p className={`text-sm mt-1 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
                }`}>
                  {trainingPlan.description}
                </p>
                <p className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {t('period')}: {new Date(trainingPlan.startDate).toLocaleDateString('en-US')} - {new Date(trainingPlan.endDate).toLocaleDateString('en-US')}
                </p>
              </div>
              <button
                onClick={() => setShowTrainingPlanModal(true)}
                className={`text-sm font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'text-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-800'
                }`}
              >
                {t('view_details')} →
              </button>
            </div>
          </div>
        )}

        {/* Modern Calendar View */}
        <CalendarMain
          workouts={activities.map(activity => ({
            id: activity._id,
            title: activity.name,
            type: activity.type,
            date: activity.date,
            duration: activity.duration || 30,
            distance: activity.distance,
            intensity: activity.intensity === 'low' ? 'easy' : 
                      activity.intensity === 'medium' ? 'moderate' : 
                      activity.intensity === 'high' ? 'hard' : 'easy',
            completed: activity.status === 'completed',
            notes: activity.description,
            actualDuration: activity.actualDuration,
            actualDistance: activity.actualDistance,
            actualPace: activity.actualPace,
            completedTime: activity.completedTime,
            completionNotes: activity.completionNotes
          }))}
          onWorkoutUpdate={(workout) => {
            // Type mapping function to ensure compatibility
            const mapWorkoutType = (type: string): 'workout' | 'rest' | 'training' | 'competition' => {
              switch (type.toLowerCase()) {
                case 'rest':
                  return 'rest'
                case 'training':
                  return 'training'
                case 'competition':
                  return 'competition'
                case 'workout':
                default:
                  return 'workout'
              }
            }

            handleUpdateActivity(workout.id, {
              name: workout.title,
              type: mapWorkoutType(workout.type),
              date: workout.date,
              duration: workout.duration,
              distance: workout.distance,
              intensity: workout.intensity === 'easy' ? 'low' :
                        workout.intensity === 'moderate' ? 'medium' :
                        workout.intensity === 'hard' ? 'high' : 'low',
              status: workout.completed ? 'completed' : 'planned',
              description: workout.notes,
              actualDuration: workout.actualDuration,
              actualDistance: workout.actualDistance,
              actualPace: workout.actualPace,
              completedTime: workout.completedTime,
              completionNotes: workout.completionNotes
            })
          }}
          onWorkoutDelete={(workoutId) => {
            handleDeleteActivity(workoutId)
          }}
          onWorkoutCreate={(workout) => {
            // Create new workout via API
            const createWorkout = async () => {
              try {
                // Type mapping function to ensure compatibility
                const mapWorkoutType = (type: string): 'workout' | 'rest' | 'training' | 'competition' => {
                  switch (type.toLowerCase()) {
                    case 'rest':
                      return 'rest'
                    case 'training':
                      return 'training'
                    case 'competition':
                      return 'competition'
                    case 'workout':
                    default:
                      return 'workout'
                  }
                }

                const result = await post<{ success: boolean; workout: CalendarActivity }>(
                  `${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/workouts`,
                  {
                    name: workout.title,
                    type: mapWorkoutType(workout.type),
                    date: workout.date,
                    duration: workout.duration,
                    distance: workout.distance,
                    intensity: workout.intensity === 'easy' ? 'low' :
                              workout.intensity === 'moderate' ? 'medium' :
                              workout.intensity === 'hard' ? 'high' : 'low',
                    status: 'planned',
                    description: workout.notes
                  }
                )
                
                if (result.success && result.data) {
                  setActivities(prev => [...prev, result.data.workout])
                }
              } catch (err) {
                logger.error('ERROR', 'Failed to create workout:', { error: err })
                setError('Failed to create workout')
              }
            }
            createWorkout()
          }}
          className="w-full"
        />

        {/* Legacy Calendar View - conditionally show for fallback */}
        {false && (
          <div className={`${themeClasses.card} rounded-lg`}>
            <CalendarView
              currentDate={currentDate}
              viewMode={viewMode}
              activities={activities}
              trainingPlan={trainingPlan}
              onDateSelect={handleDateSelect}
              onActivityClick={handleActivityClick}
              onCreateActivity={handleCreateActivity}
              getActivitiesForDate={getActivitiesForDate}
              getTrainingPlanForDate={getTrainingPlanForDate}
              showCompleted={showCompleted}
              filterType={filterType}
              loading={loading}
            />
          </div>
        )}

        {/* Activity Details Modal */}
        {showActivityModal && selectedActivity && (
          <ActivityModal
            activity={selectedActivity}
            onClose={() => {
              setShowActivityModal(false);
              setSelectedActivity(null);
            }}
            onUpdate={handleUpdateActivity}
            onDelete={handleDeleteActivity}
          />
        )}

        {/* Training Plan Details Modal */}
        {showTrainingPlanModal && trainingPlan && (
          <TrainingPlanModal
            trainingPlan={trainingPlan}
            onClose={() => setShowTrainingPlanModal(false)}
          />
        )}

        {/* New Activity Modal */}
        {showNewActivityModal && (
          <ActivityModal
            activity={null}
            selectedDate={selectedDate}
            onClose={() => {
              setShowNewActivityModal(false);
              setSelectedDate(null);
            }}
            onUpdate={() => {
              loadCalendarData(); // Reload to show new activity
              setShowNewActivityModal(false);
            }}
            onDelete={() => {}}
          />
        )}
      </div>

      {/* Footer */}
      <Footer />
    </ProtectedLayout>
  );
}