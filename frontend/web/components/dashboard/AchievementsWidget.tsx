import React, { useState, useEffect } from 'react';
import { TrophyIcon, StarIcon, FireIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { TrophyIcon as TrophySolidIcon } from '@heroicons/react/24/solid';
import ResponsiveCard from '../ui/ResponsiveCard';
import { logger } from '../../lib/productionLogger'

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'trophy' | 'star' | 'fire' | 'check';
  unlocked: boolean;
  unlockedAt?: string;
  progress?: {
    current: number;
    target: number;
    unit: string;
  };
}

interface AchievementsWidgetProps {
  className?: string;
}

const AchievementsWidget: React.FC<AchievementsWidgetProps> = ({ className = '' }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/user/achievements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAchievements(data.achievements || []);
      } else {
        setAchievements([]);
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching achievements:', { error: error });
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };


  const getIcon = (type: string, unlocked: boolean) => {
    const iconClass = `w-6 h-6 ${unlocked ? 'text-yellow-400' : 'text-gray-400'}`;
    
    switch (type) {
      case 'trophy':
        return unlocked ? <TrophySolidIcon className={iconClass} /> : <TrophyIcon className={iconClass} />;
      case 'star':
        return <StarIcon className={iconClass} />;
      case 'fire':
        return <FireIcon className={iconClass} />;
      case 'check':
        return <CheckCircleIcon className={iconClass} />;
      default:
        return <TrophyIcon className={iconClass} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <ResponsiveCard className={className}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-700 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ResponsiveCard>
    );
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const inProgressAchievements = achievements.filter(a => !a.unlocked && a.progress);

  return (
    <ResponsiveCard className={className}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <TrophySolidIcon className="w-5 h-5 text-yellow-400 mr-2" />
            Sasniegumi
          </h3>
          <span className="text-sm text-gray-400">
            {unlockedAchievements.length}/{achievements.length}
          </span>
        </div>

        {/* Recent Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Iegūtie sasniegumi</h4>
            <div className="space-y-2">
              {unlockedAchievements.slice(0, 2).map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center space-x-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                >
                  {getIcon(achievement.icon, true)}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {achievement.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {achievement.description}
                      {achievement.unlockedAt && (
                        <span className="ml-2">• {formatDate(achievement.unlockedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Achievements */}
        {inProgressAchievements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Progresā</h4>
            <div className="space-y-3">
              {inProgressAchievements.slice(0, 2).map((achievement) => {
                const progress = achievement.progress!;
                const percentage = Math.min((progress.current / progress.target) * 100, 100);
                
                return (
                  <div key={achievement.id} className="space-y-2">
                    <div className="flex items-center space-x-3">
                      {getIcon(achievement.icon, false)}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          {achievement.title}
                        </div>
                        <div className="text-xs text-gray-400">
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                    <div className="ml-9">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>{progress.current} / {progress.target} {progress.unit}</span>
                        <span>{Math.round(percentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-coral h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {achievements.length === 0 && (
          <div className="text-center py-6 text-gray-400">
            <TrophyIcon className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-sm">Sāc skrēt, lai iegūtu savus pirmos sasniegumus!</p>
          </div>
        )}
      </div>
    </ResponsiveCard>
  );
};

export default AchievementsWidget;