import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { withAdminAuth, useAuth } from '../../contexts/AuthContext';
import { useApiOperations } from '../../hooks/useAuthenticatedFetch';
import ExerciseList from '../../components/admin/ExerciseList';
import ExerciseForm from '../../components/admin/ExerciseForm';
import ExerciseStats from '../../components/admin/ExerciseStats';
import VideoProviderMigration from '../../components/admin/VideoProviderMigration';
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

interface ExerciseStatsData {
  stats: Array<{
    _id: string;
    count: number;
    avgRating: number;
    totalUsage: number;
  }>;
  summary: {
    total: number;
    active: number;
    inactive: number;
  };
}

function AdminExercisesPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { get, post, put, delete: deleteRequest } = useApiOperations();
  
  // Debug logging
  logger.info('COMPONENT', 'Admin Exercises Debug:', {
    user,
    hasToken: !!token,
    tokenLength: token?.length,
    userRole: user?.role
  });
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [stats, setStats] = useState<ExerciseStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showMigration, setShowMigration] = useState(false);
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    search: '',
    isActive: 'true'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0
  });


  // Fetch exercises
  const fetchExercises = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      logger.info('COMPONENT', 'Fetching exercises with URL:', { url: `/api/exercises?${queryParams}` });
      logger.info('COMPONENT', 'Auth token available:', { hasToken: !!token });

      // Use relative URL - let the hook handle the base URL
      const result = await get<{
        success: boolean;
        exercises: Exercise[];
        pagination: {
          totalPages: number;
          totalItems: number;
        };
      }>(`/api/exercises?${queryParams}`);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch exercises');
      }

      if (result.data) {
        setExercises(result.data.exercises);
        setPagination(prev => ({
          ...prev,
          totalPages: result.data.pagination.totalPages,
          totalItems: result.data.pagination.totalItems
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      logger.info('COMPONENT', 'Fetching stats from:', { endpoint: '/api/exercises/categories/stats' });
      
      const result = await get<ExerciseStatsData>('/api/exercises/categories/stats');
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (err) {
      logger.error('ERROR', 'Failed to fetch stats:', { error: err });
    }
  };

  useEffect(() => {
    if (user) {
      fetchExercises();
      fetchStats();
    }
  }, [user, filters, pagination.page]);

  // Handle form submission
  // Test function to debug API issues
  const testExerciseAPI = async () => {
    logger.info('COMPONENT', '🧪 Testing exercise API...');
    try {
      const result = await get('/api/exercises/test');
      logger.info('COMPONENT', '✅ API test result:', { result });
      alert('API test successful! Check console for details.');
    } catch (error) {
      logger.error('ERROR', '❌ API test failed:', { error: error });
      alert('API test failed! Check console for details.');
    }
  };

  // Fix indexes function to resolve parallel array indexing issues
  const fixExerciseIndexes = async () => {
    logger.info('COMPONENT', '🔧 Fixing exercise indexes...');
    try {
      const result = await get('/api/exercises/fix-indexes');
      logger.info('COMPONENT', '✅ Index fix result:', { result });
      if (result.success) {
        alert(`✅ Indexes fixed successfully!\n\nActions taken:\n${result.data.actions.join('\n')}`);
      } else {
        alert(`❌ Index fix failed: ${result.error }`);
      }
    } catch (error) {
      logger.error('ERROR', '❌ Index fix failed:', { error: error });
      alert('❌ Index fix failed! Check console for details.');
    }
  };

  const handleSaveExercise = async (exerciseData: Partial<Exercise>) => {
    logger.info('COMPONENT', '🔍 handleSaveExercise: Function called');
    logger.info('COMPONENT', 'handleSaveExercise: Exercise data received:', { data: JSON.stringify(exerciseData, null, 2) });
    logger.info('COMPONENT', '✏️ handleSaveExercise: Edit mode:', { isEditing: !!editingExercise });
    
    // Validate required fields before sending
    if (!exerciseData.targetMuscleGroups || !Array.isArray(exerciseData.targetMuscleGroups) || exerciseData.targetMuscleGroups.length === 0) {
      logger.info('COMPONENT', '❌ Invalid targetMuscleGroups:', { targetMuscleGroups: exerciseData.targetMuscleGroups });
      setError('Target muscle groups must be selected');
      return;
    }
    
    try {
      const apiUrl = editingExercise 
        ? `/api/exercises/${editingExercise._id }` 
        : '/api/exercises';
        
      logger.info('COMPONENT', '🌐 handleSaveExercise: Making API call to:', { apiUrl });
      logger.info('COMPONENT', '📤 handleSaveExercise: Request method:', { method: editingExercise ? 'PUT' : 'POST' });
      
      const result = editingExercise 
        ? await put(apiUrl, exerciseData)
        : await post(apiUrl, exerciseData);

      logger.info('COMPONENT', '📥 handleSaveExercise: API response:', { result });

      if (!result.success) {
        logger.error('ERROR', '❌ handleSaveExercise: API returned error:', { error: result.error });
        throw new Error(result.error || 'Failed to save exercise');
      }

      logger.info('COMPONENT', '✅ handleSaveExercise: Exercise saved successfully');
      
      logger.info('COMPONENT', '🔄 handleSaveExercise: Refreshing data...');
      await fetchExercises();
      await fetchStats();
      
      logger.info('COMPONENT', '🚪 handleSaveExercise: Closing form');
      setShowForm(false);
      setEditingExercise(null);
      
      logger.info('COMPONENT', '✨ handleSaveExercise: Process completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save exercise';
      logger.error('ERROR', '💥 handleSaveExercise: Error occurred:', { error: errorMessage });
      logger.error('ERROR', '🔍 handleSaveExercise: Full error:', { error: err });
      setError(errorMessage);
    }
  };

  // Handle delete
  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('Are you sure you want to delete this exercise? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await deleteRequest(`/api/exercises/${exerciseId}`);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete exercise');
      }

      await fetchExercises();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete exercise');
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (exerciseId: string) => {
    try {
      const result = await put(`/api/exercises/${exerciseId}/toggle-status`);

      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle exercise status');
      }

      await fetchExercises();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle exercise status');
    }
  };


  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Exercise Management</h1>
            <p className="text-gray-400 mt-1">
              Manage exercises for training programs and AI recommendations
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={testExerciseAPI}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              🧪 Test API
            </button>
            <button
              onClick={fixExerciseIndexes}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
            >
              🔧 Fix DB
            </button>
            <button
              onClick={() => setShowMigration(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Video Migration
            </button>
            <button
              onClick={() => {
                logger.info('COMPONENT', '🔵 Add Exercise button clicked');
                logger.info('COMPONENT', '📋 Current state - showForm:', { showForm, editingExercise: editingExercise });
                setEditingExercise(null);
                setShowForm(true);
                logger.info('COMPONENT', '✅ Add Exercise button - state updated, form should show');
              }}
              className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral-dark transition-colors"
            >
              Add Exercise
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-200 text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        <ExerciseList
          exercises={exercises}
          loading={loading}
          filters={filters}
          onFiltersChange={setFilters}
          pagination={pagination}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
          onEdit={(exercise) => {
            setEditingExercise(exercise);
            setShowForm(true);
          }}
          onDelete={handleDeleteExercise}
          onToggleStatus={handleToggleStatus}
        />

        {/* Exercise Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">
                  {editingExercise ? 'Edit Exercise' : 'Add New Exercise'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingExercise(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <ExerciseForm
                exercise={editingExercise}
                onSave={handleSaveExercise}
                onCancel={() => {
                  setShowForm(false);
                  setEditingExercise(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Video Provider Migration Modal */}
        {showMigration && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Video Provider Migration</h2>
                <button
                  onClick={() => setShowMigration(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <VideoProviderMigration
                onMigrationComplete={() => {
                  setShowMigration(false);
                  fetchExercises();
                  fetchStats();
                }}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(AdminExercisesPage);