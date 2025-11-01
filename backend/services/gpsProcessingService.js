// GPS Data Processing Service
// Advanced GPS analytics, route smoothing, and distance calculations

import { GpsPoint } from '../models/mongodb/index.js';

export class GPSProcessingService {
  
  /**
   * Smooth GPS route using Kalman filtering and outlier removal
   * @param {Array} gpsPoints - Array of GPS points
   * @param {Object} options - Smoothing options
   * @returns {Array} - Smoothed GPS points
   */
  static smoothRoute(gpsPoints, options = {}) {
    const {
      accuracyThreshold = 10, // meters
      speedThreshold = 50, // m/s (unrealistic speed)
      distanceThreshold = 100 // meters (max distance between consecutive points)
    } = options;

    if (!gpsPoints || gpsPoints.length < 2) return gpsPoints;

    console.log(`🔄 Smoothing route with ${gpsPoints.length} points`);

    // Step 1: Remove obvious outliers
    let cleanedPoints = this.removeOutliers(gpsPoints, {
      accuracyThreshold,
      speedThreshold,
      distanceThreshold
    });

    // Step 2: Apply Kalman filtering for position smoothing
    let smoothedPoints = this.applyKalmanFilter(cleanedPoints);

    // Step 3: Recalculate distances and speeds
    smoothedPoints = this.recalculateMetrics(smoothedPoints);

    console.log(`✅ Route smoothed: ${gpsPoints.length} → ${smoothedPoints.length} points`);
    
    return smoothedPoints;
  }

  /**
   * Remove GPS outliers based on accuracy, speed, and distance thresholds
   */
  static removeOutliers(points, thresholds) {
    const filtered = [points[0]]; // Keep first point
    
    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const previous = filtered[filtered.length - 1];
      
      // Check accuracy
      if (current.accuracy && current.accuracy > thresholds.accuracyThreshold) {
        console.log(`🚫 Removing point with poor accuracy: ${current.accuracy}m`);
        continue;
      }
      
      // Check speed
      if (current.speed && current.speed > thresholds.speedThreshold) {
        console.log(`🚫 Removing point with unrealistic speed: ${current.speed}m/s`);
        continue;
      }
      
      // Check distance from previous point
      const distance = this.calculateDistance(
        previous.location.coordinates[1], previous.location.coordinates[0],
        current.location.coordinates[1], current.location.coordinates[0]
      );
      
      if (distance > thresholds.distanceThreshold) {
        console.log(`🚫 Removing point with large distance jump: ${distance}m`);
        continue;
      }
      
      filtered.push(current);
    }
    
    return filtered;
  }

  /**
   * Apply Kalman filter for GPS position smoothing
   */
  static applyKalmanFilter(points) {
    if (points.length < 2) return points;
    
    const smoothed = [points[0]];
    
    // Kalman filter parameters
    let Q = 0.001; // Process noise
    let R = 0.01;  // Measurement noise
    let P = 1;     // Error covariance
    let K = 0;     // Kalman gain
    
    let prevLat = points[0].location.coordinates[1];
    let prevLon = points[0].location.coordinates[0];
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const measuredLat = point.location.coordinates[1];
      const measuredLon = point.location.coordinates[0];
      
      // Prediction update
      P = P + Q;
      
      // Measurement update
      K = P / (P + R);
      
      // Estimate update
      const estimatedLat = prevLat + K * (measuredLat - prevLat);
      const estimatedLon = prevLon + K * (measuredLon - prevLon);
      
      // Error covariance update
      P = (1 - K) * P;
      
      // Create smoothed point
      const smoothedPoint = {
        ...point,
        location: {
          type: 'Point',
          coordinates: [estimatedLon, estimatedLat]
        }
      };
      
      smoothed.push(smoothedPoint);
      
      prevLat = estimatedLat;
      prevLon = estimatedLon;
    }
    
    return smoothed;
  }

  /**
   * Recalculate distances and speeds after smoothing
   */
  static recalculateMetrics(points) {
    if (points.length < 2) return points;
    
    let cumulativeDistance = 0;
    
    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const previous = points[i - 1];
      
      // Calculate distance between consecutive points
      const segmentDistance = this.calculateDistance(
        previous.location.coordinates[1], previous.location.coordinates[0],
        current.location.coordinates[1], current.location.coordinates[0]
      );
      
      cumulativeDistance += segmentDistance;
      current.distance = cumulativeDistance;
      
      // Calculate speed
      const timeDiff = (new Date(current.timestamp) - new Date(previous.timestamp)) / 1000; // seconds
      if (timeDiff > 0) {
        current.speed = segmentDistance / timeDiff; // m/s
      }
    }
    
    return points;
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  }

  /**
   * Calculate pace from GPS points
   */
  static calculatePace(gpsPoints) {
    if (!gpsPoints || gpsPoints.length < 2) return null;
    
    const paces = [];
    
    for (let i = 1; i < gpsPoints.length; i++) {
      const current = gpsPoints[i];
      const previous = gpsPoints[i - 1];
      
      const distance = this.calculateDistance(
        previous.location.coordinates[1], previous.location.coordinates[0],
        current.location.coordinates[1], current.location.coordinates[0]
      );
      
      const timeDiff = (new Date(current.timestamp) - new Date(previous.timestamp)) / 1000;
      
      if (distance > 0 && timeDiff > 0) {
        const speed = distance / timeDiff; // m/s
        const pace = (1000 / speed) / 60; // min/km
        
        // Only include reasonable paces (2-20 min/km)
        if (pace >= 2 && pace <= 20) {
          paces.push({
            timestamp: current.timestamp,
            pace: pace,
            distance: distance,
            speed: speed
          });
        }
      }
    }
    
    return paces;
  }

  /**
   * Calculate elevation gain and loss with noise filtering
   */
  static calculateElevation(gpsPoints) {
    const elevationPoints = gpsPoints.filter(point => 
      point.altitude !== null && point.altitude !== undefined
    );
    
    if (elevationPoints.length < 2) return { gain: 0, loss: 0, profile: [] };
    
    // Smooth elevation data to reduce GPS altitude noise
    const smoothedElevations = this.smoothElevationData(
      elevationPoints.map(p => p.altitude)
    );
    
    let gain = 0;
    let loss = 0;
    const profile = [];
    
    for (let i = 1; i < smoothedElevations.length; i++) {
      const diff = smoothedElevations[i] - smoothedElevations[i - 1];
      
      if (Math.abs(diff) > 1) { // Only count elevation changes > 1m
        if (diff > 0) {
          gain += diff;
        } else {
          loss += Math.abs(diff);
        }
      }
      
      profile.push({
        distance: elevationPoints[i].distance || 0,
        elevation: smoothedElevations[i],
        gain: gain,
        loss: loss
      });
    }
    
    return { 
      gain: Math.round(gain), 
      loss: Math.round(loss), 
      profile 
    };
  }

  /**
   * Smooth elevation data using moving average
   */
  static smoothElevationData(elevations, windowSize = 5) {
    const smoothed = [...elevations];
    
    for (let i = windowSize; i < elevations.length - windowSize; i++) {
      let sum = 0;
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        sum += elevations[j];
      }
      smoothed[i] = sum / (2 * windowSize + 1);
    }
    
    return smoothed;
  }

  /**
   * Process workout GPS data and update workout metrics
   */
  static async processWorkoutGPS(workoutId) {
    try {
      console.log(`🔄 Processing GPS data for workout ${workoutId}`);
      
      // Get all GPS points for this workout
      const gpsPoints = await GpsPoint.find({ workoutId })
        .sort({ timestamp: 1 });
      
      if (gpsPoints.length < 2) {
        console.log(`⚠️ Not enough GPS points for processing: ${gpsPoints.length}`);
        return null;
      }
      
      // Smooth the route
      const smoothedPoints = this.smoothRoute(gpsPoints);
      
      // Calculate metrics
      const totalDistance = smoothedPoints.length > 0 ? 
        smoothedPoints[smoothedPoints.length - 1].distance : 0;
      
      const paceData = this.calculatePace(smoothedPoints);
      const elevationData = this.calculateElevation(smoothedPoints);
      
      // Calculate average pace (weighted by distance)
      let averagePace = null;
      if (paceData && paceData.length > 0) {
        const totalWeightedPace = paceData.reduce((sum, p) => sum + (p.pace * p.distance), 0);
        const totalPaceDistance = paceData.reduce((sum, p) => sum + p.distance, 0);
        averagePace = totalPaceDistance > 0 ? totalWeightedPace / totalPaceDistance : null;
      }
      
      // Find best pace
      const bestPace = paceData && paceData.length > 0 ? 
        Math.min(...paceData.map(p => p.pace)) : null;
      
      const result = {
        totalDistance: Math.round(totalDistance),
        averagePace: averagePace ? Math.round(averagePace * 100) / 100 : null,
        bestPace: bestPace ? Math.round(bestPace * 100) / 100 : null,
        elevationGain: elevationData.gain,
        elevationLoss: elevationData.loss,
        smoothedPointsCount: smoothedPoints.length,
        originalPointsCount: gpsPoints.length,
        route: {
          type: 'LineString',
          coordinates: smoothedPoints.map(p => p.location.coordinates)
        }
      };
      
      console.log(`✅ GPS processing complete for workout ${workoutId}:`, {
        distance: result.totalDistance,
        avgPace: result.averagePace,
        elevation: `+${result.elevationGain}m/-${result.elevationLoss}m`
      });
      
      return result;
      
    } catch (error) {
      console.error(`❌ Error processing GPS data for workout ${workoutId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate split times for a workout
   */
  static calculateSplits(gpsPoints, splitDistance = 1000) {
    if (!gpsPoints || gpsPoints.length < 2) return [];
    
    const splits = [];
    let currentDistance = 0;
    let splitStart = 0;
    let splitNumber = 1;
    
    for (let i = 1; i < gpsPoints.length; i++) {
      const segmentDistance = gpsPoints[i].distance - gpsPoints[i - 1].distance;
      currentDistance += segmentDistance;
      
      if (currentDistance >= splitDistance * splitNumber) {
        const splitTime = (new Date(gpsPoints[i].timestamp) - 
                          new Date(gpsPoints[splitStart].timestamp)) / 1000;
        
        const pace = splitTime / (splitDistance / 1000) / 60; // min/km
        
        splits.push({
          split: splitNumber,
          distance: splitDistance,
          time: splitTime,
          pace: Math.round(pace * 100) / 100,
          startIndex: splitStart,
          endIndex: i
        });
        
        splitStart = i;
        splitNumber++;
      }
    }
    
    return splits;
  }

  /**
   * Utility function to convert degrees to radians
   */
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }
}

export default GPSProcessingService;