import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import { withAdminAuth, useAuth } from '../../contexts/AuthContext';
import { useApiOperations } from '../../hooks/useAuthenticatedFetch';
import { logger } from '../../lib/productionLogger'

interface AIConfig {
  _id?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  exerciseWeights: {
    difficulty: number;
    muscleGroups: number;
    equipment: number;
    duration: number;
  };
  progressionRules: {
    weekly: number;
    biweekly: number;
    monthly: number;
  };
  restDayRules: {
    beginnerMinRest: number;
    intermediateMinRest: number;
    advancedMinRest: number;
  };
  isActive: boolean;
  createdBy?: { _id: string; email: string; name?: string };
  createdAt?: string;
  updatedAt?: string;
}

const defaultConfig: AIConfig = {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: `Tu esi profesionāls skrējiena treneris ar 10+ gadu pieredzi. Izveido personalizētu treniņprogrammu, ņemot vērā:
- Lietotāja fizisko sagatavotību un mērķus
- Pieejamo laiku un aprīkojumu
- Iepriekšējo pieredzi un traumu vēsturi
- Progresīvu slodzes palielināšanu
- Atpūtas dienu nozīmi
- Motivāciju un interesi

Programmai jābūt reālistiskai, drošai un motivējošai.`,
  exerciseWeights: {
    difficulty: 0.3,
    muscleGroups: 0.25,
    equipment: 0.2,
    duration: 0.25
  },
  progressionRules: {
    weekly: 0.1,
    biweekly: 0.15,
    monthly: 0.2
  },
  restDayRules: {
    beginnerMinRest: 2,
    intermediateMinRest: 1,
    advancedMinRest: 1
  },
  isActive: true
};

function AIConfigPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { get, post, put } = useApiOperations();
  
  // Debug logging
  logger.info('COMPONENT', 'AI Config Debug:', {
    user,
    role: user?.role,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin'
  });
  
  const [config, setConfig] = useState<AIConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load current configuration
  useEffect(() => {
    if (user) {
      loadConfig();
    }
  }, [user]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      logger.info('COMPONENT', 'Loading AI config...');
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/admin/ai-config`;
      logger.info('COMPONENT', 'API URL:', { apiUrl });
      const result = await get<AIConfig>('/api/admin/ai-config');
      logger.info('COMPONENT', 'AI Config API result:', { result });
      
      if (result.success && result.data) {
        // Merge API data with default config to ensure all properties exist
        const mergedConfig = {
          ...defaultConfig,
          ...result.data,
          exerciseWeights: {
            ...defaultConfig.exerciseWeights,
            ...(result.data.exerciseWeights || {})
          },
          progressionRules: {
            ...defaultConfig.progressionRules,
            ...(result.data.progressionRules || {})
          },
          restDayRules: {
            ...defaultConfig.restDayRules,
            ...(result.data.restDayRules || {})
          }
        };
        setConfig(mergedConfig);
        logger.info('COMPONENT', 'Config loaded and merged successfully:', { mergedConfig });
      } else {
        // No config exists yet, use default
        logger.info('COMPONENT', 'No config found, using default');
        setConfig(defaultConfig);
      }
    } catch (err) {
      logger.error('ERROR', 'Failed to load AI config:', { error: err });
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = config._id 
        ? await put(`/api/admin/ai-config/${config._id}`, config)
        : await post('/api/admin/ai-config', config);

      if (result.success) {
        setSuccess('AI konfigurācija veiksmīgi saglabāta!');
        if (result.data) {
          // Merge API response with default config to ensure all properties exist
          const mergedConfig = {
            ...defaultConfig,
            ...result.data,
            exerciseWeights: {
              ...defaultConfig.exerciseWeights,
              ...(result.data.exerciseWeights || {})
            },
            progressionRules: {
              ...defaultConfig.progressionRules,
              ...(result.data.progressionRules || {})
            },
            restDayRules: {
              ...defaultConfig.restDayRules,
              ...(result.data.restDayRules || {})
            }
          };
          setConfig(mergedConfig);
        }
      } else {
        throw new Error(result.error || 'Failed to save AI config');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saglabājot konfigurāciju');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof AIConfig] as any,
        [field]: value
      }
    }));
  };

  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    logger.info('COMPONENT', 'User role access denied:', { role: user?.role });
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Piekļuve liegta</h1>
          <p className="text-gray-400">Jums nav administratora tiesību.</p>
          <p className="text-gray-500 text-sm mt-2">Jūsu loma: {user?.role || 'nav autentificēts'}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">AI Konfigurācija</h1>
            <p className="text-gray-400 mt-1">
              Konfigurēt AI iestatījumus automātiskai treniņprogrammu ģenerēšanai
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-coral text-white rounded-lg hover:bg-coral-dark transition-colors disabled:opacity-50"
          >
            {saving ? 'Saglabā...' : 'Save'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <p className="text-green-400">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic AI Settings */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Pamatiestatījumi</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  AI Modelis
                </label>
                <select
                  value={config.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-coral focus:border-transparent"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3">Claude 3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Temperature ({config.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Konservatīvs</span>
                  <span>Kreatīvs</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maksimālais tokenu skaits
                </label>
                <input
                  type="number"
                  min="500"
                  max="4000"
                  value={config.maxTokens}
                  onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-coral focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={config.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">
                  Active konfigurācija
                </label>
              </div>
            </div>
          </div>

          {/* Exercise Weights */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Vingrojumu svari</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Grūtības līmenis ({config.exerciseWeights?.difficulty || 0})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.exerciseWeights?.difficulty || 0}
                  onChange={(e) => handleNestedInputChange('exerciseWeights', 'difficulty', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Muskuļu grupas ({config.exerciseWeights?.muscleGroups || 0})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.exerciseWeights?.muscleGroups || 0}
                  onChange={(e) => handleNestedInputChange('exerciseWeights', 'muscleGroups', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Aprīkojums ({config.exerciseWeights?.equipment || 0})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.exerciseWeights?.equipment || 0}
                  onChange={(e) => handleNestedInputChange('exerciseWeights', 'equipment', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ilgums ({config.exerciseWeights?.duration || 0})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.exerciseWeights?.duration || 0}
                  onChange={(e) => handleNestedInputChange('exerciseWeights', 'duration', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Progression Rules */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Progresijas noteikumi</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nedēļas progresija (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={(config.progressionRules?.weekly || 0) * 100}
                  onChange={(e) => handleNestedInputChange('progressionRules', 'weekly', parseInt(e.target.value) / 100)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-coral focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Divnedēļu progresija (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={(config.progressionRules?.biweekly || 0) * 100}
                  onChange={(e) => handleNestedInputChange('progressionRules', 'biweekly', parseInt(e.target.value) / 100)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-coral focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mēneša progresija (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={(config.progressionRules?.monthly || 0) * 100}
                  onChange={(e) => handleNestedInputChange('progressionRules', 'monthly', parseInt(e.target.value) / 100)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-coral focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Rest Day Rules */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Atpūtas dienu noteikumi</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Iesācējiem (min. atpūtas dienas nedēļā)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={config.restDayRules?.beginnerMinRest || 0}
                  onChange={(e) => handleNestedInputChange('restDayRules', 'beginnerMinRest', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-coral focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Vidējiem (min. atpūtas dienas nedēļā)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={config.restDayRules?.intermediateMinRest || 0}
                  onChange={(e) => handleNestedInputChange('restDayRules', 'intermediateMinRest', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-coral focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pieredzējušiem (min. atpūtas dienas nedēļā)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={config.restDayRules?.advancedMinRest || 0}
                  onChange={(e) => handleNestedInputChange('restDayRules', 'advancedMinRest', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-coral focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Prompt */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Sistēmas instrukcija</h2>
          <p className="text-gray-400 mb-4">
            Pamatinstrukcija, ko AI saņem katram treniņprogrammas ģenerēšanas pieprasījumam
          </p>
          
          <textarea
            value={config.systemPrompt}
            onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
            rows={8}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-coral focus:border-transparent"
            placeholder="Ievadiet sistēmas instrukciju AI modelim..."
          />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-medium text-blue-400">Temperature</h3>
            </div>
            <p className="text-sm text-blue-300 mt-1">
              Augstāka vērtība rada kreatīvākas, bet neprecīzākas atbildes
            </p>
          </div>

          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="font-medium text-green-400">Svari</h3>
            </div>
            <p className="text-sm text-green-300 mt-1">
              Nosaka cik svarīgs katrs faktors ir vingrojumu izvēlē
            </p>
          </div>

          <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="font-medium text-purple-400">Progresija</h3>
            </div>
            <p className="text-sm text-purple-300 mt-1">
              Nosaka cik ātri palielināt treniņa intensitāti
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(AIConfigPage);