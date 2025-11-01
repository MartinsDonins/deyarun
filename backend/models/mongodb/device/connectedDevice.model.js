import mongoose from 'mongoose';

const connectedDeviceSchema = new mongoose.Schema({
  userId: { 
    type: String,
    required: true,
    index: true
  },
  deviceType: {
    type: String,
    enum: [
      'APPLE_WATCH',
      'GARMIN_WATCH',
      'POLAR_WATCH',
      'SUUNTO_WATCH',
      'FITBIT_DEVICE',
      'WAHOO_DEVICE',
      'HEART_RATE_STRAP',
      'FOOT_POD',
      'SMART_SHOE'
    ],
    required: true
  },
  manufacturer: String,
  model: String,
  firmwareVersion: String,
  batteryLevel: Number,
  lastSync: Date,
  connectionStatus: {
    type: String,
    enum: ['CONNECTED', 'DISCONNECTED', 'PAIRING', 'ERROR'],
    default: 'DISCONNECTED'
  },
  capabilities: [{
    type: String,
    enum: [
      'HEART_RATE',
      'GPS',
      'STEP_COUNT',
      'CADENCE',
      'STRIDE_LENGTH',
      'GROUND_CONTACT_TIME',
      'VERTICAL_OSCILLATION',
      'POWER',
      'TEMPERATURE',
      'BLOOD_OXYGEN',
      'ECG'
    ]
  }],
  settings: {
    autoSync: { type: Boolean, default: true },
    dataUploadFrequency: { type: Number, default: 1 }, // minutes
    powerSaveMode: { type: Boolean, default: false }
  },
  authData: {
    token: String,
    refreshToken: String,
    expiresAt: Date,
    scope: [String]
  }
}, {
  timestamps: true
});

const ConnectedDevice = mongoose.model('ConnectedDevice', connectedDeviceSchema);
export default ConnectedDevice;
export { ConnectedDevice };