import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from 'date-fns';
import { lv } from 'date-fns/locale';
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext';

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
}

interface TrainingPlan {
  _id: string;
  name: string;
  weeklySchedule: {
    [key: string]: {
      type: string;
      duration: number;
      intensity: string;
      description: string;
    };
  };
}

interface CalendarViewProps {
  currentDate: Date;
  viewMode: 'month' | 'week';
  activities: CalendarActivity[];
  trainingPlan: TrainingPlan | null;
  onDateSelect: (date: Date) => void;
  onActivityClick: (activity: CalendarActivity) => void;
  onCreateActivity: (date: Date) => void;
  getActivitiesForDate: (date: Date) => CalendarActivity[];
  getTrainingPlanForDate: (date: Date) => any;
  showCompleted: boolean;
  filterType: string;
  loading: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  viewMode,
  activities,
  trainingPlan,
  onDateSelect,
  onActivityClick,
  onCreateActivity,
  getActivitiesForDate,
  getTrainingPlanForDate,
  showCompleted,
  filterType,
  loading
}) => {
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  // Get calendar days (Monday first - Latvia standard)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = new Date(monthStart);
  // Adjust for Monday as first day of week (getDay() returns 0=Sunday, 1=Monday, etc.)
  const startDayAdjustment = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  calendarStart.setDate(calendarStart.getDate() - startDayAdjustment);
  const calendarEnd = new Date(monthEnd);
  const endDayAdjustment = monthEnd.getDay() === 0 ? 0 : 7 - monthEnd.getDay();
  calendarEnd.setDate(calendarEnd.getDate() + endDayAdjustment);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getActivityTypeColor = (type: string): string => {
    const colors = {
      workout: 'bg-red-500',
      training: 'bg-blue-500',
      rest: 'bg-green-500',
      competition: 'bg-purple-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const getActivityStatusStyle = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'opacity-100 border-green-400';
      case 'skipped':
        return 'opacity-50 border-red-400 line-through';
      case 'planned':
      default:
        return 'opacity-80 border-gray-300';
    }
  };

  const getIntensityColor = (intensity?: string): string => {
    switch (intensity) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-orange-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-400';
    }
  };

  const filterActivities = (dayActivities: CalendarActivity[]): CalendarActivity[] => {
    let filtered = dayActivities;

    if (!showCompleted) {
      filtered = filtered.filter(activity => activity.status !== 'completed');
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(activity => activity.type === filterType);
    }

    return filtered;
  };

  const renderCalendarDay = (day: Date) => {
    const dayActivities = getActivitiesForDate(day);
    const filteredActivities = filterActivities(dayActivities);
    const plannedActivity = getTrainingPlanForDate(day);
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isTodayDate = isToday(day);

    return (
      <div
        key={day.toISOString()}
        className={`
          min-h-[120px] ${themeClasses.borderPrimary} border p-2 cursor-pointer transition-colors
          ${!isCurrentMonth 
            ? theme === 'dark' 
              ? 'bg-gray-800 text-gray-500' 
              : 'bg-gray-50 text-gray-400'
            : theme === 'dark' 
              ? 'bg-gray-900 hover:bg-gray-800' 
              : 'bg-white hover:bg-gray-50'
          }
          ${isTodayDate ? 'ring-2 ring-coral ring-inset' : ''}
        `}
        onClick={() => onDateSelect(day)}
      >
        {/* Date number */}
        <div className="flex items-center justify-between mb-2">
          <span className={`
            text-sm font-medium
            ${isTodayDate 
              ? 'text-coral font-bold' 
              : isCurrentMonth 
                ? themeClasses.textPrimary 
                : themeClasses.textMuted
            }
          `}>
            {format(day, 'd')}
          </span>
          
          {/* Add activity button */}
          {isCurrentMonth && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateActivity(day);
              }}
              className={`${themeClasses.textMuted} hover:${themeClasses.textSecondary} text-xs opacity-0 group-hover:opacity-100 transition-opacity`}
              title="Pievienot aktivitāti"
            >
              +
            </button>
          )}
        </div>

        {/* Training plan activity */}
        {isCurrentMonth && plannedActivity && (
          <div className={`
            text-xs p-1 mb-1 rounded border-l-4 
            ${theme === 'dark' 
              ? 'bg-blue-900/20 border-l-blue-400' 
              : 'bg-blue-50 border-l-blue-400'
            }
            ${!trainingPlan ? 'opacity-50' : ''}
          `}>
            <div className={`font-medium truncate ${
              theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
            }`}>
              Plāns: {plannedActivity.type}
            </div>
            <div className={`text-[10px] ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {plannedActivity.duration}min • {plannedActivity.intensity}
            </div>
          </div>
        )}

        {/* Activities */}
        <div className="space-y-1">
          {filteredActivities.slice(0, 3).map((activity) => (
            <div
              key={activity._id}
              onClick={(e) => {
                e.stopPropagation();
                onActivityClick(activity);
              }}
              className={`
                text-xs p-1 rounded border-l-4 cursor-pointer hover:shadow-sm transition-shadow
                ${getActivityStatusStyle(activity.status)}
                ${getIntensityColor(activity.intensity)}
                ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
              `}
            >
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getActivityTypeColor(activity.type)}`} />
                <span className={`font-medium truncate flex-1 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {activity.name}
                </span>
                {activity.status === 'completed' && (
                  <span className="text-green-600">✓</span>
                )}
                {activity.status === 'skipped' && (
                  <span className="text-red-600">✗</span>
                )}
              </div>
              
              {activity.duration && (
                <div className={`text-[10px] mt-0.5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {activity.duration}min
                  {activity.distance && ` • ${activity.distance}km`}
                </div>
              )}
            </div>
          ))}
          
          {filteredActivities.length > 3 && (
            <div className={`text-[10px] text-center py-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              +{filteredActivities.length - 3} vairāk
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
          <span className={`ml-3 ${themeClasses.textSecondary}`}>Ielādē kalendāru...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Calendar Header */}
      <div className="grid grid-cols-7 gap-0 mb-2">
        {['Pr', 'Ot', 'Tr', 'Ce', 'Pk', 'Se', 'Sv'].map((day) => (
          <div
            key={day}
            className={`p-2 text-sm font-medium text-center border ${
              theme === 'dark' 
                ? 'text-gray-300 bg-gray-800 border-gray-700' 
                : 'text-gray-700 bg-gray-50 border-gray-200'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className={`grid grid-cols-7 gap-0 border-t border-l ${themeClasses.borderPrimary}`}>
        {calendarDays.map((day) => renderCalendarDay(day))}
      </div>

      {/* Legend */}
      <div className={`mt-4 flex flex-wrap gap-4 text-xs ${themeClasses.textSecondary}`}>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Treniņš</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Kardio</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Atpūta</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span>Sacensības</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 bg-blue-400"></div>
          <span>Treniņu plāns</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-green-600">✓</span>
          <span>Pabeigts</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-600">✗</span>
          <span>Izlaists</span>
        </div>
      </div>

      {/* Summary */}
      <div className={`mt-4 p-3 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className={themeClasses.textSecondary}>Kopā aktivitātes:</span>
            <span className={`ml-2 font-medium ${themeClasses.textPrimary}`}>{activities.length}</span>
          </div>
          <div>
            <span className={themeClasses.textSecondary}>Pabeigtas:</span>
            <span className="ml-2 font-medium text-green-600">
              {activities.filter(a => a.status === 'completed').length}
            </span>
          </div>
          <div>
            <span className={themeClasses.textSecondary}>Plānotas:</span>
            <span className="ml-2 font-medium text-blue-600">
              {activities.filter(a => a.status === 'planned').length}
            </span>
          </div>
          <div>
            <span className={themeClasses.textSecondary}>Izlaistas:</span>
            <span className="ml-2 font-medium text-red-600">
              {activities.filter(a => a.status === 'skipped').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;