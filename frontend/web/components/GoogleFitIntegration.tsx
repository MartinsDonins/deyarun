import React, { useState, useEffect } from 'react';
import { useTheme, useThemeClasses } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import googleFitService, { GoogleFitConnectionInfo, GoogleFitData } from '../services/googleFitService';
import { logger } from '../lib/productionLogger'

interface GoogleFitIntegrationProps {
  className?: string;
}

const GoogleFitIntegration: React.FC<GoogleFitIntegrationProps> = ({ className = '' }) => {
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();
  const { t } = useLanguage();

  const [connectionInfo, setConnectionInfo] = useState<GoogleFitConnectionInfo>({ connected: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fitnessData, setFitnessData] = useState<GoogleFitData | null>(null);
  const [showData, setShowData] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    loadConnectionStatus();
  }, []);

  const loadConnectionStatus = async () => {
    try {
      setLoading(true);
      const status = await googleFitService.getStatus();
      setConnectionInfo(status);
    } catch (err) {
      logger.error('ERROR', 'Error loading Google Fit status:', { error: err });
      setError('Failed to load Google Fit status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      const authUrl = await googleFitService.getAuthUrl();

      if (!authUrl) {
        throw new Error('No authorization URL received from backend');
      }

      // Open Google Fit authorization in a popup
      const popup = window.open(
        authUrl,
        'googleFitAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }

      // Listen for popup messages
      const messageListener = async (event: MessageEvent) => {
        // Allow messages from any origin (popup window may have different origin during OAuth)
        // We validate the message type instead

        if (event.data.type === 'GOOGLE_FIT_AUTH_SUCCESS') {
          // Backend GET callback already exchanged code for tokens and saved them
          // No need to call handleCallback - just reload status and show success
          setSuccess('Google Fit connected successfully!');
          await loadConnectionStatus();
          popup?.close();
          window.removeEventListener('message', messageListener);
        } else if (event.data.type === 'GOOGLE_FIT_AUTH_ERROR') {
          logger.error('ERROR', 'Google Fit auth error:', { error: event.data.error });
          setError(event.data.error || 'Failed to authorize Google Fit');
          popup?.close();
          window.removeEventListener('message', messageListener);
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
        }
      }, 1000);

    } catch (err) {
      logger.error('ERROR', 'Error connecting Google Fit:', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to connect Google Fit');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Fit? This will remove access to your fitness data.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await googleFitService.disconnect();
      setSuccess('Google Fit disconnected successfully!');
      setFitnessData(null);
      setShowData(false);
      await loadConnectionStatus();
    } catch (err) {
      logger.error('ERROR', 'Error disconnecting Google Fit:', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to disconnect Google Fit');
    } finally {
      setLoading(false);
    }
  };

  const loadFitnessData = async () => {
    try {
      setDataLoading(true);
      setError(null);
      
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const data = await googleFitService.getData(startDate, endDate);
      setFitnessData(data);
      setShowData(true);
    } catch (err) {
      logger.error('ERROR', 'Error loading fitness data:', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to load fitness data');
    } finally {
      setDataLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className={`border border-gray-700 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 2C13.03 2 13.5 2.47 13.5 3V11H21.5C22.03 11 22.5 11.47 22.5 12S22.03 13 21.5 13H13.5V21C13.5 21.53 13.03 22 12.5 22S11.5 21.53 11.5 21V13H3.5C2.97 13 2.5 12.53 2.5 12S2.97 11 3.5 11H11.5V3C11.5 2.47 11.97 2 12.5 2Z"/>
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-white">Google Fit</h4>
            <p className="text-sm text-gray-400">Sync your fitness data from Google Fit</p>
          </div>
        </div>
        
        {connectionInfo.connected ? (
          <div className="flex items-center gap-3">
            <div className="text-sm">
              <div className="text-green-400 font-medium">Connected</div>
              {connectionInfo.connectedAt && (
                <div className="text-gray-400">
                  Connected: {new Date(connectionInfo.connectedAt).toLocaleDateString()}
                </div>
              )}
            </div>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded-lg transition-colors"
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg transition-colors"
          >
            {loading ? 'Connecting...' : 'Connect to Google Fit'}
          </button>
        )}
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
          error 
            ? 'bg-red-900/30 text-red-300 border border-red-700' 
            : 'bg-green-900/30 text-green-300 border border-green-700'
        }`}>
          <span>{error || success}</span>
          <button
            onClick={clearMessages}
            className="text-current hover:opacity-70 transition-opacity"
          >
            ✕
          </button>
        </div>
      )}

      {/* Connected Features */}
      {connectionInfo.connected && (
        <div className="space-y-4">
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <h5 className="text-white font-medium">Fitness Data Preview</h5>
              <button
                onClick={loadFitnessData}
                disabled={dataLoading}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {dataLoading ? 'Loading...' : 'Load Data (Last 7 days)'}
              </button>
            </div>

            {showData && fitnessData && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Steps */}
                {fitnessData.steps && !fitnessData.steps.error && (
                  <div className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                  }`}>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Steps</div>
                    <div className="text-lg font-semibold text-white">
                      {fitnessData.steps.totalSteps?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-gray-400">
                      Avg: {fitnessData.steps.averageSteps?.toLocaleString() || 0}/day
                    </div>
                  </div>
                )}

                {/* Distance */}
                {fitnessData.distance && !fitnessData.distance.error && (
                  <div className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                  }`}>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Distance</div>
                    <div className="text-lg font-semibold text-white">
                      {fitnessData.distance.totalDistance?.toFixed(1) || 0} km
                    </div>
                    <div className="text-xs text-gray-400">
                      Avg: {fitnessData.distance.averageDistance?.toFixed(1) || 0} km/day
                    </div>
                  </div>
                )}

                {/* Calories */}
                {fitnessData.calories && !fitnessData.calories.error && (
                  <div className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                  }`}>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Calories</div>
                    <div className="text-lg font-semibold text-white">
                      {Math.round(fitnessData.calories.totalCalories || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      Avg: {Math.round(fitnessData.calories.averageCalories || 0).toLocaleString()}/day
                    </div>
                  </div>
                )}

                {/* Activities */}
                {fitnessData.activities && !fitnessData.activities.error && (
                  <div className={`p-3 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                  }`}>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Activities</div>
                    <div className="text-lg font-semibold text-white">
                      {fitnessData.activities.totalActivities || 0}
                    </div>
                    <div className="text-xs text-gray-400">
                      Last 7 days
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500">
            <p>✓ Access to steps, distance, calories, and activity data</p>
            <p>✓ Automatic workout sync from Google Fit activities</p>
            <p>✓ Heart rate data integration (if available)</p>
          </div>
        </div>
      )}

      {!connectionInfo.connected && (
        <div className="text-xs text-gray-500">
          Connect Google Fit to automatically sync your fitness data with DeyaRun. 
          We'll import your workouts, steps, distance, and other health metrics to provide 
          better insights and training recommendations.
        </div>
      )}
    </div>
  );
};

export default GoogleFitIntegration;