package com.deyarun.mobile.data.model

import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    val firstName: String? = null,
    val lastName: String? = null,
    val email: String,
    val phone: String? = null,
    val birthDate: String? = null,
    val age: Int? = null,
    val gender: String? = null,
    val weight: Double? = null,
    val height: Double? = null,
    val fitnessLevel: String? = null,
    val weeklyGoal: String? = null,
    val preferredPace: String? = null,
    val runningExperience: String? = null,
    val injuryHistory: String? = null,
    val preferredDistance: String? = null,
    val timezone: String? = null,
    val units: String? = null,

    // Extended training profile fields
    val hasRunningExperience: Boolean? = null,
    val longestRunEver: String? = null,
    val longestRunLastMonth: String? = null,
    val personalBest5k: String? = null,
    val personalBest10k: String? = null,
    val workoutsPerWeekCurrent: Int? = null,
    val workoutsPerWeekLastMonth: Int? = null,
    val strengthTrainingPerWeek: Int? = null,
    val coreTrainingPerWeek: Int? = null,
    val otherActivities: String? = null,
    val hasRunningShoes: Boolean? = null,
    val runningShoesBrand: String? = null,
    val runningShoesModel: String? = null,
    val hasHeartRateMonitor: Boolean? = null,
    val monitorsHeartRate: Boolean? = null,
    val medicalConditions: String? = null,
    val currentInjuries: String? = null,
    val currentPain: String? = null,
    val hasExcessWeight: Boolean? = null,
    val targetEventType: String? = null,
    val targetEventDate: String? = null,
    val trainingIntensityPref: String? = null,
    val sleepHoursPerNight: Double? = null,
    val stressLevel: String? = null,
    val nutritionQuality: String? = null,

    val isEmailVerified: Boolean = false,
    val isProfileComplete: Boolean = false,
    val theme: String? = null,
    val notificationsEnabled: Boolean = true,
    val locationSharingEnabled: Boolean = false,
    val avatarUrl: String? = null,
    val createdAt: String,
    val updatedAt: String,
    val lastLoginAt: String? = null,

    // Role and subscription information
    val role: String? = null,
    val subscriptionType: String? = null,
    val permissions: List<String>? = null
)