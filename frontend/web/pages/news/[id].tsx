// Individual News Article Page - Display full news article with content
// Handles article viewing, read tracking, and sharing functionality

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DOMPurify from 'dompurify';
import { useAuth } from '../../contexts/AuthContext';
import { analytics } from '../../utils/analytics';
import { getAuthToken } from '../../utils/auth';
import { logger } from '../../lib/productionLogger'
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  EyeIcon,
  TagIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ShareIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: 'general' | 'training' | 'features' | 'maintenance' | 'events' | 'updates';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  publishedAt: string;
  readTime: string;
  imageUrl?: string;
  tags: string[];
  viewCount: number;
  author?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const NewsArticlePage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Fetch article details
  useEffect(() => {
    if (!id) return;

    const fetchArticle = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/news/${id}`, {
          headers: user ? {
            'Authorization': `Bearer ${getAuthToken()}`
          } : {}
        });

        if (response.ok) {
          const data = await response.json();
          setArticle(data.article);
          
          // Mark as read if user is logged in
          if (user) {
            await markAsRead(id as string);
          }
          
          // Track analytics
          analytics.trackContentView('news_article', id as string, data.article.title);
          
        } else if (response.status === 404) {
          setError('Raksts nav atrasts');
        } else {
          setError('Neizdevās ielādēt rakstu');
        }
      } catch (error) {
        logger.error('ERROR', 'Failed to fetch article:', { error: error });
        setError('Error raksta ielādē');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, user]);

  // Mark article as read
  const markAsRead = async (articleId: string) => {
    if (!user) return;

    try {
      await fetch('/api/news/user/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ newsId: articleId })
      });
    } catch (error) {
      logger.error('ERROR', 'Failed to mark as read:', { error: error });
    }
  };

  // Handle share functionality
  const handleShare = async () => {
    const shareData = {
      title: article?.title,
      text: article?.excerpt,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        analytics.trackShare('news_article', id as string, 'native_share');
      } catch (error) {
        logger.info('COMPONENT', 'Share cancelled');
      }
    } else {
      // Fallback to copying URL
      await navigator.clipboard.writeText(window.location.href);
      analytics.trackShare('news_article', id as string, 'copy_link');
      // Could add a toast notification here
    }
  };

  // Handle bookmark functionality (placeholder)
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    analytics.trackEvent(`news_bookmark_${isBookmarked ? 'remove' : 'add'}`, 'engagement', id as string);
    // Could implement actual bookmark storage here
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get priority icon and color
  const getPriorityIcon = (priority: string, category: string) => {
    switch (priority) {
      case 'urgent':
        return <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />;
      case 'high':
        return <ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />;
      case 'normal':
        return category === 'features' ? 
          <CheckCircleIcon className="w-6 h-6 text-green-500" /> :
          <InformationCircleIcon className="w-6 h-6 text-blue-500" />;
      default:
        return <InformationCircleIcon className="w-6 h-6 text-gray-400" />;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-dark text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500"></div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">{error || 'Raksts nav atrasts'}</div>
            <Link
              href="/news"
              className="inline-flex items-center space-x-2 px-6 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Atpakaļ uz jaunumiem</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/news"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Atpakaļ uz jaunumiem</span>
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-8">
          {/* Category and Priority */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              {getPriorityIcon(article.priority, article.category)}
              <span className="text-coral-400 font-medium">
                {getCategoryLabel(article.category)}
              </span>
            </div>
            
            {article.priority === 'urgent' && (
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                STEIDZAMI
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
            {article.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 mb-6">
            <div className="flex items-center space-x-2">
              <CalendarDaysIcon className="w-4 h-4" />
              <span>{formatDate(article.publishedAt)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-4 h-4" />
              <span>{article.readTime}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <EyeIcon className="w-4 h-4" />
              <span>{article.viewCount} skatījumi</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-gray-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              <ShareIcon className="w-4 h-4" />
              <span>Dalīties</span>
            </button>
            
            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                isBookmarked
                  ? 'bg-coral-500 border-coral-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-gray-300 hover:text-white hover:border-slate-500'
              }`}
            >
              <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              <span>{isBookmarked ? 'Saglabāts' : 'Saglabāt'}</span>
            </button>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex items-center space-x-2 mb-6">
              <TagIcon className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-slate-800 border border-slate-600 rounded-md text-xs text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Featured Image */}
        {article.imageUrl && (
          <div className="mb-8">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Article Content */}
        <article className="prose prose-invert prose-lg max-w-none mb-12">
          <div 
            className="text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(article.content.replace(/\n/g, '<br/>'), {
                ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img'],
                ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel']
              })
            }}
          />
        </article>

        {/* Author Information */}
        {article.author && (
          <div className="border-t border-slate-700 pt-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-white">
                  {article.author.firstName[0]}{article.author.lastName[0]}
                </span>
              </div>
              <div>
                <div className="text-white font-medium">
                  {article.author.firstName} {article.author.lastName}
                </div>
                <div className="text-gray-400 text-sm">
                  Raksta autors
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Related Articles CTA */}
        <div className="border-t border-slate-700 pt-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-4">
              Vairāk jaunumu
            </h3>
            <Link
              href="/news"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
            >
              <span>Skatīt visus jaunumus</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsArticlePage;