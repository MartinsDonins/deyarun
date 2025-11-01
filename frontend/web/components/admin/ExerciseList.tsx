import React, { useState } from 'react';
import { logger } from '../../lib/productionLogger'

interface Exercise {
  _id: string;
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
  usageStats: {
    timesUsed: number;
    avgRating: number;
    totalRatings: number;
  };
  createdBy: { _id: string; email: string; name?: string };
  lastModifiedBy?: { _id: string; email: string; name?: string };
  createdAt: string;
  updatedAt: string;
  version: number;
  translations?: {
    lv?: { name?: string; description?: string; instructions?: string };
    en?: { name?: string; description?: string; instructions?: string };
    ru?: { name?: string; description?: string; instructions?: string };
  };
}

interface Filters {
  category: string;
  difficulty: string;
  search: string;
  isActive: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
}

interface ExerciseListProps {
  exercises: Exercise[];
  loading: boolean;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  pagination: Pagination;
  onPageChange: (page: number) => void;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exerciseId: string) => void;
  onToggleStatus: (exerciseId: string) => void;
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
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
  { value: '', label: 'All Difficulties' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'text-green-400';
    case 'intermediate': return 'text-yellow-400';
    case 'advanced': return 'text-red-400';
    default: return 'text-gray-400';
  }
};

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case 'firebase':
      return '🔥';
    case 'vimeo':
      return '📹';
    case 'youtube':
      return '📺';
    case 'local':
      return '💾';
    default:
      return '❓';
  }
};

export default function ExerciseList({
  exercises,
  loading,
  filters,
  onFiltersChange,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  onToggleStatus
}: ExerciseListProps) {
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleSelectAll = () => {
    if (selectedExercises.length === exercises.length) {
      setSelectedExercises([]);
    } else {
      setSelectedExercises(exercises.map(ex => ex._id));
    }
  };

  const handleSelectExercise = (exerciseId: string) => {
    setSelectedExercises(prev =>
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const renderPagination = () => {
    const { page, totalPages } = pagination;
    const pages = [];
    
    // Always show first page
    if (totalPages > 0) {
      pages.push(1);
    }
    
    // Add ellipsis and current page area
    if (page > 3) {
      pages.push('...');
    }
    
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    
    if (page < totalPages - 2) {
      pages.push('...');
    }
    
    // Always show last page
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-400">
          Showing {((page - 1) * pagination.limit) + 1} to {Math.min(page * pagination.limit, pagination.totalItems)} of {pagination.totalItems} exercises
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 text-gray-300"
          >
            Previous
          </button>
          
          {pages.map((pageNum, index) => (
            <button
              key={index}
              onClick={() => typeof pageNum === 'number' ? onPageChange(pageNum) : null}
              disabled={typeof pageNum !== 'number'}
              className={`px-3 py-1 text-sm border border-slate-600 rounded-lg ${
                pageNum === page
                  ? 'bg-coral text-white border-coral'
                  : typeof pageNum === 'number'
                  ? 'hover:bg-slate-700 text-gray-300'
                  : 'cursor-default text-gray-500'
              }`}
            >
              {pageNum}
            </button>
          ))}
          
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 text-sm border border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 text-gray-300"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="card">
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search exercises..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
            />
          </div>
          
          <div>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
            >
              {DIFFICULTIES.map(diff => (
                <option key={diff.value} value={diff.value}>{diff.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Exercise Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
          <span className="ml-3 text-gray-400">Loading exercises...</span>
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏃‍♂️</div>
          <h3 className="text-lg font-medium text-white mb-2">No exercises found</h3>
          <p className="text-gray-400">Try adjusting your filters or create a new exercise.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedExercises.length === exercises.length}
                      onChange={handleSelectAll}
                      className="rounded bg-slate-700 border-slate-600 text-coral focus:ring-coral"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Category</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Difficulty</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Video</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Usage</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((exercise) => (
                  <tr key={exercise._id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedExercises.includes(exercise._id)}
                        onChange={() => handleSelectExercise(exercise._id)}
                        className="rounded bg-slate-700 border-slate-600 text-coral focus:ring-coral"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-white">{exercise.name}</div>
                        <div className="text-sm text-gray-400 truncate max-w-xs">
                          {exercise.description}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                        {CATEGORIES.find(cat => cat.value === exercise.category)?.label || exercise.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium capitalize ${getDifficultyColor(exercise.difficulty)}`}>
                        {exercise.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getProviderIcon(exercise.video.provider)}</span>
                        <span className="text-sm text-gray-400 capitalize">{exercise.video.provider}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="text-white">{exercise.usageStats.timesUsed} uses</div>
                        <div className="text-gray-400">
                          ⭐ {exercise.usageStats.avgRating.toFixed(1)}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onToggleStatus(exercise._id)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          exercise.isActive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {exercise.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onEdit(exercise)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                          title="Edit exercise"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(exercise._id)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium"
                          title="Delete exercise"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {renderPagination()}

          {/* Bulk Actions */}
          {selectedExercises.length > 0 && (
            <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  {selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      // Bulk activate/deactivate logic would go here
                      logger.info('COMPONENT', 'Bulk action for:', { selectedExercises });
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Toggle Status
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${selectedExercises.length} exercises?`)) {
                        // Bulk delete logic would go here
                        selectedExercises.forEach(id => onDelete(id));
                        setSelectedExercises([]);
                      }
                    }}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}