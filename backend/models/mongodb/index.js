// User model (primary)
export { default as User } from './user/user.model.js';

// AI Conversation model
export { default as AIConversation } from './aiConversation/aiConversation.model.js';

// Course and learning models
export { default as Course } from './course/course.model.js';
export { default as UserProgress } from './course/userProgress.model.js';

// Subscription models
export { SubscriptionPlan, UserSubscription } from './subscription/subscription.model.js';
export { default as PaymentHistory } from './subscription/paymentHistory.model.js';

// Core workout-related models
export { Workout } from './workout/workout.model.js';
export { GpsPoint } from './gpsPoint.model.js';
export { LapSplit } from './lapSplit.model.js';

// Analytics models
export { WorkoutAnalytics } from './analytics/workoutAnalytics.model.js';
export { AdvancedWorkoutAnalytics } from './analytics/advancedWorkoutAnalytics.model.js';

// Training plan related models
export { TrainingPlan } from './trainingPlan/trainingPlan.model.js';
export { PlannedWorkout } from './trainingPlan/plannedWorkout.model.js';
export { WorkoutTemplate } from './trainingPlan/workoutTemplate.model.js';
export { TrainingProgramTemplate } from './trainingPlan/trainingProgramTemplate.model.js';

// Device models
export { ConnectedDevice } from './device/connectedDevice.model.js';
export { DeviceCalibration } from './device/deviceCalibration.model.js';

// Strava integration models
export { default as StravaActivity } from './strava/stravaActivity.model.js';

// News and announcements models
export { default as News } from './news/news.model.js';

// AI usage tracking models
export { default as AIUsage } from './ai/aiUsage.model.js';

// Settings models
export { default as SystemSettings } from './settings/systemSettings.model.js';

// Sensor data models
export { SensorData } from './sensor/sensorData.model.js';

// Device-related models (with proper error handling)
let ConnectedDevice, DeviceCalibration, SensorData;

try {
  const connectedDeviceModule = await import('./device/connectedDevice.model.js');
  ConnectedDevice = connectedDeviceModule.default;
} catch (error) {
  console.warn('ConnectedDevice model not available:', error.message);
}

try {
  const deviceCalibrationModule = await import('./device/deviceCalibration.model.js');
  DeviceCalibration = deviceCalibrationModule.default;
} catch (error) {
  console.warn('DeviceCalibration model not available:', error.message);
}

try {
  const sensorDataModule = await import('./sensor/sensorData.model.js');
  SensorData = sensorDataModule.default;
} catch (error) {
  console.warn('SensorData model not available:', error.message);
}