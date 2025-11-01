import React from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { lv } from 'date-fns/locale';
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface CalendarControlsProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: 'month' | 'week';
  onViewModeChange: (mode: 'month' | 'week') => void;
  showCompleted: boolean;
  onShowCompletedChange: (show: boolean) => void;
  filterType: string;
  onFilterTypeChange: (type: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

const CalendarControls: React.FC<CalendarControlsProps> = ({
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  showCompleted,
  onShowCompletedChange,
  filterType,
  onFilterTypeChange,
  onRefresh,
  loading
}) => {
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { t } = useLanguage();
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subMonths(currentDate, 1)
      : addMonths(currentDate, 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const activityTypes = [
    { value: 'all', label: t('all_activities') },
    { value: 'workout', label: t('workouts_filter') },
    { value: 'training', label: t('cardio') },
    { value: 'rest', label: t('rest') },
    { value: 'competition', label: t('competitions') }
  ];

  return (
    <div className="mb-6">
      {/* Main Controls */}
      <div className={`${themeClasses.card} rounded-lg p-4 shadow-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                disabled={loading}
                className={`p-2 ${themeClasses.textSecondary} ${themeClasses.bgHover} rounded-md transition-colors disabled:opacity-50`}
                title={t('previous_month')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h2 className={`text-xl font-semibold ${themeClasses.textPrimary} min-w-[180px] text-center`}>
                {format(currentDate, 'MMMM yyyy', { locale: lv })}
              </h2>
              
              <button
                onClick={() => navigateMonth('next')}
                disabled={loading}
                className={`p-2 ${themeClasses.textSecondary} ${themeClasses.bgHover} rounded-md transition-colors disabled:opacity-50`}
                title={t('next_month')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <button
              onClick={goToToday}
              disabled={loading}
              className={`px-3 py-1 text-sm text-coral hover:text-orange-600 ${theme === 'dark' ? 'hover:bg-coral/10' : 'hover:bg-coral/5'} rounded-md transition-colors disabled:opacity-50`}
            >
              {t('today')}
            </button>
          </div>

          {/* View Mode and Refresh */}
          <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className={`flex ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-1`}>
            <button
              onClick={() => onViewModeChange('month')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'month'
                  ? theme === 'dark' 
                    ? 'bg-gray-600 text-gray-100 shadow-sm'
                    : 'bg-white text-gray-900 shadow-sm'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-gray-100'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('month')}
            </button>
            <button
              onClick={() => onViewModeChange('week')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                viewMode === 'week'
                  ? theme === 'dark'
                    ? 'bg-gray-600 text-gray-100 shadow-sm'
                    : 'bg-white text-gray-900 shadow-sm'
                  : theme === 'dark'
                    ? 'text-gray-300 hover:text-gray-100'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled // Week view not implemented yet
            >
              {t('week')}
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`p-2 ${themeClasses.textSecondary} ${themeClasses.bgHover} rounded-md transition-colors disabled:opacity-50`}
            title={t('refresh_data')}
          >
            <svg 
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Activity Type Filter */}
        <div className="flex items-center gap-2">
          <label className={`text-sm font-medium ${themeClasses.textSecondary}`}>
            {t('filter')}:
          </label>
          <select
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value)}
            className={`text-sm ${themeClasses.input} rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-coral`}
          >
            {activityTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Show Completed Toggle */}
        <div className="flex items-center gap-2">
          <label className={`flex items-center gap-2 text-sm ${themeClasses.textSecondary} cursor-pointer`}>
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => onShowCompletedChange(e.target.checked)}
              className={`w-4 h-4 text-coral ${themeClasses.borderPrimary} rounded focus:ring-coral`}
            />
            {t('show_completed')}
          </label>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => {
              onFilterTypeChange('all');
              onShowCompletedChange(true);
            }}
            className={`text-sm ${themeClasses.textSecondary} ${themeClasses.bgHover} px-2 py-1 rounded-md transition-colors`}
          >
            {t('clear_filters')}
          </button>
        </div>
      </div>

      {/* Active Filters Indicator */}
      {(filterType !== 'all' || !showCompleted) && (
        <div className={`mt-3 flex items-center gap-2 text-sm ${themeClasses.textSecondary}`}>
          <span>{t('active_filters')}:</span>
          {filterType !== 'all' && (
            <span className={`px-2 py-1 rounded-md ${
              theme === 'dark' 
                ? 'bg-blue-900/30 text-blue-300 border border-blue-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {activityTypes.find(t => t.value === filterType)?.label}
            </span>
          )}
          {!showCompleted && (
            <span className={`px-2 py-1 rounded-md ${
              theme === 'dark' 
                ? 'bg-gray-700 text-gray-300 border border-gray-600' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {t('hide_completed')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarControls;