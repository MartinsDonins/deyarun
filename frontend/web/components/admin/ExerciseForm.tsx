import React, { useState, useRef } from 'react';
import { useApiOperations } from '../../hooks/useAuthenticatedFetch';
import { adminLogger } from '../../lib/logger';

interface Exercise {
  _id?: string;
  name: string;
  description: string;
  instructions: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetMuscleGroups: string[];
  trainingPhase: string[];
  workoutTypes: string[];
  duration?: { min: number; max: number };
  repetitions?: { min: number; max: number };
  sets?: { min: number; max: number };
  restBetweenSets?: number;
  equipment: string[];
  video: {
    provider: 'firebase' | 'vimeo' | 'youtube' | 'local';
    firebaseUrl?: string;
    vimeoId?: string;
    youtubeId?: string;
    localPath?: string;
    duration?: number;
    thumbnail?: string;
    aspectRatio?: string;
    quality?: string;
  };
  aiTags: string[];
  contraindications: string[];
  benefits: string[];
  isActive: boolean;
  isPublic: boolean;
  translations?: {
    lv?: { name?: string; description?: string; instructions?: string };
    en?: { name?: string; description?: string; instructions?: string };
    ru?: { name?: string; description?: string; instructions?: string };
  };
}

interface ExerciseFormProps {
  exercise?: Exercise | null;
  onSave: (data: Partial<Exercise>) => void;
  onCancel: () => void;
}

const CATEGORIES = [
  { value: 'warm-up', label: 'Iesildīšana' },
  { value: 'strength', label: 'Spēka vingrinājumi' },
  { value: 'flexibility', label: 'Elastība' },
  { value: 'balance', label: 'Līdzsvars' },
  { value: 'coordination', label: 'Koordinācija' },
  { value: 'plyometric', label: 'Pliometrija' },
  { value: 'core', label: 'Vēdera muskulatūra' },
  { value: 'recovery', label: 'Atjaunošanās' },
  { value: 'cool-down', label: 'Nomierināšana' },
  { value: 'technique', label: 'Skriešanas tehnika' },
  { value: 'cardio', label: 'Kardio' }
];

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

const MUSCLE_GROUPS = [
  { value: 'legs', label: 'Kājas' },
  { value: 'glutes', label: 'Sēžas muskuļi' },
  { value: 'core', label: 'Vēders' },
  { value: 'arms', label: 'Rokas' },
  { value: 'shoulders', label: 'Pleci' },
  { value: 'back', label: 'Mugura' },
  { value: 'chest', label: 'Krūtis' },
  { value: 'calves', label: 'Ikri' },
  { value: 'hamstrings', label: 'Aizmugures augšstilbs' },
  { value: 'quadriceps', label: 'Priekšējais augšstilbs' },
  { value: 'hip-flexors', label: 'Gūžas locītava' },
  { value: 'ankles', label: 'Potītes' }
];

const TRAINING_PHASES = [
  { value: 'base-building', label: 'Pamata veidošana' },
  { value: 'speed-work', label: 'Ātruma darbs' },
  { value: 'endurance', label: 'Izturība' },
  { value: 'recovery', label: 'Atjaunošanās' },
  { value: 'competition-prep', label: 'Sacensību sagatavošana' },
  { value: 'off-season', label: 'Sezonas pārtraukums' },
  { value: 'injury-prevention', label: 'Traumu novēršana' },
  { value: 'rehabilitation', label: 'Rehabilitācija' }
];

const WORKOUT_TYPES = [
  { value: 'easy-run', label: 'Viegls skrējiens' },
  { value: 'tempo-run', label: 'Tempo skrējiens' },
  { value: 'intervals', label: 'Intervāli' },
  { value: 'long-run', label: 'Garš skrējiens' },
  { value: 'recovery-run', label: 'Atjaunošanās skrējiens' },
  { value: 'fartlek', label: 'Fartlek' },
  { value: 'hill-training', label: 'Kalnu treniņš' },
  { value: 'track-workout', label: 'Trases treniņš' },
  { value: 'cross-training', label: 'Krusttreniņš' }
];

const EQUIPMENT = [
  { value: 'none', label: 'Nav nepieciešams' },
  { value: 'mat', label: 'Paklājiņš' },
  { value: 'resistance-band', label: 'Pretestības lenta' },
  { value: 'dumbbells', label: 'Hanteles' },
  { value: 'kettlebell', label: 'Gira' },
  { value: 'foam-roller', label: 'Porolona rulis' },
  { value: 'medicine-ball', label: 'Medicīnas bumba' },
  { value: 'step', label: 'Pakāpiens' },
  { value: 'pull-up-bar', label: 'Pievilkšanās stieņa' },
  { value: 'stability-ball', label: 'Stabilitātes bumba' },
  { value: 'cones', label: 'Konusi' },
  { value: 'agility-ladder', label: 'Veiklības kāpnes' }
];

const VIDEO_PROVIDERS = [
  { value: 'firebase', label: 'Firebase Storage' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'local', label: 'Local File' }
];

export default function ExerciseForm({ exercise, onSave, onCancel }: ExerciseFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<Exercise>({
    name: exercise?.name || '',
    description: exercise?.description || '',
    instructions: exercise?.instructions || '',
    category: exercise?.category || 'warm-up',
    difficulty: exercise?.difficulty || 'beginner',
    targetMuscleGroups: exercise?.targetMuscleGroups || [],
    trainingPhase: exercise?.trainingPhase || [],
    workoutTypes: exercise?.workoutTypes || [],
    duration: exercise?.duration || { min: 0, max: 0 },
    repetitions: exercise?.repetitions || { min: 0, max: 0 },
    sets: exercise?.sets || { min: 1, max: 1 },
    restBetweenSets: exercise?.restBetweenSets || 30,
    equipment: exercise?.equipment || ['none'],
    video: exercise?.video || {
      provider: 'firebase',
      aspectRatio: '16:9',
      quality: '720p'
    },
    aiTags: exercise?.aiTags || [],
    contraindications: exercise?.contraindications || [],
    benefits: exercise?.benefits || [],
    isActive: exercise?.isActive ?? true,
    isPublic: exercise?.isPublic ?? true,
    translations: exercise?.translations || {}
  });

  const handleArrayFieldChange = (field: keyof Exercise, value: string) => {
    const currentArray = formData[field] as string[] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const handleTagInput = (field: 'aiTags' | 'contraindications' | 'benefits', value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeTag = (field: 'aiTags' | 'contraindications' | 'benefits', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const { upload } = useApiOperations();

  const handleVideoUpload = async (file: File) => {
    if (!exercise?._id) {
      alert('Please save the exercise first before uploading a video');
      return;
    }

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('video', file);

    try {
      const result = await upload(`/api/exercises/${exercise._id}/upload-video`, formDataUpload);

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload video');
      }

      setFormData(prev => ({
        ...prev,
        video: {
          ...prev.video,
          provider: 'firebase',
          firebaseUrl: result.data?.videoUrl
        }
      }));

      alert('Video uploaded successfully!');
    } catch (error) {
      adminLogger.error('EXERCISE_FORM', 'Upload error', error);
      alert('Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    adminLogger.info('EXERCISE_FORM', 'Form submission started', { formData });
    
    // Validation - following backend validation rules
    if (!formData.name.trim()) {
      adminLogger.warn('EXERCISE_FORM', 'Validation failed - missing name');
      alert('Exercise name is required');
      return;
    }
    
    if (formData.name.trim().length > 200) {
      adminLogger.warn('EXERCISE_FORM', 'Validation failed - name too long', { nameLength: formData.name.trim().length });
      alert('Exercise name must be 200 characters or less');
      return;
    }
    
    if (!formData.description.trim()) {
      adminLogger.warn('EXERCISE_FORM', 'Validation failed - missing description');
      alert('Description is required');
      return;
    }
    
    if (formData.description.trim().length < 10) {
      adminLogger.warn('EXERCISE_FORM', 'Validation failed - description too short', { descriptionLength: formData.description.trim().length });
      alert('Description must be at least 10 characters long');
      return;
    }
    
    if (formData.description.trim().length > 1000) {
      adminLogger.warn('EXERCISE_FORM', 'Validation failed - description too long', { descriptionLength: formData.description.trim().length });
      alert('Description must be 1000 characters or less');
      return;
    }
    
    if (!formData.instructions.trim()) {
      adminLogger.warn('EXERCISE_FORM', 'Validation failed - missing instructions');
      alert('Instructions are required');
      return;
    }
    
    if (formData.instructions.trim().length < 10) {
      adminLogger.warn('EXERCISE_FORM', 'Validation failed - instructions too short', { instructionsLength: formData.instructions.trim().length });
      alert('Instructions must be at least 10 characters long');
      return;
    }
    
    if (formData.instructions.trim().length > 2000) {
      adminLogger.warn('EXERCISE_FORM', 'Validation failed - instructions too long', { instructionsLength: formData.instructions.trim().length });
      alert('Instructions must be 2000 characters or less');
      return;
    }
    
    if (formData.targetMuscleGroups.length === 0) {
      adminLogger.warn('EXERCISE_FORM', 'Validation failed - no target muscle groups');
      alert('At least one target muscle group must be selected');
      return;
    }

    adminLogger.info('EXERCISE_FORM', 'Validation passed, calling onSave');
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Exercise Name * 
            <span className="text-xs text-gray-400 ml-2">
              ({formData.name.length}/200 characters)
            </span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
            placeholder="Enter exercise name"
            maxLength={200}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description * 
            <span className="text-xs text-gray-400 ml-2">
              ({formData.description.length}/1000 characters, min 10)
            </span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent ${
              formData.description.length < 10 && formData.description.length > 0 
                ? 'border-red-500' 
                : 'border-slate-600'
            }`}
            placeholder="Brief description of the exercise (minimum 10 characters)"
            maxLength={1000}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Instructions * 
            <span className="text-xs text-gray-400 ml-2">
              ({formData.instructions.length}/2000 characters, min 10)
            </span>
          </label>
          <textarea
            value={formData.instructions}
            onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
            rows={4}
            className={`w-full bg-slate-700 border rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent ${
              formData.instructions.length < 10 && formData.instructions.length > 0 
                ? 'border-red-500' 
                : 'border-slate-600'
            }`}
            placeholder="Step-by-step instructions (minimum 10 characters)"
            maxLength={2000}
          />
        </div>
      </div>

      {/* Categorization */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Categorization</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Difficulty *
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
            >
              {DIFFICULTIES.map(diff => (
                <option key={diff.value} value={diff.value}>{diff.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Target Muscle Groups */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Muscle Groups *
            <span className="text-xs text-gray-400 ml-2">
              ({formData.targetMuscleGroups.length} selected)
            </span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {MUSCLE_GROUPS.map(muscle => (
              <label key={muscle.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.targetMuscleGroups.includes(muscle.value)}
                  onChange={() => handleArrayFieldChange('targetMuscleGroups', muscle.value)}
                  className="rounded bg-slate-700 border-slate-600 text-coral focus:ring-coral"
                />
                <span className="text-sm text-gray-300">{muscle.label}</span>
              </label>
            ))}
          </div>
          {formData.targetMuscleGroups.length === 0 && (
            <p className="text-red-400 text-xs mt-1">Please select at least one target muscle group</p>
          )}
        </div>
      </div>

      {/* Training Context */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Training Context</h3>
        
        {/* Training Phases */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Training Phases
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TRAINING_PHASES.map(phase => (
              <label key={phase.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.trainingPhase.includes(phase.value)}
                  onChange={() => handleArrayFieldChange('trainingPhase', phase.value)}
                  className="rounded bg-slate-700 border-slate-600 text-coral focus:ring-coral"
                />
                <span className="text-sm text-gray-300">{phase.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Workout Types */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Workout Types
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {WORKOUT_TYPES.map(type => (
              <label key={type.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.workoutTypes.includes(type.value)}
                  onChange={() => handleArrayFieldChange('workoutTypes', type.value)}
                  className="rounded bg-slate-700 border-slate-600 text-coral focus:ring-coral"
                />
                <span className="text-sm text-gray-300">{type.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise Parameters */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Exercise Parameters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration (seconds)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="0"
                value={formData.duration?.min || 0}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  duration: { ...prev.duration, min: parseInt(e.target.value) || 0 }
                }))}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
                placeholder="Min"
              />
              <span className="text-gray-400 py-2">-</span>
              <input
                type="number"
                min="0"
                value={formData.duration?.max || 0}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  duration: { ...prev.duration, max: parseInt(e.target.value) || 0 }
                }))}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
                placeholder="Max"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Repetitions
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="0"
                value={formData.repetitions?.min || 0}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  repetitions: { ...prev.repetitions, min: parseInt(e.target.value) || 0 }
                }))}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
                placeholder="Min"
              />
              <span className="text-gray-400 py-2">-</span>
              <input
                type="number"
                min="0"
                value={formData.repetitions?.max || 0}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  repetitions: { ...prev.repetitions, max: parseInt(e.target.value) || 0 }
                }))}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
                placeholder="Max"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sets
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="1"
                value={formData.sets?.min || 1}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  sets: { ...prev.sets, min: parseInt(e.target.value) || 1 }
                }))}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
                placeholder="Min"
              />
              <span className="text-gray-400 py-2">-</span>
              <input
                type="number"
                min="1"
                value={formData.sets?.max || 1}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  sets: { ...prev.sets, max: parseInt(e.target.value) || 1 }
                }))}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
                placeholder="Max"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Rest Between Sets (seconds)
          </label>
          <input
            type="number"
            min="0"
            value={formData.restBetweenSets || 30}
            onChange={(e) => setFormData(prev => ({ ...prev, restBetweenSets: parseInt(e.target.value) || 30 }))}
            className="w-32 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
          />
        </div>
      </div>

      {/* Equipment */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Required Equipment
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {EQUIPMENT.map(equip => (
            <label key={equip.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.equipment.includes(equip.value)}
                onChange={() => handleArrayFieldChange('equipment', equip.value)}
                className="rounded bg-slate-700 border-slate-600 text-coral focus:ring-coral"
              />
              <span className="text-sm text-gray-300">{equip.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Video Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Video Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Video Provider
            </label>
            <select
              value={formData.video.provider}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                video: { ...prev.video, provider: e.target.value as any }
              }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
            >
              {VIDEO_PROVIDERS.map(provider => (
                <option key={provider.value} value={provider.value}>{provider.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Aspect Ratio
            </label>
            <select
              value={formData.video.aspectRatio || '16:9'}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                video: { ...prev.video, aspectRatio: e.target.value }
              }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
            >
              <option value="16:9">16:9</option>
              <option value="4:3">4:3</option>
              <option value="1:1">1:1</option>
              <option value="9:16">9:16</option>
            </select>
          </div>
        </div>
        
        {/* Provider-specific fields */}
        {formData.video.provider === 'firebase' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Upload Video File
            </label>
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleVideoUpload(file);
                  }
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !exercise?._id}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Choose Video File'}
              </button>
              {formData.video.firebaseUrl && (
                <span className="text-green-400 text-sm">✓ Video uploaded</span>
              )}
              {!exercise?._id && (
                <span className="text-yellow-400 text-sm">Save exercise first to upload video</span>
              )}
            </div>
          </div>
        )}
        
        {formData.video.provider === 'vimeo' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Vimeo Video ID
            </label>
            <input
              type="text"
              value={formData.video.vimeoId || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                video: { ...prev.video, vimeoId: e.target.value }
              }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
              placeholder="e.g., 123456789"
            />
          </div>
        )}
        
        {formData.video.provider === 'youtube' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              YouTube Video ID
            </label>
            <input
              type="text"
              value={formData.video.youtubeId || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                video: { ...prev.video, youtubeId: e.target.value }
              }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
              placeholder="e.g., dQw4w9WgXcQ"
            />
          </div>
        )}
      </div>

      {/* AI Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          AI Tags (for training plan generation)
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.aiTags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-coral text-white"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag('aiTags', index)}
                className="ml-1 text-white hover:text-gray-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleTagInput('aiTags', e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
          placeholder="Type tag and press Enter"
        />
      </div>

      {/* Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Status</h3>
        <div className="flex space-x-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded bg-slate-700 border-slate-600 text-coral focus:ring-coral"
            />
            <span className="text-gray-300">Active</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
              className="rounded bg-slate-700 border-slate-600 text-coral focus:ring-coral"
            />
            <span className="text-gray-300">Public</span>
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-slate-600">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-coral text-white rounded-lg hover:bg-coral-dark transition-colors"
        >
          {exercise ? 'Update Exercise' : 'Create Exercise'}
        </button>
      </div>
    </form>
  );
}