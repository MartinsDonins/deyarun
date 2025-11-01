/**
 * Onboarding TypeScript type definitions
 * Defines interfaces for user onboarding data collection
 */

export interface BasicInfo {
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
}

export interface PersonalBests {
  fiveK?: string;
  tenK?: string;
  halfMarathon?: string;
  marathon?: string;
}

export interface RunningExperience {
  level: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  yearsExperience: number;
  weeklyDistance: string;
  personalBests: PersonalBests;
}

export interface TrainingGoals {
  primaryGoal: string;
  targetRaceDate?: string;
  trainingDaysPerWeek: number;
  preferredTrainingTime: string[];
}

export interface HealthInfo {
  injuryHistory?: string;
  currentInjuries?: string;
  medicalConditions?: string;
  medications?: string;
}

export interface OnboardingData {
  basicInfo: BasicInfo;
  runningExperience: RunningExperience;
  trainingGoals: TrainingGoals;
  healthInfo: HealthInfo;
}

export interface WelcomeSlide {
  id: number;
  title: string;
  description: string;
  image: string;
  icon: JSX.Element;
}
