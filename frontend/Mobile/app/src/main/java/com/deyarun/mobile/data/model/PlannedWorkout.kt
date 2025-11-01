package com.deyarun.mobile.data.model

data class PlannedWorkout(
    val id: String,
    val scheduledDate: String,
    val dayOfWeek: String,
    val type: String,
    val name: String,
    val description: String,
    val targetMetrics: TargetMetrics,
    val exercises: Exercises? = null,
    val warmupInstructions: String,
    val cooldownInstructions: String,
    val coachingTips: List<String>,
    val status: String,
    val completionMetrics: CompletionMetrics? = null
)

data class TargetMetrics(
    val totalDistance: Int,
    val totalDuration: Int,
    val averagePace: Int,
    val heartRateZone: HeartRateZone? = null,
    val calories: Int
)

data class HeartRateZone(
    val min: Int,
    val max: Int
)

data class Exercises(
    val warmup: List<Exercise>,
    val cooldown: List<Exercise>,
    val strengthening: List<Exercise>
)

data class Exercise(
    val exerciseId: String,
    val name: String,
    val description: String,
    val videoUrl: String,
    val duration: DurationRange? = null,
    val repetitions: RepetitionRange? = null,
    val sets: SetsRange? = null,
    val targetMuscles: List<String>? = null
)

data class DurationRange(
    val min: Int,
    val max: Int
)

data class RepetitionRange(
    val min: Int,
    val max: Int
)

data class SetsRange(
    val min: Int,
    val max: Int
)

data class CompletionMetrics(
    val actualDistance: Int,
    val actualDuration: Int,
    val actualPace: Int,
    val completionDate: String,
    val effortLevel: Int,
    val notes: String
)
