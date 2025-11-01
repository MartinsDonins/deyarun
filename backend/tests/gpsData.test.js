import mongoose from 'mongoose';
import GpsData from '../models/gpsData.model.js';

describe('GpsData model', () => {
  it('initializes with track array', () => {
    const gps = new GpsData({
      user: new mongoose.Types.ObjectId(),
      training: new mongoose.Types.ObjectId(),
      track: [{ latitude: 1, longitude: 2, timestamp: new Date() }]
    });
    expect(Array.isArray(gps.track)).toBe(true);
    expect(gps.track.length).toBe(1);
  });
});
