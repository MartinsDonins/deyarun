import mongoose from 'mongoose';

const GpsPointSchema = new mongoose.Schema({
  workoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workout',
      required: true,
      index: true
    },
    
    // GPS Coordinates
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    
    // Timing
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    elapsedTime: {
      type: Number, // seconds since workout start
      required: true
    },
    
    // GPS Quality
    altitude: {
      type: Number, // meters above sea level
      default: null
    },
    accuracy: {
      type: Number, // GPS accuracy in meters
      default: null
    },
    speed: {
      type: Number, // speed in m/s
      default: null
    },
    heading: {
      type: Number, // direction in degrees (0-360)
      default: null
    },
    
    // Performance Data at this Point
    heartRate: {
      type: Number,
      default: null
    },
    pace: {
      type: Number, // instantaneous pace in min/km
      default: null
    },
    distance: {
      type: Number, // cumulative distance to this point in meters
      default: 0
    },
    
    // Device Status
    batteryLevel: {
      type: Number, // device battery percentage
      default: null
    },
    
    // Additional Sensor Data
    sensors: {
      accelerometer: {
        x: Number,
        y: Number,
        z: Number
      },
      gyroscope: {
        x: Number,
        y: Number,
        z: Number
      },
      magnetometer: {
        x: Number,
        y: Number,
        z: Number
      }
    }
    
}, {
  timestamps: true,
  collection: 'gps_points'
});

// Indexes
GpsPointSchema.index({ workoutId: 1, timestamp: 1 });
GpsPointSchema.index({ workoutId: 1, elapsedTime: 1 });
GpsPointSchema.index({ location: '2dsphere' });

export const GpsPoint = mongoose.model('GpsPoint', GpsPointSchema);