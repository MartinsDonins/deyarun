import mongoose from 'mongoose';

const LapSplitSchema = new mongoose.Schema({
 workoutId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Workout',
     required: true,
     index: true
   },
   
   // Lap Information
   lapNumber: {
     type: Number,
     required: true
   },
   splitType: {
     type: String,
     enum: ['manual', 'auto_distance', 'auto_time'],
     default: 'auto_distance'
   },
   
   // Lap Metrics
   distance: {
     type: Number, // distance of this lap in meters
     required: true
   },
   duration: {
     type: Number, // duration of this lap in seconds
     required: true
   },
   pace: {
     type: Number, // pace for this lap in min/km
     required: true
   },
   
   // Heart Rate for this Lap
   averageHeartRate: {
     type: Number,
     default: null
   },
   maxHeartRate: {
     type: Number,
     default: null
   },
   
   // Elevation Change
   elevationGain: {
     type: Number,
     default: 0
   },
   elevationLoss: {
     type: Number,
     default: 0
   },
   
   // Timing
   startTime: {
     type: Date,
     required: true
   },
   endTime: {
     type: Date,
     required: true
   },
   
   // GPS Points for this Lap
   startLocation: {
     type: {
       type: String,
       enum: ['Point'],
       default: 'Point'
     },
     coordinates: [Number]
   },
   endLocation: {
     type: {
       type: String,
       enum: ['Point'],
       default: 'Point'
     },
     coordinates: [Number]
   }
}, {
  timestamps: true,
  collection: 'lap_splits'
});

// Indexes
LapSplitSchema.index({ workoutId: 1, lapNumber: 1 });

export const LapSplit = mongoose.model('LapSplit', LapSplitSchema);