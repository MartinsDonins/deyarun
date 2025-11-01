import mongoose from 'mongoose';
import { 
  Workout,
  GpsPoint,
  ConnectedDevice,
  SensorData
} from '../models/mongodb/index.js';

// Import old models
import Training from '../models/training.model.js_backup';
import GpsData from '../models/gpsData.model.js_backup';
import DeviceConnection from '../models/deviceConnection.model.js';
import WearableRaw from '../models/wearableRaw.model.js';

async function migrateData() {
  try {
    // Migrate training data to workouts
    const trainings = await Training.find({});
    for (const training of trainings) {
      await Workout.create({
        userId: training.user.toString(),
        distance: training.distance,
        duration: training.duration,
        status: training.completed ? 'completed' : 'in_progress',
        startedAt: training.createdAt,
        finishedAt: training.completed ? training.updatedAt : null,
        notes: training.feedback
      });
    }

    // Migrate GPS data
    const gpsData = await GpsData.find({});
    for (const data of gpsData) {
      for (const point of data.track) {
        await GpsPoint.create({
          workoutId: data.training,
          location: {
            type: 'Point',
            coordinates: [point.longitude, point.latitude]
          },
          timestamp: point.timestamp,
          altitude: point.altitude
        });
      }
    }

    // Migrate device connections
    const devices = await DeviceConnection.find({});
    for (const device of devices) {
      await ConnectedDevice.create({
        userId: device.user.toString(),
        deviceType: device.deviceVendor,
        authData: {
          token: device.authToken
        },
        ...device.metadata
      });
    }

    // Migrate wearable data
    const wearableData = await WearableRaw.find({});
    for (const data of wearableData) {
      await SensorData.create({
        deviceId: data.user, // You'll need to map this to the new device ID
        dataType: data.dataType,
        value: data.rawPayload,
        timestamp: data.recordedAt
      });
    }

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateData().then(() => process.exit());