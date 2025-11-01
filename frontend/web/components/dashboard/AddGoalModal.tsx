import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../lib/productionLogger'

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface GoalFormData {
  title: string;
  type: 'distance' | 'workouts' | 'pace' | 'streak';
  targetValue: string;
  unit: string;
  deadline: string;
  description?: string;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    type: 'distance',
    targetValue: '',
    unit: 'km',
    deadline: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const goalTypes = [
    {
      value: 'distance',
      label: 'Attāluma mērķis',
      description: 'Kopējais noskrietais attālums',
      units: ['km', 'mi'],
      placeholder: 'piem., 100'
    },
    {
      value: 'workouts',
      label: 'Treniņu skaits',
      description: 'Kopējais treniņu skaits',
      units: ['treniņi'],
      placeholder: 'piem., 20'
    },
    {
      value: 'pace',
      label: 'Tempa mērķis',
      description: 'Vidējais temps vai konkrēta distance',
      units: ['min/km', 'min'],
      placeholder: 'piem., 5.0'
    },
    {
      value: 'streak',
      label: 'Treniņu sērija',
      description: 'Nepārtrauktu treniņu dienu skaits',
      units: ['dienas'],
      placeholder: 'piem., 14'
    }
  ];

  const selectedGoalType = goalTypes.find(type => type.value === formData.type);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-update unit when type changes
    if (name === 'type') {
      const goalType = goalTypes.find(type => type.value === value);
      if (goalType) {
        setFormData(prev => ({
          ...prev,
          type: value as GoalFormData['type'],
          unit: goalType.units[0]
        }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.title.trim()) {
      newErrors.push('Mērķa nosaukums ir obligāts');
    }

    if (!formData.targetValue.trim()) {
      newErrors.push('Mērķa vērtība ir obligāta');
    } else {
      const value = parseFloat(formData.targetValue);
      if (isNaN(value) || value <= 0) {
        newErrors.push('Mērķa vērtībai jābūt pozitīvam skaitlim');
      }
    }

    if (!formData.deadline) {
      newErrors.push('Termiņš ir obligāts');
    } else {
      const deadline = new Date(formData.deadline);
      const today = new Date();
      if (deadline <= today) {
        newErrors.push('Termiņam jābūt nākotnē');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const goalData = {
        title: formData.title.trim(),
        type: formData.type,
        targetValue: parseFloat(formData.targetValue),
        unit: formData.unit,
        deadline: formData.deadline,
        description: formData.description?.trim() || '',
        userId: user?.id
      };

      // For now, we'll just simulate API call
      // In production, this would be an actual API call
      logger.info('COMPONENT', 'Creating goal:', { goalData });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Success
      alert('Mērķis veiksmīgi izveidots!');
      onSuccess?.();
      handleClose();

    } catch (error) {
      logger.error('ERROR', 'Error creating goal:', { error: error });
      setErrors(['Neizdevās izveidot mērķi. Lūdzu mēģiniet vēlāk.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      type: 'distance',
      targetValue: '',
      unit: 'km',
      deadline: '',
      description: ''
    });
    setErrors([]);
    setIsSubmitting(false);
    onClose();
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Izveidot jaunu mērķi</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg">
              <ul className="list-disc list-inside text-red-400 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Goal Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Mērķa nosaukums *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                placeholder="piem., Mēneša distance - 100km"
                required
              />
            </div>

            {/* Goal Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                Mērķa veids *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                required
              >
                {goalTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {selectedGoalType && (
                <p className="text-xs text-gray-400 mt-1">{selectedGoalType.description}</p>
              )}
            </div>

            {/* Target Value and Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="targetValue" className="block text-sm font-medium text-gray-300 mb-2">
                  Mērķa vērtība *
                </label>
                <input
                  type="number"
                  id="targetValue"
                  name="targetValue"
                  value={formData.targetValue}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0.1"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                  placeholder={selectedGoalType?.placeholder}
                  required
                />
              </div>
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-300 mb-2">
                  Mērvienība
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                >
                  {selectedGoalType?.units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-300 mb-2">
                Termiņš *
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                min={getMinDate()}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Papildu apraksts (nav obligāts)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                placeholder="Papildu informācija par mērķi..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
              >
                Atcelt
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-coral-600 text-white rounded-md hover:bg-coral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Izveido...' : 'Izveidot mērķi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddGoalModal;