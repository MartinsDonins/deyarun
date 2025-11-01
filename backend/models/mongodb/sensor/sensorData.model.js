import mongoose from 'mongoose';

const sensorDataSchema = new mongoose.Schema({
  workoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workout',
    required: true,
    index: true
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConnectedDevice',
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  dataType: {
    type: String,
    enum: [
      'HEART_RATE',
      'CADENCE',
      'STRIDE_LENGTH',
      'GROUND_CONTACT_TIME',
      'VERTICAL_OSCILLATION',
      'POWER',
      'TEMPERATURE',
      'BLOOD_OXYGEN',
      'ECG'
    ],
    required: true
  },
  value: mongoose.Schema.Types.Mixed,
  accuracy: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH']
  },
  unit: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  timeseries: {
    timeField: 'timestamp',
    metaField: 'workoutId',
  granularity: 'seconds'
  }
});

const SensorData = mongoose.model('SensorData', sensorDataSchema);
export default SensorData;
export { SensorData };