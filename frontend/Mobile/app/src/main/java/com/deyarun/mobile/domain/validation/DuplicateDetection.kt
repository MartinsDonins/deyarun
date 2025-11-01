package com.deyarun.mobile.domain.validation

import com.deyarun.mobile.data.model.Activity
import com.deyarun.mobile.data.model.StravaActivity
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.abs

/**
 * Result of duplicate detection analysis
 */
data class DuplicateCheckResult(
    val hasDuplicates: Boolean,
    val duplicates: List<DuplicateMatch> = emptyList(),
    val confidence: DuplicateConfidence = DuplicateConfidence.NONE
) {
    val bestMatch: DuplicateMatch?
        get() = duplicates.maxByOrNull { it.similarityScore }
}

/**
 * Individual duplicate match with similarity metrics
 */
data class DuplicateMatch(
    val stravaActivity: StravaActivity,
    val similarityScore: Double, // 0.0 to 1.0
    val matchReasons: List<String>,
    val differences: List<String> = emptyList()
) {
    val isHighConfidence: Boolean
        get() = similarityScore >= 0.85

    val isMediumConfidence: Boolean
        get() = similarityScore >= 0.70 && similarityScore < 0.85

    val isLowConfidence: Boolean
        get() = similarityScore < 0.70
}

/**
 * Confidence level of duplicate detection
 */
enum class DuplicateConfidence {
    NONE,      // No duplicates found
    LOW,       // Possible duplicate (50-69% match)
    MEDIUM,    // Likely duplicate (70-84% match)
    HIGH,      // Almost certain duplicate (85-100% match)
    CERTAIN    // Exact match (100%)
}

/**
 * Duplicate detection system for comparing local activities with Strava activities
 * Uses multiple metrics to determine if an activity already exists on Strava
 */
object DuplicateDetection {

    // Matching thresholds
    private const val TIME_PROXIMITY_MS = 5 * 60 * 1000L // 5 minutes
    private const val DISTANCE_TOLERANCE = 0.05 // 5%
    private const val DURATION_TOLERANCE = 0.10 // 10%
    private const val CALORIES_TOLERANCE = 0.15 // 15%

    /**
     * Check for duplicate activities in Strava
     * Returns detailed analysis with similarity scores
     */
    suspend fun checkForDuplicates(
        activity: Activity,
        stravaActivities: List<StravaActivity>
    ): DuplicateCheckResult {
        if (stravaActivities.isEmpty()) {
            return DuplicateCheckResult(
                hasDuplicates = false,
                confidence = DuplicateConfidence.NONE
            )
        }

        val matches = stravaActivities.mapNotNull { stravaActivity ->
            analyzeSimilarity(activity, stravaActivity)
        }.sortedByDescending { it.similarityScore }

        if (matches.isEmpty()) {
            return DuplicateCheckResult(
                hasDuplicates = false,
                confidence = DuplicateConfidence.NONE
            )
        }

        // Determine overall confidence based on best match
        val bestMatch = matches.first()
        val confidence = when {
            bestMatch.similarityScore >= 1.0 -> DuplicateConfidence.CERTAIN
            bestMatch.similarityScore >= 0.85 -> DuplicateConfidence.HIGH
            bestMatch.similarityScore >= 0.70 -> DuplicateConfidence.MEDIUM
            bestMatch.similarityScore >= 0.50 -> DuplicateConfidence.LOW
            else -> DuplicateConfidence.NONE
        }

        return DuplicateCheckResult(
            hasDuplicates = bestMatch.similarityScore >= 0.70, // Medium confidence or higher
            duplicates = matches.filter { it.similarityScore >= 0.50 }, // Include low confidence
            confidence = confidence
        )
    }

    /**
     * Analyze similarity between local activity and Strava activity
     * Returns null if similarity is too low (< 50%)
     */
    private fun analyzeSimilarity(
        localActivity: Activity,
        stravaActivity: StravaActivity
    ): DuplicateMatch? {
        val matchReasons = mutableListOf<String>()
        val differences = mutableListOf<String>()
        var totalScore = 0.0
        var maxScore = 0.0

        // 1. Time proximity check (weight: 30%)
        val timeWeight = 0.30
        maxScore += timeWeight
        val timeMatch = checkTimeProximity(localActivity, stravaActivity)
        if (timeMatch != null) {
            totalScore += timeMatch.score * timeWeight
            matchReasons.add(timeMatch.reason)
        } else {
            differences.add("Laiki neatbilst (> 5 min starpība)")
        }

        // 2. Distance similarity (weight: 25%)
        val distanceWeight = 0.25
        maxScore += distanceWeight
        val distanceMatch = checkDistanceSimilarity(localActivity, stravaActivity)
        if (distanceMatch != null) {
            totalScore += distanceMatch.score * distanceWeight
            if (distanceMatch.score >= 0.7) {
                matchReasons.add(distanceMatch.reason)
            }
        } else {
            differences.add("Distances būtiski atšķiras")
        }

        // 3. Duration similarity (weight: 25%)
        val durationWeight = 0.25
        maxScore += durationWeight
        val durationMatch = checkDurationSimilarity(localActivity, stravaActivity)
        if (durationMatch != null) {
            totalScore += durationMatch.score * durationWeight
            if (durationMatch.score >= 0.7) {
                matchReasons.add(durationMatch.reason)
            }
        } else {
            differences.add("Ilgumi būtiski atšķiras")
        }

        // 4. Activity type match (weight: 10%)
        val typeWeight = 0.10
        maxScore += typeWeight
        val typeMatch = checkTypeMatch(localActivity, stravaActivity)
        if (typeMatch) {
            totalScore += typeWeight
            matchReasons.add("Vienāds aktivitātes tips")
        } else {
            differences.add("Atšķirīgi aktivitātes tipi")
        }

        // 5. Name similarity (weight: 5%)
        val nameWeight = 0.05
        maxScore += nameWeight
        val nameMatch = checkNameSimilarity(localActivity, stravaActivity)
        if (nameMatch != null && nameMatch.score > 0.5) {
            totalScore += nameMatch.score * nameWeight
            matchReasons.add(nameMatch.reason)
        }

        // 6. Calories similarity (weight: 5% - optional)
        val caloriesWeight = 0.05
        maxScore += caloriesWeight
        val caloriesMatch = checkCaloriesSimilarity(localActivity, stravaActivity)
        if (caloriesMatch != null && caloriesMatch.score > 0.5) {
            totalScore += caloriesMatch.score * caloriesWeight
            matchReasons.add(caloriesMatch.reason)
        }

        // Calculate normalized similarity score (0.0 to 1.0)
        val similarityScore = if (maxScore > 0) totalScore / maxScore else 0.0

        // Only return matches with at least 50% similarity
        return if (similarityScore >= 0.50) {
            DuplicateMatch(
                stravaActivity = stravaActivity,
                similarityScore = similarityScore,
                matchReasons = matchReasons,
                differences = differences
            )
        } else {
            null
        }
    }

    /**
     * Check if activities occurred at similar times
     */
    private fun checkTimeProximity(
        localActivity: Activity,
        stravaActivity: StravaActivity
    ): SimilarityMetric? {
        // Parse Strava ISO date string
        val stravaStartTime = parseIsoDate(stravaActivity.startDate) ?: return null
        val timeDiff = abs(localActivity.startTime.time - stravaStartTime.time)

        return when {
            timeDiff == 0L -> SimilarityMetric(
                score = 1.0,
                reason = "Precīzi vienāds laiks"
            )
            timeDiff < 60000L -> SimilarityMetric( // < 1 minute
                score = 0.95,
                reason = "Laiki sakrīt (< 1 min)"
            )
            timeDiff < TIME_PROXIMITY_MS -> SimilarityMetric( // < 5 minutes
                score = 0.80,
                reason = "Laiki ļoti tuvi (< 5 min)"
            )
            timeDiff < 15 * 60 * 1000L -> SimilarityMetric( // < 15 minutes
                score = 0.50,
                reason = "Laiki tuvi (< 15 min)"
            )
            else -> null
        }
    }

    /**
     * Check distance similarity
     */
    private fun checkDistanceSimilarity(
        localActivity: Activity,
        stravaActivity: StravaActivity
    ): SimilarityMetric? {
        if (localActivity.totalDistance <= 0 || stravaActivity.distance <= 0) {
            return null
        }

        val distanceDiff = abs(localActivity.totalDistance - stravaActivity.distance)
        val distanceRatio = distanceDiff / localActivity.totalDistance

        return when {
            distanceRatio < 0.01 -> SimilarityMetric( // < 1% difference
                score = 1.0,
                reason = "Distances praktiski identiskas"
            )
            distanceRatio < DISTANCE_TOLERANCE -> SimilarityMetric( // < 5% difference
                score = 0.90,
                reason = "Distances ļoti līdzīgas (< 5%)"
            )
            distanceRatio < 0.10 -> SimilarityMetric( // < 10% difference
                score = 0.70,
                reason = "Distances līdzīgas (< 10%)"
            )
            distanceRatio < 0.20 -> SimilarityMetric( // < 20% difference
                score = 0.50,
                reason = "Distances samērā līdzīgas (< 20%)"
            )
            else -> null
        }
    }

    /**
     * Check duration similarity
     */
    private fun checkDurationSimilarity(
        localActivity: Activity,
        stravaActivity: StravaActivity
    ): SimilarityMetric? {
        if (localActivity.totalDuration <= 0) {
            return null
        }

        val stravaDurationMs = stravaActivity.movingTime * 1000L
        val durationDiff = abs(localActivity.totalDuration - stravaDurationMs)
        val durationRatio = durationDiff.toDouble() / localActivity.totalDuration

        return when {
            durationRatio < 0.01 -> SimilarityMetric( // < 1% difference
                score = 1.0,
                reason = "Ilgumi praktiski identiski"
            )
            durationRatio < DURATION_TOLERANCE -> SimilarityMetric( // < 10% difference
                score = 0.90,
                reason = "Ilgumi ļoti līdzīgi (< 10%)"
            )
            durationRatio < 0.20 -> SimilarityMetric( // < 20% difference
                score = 0.70,
                reason = "Ilgumi līdzīgi (< 20%)"
            )
            durationRatio < 0.30 -> SimilarityMetric( // < 30% difference
                score = 0.50,
                reason = "Ilgumi samērā līdzīgi (< 30%)"
            )
            else -> null
        }
    }

    /**
     * Check if activity types match
     */
    private fun checkTypeMatch(
        localActivity: Activity,
        stravaActivity: StravaActivity
    ): Boolean {
        val localType = localActivity.type.name.lowercase()
        val stravaType = stravaActivity.type.lowercase()

        return when {
            localType == stravaType -> true
            localType == "running" && stravaType == "run" -> true
            localType == "walking" && stravaType == "walk" -> true
            localType == "cycling" && stravaType in listOf("ride", "cycling", "virtualride") -> true
            localType == "hiking" && stravaType == "hike" -> true
            else -> false
        }
    }

    /**
     * Check name similarity using simple string comparison
     */
    private fun checkNameSimilarity(
        localActivity: Activity,
        stravaActivity: StravaActivity
    ): SimilarityMetric? {
        val localName = localActivity.name.lowercase().trim()
        val stravaName = stravaActivity.name.lowercase().trim()

        return when {
            localName == stravaName -> SimilarityMetric(
                score = 1.0,
                reason = "Identiski nosaukumi"
            )
            localName.contains(stravaName) || stravaName.contains(localName) -> SimilarityMetric(
                score = 0.70,
                reason = "Līdzīgi nosaukumi"
            )
            else -> null
        }
    }

    /**
     * Check calories similarity (if available)
     */
    private fun checkCaloriesSimilarity(
        localActivity: Activity,
        stravaActivity: StravaActivity
    ): SimilarityMetric? {
        if (localActivity.calories <= 0 || stravaActivity.calories == null || stravaActivity.calories!! <= 0) {
            return null
        }

        val caloriesDiff = abs(localActivity.calories - stravaActivity.calories!!)
        val caloriesRatio = caloriesDiff.toDouble() / localActivity.calories

        return when {
            caloriesRatio < 0.05 -> SimilarityMetric( // < 5% difference
                score = 1.0,
                reason = "Kalorijas ļoti līdzīgas"
            )
            caloriesRatio < CALORIES_TOLERANCE -> SimilarityMetric( // < 15% difference
                score = 0.70,
                reason = "Kalorijas līdzīgas"
            )
            else -> null
        }
    }

    /**
     * Get confidence text for UI display
     */
    fun getConfidenceText(confidence: DuplicateConfidence): String {
        return when (confidence) {
            DuplicateConfidence.CERTAIN -> "Identiska aktivitāte"
            DuplicateConfidence.HIGH -> "Gandrīz noteikti dublikāts"
            DuplicateConfidence.MEDIUM -> "Iespējams dublikāts"
            DuplicateConfidence.LOW -> "Varētu būt dublikāts"
            DuplicateConfidence.NONE -> "Nav dublikātu"
        }
    }

    /**
     * Get confidence color for UI display
     */
    fun getConfidenceColor(confidence: DuplicateConfidence): String {
        return when (confidence) {
            DuplicateConfidence.CERTAIN -> "#D32F2F" // Red
            DuplicateConfidence.HIGH -> "#F57C00" // Orange
            DuplicateConfidence.MEDIUM -> "#FBC02D" // Yellow
            DuplicateConfidence.LOW -> "#AFB42B" // Light Green
            DuplicateConfidence.NONE -> "#4CAF50" // Green
        }
    }

    /**
     * Format similarity score as percentage
     */
    fun formatSimilarityScore(score: Double): String {
        return "${(score * 100).toInt()}%"
    }

    /**
     * Quick check if activity is likely a duplicate
     */
    fun isLikelyDuplicate(checkResult: DuplicateCheckResult): Boolean {
        return checkResult.confidence >= DuplicateConfidence.MEDIUM
    }

    /**
     * Parse ISO date string from Strava API
     */
    private fun parseIsoDate(dateString: String): Date? {
        return try {
            val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
            format.timeZone = TimeZone.getTimeZone("UTC")
            format.parse(dateString)
        } catch (e: Exception) {
            null
        }
    }
}

/**
 * Internal similarity metric for scoring
 */
private data class SimilarityMetric(
    val score: Double, // 0.0 to 1.0
    val reason: String
)
