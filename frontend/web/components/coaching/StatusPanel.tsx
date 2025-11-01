import React, { useState, useEffect } from 'react';
import { getAuthToken } from '../../utils/auth';
import { logger } from '../../lib/productionLogger';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  CpuChipIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface StatusData {
  openAI: {
    initialized: boolean;
    model: string;
    requestsThisMinute: number;
    cacheSize: number;
    hasApiKey: boolean;
  };
  trainingService: {
    ready: boolean;
    score: number;
    requirements: {
      dataVolume: boolean;
      apiKeys: boolean;
      models: boolean;
      infrastructure: boolean;
    };
    recommendations: string[];
  };
  endpoints: Record<string, string>;
}

interface StatusPanelProps {
  className?: string;
}

const StatusPanel: React.FC<StatusPanelProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/coaching/status', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
        setLastUpdated(new Date());
      } else {
        setError(data.message || 'Failed to load status');
      }
    } catch (err) {
      setError('Error loading status');
      logger.error('ERROR', 'Status error:', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTestingConnection(true);

      const response = await fetch('/api/coaching/test-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Connection test successful!');
        await loadStatus(); // Refresh status after test
      } else {
        alert(`❌ Connection test failed: ${data.message}`);
      }
    } catch (err) {
      alert('❌ Connection test error');
      logger.error('ERROR', 'Connection test error:', { error: err });
    } finally {
      setTestingConnection(false);
    }
  };

  const clearCache = async () => {
    try {
      const response = await fetch('/api/coaching/clear-cache', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('🧹 Cache cleared successfully!');
        await loadStatus(); // Refresh status after clearing cache
      } else {
        alert(`❌ Failed to clear cache: ${data.message}`);
      }
    } catch (err) {
      alert('❌ Cache clear error');
      logger.error('ERROR', 'Cache clear error:', { error: err });
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircleIcon className="w-5 h-5 text-green-400" />
    ) : (
      <XCircleIcon className="w-5 h-5 text-red-400" />
    );
  };

  const getReadinessColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 0.8) return 'Gatavs';
    if (score >= 0.6) return 'Daļēji gatavs';
    return 'Nav gatavs';
  };

  if (loading) {
    return (
      <div className={`bg-slate-800 border border-gray-700 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-coral border-t-transparent rounded-full mr-3"></div>
          <span className="text-adaptive-light">Ielādē statusu...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-slate-800 border border-gray-700 rounded-xl p-6 ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadStatus}
            className="btn-ghost"
          >
            Mēģināt vēlreiz
          </button>
        </div>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className={`bg-slate-800 border border-gray-700 rounded-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-coral/20 rounded-lg">
            <CpuChipIcon className="w-6 h-6 text-coral" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-adaptive-white">Sistēmas Status</h3>
            <p className="text-sm text-adaptive-light">
              Pēdējo reizi atjaunināts: {lastUpdated?.toLocaleTimeString('lv') || 'Nav datu'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadStatus}
            disabled={loading}
            className="p-2 text-adaptive-light hover:text-adaptive-white transition-colors"
            title="Atjaunināt statusu"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Service Status */}
        <div>
          <h4 className="text-lg font-medium text-adaptive-white mb-4 flex items-center">
            <CpuChipIcon className="w-5 h-5 mr-2" />
            Coaching Serviss
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-adaptive-light">Inicializēts</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.openAI.initialized)}
                  <span className="text-sm text-adaptive-light">
                    {status.openAI.initialized ? 'Jā' : 'Nē'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-adaptive-light">API atslēga</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(status.openAI.hasApiKey)}
                  <span className="text-sm text-adaptive-light">
                    {status.openAI.hasApiKey ? 'Konfigurēta' : 'Nav'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-adaptive-light">Modelis</span>
                <span className="text-sm text-coral font-medium">
                  {status.openAI.model || 'Nav norādīts'}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-adaptive-light">Pieprasījumi/min</span>
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-adaptive-white">
                    {status.openAI.requestsThisMinute}/60
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-adaptive-light">Kešatmiņa</span>
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-adaptive-white">
                    {status.openAI.cacheSize} ieraksti
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Training Service Readiness */}
        <div>
          <h4 className="text-lg font-medium text-adaptive-white mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Treniņu Serviss
          </h4>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-adaptive-light">Gatavības līmenis</span>
              <span className={`font-semibold ${getReadinessColor(status.trainingService.score)}`}>
                {Math.round(status.trainingService.score * 100)}% - {getReadinessLabel(status.trainingService.score)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  status.trainingService.score >= 0.8 ? 'bg-green-400' :
                  status.trainingService.score >= 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${status.trainingService.score * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-adaptive-light mb-2">Prasības</h5>
              <div className="space-y-2">
                {Object.entries(status.trainingService.requirements).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    {getStatusIcon(value)}
                    <span className="text-sm text-adaptive-light capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {status.trainingService.recommendations.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-adaptive-light mb-2">Ieteikumi</h5>
                <div className="space-y-1">
                  {status.trainingService.recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="text-xs text-adaptive-light flex items-start">
                      <div className="w-1 h-1 bg-coral rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* API Endpoints */}
        <div>
          <h4 className="text-lg font-medium text-adaptive-white mb-4">API Galapunkti</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(status.endpoints).map(([name, url]) => (
              <div key={name} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                <span className="text-sm text-adaptive-light capitalize">
                  {name.replace(/([A-Z])/g, ' $1')}
                </span>
                <code className="text-xs text-coral bg-slate-600 px-2 py-1 rounded">
                  {url}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={testConnection}
            disabled={testingConnection}
            className="btn-primary flex items-center space-x-2"
          >
            {testingConnection ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <CheckCircleIcon className="w-4 h-4" />
            )}
            <span>Testēt savienojumu</span>
          </button>
          
          <button
            onClick={clearCache}
            className="btn-ghost flex items-center space-x-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Notīrīt kešatmiņu</span>
          </button>

          <div className="ml-auto flex items-center space-x-2 text-xs text-muted">
            <CurrencyDollarIcon className="w-4 h-4" />
            <span>Izmaksas tiek sekoto reālajā laikā</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;