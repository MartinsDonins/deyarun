import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { lv } from 'date-fns/locale';
import { logger } from '../../lib/productionLogger'

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
  createdAt: string;
  updatedAt: string;
}

interface ActivityModalProps {
  activity: CalendarActivity | null;
  selectedDate?: Date | null;
  onClose: () => void;
  onUpdate: (activityId: string, updates: Partial<CalendarActivity>) => void;
  onDelete: (activityId: string) => void;
}

const ActivityModal: React.FC<ActivityModalProps> = ({
  activity,
  selectedDate,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'workout' as CalendarActivity['type'],
    date: '',
    duration: '',
    distance: '',
    intensity: 'medium' as CalendarActivity['intensity'],
    status: 'planned' as CalendarActivity['status'],
    description: '',
    averageHeartRate: '',
    maxHeartRate: '',
    calories: '',
    pace: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!activity;
  const isNew = !activity && selectedDate;

  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.name || '',
        type: activity.type || 'workout',
        date: activity.date ? new Date(activity.date).toISOString().split('T')[0] : '',
        duration: activity.duration?.toString() || '',
        distance: activity.distance?.toString() || '',
        intensity: activity.intensity || 'medium',
        status: activity.status || 'planned',
        description: activity.description || '',
        averageHeartRate: activity.metrics?.averageHeartRate?.toString() || '',
        maxHeartRate: activity.metrics?.maxHeartRate?.toString() || '',
        calories: activity.metrics?.calories?.toString() || '',
        pace: activity.metrics?.pace || ''
      });
    } else if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate.toISOString().split('T')[0]
      }));
    }
  }, [activity, selectedDate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nosaukums ir obligāts';
    }

    if (!formData.date) {
      newErrors.date = 'Datums ir obligāts';
    }

    if (formData.duration && (isNaN(Number(formData.duration)) || Number(formData.duration) < 0)) {
      newErrors.duration = 'Ilgums jābūt pozitīvam skaitlim';
    }

    if (formData.distance && (isNaN(Number(formData.distance)) || Number(formData.distance) < 0)) {
      newErrors.distance = 'Attālums jābūt pozitīvam skaitlim';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const updateData: Partial<CalendarActivity> = {
        name: formData.name.trim(),
        type: formData.type,
        date: formData.date,
        duration: formData.duration ? Number(formData.duration) : undefined,
        distance: formData.distance ? Number(formData.distance) : undefined,
        intensity: formData.intensity,
        status: formData.status,
        description: formData.description.trim() || undefined,
        metrics: {
          averageHeartRate: formData.averageHeartRate ? Number(formData.averageHeartRate) : undefined,
          maxHeartRate: formData.maxHeartRate ? Number(formData.maxHeartRate) : undefined,
          calories: formData.calories ? Number(formData.calories) : undefined,
          pace: formData.pace || undefined
        }
      };

      if (isEditing && activity) {
        await onUpdate(activity._id, updateData);
      } else {
        // For new activities, we would need a create endpoint
        // For now, treat as update with empty ID
        await onUpdate('new', updateData);
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to save activity:', { error: error });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activity) return;

    if (window.confirm('Vai tiešām vēlaties dzēst šo aktivitāti?')) {
      setLoading(true);
      try {
        await onDelete(activity._id);
      } catch (error) {
        logger.error('ERROR', 'Failed to delete activity:', { error: error });
      } finally {
        setLoading(false);
      }
    }
  };

  const getTypeLabel = (type: string): string => {
    const labels = {
      workout: 'Treniņš',
      training: 'Kardio',
      rest: 'Atpūta',
      competition: 'Sacensības'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusLabel = (status: string): string => {
    const labels = {
      planned: 'Plānots',
      completed: 'Pabeigts',
      skipped: 'Izlaists'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getIntensityLabel = (intensity: string): string => {
    const labels = {
      low: 'Zema',
      medium: 'Vidēja',
      high: 'Augsta'
    };
    return labels[intensity as keyof typeof labels] || intensity;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isNew ? 'Jauna aktivitāte' : isEditing ? 'Rediģēt aktivitāti' : 'Aktivitātes detaļas'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Pamatinformācija</h3>
              
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nosaukums *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Piemēram: Rīta skrējiens"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Veids
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CalendarActivity['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="workout">Treniņš</option>
                  <option value="training">Kardio</option>
                  <option value="rest">Atpūta</option>
                  <option value="competition">Sacensības</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datums *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statuss
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as CalendarActivity['status'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="planned">Plānots</option>
                  <option value="completed">Pabeigts</option>
                  <option value="skipped">Izlaists</option>
                </select>
              </div>
            </div>

            {/* Activity Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Aktivitātes detaļas</h3>
              
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ilgums (minūtes)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.duration ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="60"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                )}
              </div>

              {/* Distance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attālums (km)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.distance}
                  onChange={(e) => setFormData(prev => ({ ...prev, distance: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.distance ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="5.0"
                />
                {errors.distance && (
                  <p className="mt-1 text-sm text-red-600">{errors.distance}</p>
                )}
              </div>

              {/* Intensity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intensitāte
                </label>
                <select
                  value={formData.intensity}
                  onChange={(e) => setFormData(prev => ({ ...prev, intensity: e.target.value as CalendarActivity['intensity'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="low">Zema</option>
                  <option value="medium">Vidēja</option>
                  <option value="high">Augsta</option>
                </select>
              </div>

              {/* Pace */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temps (min/km)
                </label>
                <input
                  type="text"
                  value={formData.pace}
                  onChange={(e) => setFormData(prev => ({ ...prev, pace: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="5:30"
                />
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Metrikas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vidējais sirdsdarbības ritms
                </label>
                <input
                  type="number"
                  min="0"
                  max="250"
                  value={formData.averageHeartRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, averageHeartRate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="145"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maksimālais sirdsdarbības ritms
                </label>
                <input
                  type="number"
                  min="0"
                  max="250"
                  value={formData.maxHeartRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxHeartRate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="165"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kalorijas
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.calories}
                  onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="350"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apraksts
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Papildu informācija par aktivitāti..."
            />
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between">
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                >
                  Dzēst aktivitāti
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                Atcelt
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isNew ? 'Izveidot' : 'Saglabāt'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityModal;