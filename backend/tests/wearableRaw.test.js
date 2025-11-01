import mongoose from 'mongoose';
import WearableRaw from '../models/wearableRaw.model.js';

describe('WearableRaw model', () => {
  it('stores raw payload', () => {
    const wr = new WearableRaw({
      user: new mongoose.Types.ObjectId(),
      deviceType: 'fitbit',
      dataType: 'hr',
      rawPayload: { bpm: 120 }
    });
    expect(wr.rawPayload).toHaveProperty('bpm');
    expect(wr.deviceType).toBe('fitbit');
  });
});
