import React, { useState, useEffect } from 'react';
import { logger } from '../../lib/productionLogger';
import { 
  LinkIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import ResponsiveCard from '../ui/ResponsiveCard';

interface StravaConnection {
  connected: boolean;
  lastSync?: string;
  athleteName?: string;
  totalActivities?: number;
  syncEnabled?: boolean;
  syncErrors?: string[];
}

interface StravaActivity {
  id: string;
  name: string;
  type: string;
  distance: number;
  duration: number;
  date: string;
  synced: boolean;
}

interface StravaWidgetProps {
  className?: string;
}

const StravaWidget: React.FC<StravaWidgetProps> = ({ className = '' }) => {
  const [connection, setConnection] = useState<StravaConnection | null>(null);
  const [recentActivities, setRecentActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchStravaStatus();
  }, []);

  const fetchStravaStatus = async () => {
    try {
      const [statusResponse, activitiesResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/strava/status`, {
          credentials: 'include', // Use httpOnly cookies
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/strava/activities?per_page=5`, {
          credentials: 'include', // Use httpOnly cookies
          headers: {
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        
        const connectionData = {
          connected: statusData.connected && !statusData.expired,
          lastSync: statusData.connectedAt,
          athleteName: statusData.athlete ? `${statusData.athlete.firstname} ${statusData.athlete.lastname}` : undefined,
          totalActivities: 0,
          syncEnabled: statusData.connected,
          syncErrors: statusData.expired ? ['Token ir beidzies - nepieciešams atkārtoti savienoties'] : []
        };

        setConnection(connectionData);

        // Fetch recent activities if connected
        if (activitiesResponse.ok && connectionData.connected) {
          const activitiesData = await activitiesResponse.json();
          const formattedActivities = activitiesData.activities?.slice(0, 3).map((activity: any) => ({
            id: activity.id.toString(),
            name: activity.name,
            type: activity.type,
            distance: (activity.distance / 1000).toFixed(1), // Convert to km
            duration: Math.round(activity.moving_time / 60), // Convert to minutes
            date: activity.start_date,
            synced: activity.imported || false
          })) || [];

          setRecentActivities(formattedActivities);
          
          // Update total activities count
          setConnection(prev => prev ? {
            ...prev,
            totalActivities: activitiesData.activities?.length || 0
          } : null);
        }
      } else {
        setConnection({ connected: false });
        setRecentActivities([]);
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching Strava status:', { error: error });
      setConnection({ connected: false });
      setRecentActivities([]);
    } finally {
      setLoading(false);
    }
  };


  const handleConnect = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/strava/auth`, {
        credentials: 'include', // Use httpOnly cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      } else {
        logger.error('ERROR', 'Failed to get Strava auth URL');
      }
    } catch (error) {
      logger.error('ERROR', 'Error starting Strava connection:', { error: error });
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Vai tiešām vēlaties atvienot Strava kontu?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/strava/disconnect`, {
        method: 'POST',
        credentials: 'include', // Use httpOnly cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setConnection({ connected: false });
        setRecentActivities([]);
      }
    } catch (error) {
      logger.error('ERROR', 'Error disconnecting Strava:', { error: error });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/strava/sync/manual`, {
        method: 'POST',
        credentials: 'include', // Use httpOnly cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('COMPONENT', 'Sync completed:', { result: data.result });
        await fetchStravaStatus();
      }
    } catch (error) {
      logger.error('ERROR', 'Error syncing Strava data:', { error: error });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <ResponsiveCard className={className}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="h-8 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </ResponsiveCard>
    );
  }

  return (
    <ResponsiveCard className={className}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <div className="w-5 h-5 mr-2 bg-gradient-to-r from-orange-500 to-red-500 rounded"></div>
            Strava
          </h3>
          
          {connection?.connected && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="text-coral hover:text-coral-light text-sm flex items-center space-x-1"
            >
              <ArrowPathIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sinhronizēt</span>
            </button>
          )}
        </div>

        {/* Connection Status */}
        {!connection?.connected ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-white" />
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Savienojies ar Strava, lai automātiski sinhronizētu savus treniņus
            </p>
            <button
              onClick={handleConnect}
              className="btn-primary text-sm"
            >
              Connect ar Strava
            </button>
          </div>
        ) : (
          <>
            {/* Connected Status */}
            <div className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
              <CheckCircleIcon className="w-5 h-5 text-green-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">
                  Savienots ar {connection.athleteName}
                </div>
                <div className="text-xs text-gray-400">
                  Pēdējā sinhronizācija: {connection.lastSync ? formatDate(connection.lastSync) : 'Nekad'}
                </div>
              </div>
            </div>

            {/* Sync Errors */}
            {connection.syncErrors && connection.syncErrors.length > 0 && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-yellow-400 mb-1">
                    Sinhronizācijas problēmas
                  </div>
                  {connection.syncErrors.map((error, index) => (
                    <div key={index} className="text-xs text-gray-400">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <ChartBarIcon className="w-5 h-5 text-coral mx-auto mb-1" />
                <div className="text-lg font-bold text-white">
                  {connection.totalActivities || 0}
                </div>
                <div className="text-xs text-gray-400">Aktivitātes</div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <ClockIcon className="w-5 h-5 text-coral mx-auto mb-1" />
                <div className="text-lg font-bold text-white">
                  {connection.syncEnabled ? 'Auto' : 'Manuāli'}
                </div>
                <div className="text-xs text-gray-400">Sinhronizācija</div>
              </div>
            </div>

            {/* Recent Activities */}
            {recentActivities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Pēdējās aktivitātes
                </h4>
                <div className="space-y-2">
                  {recentActivities.slice(0, 2).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-white">
                            {activity.name}
                          </span>
                          {activity.synced && (
                            <CheckCircleIcon className="w-3 h-3 text-green-400" />
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {activity.distance} km • {formatDuration(activity.duration)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(activity.date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disconnect Button */}
            <button
              onClick={handleDisconnect}
              className="w-full mt-4 text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              Atvienot Strava kontu
            </button>
          </>
        )}
      </div>
    </ResponsiveCard>
  );
};

export default StravaWidget;