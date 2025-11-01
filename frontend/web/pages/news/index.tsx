// News Feed Page - Main page for viewing all news articles
// Displays news feed with filtering, pagination, and category organization

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { analytics } from '../../utils/analytics';
import { getAuthToken } from '../../utils/auth';
import { logger } from '../../lib/productionLogger'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  TagIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: 'general' | 'training' | 'features' | 'maintenance' | 'events' | 'updates';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  publishedAt: string;
  readTime: string;
  imageUrl?: string;
  tags: string[];
  viewCount: number;
  isUrgent: boolean;
  timeAgo: string;
}

interface NewsFilters {
  category: string;
  priority: string;
  search: string;
}

const NewsPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [filters, setFilters] = useState<NewsFilters>({
    category: 'all',
    priority: 'all',
    search: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const itemsPerPage = 12;

  // Fetch news with filters and pagination
  const fetchNews = async (page = 1, currentFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        category: currentFilters.category,
        priority: currentFilters.priority
      });

      const response = await fetch(`/api/news?${params}`, {
        headers: user ? {
          'Authorization': `Bearer ${getAuthToken()}`
        } : {}
      });

      if (response.ok) {
        const data = await response.json();
        
        setNews(data.news.map((item: any) => ({
          ...item,
          timeAgo: formatTimeAgo(item.publishedAt)
        })));
        
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
        setCategories(data.categories || []);
        
        // Track analytics
        analytics.trackPageView(`/news?page=${page}`, 'News Feed');
        
      } else {
        setError('Neizdevās ielādēt jaunumus');
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to fetch news:', { error: error });
      setError('Error jaunumu ielādē');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNews(1, filters);
  }, []);

  // Handle filter changes
  const handleFilterChange = (key: keyof NewsFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchNews(1, newFilters);
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    const filteredNews = news.filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    if (searchTerm) {
      setNews(filteredNews);
    } else {
      fetchNews(currentPage, filters);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchNews(page, filters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to article
  const handleArticleClick = (articleId: string) => {
    analytics.trackContentView('news_article', articleId, 'News Feed');
    router.push(`/news/${articleId}`);
  };

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
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'high':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />;
      case 'normal':
        return category === 'features' ? 
          <CheckCircleIcon className="w-5 h-5 text-green-500" /> :
          <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-400" />;
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

  // Get priority color class
  const getPriorityColorClass = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-500/5';
      case 'high': return 'border-l-orange-500 bg-orange-500/5';
      case 'normal': return 'border-l-blue-500 bg-blue-500/5';
      default: return 'border-l-gray-500 bg-gray-500/5';
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white">
      {/* Header */}
      <div className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-white">Jaunumi un Ziņojumi</h1>
              <p className="text-gray-400 mt-1">
                Sekojiet līdzi jaunākajām ziņām, atjauninājumiem un svarīgiem paziņojumiem
              </p>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Meklēt jaunumos..."
                  value={filters.search}
                  onChange={(e) => {
                    handleFilterChange('search', e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className="pl-10 pr-4 py-2 w-full sm:w-64 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500"
                />
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${
                  showFilters 
                    ? 'bg-coral-500 border-coral-500 text-white' 
                    : 'border-slate-600 text-gray-400 hover:border-slate-500 hover:text-white'
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
                <span>Filtri</span>
              </button>
            </div>
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kategorija
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                  >
                    <option value="all">Visas kategorijas</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {getCategoryLabel(category)}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Priority Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Prioritāte
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-coral-500"
                  >
                    <option value="all">Visas prioritātes</option>
                    <option value="urgent">Steidzams</option>
                    <option value="high">Augsts</option>
                    <option value="normal">Normāls</option>
                    <option value="low">Zems</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-4">{error}</div>
            <button
              onClick={() => fetchNews(currentPage, filters)}
              className="px-6 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
            >
              Mēģināt vēlreiz
            </button>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <InformationCircleIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">Nav jaunumu</h2>
            <p className="text-gray-500">Pagaidām nav publicēti jauni raksti.</p>
          </div>
        ) : (
          <>
            {/* Results Info */}
            <div className="mb-6 flex items-center justify-between">
              <div className="text-gray-400">
                Rāda {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} no {totalItems} rakstiem
              </div>
            </div>

            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {news.map((article) => (
                <article
                  key={article.id}
                  onClick={() => handleArticleClick(article.id)}
                  className={`bg-slate-800 rounded-lg overflow-hidden border-l-4 hover:bg-slate-700 transition-all duration-200 cursor-pointer group ${getPriorityColorClass(article.priority)}`}
                >
                  {article.imageUrl && (
                    <div className="aspect-video bg-slate-700 relative overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {article.isUrgent && (
                        <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                          STEIDZAMI
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getPriorityIcon(article.priority, article.category)}
                        <span className="text-sm font-medium text-coral-400">
                          {getCategoryLabel(article.category)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{article.timeAgo}</span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-coral-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <ClockIcon className="w-3 h-3" />
                          <span>{article.readTime}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <EyeIcon className="w-3 h-3" />
                          <span>{article.viewCount}</span>
                        </span>
                      </div>
                      
                      {article.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <TagIcon className="w-3 h-3" />
                          <span className="truncate max-w-20">
                            {article.tags[0]}
                          </span>
                          {article.tags.length > 1 && (
                            <span>+{article.tags.length - 1}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                >
                  Iepriekšējā
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      page === currentPage
                        ? 'bg-coral-500 text-white'
                        : 'bg-slate-800 border border-slate-600 text-white hover:bg-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                >
                  Nākamā
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NewsPage;