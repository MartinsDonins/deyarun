/**
 * Zod validation schemas for onboarding forms
 * Provides type-safe validation with Latvian error messages
 */

import { z } from 'zod';

// Time format validation helper
const timeFormatRegex = /^([0-5]?[0-9]):([0-5][0-9])$/; // MM:SS
const marathonTimeRegex = /^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])$/; // HH:MM:SS

export const basicInfoSchema = z.object({
  fullName: z.string()
    .min(2, 'Vārdam jābūt vismaz 2 simboliem')
    .max(100, 'Vārds ir pārāk garš'),
  dateOfBirth: z.string()
    .min(1, 'Dzimšanas datums ir obligāts')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 13 && age <= 100;
    }, 'Vecumam jābūt no 13 līdz 100 gadiem'),
  gender: z.enum(['male', 'female', 'other']).refine((val) => !!val, {
    message: 'Lūdzu izvēlieties dzimumu'
  }),
  weight: z.number()
    .min(30, 'Svars nevar būt mazāks par 30 kg')
    .max(250, 'Svars nevar būt lielāks par 250 kg'),
  height: z.number()
    .min(100, 'Augums nevar būt mazāks par 100 cm')
    .max(250, 'Augums nevar būt lielāks par 250 cm')
});

export const runningExperienceSchema = z.object({
  level: z.enum(['beginner', 'intermediate', 'advanced', 'elite']).refine((val) => !!val, {
    message: 'Lūdzu izvēlieties savu līmeni'
  }),
  yearsExperience: z.number()
    .min(0, 'Nevar būt negatīvs')
    .max(50, 'Nevar būt vairāk par 50 gadiem'),
  weeklyDistance: z.string()
    .min(1, 'Lūdzu izvēlieties nedēļas distanci'),
  personalBests: z.object({
    fiveK: z.string().regex(timeFormatRegex, 'Formāts: MM:SS').optional().or(z.literal('')),
    tenK: z.string().regex(timeFormatRegex, 'Formāts: MM:SS').optional().or(z.literal('')),
    halfMarathon: z.string().regex(marathonTimeRegex, 'Formāts: HH:MM:SS').optional().or(z.literal('')),
    marathon: z.string().regex(marathonTimeRegex, 'Formāts: HH:MM:SS').optional().or(z.literal(''))
  })
});

export const trainingGoalsSchema = z.object({
  primaryGoal: z.string()
    .min(1, 'Lūdzu izvēlieties galveno mērķi'),
  targetRaceDate: z.string().optional(),
  trainingDaysPerWeek: z.number()
    .min(1, 'Vismaz 1 diena nedēļā')
    .max(7, 'Maksimums 7 dienas nedēļā'),
  preferredTrainingTime: z.array(z.string())
    .min(1, 'Izvēlieties vismaz vienu laiku')
});

export const healthInfoSchema = z.object({
  injuryHistory: z.string().optional(),
  currentInjuries: z.string().optional(),
  medicalConditions: z.string().optional(),
  medications: z.string().optional(),
  consent: z.boolean()
    .refine((val) => val === true, 'Jums jāapstiprina, ka informācija ir patiesa')
});

export const onboardingSchema = z.object({
  basicInfo: basicInfoSchema,
  runningExperience: runningExperienceSchema,
  trainingGoals: trainingGoalsSchema,
  healthInfo: healthInfoSchema
});

export type BasicInfoForm = z.infer<typeof basicInfoSchema>;
export type RunningExperienceForm = z.infer<typeof runningExperienceSchema>;
export type TrainingGoalsForm = z.infer<typeof trainingGoalsSchema>;
export type HealthInfoForm = z.infer<typeof healthInfoSchema>;
export type OnboardingForm = z.infer<typeof onboardingSchema>;
