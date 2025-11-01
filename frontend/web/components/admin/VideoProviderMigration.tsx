import React, { useState } from 'react';
import { useApiOperations } from '../../hooks/useAuthenticatedFetch';

interface VideoProviderMigrationProps {
  onMigrationComplete: () => void;
}

const VIDEO_PROVIDERS = [
  { value: 'firebase', label: 'Firebase Storage', description: 'Self-hosted video files' },
  { value: 'vimeo', label: 'Vimeo', description: 'Professional video hosting' },
  { value: 'youtube', label: 'YouTube', description: 'Public video hosting' },
  { value: 'local', label: 'Local Files', description: 'Development/testing only' }
];

export default function VideoProviderMigration({ onMigrationComplete }: VideoProviderMigrationProps) {
  const [fromProvider, setFromProvider] = useState<string>('firebase');
  const [toProvider, setToProvider] = useState<string>('vimeo');
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; modifiedCount?: number } | null>(null);
  const { post } = useApiOperations();

  const handleMigration = async () => {
    if (fromProvider === toProvider) {
      alert('Source and target providers must be different');
      return;
    }

    if (!confirm(`Are you sure you want to migrate all exercises from ${fromProvider} to ${toProvider}? This action cannot be undone.`)) {
      return;
    }

    setMigrating(true);
    setResult(null);

    try {
      const response = await post('/api/exercises/migrate-videos', {
        from: fromProvider,
        to: toProvider
      });

      if (response.success && response.data) {
        setResult({
          success: true,
          message: response.data.message,
          modifiedCount: response.data.modifiedCount
        });
        
        // Call the completion callback after a short delay
        setTimeout(() => {
          onMigrationComplete();
        }, 2000);
      } else {
        setResult({
          success: false,
          message: response.error || 'Migration failed'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Network error'
      });
    } finally {
      setMigrating(false);
    }
  };

  const getProviderInfo = (provider: string) => {
    return VIDEO_PROVIDERS.find(p => p.value === provider);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Video Provider Migration</h3>
        <p className="text-gray-400 text-sm">
          Migrate exercise videos from one provider to another. This will update the video provider configuration 
          for all exercises that currently use the source provider.
        </p>
      </div>

      {/* Migration Configuration */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              From Provider
            </label>
            <select
              value={fromProvider}
              onChange={(e) => setFromProvider(e.target.value)}
              disabled={migrating}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent disabled:opacity-50"
            >
              {VIDEO_PROVIDERS.map(provider => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {getProviderInfo(fromProvider)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              To Provider
            </label>
            <select
              value={toProvider}
              onChange={(e) => setToProvider(e.target.value)}
              disabled={migrating}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-coral focus:border-transparent disabled:opacity-50"
            >
              {VIDEO_PROVIDERS.map(provider => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {getProviderInfo(toProvider)?.description}
            </p>
          </div>
        </div>

        {/* Migration Arrow */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-4 text-gray-400">
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center mb-2">
                {fromProvider === 'firebase' && '🔥'}
                {fromProvider === 'vimeo' && '📹'}
                {fromProvider === 'youtube' && '📺'}
                {fromProvider === 'local' && '💾'}
              </div>
              <div className="text-xs">{getProviderInfo(fromProvider)?.label}</div>
            </div>
            
            <div className="flex flex-col items-center">
              <svg className="w-8 h-8 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="text-xs mt-1">Migrate</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center mb-2">
                {toProvider === 'firebase' && '🔥'}
                {toProvider === 'vimeo' && '📹'}
                {toProvider === 'youtube' && '📺'}
                {toProvider === 'local' && '💾'}
              </div>
              <div className="text-xs">{getProviderInfo(toProvider)?.label}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-yellow-400 mb-1">Important Notes</h4>
            <ul className="text-sm text-yellow-300 space-y-1">
              <li>• This operation will update the provider configuration for ALL exercises using the source provider</li>
              <li>• Video URLs/IDs will need to be manually updated after migration</li>
              <li>• Consider backing up your data before proceeding</li>
              <li>• This action cannot be undone automatically</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Migration Result */}
      {result && (
        <div className={`rounded-lg p-4 ${
          result.success 
            ? 'bg-green-500/20 border border-green-500/30' 
            : 'bg-red-500/20 border border-red-500/30'
        }`}>
          <div className="flex items-start">
            <svg 
              className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                result.success ? 'text-green-400' : 'text-red-400'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {result.success ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <div>
              <h4 className={`text-sm font-medium mb-1 ${
                result.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.success ? 'Migration Completed' : 'Migration Failed'}
              </h4>
              <p className={`text-sm ${
                result.success ? 'text-green-300' : 'text-red-300'
              }`}>
                {result.message}
              </p>
              {result.success && result.modifiedCount !== undefined && (
                <p className="text-sm text-green-300 mt-1">
                  {result.modifiedCount} exercises were updated.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={onMigrationComplete}
          disabled={migrating}
          className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleMigration}
          disabled={migrating || fromProvider === toProvider}
          className="px-6 py-2 bg-coral text-white rounded-lg hover:bg-coral-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {migrating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Migrating...
            </>
          ) : (
            'Start Migration'
          )}
        </button>
      </div>

      {/* Provider Comparison */}
      <div className="mt-8 border-t border-slate-600 pt-6">
        <h4 className="text-sm font-medium text-gray-300 mb-4">Provider Comparison</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {VIDEO_PROVIDERS.map(provider => (
            <div key={provider.value} className="bg-slate-700/30 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-lg">
                  {provider.value === 'firebase' && '🔥'}
                  {provider.value === 'vimeo' && '📹'}
                  {provider.value === 'youtube' && '📺'}
                  {provider.value === 'local' && '💾'}
                </span>
                <span className="text-sm font-medium text-white">{provider.label}</span>
              </div>
              <p className="text-xs text-gray-400">{provider.description}</p>
              
              <div className="mt-2 space-y-1 text-xs">
                {provider.value === 'firebase' && (
                  <>
                    <div className="text-green-400">✓ Full control</div>
                    <div className="text-green-400">✓ No external dependencies</div>
                    <div className="text-yellow-400">⚠ Storage costs</div>
                  </>
                )}
                {provider.value === 'vimeo' && (
                  <>
                    <div className="text-green-400">✓ Professional quality</div>
                    <div className="text-green-400">✓ Privacy controls</div>
                    <div className="text-yellow-400">⚠ Subscription required</div>
                  </>
                )}
                {provider.value === 'youtube' && (
                  <>
                    <div className="text-green-400">✓ Free hosting</div>
                    <div className="text-green-400">✓ Global CDN</div>
                    <div className="text-red-400">✗ Public only</div>
                  </>
                )}
                {provider.value === 'local' && (
                  <>
                    <div className="text-green-400">✓ Development friendly</div>
                    <div className="text-red-400">✗ Not for production</div>
                    <div className="text-red-400">✗ No CDN</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}