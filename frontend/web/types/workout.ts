export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp?: number;
  altitude?: number;
  speed?: number;
}

export interface Weather {
  temperature?: number;
  humidity?: number;
  conditions?: string;
  windSpeed?: number;
}

export interface Workout {
  id: string;
  userId: string;
  type: 'running' | 'walking' | 'cycling';
  startTime: string;
  endTime?: string;
  duration: number; // seconds
  distance: number; // meters
  pace: string;
  calories?: number;
  heartRateAvg?: number;
  heartRateMax?: number;
  elevationGain?: number;
  effort?: number; // 1-5 scale
  feeling?: number; // 1-5 scale
  notes?: string;
  route?: RoutePoint[];
  weather?: Weather;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalDistance: number;
  totalDuration: number;
  averagePace: string;
  thisWeekDistance: number;
  thisWeekWorkouts: number;
  thisMonthDistance: number;
  thisMonthWorkouts: number;
}