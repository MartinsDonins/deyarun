// Removed getAuthToken - using httpOnly cookies instead

export interface GoogleFitConnectionInfo {
  connected: boolean;
  connectedAt?: string;
  tokenType?: string;
  hasValidToken?: boolean;
}

export interface GoogleFitData {
  steps?: {
    totalSteps: number;
    dailySteps: Array<{ date: string; steps: number }>;
    averageSteps: number;
    error?: string;
  };
  distance?: {
    totalDistance: number;
    dailyDistance: Array<{ date: string; distance: number }>;
    averageDistance: number;
    error?: string;
  };
  calories?: {
    totalCalories: number;
    dailyCalories: Array<{ date: string; calories: number }>;
    averageCalories: number;
    error?: string;
  };
  heartRate?: {
    readings: Array<{ timestamp: string; bpm: number }>;
    averageHeartRate: number;
    minHeartRate: number;
    maxHeartRate: number;
    totalReadings: number;
    error?: string;
  };
  activities?: {
    totalActivities: number;
    activities: Array<{
      id: string;
      name: string;
      activityType: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
    }>;
    error?: string;
  };
  timeRange: {
    startTime: string;
    endTime: string;
  };
}

export interface SyncResult {
  success: boolean;
  message: string;
  summary?: {
    totalActivities: number;
    syncedCount: number;
    skippedCount: number;
    errorsCount: number;
  };
  timeRange?: {
    startDate: string;
    endDate: string;
  };
  errors?: Array<{
    activityId: string;
    error: string;
  }>;
  needsReauth?: boolean;
}

class GoogleFitService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; message?: string; needsReauth?: boolean; error?: string }> {
    // SECURITY: Using httpOnly cookies for authentication
    const response = await fetch(`${this.baseUrl}/api/google-fit${endpoint}`, {
      ...options,
      credentials: 'include', // Send httpOnly cookie
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `HTTP error! status: ${response.status}`);
    }

    return result;
  }

  /**
   * Get Google Fit authorization URL
   */
  async getAuthUrl(): Promise<string> {
    const result = await this.makeRequest<{ authUrl: string }>('/auth-url');
    
    if (!result.success || !result.data?.authUrl) {
      throw new Error(result.message || 'Failed to get authorization URL');
    }

    return result.data.authUrl;
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(code: string): Promise<{ success: boolean; message: string; connectedAt: string }> {
    const result = await this.makeRequest<{ connectedAt: string }>('/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });

    if (!result.success) {
      throw new Error(result.message || 'Failed to connect Google Fit');
    }

    return {
      success: true,
      message: result.message || 'Google Fit connected successfully',
      connectedAt: result.data?.connectedAt || new Date().toISOString()
    };
  }

  /**
   * Disconnect Google Fit
   */
  async disconnect(): Promise<{ success: boolean; message: string }> {
    const result = await this.makeRequest('/disconnect', {
      method: 'DELETE',
    });

    if (!result.success) {
      throw new Error(result.message || 'Failed to disconnect Google Fit');
    }

    return {
      success: true,
      message: result.message || 'Google Fit disconnected successfully'
    };
  }

  /**
   * Get connection status
   */
  async getStatus(): Promise<GoogleFitConnectionInfo> {
    const result = await this.makeRequest<{
      connected: boolean;
      connectionInfo: GoogleFitConnectionInfo | null;
    }>('/status');

    if (!result.success) {
      throw new Error(result.message || 'Failed to get Google Fit status');
    }

    return result.data?.connectionInfo || { connected: false };
  }

  /**
   * Get Google Fit data for a date range
   */
  async getData(
    startDate: string,
    endDate: string,
    dataTypes?: string[]
  ): Promise<GoogleFitData> {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    if (dataTypes && dataTypes.length > 0) {
      params.append('dataTypes', dataTypes.join(','));
    }

    const result = await this.makeRequest<GoogleFitData>(`/data?${params.toString()}`);

    if (!result.success) {
      if (result.needsReauth) {
        throw new Error('Google Fit authorization expired. Please reconnect.');
      }
      throw new Error(result.message || 'Failed to get Google Fit data');
    }

    return result.data || {} as GoogleFitData;
  }

  /**
   * Get steps data
   */
  async getStepsData(startDate: string, endDate: string) {
    return this.getData(startDate, endDate, ['steps']);
  }

  /**
   * Get distance data
   */
  async getDistanceData(startDate: string, endDate: string) {
    return this.getData(startDate, endDate, ['distance']);
  }

  /**
   * Get calories data
   */
  async getCaloriesData(startDate: string, endDate: string) {
    return this.getData(startDate, endDate, ['calories']);
  }

  /**
   * Get heart rate data
   */
  async getHeartRateData(startDate: string, endDate: string) {
    return this.getData(startDate, endDate, ['heartRate']);
  }

  /**
   * Get activities data
   */
  async getActivitiesData(startDate: string, endDate: string) {
    return this.getData(startDate, endDate, ['activities']);
  }

  /**
   * Sync Google Fit activities to DeyaRun workouts
   */
  async syncActivities(
    startDate: string,
    endDate: string,
    activityTypes: string[] = []
  ): Promise<SyncResult> {
    const result = await this.makeRequest<SyncResult>('/sync', {
      method: 'POST',
      body: JSON.stringify({
        startDate,
        endDate,
        activityTypes,
      }),
    });

    if (!result.success) {
      if (result.needsReauth) {
        return {
          success: false,
          message: 'Google Fit authorization expired. Please reconnect.',
          needsReauth: true
        };
      }
      throw new Error(result.message || 'Failed to sync Google Fit activities');
    }

    return result.data || {
      success: true,
      message: 'Sync completed successfully'
    };
  }

  /**
   * Get available activity types for filtering
   */
  getActivityTypes(): Array<{ value: string; label: string }> {
    return [
      { value: 'running', label: 'Running' },
      { value: 'walking', label: 'Walking' },
      { value: 'biking', label: 'Cycling' },
      { value: 'swimming', label: 'Swimming' },
      { value: 'strength_training', label: 'Strength Training' },
      { value: 'yoga', label: 'Yoga' },
      { value: 'dancing', label: 'Dancing' },
      { value: 'hiking', label: 'Hiking' },
      { value: 'basketball', label: 'Basketball' },
      { value: 'football_soccer', label: 'Soccer' },
      { value: 'tennis', label: 'Tennis' },
      { value: 'golf', label: 'Golf' },
      { value: 'skiing', label: 'Skiing' },
      { value: 'snowboarding', label: 'Snowboarding' },
      { value: 'surfing', label: 'Surfing' },
      { value: 'rock_climbing', label: 'Rock Climbing' },
      { value: 'martial_arts', label: 'Martial Arts' },
      { value: 'boxing', label: 'Boxing' },
      { value: 'aerobics', label: 'Aerobics' },
      { value: 'crossfit', label: 'CrossFit' }
    ];
  }

  /**
   * Format activity duration
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}min`;
  }

  /**
   * Format distance
   */
  formatDistance(kilometers: number): string {
    if (kilometers < 1) {
      return `${Math.round(kilometers * 1000)}m`;
    }
    
    return `${kilometers.toFixed(2)}km`;
  }

  /**
   * Format calories
   */
  formatCalories(calories: number): string {
    return `${Math.round(calories)} cal`;
  }

  /**
   * Get data range suggestions
   */
  getDateRangeOptions(): Array<{ value: string; label: string; startDate: string; endDate: string }> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const last3Months = new Date(today);
    last3Months.setMonth(last3Months.getMonth() - 3);

    return [
      {
        value: 'today',
        label: 'Today',
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      },
      {
        value: 'yesterday',
        label: 'Yesterday',
        startDate: yesterday.toISOString().split('T')[0],
        endDate: yesterday.toISOString().split('T')[0],
      },
      {
        value: 'last7days',
        label: 'Last 7 days',
        startDate: lastWeek.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      },
      {
        value: 'last30days',
        label: 'Last 30 days',
        startDate: lastMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      },
      {
        value: 'last3months',
        label: 'Last 3 months',
        startDate: last3Months.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      },
    ];
  }
}

export default new GoogleFitService();