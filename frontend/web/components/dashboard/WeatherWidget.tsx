import React, { useState, useEffect } from 'react';
import { logger } from '../../lib/productionLogger';
import { 
  SunIcon, 
  CloudIcon, 
  EyeIcon,
  ArrowPathIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import ResponsiveCard from '../ui/ResponsiveCard';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  uvIndex: number;
  airQuality: {
    index: number;
    category: string;
  };
  runningConditions: {
    rating: 'excellent' | 'good' | 'fair' | 'poor';
    message: string;
  };
}

interface WeatherWidgetProps {
  className?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ className = '' }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get user's location
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await fetchWeatherByCoords(latitude, longitude);
          },
          () => {
            // If geolocation fails, use default location (Riga)
            fetchDefaultWeather();
          }
        );
      } else {
        fetchDefaultWeather();
      }
    } catch (error) {
      logger.error('ERROR', 'Error fetching weather:', { error: error });
      setError('Neizdevās ielādēt laika apstākļus');
      setWeather(null);
      setLoading(false);
    }
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    try {
      // TODO: Implement actual weather API call
      // For now, show message that weather service is unavailable
      setTimeout(() => {
        setError('Laika apstākļu pakalpojums nav pieejams');
        setWeather(null);
        setLoading(false);
      }, 500);
    } catch (error) {
      logger.error('ERROR', 'Error fetching weather by coordinates:', { error: error });
      fetchDefaultWeather();
    }
  };

  const fetchDefaultWeather = () => {
    setTimeout(() => {
      setError('Laika apstākļu pakalpojums nav pieejams');
      setWeather(null);
      setLoading(false);
    }, 500);
  };


  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <SunIcon className="w-8 h-8 text-yellow-400" />;
      case 'partly_cloudy':
        return <CloudIcon className="w-8 h-8 text-gray-400" />;
      case 'cloudy':
        return <CloudIcon className="w-8 h-8 text-gray-500" />;
      case 'rainy':
        return <CloudIcon className="w-8 h-8 text-blue-400" />;
      default:
        return <SunIcon className="w-8 h-8 text-yellow-400" />;
    }
  };

  const getConditionText = (condition: string) => {
    const conditions: Record<string, string> = {
      sunny: 'Saulains',
      partly_cloudy: 'Daļēji mākoņains',
      cloudy: 'Mākoņains',
      rainy: 'Lietus',
      snowy: 'Sniegs'
    };
    return conditions[condition] || 'Nav zināms';
  };

  const getRunningConditionColor = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'text-green-400 bg-green-500/20';
      case 'good':
        return 'text-blue-400 bg-blue-500/20';
      case 'fair':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'poor':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getAirQualityColor = (index: number) => {
    if (index <= 50) return 'text-green-400';
    if (index <= 100) return 'text-yellow-400';
    if (index <= 150) return 'text-orange-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <ResponsiveCard className={className}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-8 h-8 bg-gray-700 rounded"></div>
            <div className="flex-1">
              <div className="h-8 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </ResponsiveCard>
    );
  }

  if (error) {
    return (
      <ResponsiveCard className={className}>
        <div className="text-center py-6">
          <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <button
            onClick={fetchWeatherData}
            className="text-coral hover:text-coral-light text-sm"
          >
            Mēģināt vēlreiz
          </button>
        </div>
      </ResponsiveCard>
    );
  }

  if (!weather) return null;

  return (
    <ResponsiveCard className={className}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Laika apstākļi</h3>
          <span className="text-xs text-gray-400">{location}</span>
        </div>

        {/* Current Weather */}
        <div className="flex items-center space-x-4 mb-4">
          {getWeatherIcon(weather.condition)}
          <div className="flex-1">
            <div className="text-2xl font-bold text-white">
              {weather.temperature}°C
            </div>
            <div className="text-sm text-gray-400">
              {getConditionText(weather.condition)}
            </div>
          </div>
        </div>

        {/* Running Conditions */}
        <div className={`p-3 rounded-lg mb-4 ${getRunningConditionColor(weather.runningConditions.rating)}`}>
          <div className="text-sm font-medium">
            Skrēšanas apstākļi
          </div>
          <div className="text-xs opacity-90">
            {weather.runningConditions.message}
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <EyeIcon className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Redzamība:</span>
            <span className="text-white">{weather.visibility} km</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <ArrowPathIcon className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Vējš:</span>
            <span className="text-white">{weather.windSpeed} km/h</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 text-gray-400">💧</div>
            <span className="text-gray-400">Mitrums:</span>
            <span className="text-white">{weather.humidity}%</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <SunIcon className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">UV indekss:</span>
            <span className="text-white">{weather.uvIndex}</span>
          </div>
        </div>

        {/* Air Quality */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Gaisa kvalitāte</span>
            <div className="text-right">
              <div className={`text-sm font-medium ${getAirQualityColor(weather.airQuality.index)}`}>
                {weather.airQuality.category}
              </div>
              <div className="text-xs text-gray-400">
                AQI {weather.airQuality.index}
              </div>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchWeatherData}
          className="w-full mt-3 text-xs text-gray-400 hover:text-coral transition-colors"
        >
          Atjaunināt • Pēdējā atjaunošana: tikko
        </button>
      </div>
    </ResponsiveCard>
  );
};

export default WeatherWidget;