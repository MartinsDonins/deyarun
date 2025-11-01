import React, { useState, useEffect } from 'react';
import { logger } from '../../lib/productionLogger';
import { 
  FireIcon,
  BeakerIcon,
  ScaleIcon,
  ChartBarIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import ResponsiveCard from '../ui/ResponsiveCard';

interface NutritionData {
  calories: {
    consumed: number;
    burned: number;
    target: number;
  };
  macros: {
    carbs: { consumed: number; target: number };
    protein: { consumed: number; target: number };
    fat: { consumed: number; target: number };
  };
  water: {
    consumed: number; // in ml
    target: number;
  };
  meals: Array<{
    id: string;
    name: string;
    time: string;
    calories: number;
  }>;
  lastUpdated?: string;
}

interface NutritionWidgetProps {
  className?: string;
}

const NutritionWidget: React.FC<NutritionWidgetProps> = ({ className = '' }) => {
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    fetchNutritionData();
  }, []);

  const fetchNutritionData = async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/user/nutrition/${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNutrition(data.nutrition || null);
      } else {
        setNutrition(null);
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching nutrition data:', { error: error });
      setNutrition(null);
    } finally {
      setLoading(false);
    }
  };


  const getCalorieBalance = () => {
    if (!nutrition) return 0;
    return nutrition.calories.consumed - nutrition.calories.burned;
  };

  const getCalorieBalanceColor = () => {
    const balance = getCalorieBalance();
    const target = nutrition?.calories.target || 0;
    
    if (balance < target * 0.8) return 'text-yellow-400';
    if (balance > target * 1.2) return 'text-red-400';
    return 'text-green-400';
  };

  const getMacroPercentage = (consumed: number, target: number) => {
    return Math.min((consumed / target) * 100, 100);
  };

  const getWaterPercentage = () => {
    if (!nutrition) return 0;
    return Math.min((nutrition.water.consumed / nutrition.water.target) * 100, 100);
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  if (loading) {
    return (
      <ResponsiveCard className={className}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </ResponsiveCard>
    );
  }

  if (!nutrition) {
    return (
      <ResponsiveCard className={className}>
        <div className="text-center py-6">
          <BeakerIcon className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 text-sm mb-4">
            Nav pieejamu uztura datu šai dienai
          </p>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="btn-primary text-sm"
          >
            Pievienot ēdienu
          </button>
        </div>
      </ResponsiveCard>
    );
  }

  const calorieBalance = getCalorieBalance();
  const remainingCalories = nutrition.calories.target - calorieBalance;

  return (
    <ResponsiveCard className={className}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <BeakerIcon className="w-5 h-5 text-coral mr-2" />
            Uzturs
          </h3>
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="text-coral hover:text-coral-light text-sm flex items-center space-x-1"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Pievienot</span>
          </button>
        </div>

        {/* Calorie Summary */}
        <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Kalorijas</span>
            <span className={`text-sm font-medium ${getCalorieBalanceColor()}`}>
              {remainingCalories > 0 ? `${remainingCalories} atlikušas` : `${Math.abs(remainingCalories)} pāri`}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-400">Uzņemtas:</span>
              <span className="text-gray-900 dark:text-white">{nutrition.calories.consumed}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-gray-400">Sadedzinātas:</span>
              <span className="text-gray-900 dark:text-white">{nutrition.calories.burned}</span>
            </div>
          </div>
          
          <div className="mt-2">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-coral h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((calorieBalance / nutrition.calories.target) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Macros */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Makroelementi</h4>
          <div className="space-y-2">
            {/* Carbs */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Ogļhidrāti</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-900 dark:text-white">
                  {nutrition.macros.carbs.consumed}g / {nutrition.macros.carbs.target}g
                </span>
                <div className="w-16 bg-gray-700 rounded-full h-1">
                  <div
                    className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${getMacroPercentage(nutrition.macros.carbs.consumed, nutrition.macros.carbs.target)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Protein */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Proteīni</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-900 dark:text-white">
                  {nutrition.macros.protein.consumed}g / {nutrition.macros.protein.target}g
                </span>
                <div className="w-16 bg-gray-700 rounded-full h-1">
                  <div
                    className="bg-green-400 h-1 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${getMacroPercentage(nutrition.macros.protein.consumed, nutrition.macros.protein.target)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Fat */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Tauki</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-900 dark:text-white">
                  {nutrition.macros.fat.consumed}g / {nutrition.macros.fat.target}g
                </span>
                <div className="w-16 bg-gray-700 rounded-full h-1">
                  <div
                    className="bg-yellow-400 h-1 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${getMacroPercentage(nutrition.macros.fat.consumed, nutrition.macros.fat.target)}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Water Intake */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Ūdens</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {(nutrition.water.consumed / 1000).toFixed(1)}L / {(nutrition.water.target / 1000).toFixed(1)}L
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getWaterPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Recent Meals */}
        {nutrition.meals.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Šodienas ēdieni</h4>
            <div className="space-y-1">
              {nutrition.meals.slice(0, 3).map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">{formatTime(meal.time)}</span>
                    <span className="text-gray-900 dark:text-white">{meal.name}</span>
                  </div>
                  <span className="text-gray-400">{meal.calories} kcal</span>
                </div>
              ))}
            </div>
            
            {nutrition.meals.length > 3 && (
              <div className="text-xs text-gray-400 mt-2">
                +{nutrition.meals.length - 3} vēl ēdieni
              </div>
            )}
          </div>
        )}

        {/* Quick Add Section */}
        {showQuickAdd && (
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-gray-900 dark:text-white transition-colors">
                + Brokastis
              </button>
              <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-gray-900 dark:text-white transition-colors">
                + Pusdienas
              </button>
              <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-gray-900 dark:text-white transition-colors">
                + Uzkoda
              </button>
              <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-gray-900 dark:text-white transition-colors">
                + Ūdens
              </button>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {nutrition.lastUpdated && (
          <div className="mt-3 text-xs text-gray-400 text-center">
            Updated: {new Date(nutrition.lastUpdated).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>
    </ResponsiveCard>
  );
};

export default NutritionWidget;