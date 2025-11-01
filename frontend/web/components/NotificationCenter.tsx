// News/Notification Center Component
// Real notification system replacing mock bell icon

import React, { useState, useEffect, useRef } from 'react';
import { logger } from '../lib/productionLogger';
import { 
  BellIcon, 
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import { analytics } from '../utils/analytics';
import { apiService } from '../lib/api';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: 'general' | 'training' | 'features' | 'maintenance' | 'events' | 'updates';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  publishedAt: string;
  readTime: string;
  imageUrl?: string;
  isUrgent: boolean;
  timeAgo: string;
}

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const data = await apiService.getUnreadNewsCount();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      logger.error('ERROR', 'Failed to fetch unread count:', { error: error });
    }
  };

  // Fetch news feed
  const fetchNews = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getNews(10);
      setNews(data.news.map((item: any) => ({
        ...item,
        timeAgo: formatTimeAgo(item.publishedAt)
      })));
    } catch (error) {
      logger.error('ERROR', 'Failed to fetch news:', { error: error });
      setError('Neizdevās ielādēt jaunumus');
    } finally {
      setLoading(false);
    }
  };

  // Mark news as read
  const markAsRead = async (newsId?: string, markAll = false) => {
    if (!user) return;

    try {
      await apiService.markNewsAsRead(newsId, markAll);

      if (markAll) {
        setUnreadCount(0);
      } else {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }

      // Track analytics
      analytics.trackContentView('news', newsId || 'all', 'Notification Center');
    } catch (error) {
      logger.error('ERROR', 'Failed to mark as read:', { error: error });
    }
  };

  // Toggle notification center
  const toggleCenter = () => {
    if (!isOpen) {
      fetchNews();
      analytics.trackEvent('notification_center_open', 'ui_interaction', 'header');
    }
    setIsOpen(!isOpen);
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch unread count on component mount and user change
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Check for updates every 5 minutes
      const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const publishDate = new Date(dateString);
    const diffInMs = now.getTime() - publishDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return diffInMinutes <= 1 ? 'Tikko' : `${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return diffInHours === 1 ? '1 h' : `${diffInHours} h`;
    } else if (diffInDays < 7) {
      return diffInDays === 1 ? '1 d' : `${diffInDays} d`;
    } else {
      return publishDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Get priority icon and color
  const getPriorityIcon = (priority: string, category: string) => {
    switch (priority) {
      case 'urgent':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      case 'high':
        return <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />;
      case 'normal':
        return category === 'features' ? 
          <CheckCircleIcon className="w-4 h-4 text-green-500" /> :
          <InformationCircleIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <InformationCircleIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get category label
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      'general': 'Vispārīgi',
      'training': 'Treniņi', 
      'features': 'Jaunumi',
      'maintenance': 'Uzturēšana',
      'events': 'Notikumi',
      'updates': 'Atjauninājumi'
    };
    return labels[category] || category;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={toggleCenter}
        className={`relative p-2 rounded-lg transition-colors duration-200 ${
          isOpen 
            ? 'bg-coral-500/20 text-coral-400' 
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        aria-label={`Jaunumi ${unreadCount > 0 ? `(${unreadCount} jauni)` : ''}`}
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="w-6 h-6" />
        ) : (
          <BellIcon className="w-6 h-6" />
        )}
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-coral-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Center Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <BellIcon className="w-5 h-5 text-coral-500" />
              <h3 className="font-semibold text-white">Jaunumi</h3>
              {unreadCount > 0 && (
                <span className="bg-coral-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && user && (
                <button
                  onClick={() => markAsRead(undefined, true)}
                  className="text-xs text-coral-400 hover:text-coral-300 transition-colors"
                >
                  Atzīmēt visu
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-500"></div>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-red-400 text-sm">{error}</p>
                <button 
                  onClick={fetchNews}
                  className="mt-2 text-coral-400 hover:text-coral-300 text-sm transition-colors"
                >
                  Mēģināt vēlreiz
                </button>
              </div>
            ) : news.length === 0 ? (
              <div className="p-8 text-center">
                <InformationCircleIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Nav jaunu ziņojumu</p>
                <p className="text-gray-500 text-sm mt-1">Visi jaunumi ir izlasīti</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {news.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() => {
                      markAsRead(item.id);
                      // Navigate to news article or show modal
                      window.open(`/news/${item.id}`, '_blank');
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getPriorityIcon(item.priority, item.category)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-white truncate">
                            {item.title}
                          </p>
                          {item.isUrgent && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                              STEIDZAMI
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                          {item.excerpt}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center space-x-3">
                            <span className="bg-slate-600 px-2 py-1 rounded text-xs">
                              {getCategoryLabel(item.category)}
                            </span>
                            <span className="flex items-center space-x-1">
                              <ClockIcon className="w-3 h-3" />
                              <span>{item.readTime}</span>
                            </span>
                          </div>
                          <span>{item.timeAgo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {news.length > 0 && (
            <div className="border-t border-slate-700 p-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/news';
                }}
                className="w-full text-center text-coral-400 hover:text-coral-300 text-sm transition-colors"
              >
                Redzēt visus jaunumus →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;