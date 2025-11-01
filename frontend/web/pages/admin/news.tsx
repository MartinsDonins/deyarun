// Admin News Management Page - Complete CRUD interface for managing news articles
// Allows admins to create, edit, delete, and publish news articles

import React, { useState, useEffect } from 'react';
import { useAuth, withAdminAuth } from '../../contexts/AuthContext';
import { analytics } from '../../utils/analytics';
import { getAuthToken } from '../../utils/auth';
import AdminLayout from '../../components/layout/AdminLayout';
import { logger } from '../../lib/productionLogger'
import {
  Plus as PlusIcon,
  Edit as PencilIcon,
  Trash2 as TrashIcon,
  Eye as EyeIcon,
  Search as MagnifyingGlassIcon,
  Filter as FunnelIcon,
  Calendar as CalendarDaysIcon,
  AlertTriangle as ExclamationTriangleIcon,
  Info as InformationCircleIcon,
  CheckCircle as CheckCircleIcon,
  Clock as ClockIcon,
  Tag as TagIcon,
  X as XMarkIcon
} from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  category: 'general' | 'training' | 'features' | 'maintenance' | 'events' | 'updates';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  viewCount: number;
  author?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface NewsFormData {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  priority: string;
  publishedAt: string;
  imageUrl: string;
  tags: string[];
  readTime: string;
}

const AdminNewsPage: React.FC = () => {
  const { user } = useAuth();
  
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
    search: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    content: '',
    excerpt: '',
    category: 'general',
    priority: 'normal',
    publishedAt: new Date().toISOString().slice(0, 16),
    imageUrl: '',
    tags: [],
    readTime: '2 min'
  });

  const itemsPerPage = 10;

  // Fetch news articles
  const fetchNews = async (page = 1, currentFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        status: currentFilters.status
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/news/admin/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNews(data.news);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
        
        analytics.trackAdminAction('view_news_list', 'admin_panel', page);
        
      } else if (response.status === 403) {
        setError('Nav tiesību piekļūt ziņu pārvaldībai');
      } else {
        setError('Neizdevās ielādēt ziņas');
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to fetch news:', { error: error });
      setError('Error ziņu ielādē');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      fetchNews(1, filters);
    } else {
      setError('Nav tiesību piekļūt šai sadaļai');
      setLoading(false);
    }
  }, [user]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    fetchNews(1, newFilters);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: 'general',
      priority: 'normal',
      publishedAt: new Date().toISOString().slice(0, 16),
      imageUrl: '',
      tags: [],
      readTime: '2 min'
    });
  };

  // Handle create new article
  const handleCreate = () => {
    resetForm();
    setEditingArticle(null);
    setShowCreateModal(true);
    analytics.trackAdminAction('start_create_news', 'admin_panel');
  };

  // Handle edit article
  const handleEdit = (article: NewsArticle) => {
    setFormData({
      title: article.title,
      content: '', // Will be loaded separately
      excerpt: article.excerpt,
      category: article.category,
      priority: article.priority,
      publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      imageUrl: '',
      tags: [],
      readTime: '2 min'
    });
    setEditingArticle(article);
    setShowCreateModal(true);
    analytics.trackAdminAction('start_edit_news', 'admin_panel', article.id);
  };

  // Handle save article (create or update)
  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Nosaukums un saturs ir obligāti!');
      return;
    }

    try {
      const url = editingArticle 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/news/admin/${editingArticle.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/news/admin/create`;
      
      const method = editingArticle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.filter(tag => tag.trim() !== '')
        })
      });

      if (response.ok) {
        analytics.trackAdminAction(
          editingArticle ? 'update_news' : 'create_news', 
          'admin_panel', 
          editingArticle?.id || 'new'
        );
        
        setShowCreateModal(false);
        fetchNews(currentPage, filters);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to save article:', { error: error });
      alert('Error saglabāšanā');
    }
  };

  // Handle delete article
  const handleDelete = async (articleId: string) => {
    if (deleteConfirm !== articleId) {
      setDeleteConfirm(articleId);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'}/api/news/admin/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        analytics.trackAdminAction('delete_news', 'admin_panel', articleId);
        fetchNews(currentPage, filters);
        setDeleteConfirm(null);
      } else {
        alert('Error dzēšanā');
      }
    } catch (error) {
      logger.error('ERROR', 'Failed to delete article:', { error: error });
      alert('Error dzēšanā');
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchNews(page, filters);
  };

  // Add tag
  const addTag = () => {
    const tagInput = document.getElementById('tagInput') as HTMLInputElement;
    const tag = tagInput.value.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      });
      tagInput.value = '';
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'high':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />;
      case 'normal':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
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

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges = {
      'published': 'bg-green-500 text-white',
      'draft': 'bg-yellow-500 text-black',
      'archived': 'bg-gray-500 text-white'
    };
    
    const labels = {
      'published': 'Publicēts',
      'draft': 'Melnraksts',
      'archived': 'Arhivēts'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Ziņu pārvaldība">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Ziņu Pārvaldība</h1>
            <p className="text-gray-400 mt-1">
              Pārvaldīt visus jaunumus un paziņojumus
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
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
            
            <button
              onClick={handleCreate}
              className="px-6 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Jauna ziņa</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Statuss
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">Visi</option>
                  <option value="published">Publicēti</option>
                  <option value="draft">Melnraksti</option>
                  <option value="archived">Arhivēti</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Kategorija
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">Visas</option>
                  <option value="general">Vispārīgi</option>
                  <option value="training">Treniņi</option>
                  <option value="features">Jaunumi</option>
                  <option value="maintenance">Uzturēšana</option>
                  <option value="events">Notikumi</option>
                  <option value="updates">Atjauninājumi</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prioritāte
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="all">Visas</option>
                  <option value="urgent">Steidzams</option>
                  <option value="high">Augsts</option>
                  <option value="normal">Normāls</option>
                  <option value="low">Zems</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Meklēt
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nosaukums..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-9 pr-3 py-2 w-full bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
            <div className="text-2xl font-bold text-white">{totalItems}</div>
            <div className="text-sm text-gray-400">Kopā rakstu</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
            <div className="text-2xl font-bold text-green-400">
              {news.filter(n => n.status === 'published').length}
            </div>
            <div className="text-sm text-gray-400">Publicēti</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
            <div className="text-2xl font-bold text-yellow-400">
              {news.filter(n => n.status === 'draft').length}
            </div>
            <div className="text-sm text-gray-400">Melnraksti</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-600">
            <div className="text-2xl font-bold text-red-400">
              {news.filter(n => n.priority === 'urgent').length}
            </div>
            <div className="text-sm text-gray-400">Steidzami</div>
          </div>
        </div>

        {/* News List */}
        {news.length === 0 ? (
          <div className="text-center py-12">
            <InformationCircleIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">Nav ziņu</h2>
            <p className="text-gray-500">Izveidojiet savu pirmo ziņu!</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg border border-slate-600 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Raksts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Kategorija
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Statuss
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Prioritāte
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Skatījumi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Darbības
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {news.map((article) => (
                    <tr key={article.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          {getPriorityIcon(article.priority)}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-white truncate">
                              {article.title}
                            </div>
                            <div className="text-sm text-gray-400 truncate">
                              {article.excerpt}
                            </div>
                            {article.author && (
                              <div className="text-xs text-gray-500">
                                {article.author.firstName} {article.author.lastName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-slate-600 text-gray-300 rounded">
                          {getCategoryLabel(article.category)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(article.status)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          {getPriorityIcon(article.priority)}
                          <span className="text-sm text-gray-300 capitalize">
                            {article.priority}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1 text-sm text-gray-400">
                          <EyeIcon className="w-4 h-4" />
                          <span>{article.viewCount}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <CalendarDaysIcon className="w-4 h-4" />
                          <span>
                            {new Date(article.createdAt).toLocaleDateString('en-US')}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => window.open(`/news/${article.id}`, '_blank')}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title="View"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleEdit(article)}
                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(article.id)}
                            className={`p-2 transition-colors ${
                              deleteConfirm === article.id
                                ? 'text-red-300 bg-red-500/20'
                                : 'text-red-400 hover:text-red-300'
                            }`}
                            title={deleteConfirm === article.id ? 'Noklikšķināt vēlreiz' : 'Delete'}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Rāda {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} no {totalItems}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white disabled:opacity-50"
                    >
                      Iepriekšējā
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded transition-colors ${
                          page === currentPage
                            ? 'bg-coral-500 text-white'
                            : 'bg-slate-700 border border-slate-600 text-white hover:bg-slate-600'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 bg-slate-700 border border-slate-600 rounded text-white disabled:opacity-50"
                    >
                      Nākamā
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white">
                  {editingArticle ? 'Edit ziņu' : 'Jauna ziņa'}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kategorija *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="general">Vispārīgi</option>
                      <option value="training">Treniņi</option>
                      <option value="features">Jaunumi</option>
                      <option value="maintenance">Uzturēšana</option>
                      <option value="events">Notikumi</option>
                      <option value="updates">Atjauninājumi</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Prioritāte *
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="low">Zems</option>
                      <option value="normal">Normāls</option>
                      <option value="high">Augsts</option>
                      <option value="urgent">Steidzams</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nosaukums *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Ievadiet ziņas nosaukumu..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Īss apraksts
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Īss ziņas apraksts, kas rādīsies sarakstā..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Saturs *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={12}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Pilnais ziņas saturs (HTML atbalstīts)..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Publicēšanas datums
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.publishedAt}
                      onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Lasīšanas laiks
                    </label>
                    <input
                      type="text"
                      value={formData.readTime}
                      onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                      placeholder="5 min"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Attēla URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tagi
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      id="tagInput"
                      type="text"
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                      placeholder="Pievienot tagu..."
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-slate-600 text-white text-sm rounded flex items-center space-x-1"
                      >
                        <TagIcon className="w-3 h-3" />
                        <span>{tag}</span>
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-4 p-6 border-t border-slate-700">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
                >
                  {editingArticle ? 'Atjaunināt' : 'Izveidot'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default withAdminAuth(AdminNewsPage);