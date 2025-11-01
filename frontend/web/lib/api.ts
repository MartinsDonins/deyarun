// API Configuration and Base Service
import { adminLogger } from './logger'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com';
import { logger } from '../lib/productionLogger'

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface DashboardStats {
  activeUsers: number;
  totalWorkouts: number;
  totalDistance: number;
  averagePace: string;
  trends: {
    activeUsers: number;
    totalWorkouts: number;
    totalDistance: number;
    averagePace: number;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  lastActiveAt?: string;
  isEmailVerified?: boolean;
  emailVerificationSentAt?: string;
}

interface Workout {
  id: string;
  type: string;
  name: string;
  status: 'in_progress' | 'paused' | 'completed';
  startedAt: string;
  finishedAt?: string;
  duration: number;
  distance: number;
  averagePace?: number;
  bestPace?: number;
  calories?: number;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface RecentActivity {
  user: string;
  action: string;
  time: string;
  pace?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';

    // Log API call
    adminLogger.logApiCall(endpoint, method, {
      bodySize: options.body ? String(options.body).length : 0
    });

    const startTime = Date.now();

    const config: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const duration = Date.now() - startTime;

      const data = await response.json();

      // Log API response
      adminLogger.logApiResponse(endpoint, response.status, {
        duration,
        responseSize: JSON.stringify(data).length,
        success: response.ok
      });

      if (!response.ok) {
        const error = new Error(`API Error: ${response.status} ${response.statusText}`);
        adminLogger.logError('API_SERVICE', error, {
          url,
          method,
          status: response.status,
          responseData: data
        });
        throw error;
      }

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof Error) {
        adminLogger.logError('API_SERVICE', error, {
          url,
          method,
          duration,
          type: 'fetch_error'
        });
      }

      throw error;
    }
  }

  // Generic HTTP methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async healthCheck(): Promise<any> {
    return this.request('/health');
  }

  // Dashboard API
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await this.request<{
        success: boolean;
        activeUsers: number;
        totalWorkouts: number;
        totalDistance: number;
        averagePace: string;
        trends: {
          activeUsers: number;
          totalWorkouts: number;
          totalDistance: number;
          averagePace: number;
        };
      }>('/api/dashboard/stats');

      return {
        activeUsers: response.activeUsers,
        totalWorkouts: response.totalWorkouts,
        totalDistance: response.totalDistance,
        averagePace: response.averagePace,
        trends: response.trends
      };
    } catch (error) {
      logger.error('ERROR', 'Error fetching dashboard stats:', { error: error });
      // Return fallback data in case of error
      return {
        activeUsers: 0,
        totalWorkouts: 0,
        totalDistance: 0,
        averagePace: '0:00',
        trends: {
          activeUsers: 0,
          totalWorkouts: 0,
          totalDistance: 0,
          averagePace: 0
        }
      };
    }
  }

  // Users API
  async getUsers(limit: number = 20, offset: number = 0): Promise<User[]> {
    try {
      const response = await this.request<{
        success: boolean;
        users: User[];
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
      }>(`/admin/users?limit=${limit}&offset=${offset}`);

      if (response.success && response.users) {
        return response.users;
      }

      adminLogger.warn('API', 'Failed to fetch users from API, using empty array');
      return [];
    } catch (error) {
      logger.error('ERROR', 'Error fetching users:', { error: error });
      adminLogger.error('API', 'Failed to fetch users', error);
      return [];
    }
  }

  // Workouts API
  async getWorkouts(limit: number = 20, offset: number = 0): Promise<Workout[]> {
    try {
      const response = await this.request<{
        success: boolean;
        workouts: Workout[];
        total: number;
        hasMore: boolean;
      }>(`/api/workouts?limit=${limit}&offset=${offset}`);

      return response.workouts || [];
    } catch (error) {
      logger.error('ERROR', 'Error fetching workouts:', { error: error });
      // Return empty array instead of fake data - let UI handle empty state
      return [];
    }
  }

  // Recent Activity API
  async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      const response = await this.request<{
        success: boolean;
        activities: Array<{
          id: string;
          description: string;
          value: string;
          timestamp: string;
          timeAgo: string;
        }>;
      }>('/api/dashboard/recent-activity');

      return response.activities.map(activity => ({
        user: '', // Description already contains user info
        action: activity.description,
        time: activity.timeAgo,
        pace: activity.value
      }));
    } catch (error) {
      logger.error('ERROR', 'Error fetching recent activity:', { error: error });
      return [
        { user: 'Jūs', action: 'Nav pēdējās aktivitātes', time: 'Sāciet trenēties!', pace: '' }
      ];
    }
  }

  // Leaderboard API
  async getLeaderboard(type: 'distance' | 'pace' | 'workouts' = 'distance', limit: number = 10) {
    try {
      const response = await this.request<any>(`/api/leaderboard?type=${type}&limit=${limit}`);
      return response.leaderboard || [];
    } catch (error) {
      logger.error('ERROR', 'Error fetching leaderboard:', { error: error });
      return [];
    }
  }

  // Coach Tips API
  async getCoachTips(limit: number = 10) {
    try {
      const response = await this.request<any>(`/api/coach-tips?limit=${limit}`);
      return response.tips || [];
    } catch (error) {
      logger.error('ERROR', 'Error fetching coach tips:', { error: error });
      return [];
    }
  }

  // Subscription API
  async getSubscriptionPlans() {
    try {
      const response = await this.request<{
        success: boolean;
        data: {
          plans: any[];
        };
      }>('/api/subscriptions/plans');

      return response.data.plans;
    } catch (error) {
      logger.error('ERROR', 'Error fetching subscription plans:', { error: error });
      throw error;
    }
  }

  async getCurrentSubscription() {
    try {
      const response = await this.request<{
        success: boolean;
        data: {
          subscription: any;
          plan: any;
          usage: any;
        };
      }>('/api/subscriptions/current');

      return response.data;
    } catch (error) {
      logger.error('ERROR', 'Error fetching current subscription:', { error: error });
      throw error;
    }
  }

  async createSubscription(planType: string, billingCycle: string = 'monthly') {
    try {
      logger.info('COMPONENT', '🎯 Creating subscription:', {
        planType,
        billingCycle
      });

      const response = await this.request<{
        success: boolean;
        data: any;
      }>('/api/subscriptions/create', {
        method: 'POST',
        body: JSON.stringify({
          planType,
          billingCycle
        })
      });

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error creating subscription:', { error: error });
      throw error;
    }
  }

  async cancelSubscription(reason?: string) {
    try {
      const response = await this.request<{
        success: boolean;
        message: string;
      }>('/api/subscriptions/cancel', {
        method: 'POST',
        body: JSON.stringify({
          reason
        })
      });

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error cancelling subscription:', { error: error });
      throw error;
    }
  }

  async upgradeSubscription(newPlanType: string, billingCycle: string = 'monthly') {
    try {
      const response = await this.request<{
        success: boolean;
        data: any;
      }>('/api/subscriptions/upgrade', {
        method: 'POST',
        body: JSON.stringify({
          newPlanType,
          billingCycle
        })
      });

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error upgrading subscription:', { error: error });
      throw error;
    }
  }

  // Admin Analytics API
  async getAnalyticsOverview() {
    try {
      const response = await this.request<{
        success: boolean;
        data: any;
        timestamp: string;
      }>('/api/admin/analytics/overview');

      return response.data;
    } catch (error) {
      logger.error('ERROR', 'Error fetching analytics overview:', { error: error });
      throw error;
    }
  }

  async getUserAnalytics(period: string = '6months') {
    try {
      const response = await this.request<{
        success: boolean;
        data: any;
      }>(`/api/admin/analytics/users?period=${period}`);

      return response.data;
    } catch (error) {
      logger.error('ERROR', 'Error fetching user analytics:', { error: error });
      throw error;
    }
  }

  async getWorkoutAnalytics(period: string = '6months') {
    try {
      const response = await this.request<{
        success: boolean;
        data: any;
      }>(`/api/admin/analytics/workouts?period=${period}`);

      return response.data;
    } catch (error) {
      logger.error('ERROR', 'Error fetching workout analytics:', { error: error });
      throw error;
    }
  }

  async getAdminRecentActivity(limit: number = 20) {
    try {
      const response = await this.request<{
        success: boolean;
        data: any;
      }>(`/api/admin/analytics/recent-activity?limit=${limit}`);

      return response.data;
    } catch (error) {
      logger.error('ERROR', 'Error fetching admin recent activity:', { error: error });
      throw error;
    }
  }

  async getPerformanceMetrics(timeframe: string = '24h') {
    try {
      const response = await this.request<{
        success: boolean;
        data: any;
      }>(`/api/admin/analytics/performance-metrics?timeframe=${timeframe}`);

      return response.data;
    } catch (error) {
      logger.error('ERROR', 'Error fetching performance metrics:', { error: error });
      throw error;
    }
  }

  async getAIIntelligence(timeframe: string = '24h') {
    try {
      const response = await this.request<{
        success: boolean;
        data: any;
      }>(`/api/admin/analytics/ai-intelligence?timeframe=${timeframe}`);

      return response.data;
    } catch (error) {
      logger.error('ERROR', 'Error fetching AI intelligence:', { error: error });
      throw error;
    }
  }

  async exportAnalytics(format: string = 'csv', type: string = 'overview', period: string = '30d') {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/analytics/export?format=${format}&type=${type}&period=${period}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Return blob for download
      return await response.blob();
    } catch (error) {
      logger.error('ERROR', 'Error exporting analytics:', { error: error });
      throw error;
    }
  }

  // News API
  async getNews(limit: number = 10, category: string = 'all', priority: string = 'all') {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        category,
        priority
      });

      const response = await this.request<{
        success: boolean;
        news: any[];
        pagination: any;
        categories: string[];
        timestamp: string;
      }>(`/api/news?${params}`);

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error fetching news:', { error: error });
      throw error;
    }
  }

  async getUnreadNewsCount() {
    try {
      const response = await this.request<{
        success: boolean;
        unreadCount: number;
        lastReadDate: string;
      }>('/api/news/user/unread-count');

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error fetching unread count:', { error: error });
      return { unreadCount: 0 };
    }
  }

  async markNewsAsRead(newsId?: string, markAllRead: boolean = false) {
    try {
      const response = await this.request<{
        success: boolean;
        message: string;
      }>('/api/news/user/mark-read', {
        method: 'POST',
        body: JSON.stringify({
          newsId,
          markAllRead
        })
      });

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error marking news as read:', { error: error });
      throw error;
    }
  }

  // Utility functions
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `Pirms ${diffMins} minūtēm`;
    } else if (diffHours < 24) {
      return `Pirms ${diffHours} stundām`;
    } else {
      return `Pirms ${diffDays} dienām`;
    }
  }

  private formatPace(paceMinPerKm: number): string {
    const minutes = Math.floor(paceMinPerKm);
    const seconds = Math.round((paceMinPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  }

  // Admin Subscription Plans API
  async createSubscriptionPlan(planData: any) {
    try {
      const response = await this.request<{
        success: boolean;
        data: any;
      }>('/api/subscriptions/admin/plans', {
        method: 'POST',
        body: JSON.stringify(planData)
      });

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error creating subscription plan:', { error: error });
      throw error;
    }
  }

  async updateSubscriptionPlan(planId: string, planData: any) {
    try {
      const response = await this.request<{
        success: boolean;
        data: any;
      }>(`/api/subscriptions/admin/plans/${planId}`, {
        method: 'PUT',
        body: JSON.stringify(planData)
      });

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error updating subscription plan:', { error: error });
      throw error;
    }
  }

  async deleteSubscriptionPlan(planId: string) {
    try {
      const response = await this.request<{
        success: boolean;
        data: any;
      }>(`/api/subscriptions/admin/plans/${planId}`, {
        method: 'DELETE'
      });

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error deleting subscription plan:', { error: error });
      throw error;
    }
  }

  async getAdminSubscriptionPlans() {
    try {
      const response = await this.request<{
        success: boolean;
        data: { plans: any[] };
      }>('/api/subscriptions/admin/plans');

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error fetching admin subscription plans:', { error: error });
      throw error;
    }
  }

  async getAdminSubscriptions(filters?: any) {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            queryParams.append(key, value as string);
          }
        });
      }

      const url = `/api/admin/subscriptions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      const response = await this.request<{
        success: boolean;
        subscriptions: any[];
      }>(url);

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error fetching admin subscriptions:', { error: error });
      throw error;
    }
  }

  async getSubscriptionDetails(subscriptionId: string) {
    try {
      const response = await this.request<{
        success: boolean;
        subscription: any;
      }>(`/api/admin/subscriptions/${subscriptionId}`);

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error fetching subscription details:', { error: error });
      throw error;
    }
  }

  async updateSubscriptionStatus(subscriptionId: string, action: string) {
    try {
      const response = await this.request<{
        success: boolean;
        message: string;
      }>(`/api/admin/subscriptions/${subscriptionId}/${action}`, {
        method: 'POST'
      });

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error updating subscription status:', { error: error });
      throw error;
    }
  }

  async updateUserSubscription(userId: string, subscriptionData: any) {
    try {
      const response = await this.request<{
        success: boolean;
        message: string;
        data: any;
      }>(`/api/subscriptions/admin/users/${userId}/subscription`, {
        method: 'PUT',
        body: JSON.stringify(subscriptionData)
      });

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error updating user subscription:', { error: error });
      throw error;
    }
  }

  async createUserSubscription(userId: string, subscriptionData: any) {
    try {
      const response = await this.request<{
        success: boolean;
        message: string;
        data: any;
      }>(`/api/subscriptions/admin/users/${userId}/subscription`, {
        method: 'POST',
        body: JSON.stringify(subscriptionData)
      });

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error creating user subscription:', { error: error });
      throw error;
    }
  }

  async cancelUserSubscription(userId: string, reason?: string) {
    try {
      const response = await this.request<{
        success: boolean;
        message: string;
        data: any;
      }>(`/api/subscriptions/admin/users/${userId}/subscription`, {
        method: 'DELETE',
        body: JSON.stringify({ reason })
      });

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error cancelling user subscription:', { error: error });
      throw error;
    }
  }

  // AI Usage Analytics API
  async getAIUsageOverview(period: string = '30d') {
    try {
      const response = await this.request<{
        success: boolean;
        data: any;
      }>(`/api/ai-usage/overview?period=${period}`);

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error fetching AI usage overview:', { error: error });
      throw error;
    }
  }

  async getAIUsageByCourse(limit: number = 20) {
    try {
      const response = await this.request<{
        success: boolean;
        data: any;
      }>(`/api/ai-usage/courses?limit=${limit}`);

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error fetching AI usage by course:', { error: error });
      throw error;
    }
  }

  async getAIUsageByTrainingPlans(limit: number = 20) {
    try {
      const response = await this.request<{
        success: boolean;
        data: any;
      }>(`/api/ai-usage/training-plans?limit=${limit}`);

      return response;
    } catch (error) {
      logger.error('ERROR', 'Error fetching AI usage by training plans:', { error: error });
      throw error;
    }
  }

  async exportAIUsage(format: string = 'csv', limit: number = 1000) {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai-usage/export?format=${format}&limit=${limit}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      logger.error('ERROR', 'Error exporting AI usage:', { error: error });
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types
export type {
  ApiResponse,
  DashboardStats,
  User,
  Workout,
  RecentActivity
};