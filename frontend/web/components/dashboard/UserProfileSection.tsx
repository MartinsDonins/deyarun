// User Profile Section Component for Dashboard
// Displays real user profile information, subscription, and account status

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { analytics } from '../../utils/analytics';
import {
  UserCircleIcon,
  CakeIcon,
  MapPinIcon,
  HeartIcon,
  ScaleIcon,
  TrophyIcon,
  CalendarDaysIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import {
  UserCircleIcon as UserCircleSolidIcon,
  HeartIcon as HeartSolidIcon,
  TrophyIcon as TrophySolidIcon
} from '@heroicons/react/24/solid';

interface UserProfileSectionProps {
  className?: string;
}

const UserProfileSection: React.FC<UserProfileSectionProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);

  if (!user) return null;

  // Calculate age from birth date
  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Format subscription type
  const getSubscriptionInfo = (type: string) => {
    const subscriptions = {
      'free': { label: 'Bezmaksas', color: 'bg-gray-500', icon: null },
      'premium': { label: 'Premium', color: 'bg-blue-500', icon: <TrophySolidIcon className="w-4 h-4" /> },
      'pro': { label: 'Pro', color: 'bg-gradient-to-r from-yellow-400 to-orange-500', icon: <StarIcon className="w-4 h-4" /> }
    };
    return subscriptions[type as keyof typeof subscriptions] || subscriptions.free;
  };

  // Get fitness level color
  const getFitnessLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-400 bg-green-500/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20';
      case 'advanced': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  // Get fitness level label
  const getFitnessLevelLabel = (level: string) => {
    const labels = {
      'beginner': 'Iesācējs',
      'intermediate': 'Vidējais',
      'advanced': 'Pieredzes bagāts'
    };
    return labels[level as keyof typeof labels] || level;
  };

  // Handle edit profile
  const handleEditProfile = () => {
    analytics.trackEvent('edit_profile_click', 'dashboard', 'profile_section');
    // Navigate to profile edit page
    window.location.href = '/profile';
  };

  // Toggle personal info visibility
  const togglePersonalInfo = () => {
    setShowPersonalInfo(!showPersonalInfo);
    analytics.trackEvent('toggle_personal_info', 'dashboard', showPersonalInfo ? 'hide' : 'show');
  };

  const subscriptionInfo = getSubscriptionInfo(user.subscriptionType || 'free');
  // Calculate real age from user birthDate
  const age = user.birthDate ? calculateAge(user.birthDate) : null;
  
  // Format join date from user createdAt
  const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }) : null;

  return (
    <div className={`bg-slate-800 rounded-lg border border-slate-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <UserCircleSolidIcon className="w-8 h-8 text-coral-500" />
          <h2 className="text-xl font-bold text-white">Profila informācija</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePersonalInfo}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
            title={showPersonalInfo ? 'Slēpt personīgo info' : 'Rādīt personīgo info'}
          >
            {showPersonalInfo ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
          
          <button
            onClick={handleEditProfile}
            className="flex items-center space-x-2 px-3 py-2 bg-coral-500 text-white text-sm rounded-lg hover:bg-coral-600 transition-colors"
          >
            <PencilIcon className="w-4 h-4" />
            <span>Rediģēt</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Basic Info */}
        <div className="flex items-start space-x-6 mb-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.avatarUrl || user.profilePicture ? (
              <img
                src={user.avatarUrl || user.profilePicture}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-20 h-20 rounded-full object-cover border-2 border-coral-500"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-coral-500 to-coral-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-2xl font-bold text-white truncate">
                {user.firstName} {user.lastName}
              </h3>
              
              {/* Subscription Badge */}
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-white text-xs font-medium ${subscriptionInfo.color}`}>
                {subscriptionInfo.icon}
                <span>{subscriptionInfo.label}</span>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm mb-2">{user.email}</p>
            
            {/* Status Indicators */}
            <div className="flex items-center space-x-4 text-sm">
              {user.isEmailVerified ? (
                <div className="flex items-center space-x-1 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>E-pasts apstiprināts</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-yellow-400">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>E-pasts nav apstiprināts</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1 text-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Profils aktīvs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Join Date */}
          {joinDate && (
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <CalendarDaysIcon className="w-6 h-6 text-coral-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">{joinDate}</div>
              <div className="text-xs text-gray-400">Pievienojās</div>
            </div>
          )}

          {/* Age */}
          {age && (
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <CakeIcon className="w-6 h-6 text-coral-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">{age}</div>
              <div className="text-xs text-gray-400">Gadi</div>
            </div>
          )}

          {/* Total Workouts */}
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <TrophySolidIcon className="w-6 h-6 text-coral-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">{user.totalWorkouts || 0}</div>
            <div className="text-xs text-gray-400">Treniņi</div>
          </div>

          {/* Login Count */}
          <div className="bg-slate-700/50 rounded-lg p-4 text-center">
            <UserCircleIcon className="w-6 h-6 text-coral-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-white">{user.loginCount || 0}</div>
            <div className="text-xs text-gray-400">Ielogojas</div>
          </div>
        </div>

        {/* Personal Information (Collapsible) */}
        {showPersonalInfo && (
          <div className="border-t border-slate-700 pt-6">
            <h4 className="text-lg font-semibold text-white mb-4">Personīgā informācija</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Physical Stats */}
              <div className="space-y-3">
                <h5 className="font-medium text-gray-300">Fiziskās raksturlielumi</h5>
                
                {user.height && (
                  <div className="flex items-center space-x-2 text-sm">
                    <UserCircleIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">Augums:</span>
                    <span className="text-white">{user.height} cm</span>
                  </div>
                )}
                
                {user.weight && (
                  <div className="flex items-center space-x-2 text-sm">
                    <ScaleIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">Svars:</span>
                    <span className="text-white">{user.weight} kg</span>
                  </div>
                )}
              </div>

              {/* Training Info */}
              <div className="space-y-3">
                <h5 className="font-medium text-gray-300">Treniņu informācija</h5>
                
                {user.fitnessLevel && (
                  <div className="flex items-center space-x-2 text-sm">
                    <HeartSolidIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">Fitness līmenis:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFitnessLevelColor(user.fitnessLevel)}`}>
                      {getFitnessLevelLabel(user.fitnessLevel)}
                    </span>
                  </div>
                )}
                
                {user.weeklyGoal && (
                  <div className="flex items-center space-x-2 text-sm">
                    <TrophyIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">Nedēļas mērķis:</span>
                    <span className="text-white">{user.weeklyGoal} km</span>
                  </div>
                )}
                
                {user.preferredDistance && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">Vēlamā distance:</span>
                    <span className="text-white">{user.preferredDistance.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Health & Recovery */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <h5 className="font-medium text-gray-300 mb-3">Veselība un atjaunošanās</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {user.sleepHours && (
                  <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">{user.sleepHours}h</div>
                    <div className="text-xs text-gray-400">Miega stundu</div>
                  </div>
                )}
                
                {user.stressLevel && (
                  <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">{user.stressLevel}/5</div>
                    <div className="text-xs text-gray-400">Stress līmenis</div>
                  </div>
                )}
                
                {user.nutritionQuality && (
                  <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-white">{user.nutritionQuality}/5</div>
                    <div className="text-xs text-gray-400">Uztura kvalitāte</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileSection;