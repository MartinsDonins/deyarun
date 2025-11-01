// Real-time Workout Service with WebSocket Support
// Handles live workout data streaming, coaching tips, and real-time analytics

import WebSocket from 'ws';
import { Workout } from '../models/mongodb/index.js';
import { GpsPoint } from '../models/mongodb/index.js';
import GPSProcessingService from './gpsProcessingService.js';

class RealtimeWorkoutService {
  constructor() {
    this.clients = new Map(); // workoutId -> Set of WebSocket connections
    this.activeWorkouts = new Map(); // workoutId -> workout data
    this.heartbeatInterval = null;
    
    this.setupHeartbeat();
  }

  // Setup heartbeat to keep connections alive
  setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((clientSet, workoutId) => {
        clientSet.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ping',
              timestamp: Date.now()
            }));
          } else {
            clientSet.delete(ws);
          }
        });
        
        // Clean up empty workout client sets
        if (clientSet.size === 0) {
          this.clients.delete(workoutId);
        }
      });
    }, 30000); // 30 seconds
  }

  // Subscribe client to workout updates
  subscribeToWorkout(ws, workoutId, userId) {
    console.log(`📱 Client subscribing to workout ${workoutId} for user ${userId}`);
    
    if (!this.clients.has(workoutId)) {
      this.clients.set(workoutId, new Set());
    }
    
    const clientSet = this.clients.get(workoutId);
    clientSet.add(ws);
    
    // Store user info on websocket
    ws.workoutId = workoutId;
    ws.userId = userId;
    
    // Send current workout state if available
    if (this.activeWorkouts.has(workoutId)) {
      const workoutData = this.activeWorkouts.get(workoutId);
      this.sendToClient(ws, 'workout_update', workoutData);
    }
    
    console.log(`✅ Client subscribed. Total clients for workout ${workoutId}: ${clientSet.size}`);
  }

  // Unsubscribe client from workout updates
  unsubscribeFromWorkout(ws, workoutId) {
    console.log(`📱 Client unsubscribing from workout ${workoutId}`);
    
    if (this.clients.has(workoutId)) {
      const clientSet = this.clients.get(workoutId);
      clientSet.delete(ws);
      
      if (clientSet.size === 0) {
        this.clients.delete(workoutId);
        console.log(`🧹 No more clients for workout ${workoutId}, cleaning up`);
      }
    }
  }

  // Process real-time workout data
  async processRealtimeWorkoutData(data) {
    try {
      const { workoutId, userId, location, metrics, status } = data;
      
      console.log(`🔄 Processing real-time data for workout ${workoutId}`);
      
      // Update active workout data
      const workoutData = {
        workoutId,
        userId,
        timestamp: Date.now(),
        location,
        metrics,
        status,
        lastUpdate: new Date()
      };
      
      this.activeWorkouts.set(workoutId, workoutData);
      
      // Save GPS point if location provided
      if (location) {
        await this.saveGPSPoint(workoutId, location, metrics);
      }
      
      // Generate coaching tips based on current data
      const coachingTip = await this.generateCoachingTip(workoutData);
      if (coachingTip) {
        this.broadcastToWorkout(workoutId, 'coaching_tip', coachingTip);
      }
      
      // Check for achievements
      const achievement = await this.checkForAchievements(workoutData);
      if (achievement) {
        this.broadcastToWorkout(workoutId, 'achievement', achievement);
      }
      
      // Broadcast update to all subscribers
      this.broadcastToWorkout(workoutId, 'workout_update', workoutData);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error processing real-time workout data:', error);
      return { success: false, error: error.message };
    }
  }

  // Save GPS point to database
  async saveGPSPoint(workoutId, location, metrics) {
    try {
      const gpsPoint = new GpsPoint({
        workoutId,
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        },
        timestamp: new Date(),
        elapsedTime: metrics.elapsedTime || 0,
        altitude: location.altitude,
        accuracy: location.accuracy,
        speed: metrics.speed,
        heartRate: metrics.heartRate,
        pace: this.parsePace(metrics.pace),
        distance: metrics.distance
      });
      
      await gpsPoint.save();
      console.log(`📍 GPS point saved for workout ${workoutId}`);
    } catch (error) {
      console.error('❌ Error saving GPS point:', error);
    }
  }

  // Parse pace string to number (min/km)
  parsePace(paceString) {
    if (!paceString || paceString === '--:--') return null;
    
    const parts = paceString.split(':');
    if (parts.length !== 2) return null;
    
    const minutes = parseInt(parts[0]);
    const seconds = parseInt(parts[1]);
    
    return minutes + (seconds / 60);
  }

  // Generate real-time coaching tips
  async generateCoachingTip(workoutData) {
    try {
      const { metrics, workoutId } = workoutData;
      
      // Get workout context
      const workout = await Workout.findById(workoutId);
      if (!workout) return null;
      
      const tips = [];
      
      // Pace-based tips
      if (metrics.pace && metrics.pace !== '--:--') {
        const currentPace = this.parsePace(metrics.pace);
        
        if (workout.targetPace) {
          const targetPace = this.parsePace(workout.targetPace);
          const paceDiff = currentPace - targetPace;
          
          if (paceDiff > 0.5) { // Running too slow
            tips.push({
              type: 'pace',
              message: `Pick up the pace! You're ${Math.round(paceDiff * 60)} seconds slower than target.`,
              priority: 'medium'
            });
          } else if (paceDiff < -0.5) { // Running too fast
            tips.push({
              type: 'pace',
              message: `Slow down a bit! You're ${Math.round(Math.abs(paceDiff) * 60)} seconds faster than target.`,
              priority: 'medium'
            });
          }
        }
      }
      
      // Heart rate based tips
      if (metrics.heartRate && workout.targetHeartRateZone) {
        const { min, max } = workout.targetHeartRateZone;
        
        if (metrics.heartRate > max) {
          tips.push({
            type: 'heart_rate',
            message: `Heart rate too high (${metrics.heartRate} bpm). Consider slowing down.`,
            priority: 'high'
          });
        } else if (metrics.heartRate < min) {
          tips.push({
            type: 'heart_rate',
            message: `Heart rate below target zone (${metrics.heartRate} bpm). You can push harder!`,
            priority: 'low'
          });
        }
      }
      
      // Distance milestones
      if (metrics.distance && metrics.distance > 0) {
        const distanceKm = metrics.distance / 1000;
        const milestones = [1, 2, 5, 10, 15, 20, 25, 30];
        
        const passedMilestone = milestones.find(km => 
          Math.abs(distanceKm - km) < 0.01 // Within 10 meters
        );
        
        if (passedMilestone) {
          tips.push({
            type: 'motivation',
            message: `Great job! You've completed ${passedMilestone}km. Keep it up!`,
            priority: 'low'
          });
        }
      }
      
      // Hydration reminders (every 20 minutes for long runs)
      if (metrics.elapsedTime && metrics.elapsedTime % 1200 === 0) { // 20 minutes
        tips.push({
          type: 'hydration',
          message: 'Time for a hydration break! Stay hydrated.',
          priority: 'medium'
        });
      }
      
      // Return highest priority tip
      if (tips.length > 0) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        tips.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        
        return {
          id: `tip_${workoutId}_${Date.now()}`,
          workoutId,
          ...tips[0],
          timestamp: Date.now()
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error generating coaching tip:', error);
      return null;
    }
  }

  // Check for achievements
  async checkForAchievements(workoutData) {
    try {
      const { metrics, workoutId, userId } = workoutData;
      
      const achievements = [];
      
      // Distance achievements
      if (metrics.distance) {
        const distanceKm = metrics.distance / 1000;
        const distanceMilestones = [5, 10, 15, 20, 25, 42.195]; // Including marathon
        
        for (const milestone of distanceMilestones) {
          if (Math.abs(distanceKm - milestone) < 0.1) {
            achievements.push({
              type: 'distance',
              title: `${milestone}km Achievement!`,
              description: `You've completed ${milestone}km in one session!`,
              value: milestone,
              unit: 'km'
            });
          }
        }
      }
      
      // Time achievements
      if (metrics.elapsedTime) {
        const timeMinutes = metrics.elapsedTime / 60;
        const timeMilestones = [30, 60, 90, 120, 180]; // minutes
        
        for (const milestone of timeMilestones) {
          if (Math.abs(timeMinutes - milestone) < 1) {
            achievements.push({
              type: 'time',
              title: `${milestone} Minute Runner!`,
              description: `You've been running for ${milestone} minutes straight!`,
              value: milestone,
              unit: 'minutes'
            });
          }
        }
      }
      
      // Pace achievements (personal bests would require database lookup)
      if (metrics.pace && metrics.pace !== '--:--') {
        // This would require comparing against user's historical data
        // For now, just celebrate good paces
        const currentPace = this.parsePace(metrics.pace);
        
        if (currentPace && currentPace < 4.0) { // Sub-4 min/km
          achievements.push({
            type: 'pace',
            title: 'Speed Demon!',
            description: `Amazing pace of ${metrics.pace} per km!`,
            value: currentPace,
            unit: 'min/km'
          });
        }
      }
      
      // Return first achievement
      if (achievements.length > 0) {
        return {
          id: `achievement_${workoutId}_${Date.now()}`,
          workoutId,
          userId,
          ...achievements[0],
          timestamp: Date.now()
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error checking achievements:', error);
      return null;
    }
  }

  // Send message to specific client
  sendToClient(ws, type, data) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type,
          payload: data,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.error('❌ Error sending message to client:', error);
      }
    }
  }

  // Broadcast message to all clients of a workout
  broadcastToWorkout(workoutId, type, data) {
    const clientSet = this.clients.get(workoutId);
    if (!clientSet) return;
    
    console.log(`📡 Broadcasting ${type} to ${clientSet.size} clients for workout ${workoutId}`);
    
    const message = JSON.stringify({
      type,
      payload: data,
      timestamp: Date.now()
    });
    
    clientSet.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          console.error('❌ Error broadcasting to client:', error);
          clientSet.delete(ws);
        }
      } else {
        clientSet.delete(ws);
      }
    });
  }

  // Clean up when workout ends
  async cleanupWorkout(workoutId) {
    console.log(`🧹 Cleaning up workout ${workoutId}`);
    
    // Remove active workout data
    this.activeWorkouts.delete(workoutId);
    
    // Notify all clients that workout has ended
    this.broadcastToWorkout(workoutId, 'workout_ended', { workoutId });
    
    // Remove all client connections
    this.clients.delete(workoutId);
  }

  // Get workout statistics
  getWorkoutStats(workoutId) {
    const workoutData = this.activeWorkouts.get(workoutId);
    if (!workoutData) return null;
    
    const clientCount = this.clients.get(workoutId)?.size || 0;
    
    return {
      workoutId,
      isActive: true,
      lastUpdate: workoutData.lastUpdate,
      connectedClients: clientCount,
      currentMetrics: workoutData.metrics,
      status: workoutData.status
    };
  }

  // Get all active workouts
  getAllActiveWorkouts() {
    const activeWorkouts = [];
    
    this.activeWorkouts.forEach((workoutData, workoutId) => {
      activeWorkouts.push(this.getWorkoutStats(workoutId));
    });
    
    return activeWorkouts;
  }

  // Cleanup service
  cleanup() {
    console.log('🧹 Cleaning up RealtimeWorkoutService');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Close all WebSocket connections
    this.clients.forEach((clientSet) => {
      clientSet.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Service shutdown');
        }
      });
    });
    
    this.clients.clear();
    this.activeWorkouts.clear();
  }
}

// Export singleton instance
export const realtimeWorkoutService = new RealtimeWorkoutService();
export default realtimeWorkoutService;