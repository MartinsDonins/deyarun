import React from 'react';
import { format, differenceInWeeks, parseISO } from 'date-fns';
import { lv } from 'date-fns/locale';

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

interface TrainingPlanModalProps {
  trainingPlan: TrainingPlan;
  onClose: () => void;
}

const TrainingPlanModal: React.FC<TrainingPlanModalProps> = ({
  trainingPlan,
  onClose
}) => {
  const getDifficultyLabel = (difficulty: string): string => {
    const labels = {
      beginner: 'Iesācējs',
      intermediate: 'Vidējs',
      advanced: 'Progresīvs'
    };
    return labels[difficulty as keyof typeof labels] || difficulty;
  };

  const getDifficultyBadgeColor = (difficulty: string): string => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string): string => {
    const labels = {
      active: 'Aktīvs',
      completed: 'Pabeigts',
      paused: 'Pārtraukts'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusBadgeColor = (status: string): string => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      paused: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getIntensityColor = (intensity: string): string => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-orange-600',
      high: 'text-red-600',
      zema: 'text-green-600',
      vidēja: 'text-orange-600',
      augsta: 'text-red-600'
    };
    return colors[intensity.toLowerCase() as keyof typeof colors] || 'text-gray-600';
  };

  const dayNames = {
    monday: 'Pirmdiena',
    tuesday: 'Otrdiena', 
    wednesday: 'Trešdiena',
    thursday: 'Ceturtdiena',
    friday: 'Piektdiena',
    saturday: 'Sestdiena',
    sunday: 'Svētdiena'
  };

  const startDate = parseISO(trainingPlan.startDate);
  const endDate = parseISO(trainingPlan.endDate);
  const weeksCount = differenceInWeeks(endDate, startDate);
  const currentWeek = Math.min(differenceInWeeks(new Date(), startDate) + 1, weeksCount);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {trainingPlan.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Treniņu plāna detaļas
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Plan Overview */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Statuss</div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(trainingPlan.status)}`}>
                  {getStatusLabel(trainingPlan.status)}
                </span>
              </div>

              {/* Difficulty */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Grūtības līmenis</div>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getDifficultyBadgeColor(trainingPlan.difficulty)}`}>
                  {getDifficultyLabel(trainingPlan.difficulty)}
                </span>
              </div>

              {/* Duration */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Ilgums</div>
                <div className="text-lg font-semibold text-gray-900">
                  {weeksCount} nedēļas
                </div>
                <div className="text-xs text-gray-500">
                  {currentWeek}. nedēļa
                </div>
              </div>

              {/* Period */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Periods</div>
                <div className="text-sm font-medium text-gray-900">
                  {format(startDate, 'dd.MM.yyyy', { locale: lv })}
                </div>
                <div className="text-xs text-gray-500">
                  līdz {format(endDate, 'dd.MM.yyyy', { locale: lv })}
                </div>
              </div>
            </div>

            {/* Description and Goal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Apraksts</h3>
                <p className="text-gray-700 leading-relaxed">
                  {trainingPlan.description}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Mērķis</h3>
                <p className="text-gray-700 leading-relaxed">
                  {trainingPlan.goal}
                </p>
              </div>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Nedēļas grafiks</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(trainingPlan.weeklySchedule).map(([day, schedule]) => (
                <div key={day} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      {dayNames[day as keyof typeof dayNames] || day}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {schedule.duration} min
                      </span>
                      <span className={`text-sm font-medium ${getIntensityColor(schedule.intensity)}`}>
                        {schedule.intensity}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {schedule.type}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {schedule.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="mt-8 bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Nedēļas kopsavilkums</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Kopējais laiks:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {Object.values(trainingPlan.weeklySchedule).reduce((total, schedule) => total + schedule.duration, 0)} min
                </span>
              </div>
              <div>
                <span className="text-blue-700">Treniņu dienas:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {Object.keys(trainingPlan.weeklySchedule).length}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Vidējais ilgums:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {Math.round(Object.values(trainingPlan.weeklySchedule).reduce((total, schedule) => total + schedule.duration, 0) / Object.keys(trainingPlan.weeklySchedule).length)} min
                </span>
              </div>
              <div>
                <span className="text-blue-700">Created:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {format(parseISO(trainingPlan.createdAt), 'dd.MM.yyyy', { locale: lv })}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progresa rādītājs</span>
              <span className="text-sm text-gray-600">
                {currentWeek} no {weeksCount} nedēļām
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((currentWeek / weeksCount) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round((currentWeek / weeksCount) * 100)}% pabeigts
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Aizvērt
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingPlanModal;