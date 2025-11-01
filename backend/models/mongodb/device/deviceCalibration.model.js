import mongoose from 'mongoose';

const deviceCalibrationSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConnectedDevice',
    required: true
  },
  calibrationType: {
    type: String,
    enum: ['STRIDE_LENGTH', 'HEART_RATE_ZONES', 'POWER_METER', 'GPS'],
    required: true
  },
  calibrationData: mongoose.Schema.Types.Mixed,
  validFrom: {
    type: Date,
    required: true
  },
  validTo: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const DeviceCalibration = mongoose.model('DeviceCalibration', deviceCalibrationSchema);
export default DeviceCalibration;
export { DeviceCalibration };