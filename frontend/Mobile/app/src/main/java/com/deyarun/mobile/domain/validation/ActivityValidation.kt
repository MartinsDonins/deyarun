package com.deyarun.mobile.domain.validation

import com.deyarun.mobile.data.model.Activity
import com.deyarun.mobile.data.model.ActivityStatus
import com.deyarun.mobile.data.model.ActivityType

/**
 * Validation result for activity data
 * Contains validation status and list of issues found
 */
data class ValidationResult(
    val isValid: Boolean,
    val issues: List<ValidationIssue> = emptyList(),
    val severity: ValidationSeverity = ValidationSeverity.NONE
) {
    val hasErrors: Boolean
        get() = issues.any { it.severity == ValidationSeverity.ERROR }

    val hasWarnings: Boolean
        get() = issues.any { it.severity == ValidationSeverity.WARNING }

    val errorCount: Int
        get() = issues.count { it.severity == ValidationSeverity.ERROR }

    val warningCount: Int
        get() = issues.count { it.severity == ValidationSeverity.WARNING }
}

/**
 * Individual validation issue
 */
data class ValidationIssue(
    val field: String,
    val message: String,
    val severity: ValidationSeverity,
    val suggestion: String? = null
)

/**
 * Validation severity levels
 */
enum class ValidationSeverity {
    NONE,     // No issues
    WARNING,  // Non-critical issue that might affect sync
    ERROR     // Critical issue that will prevent sync
}

/**
 * Comprehensive activity validation logic
 * Validates all required fields and data integrity
 */
object ActivityValidation {

    /**
     * Validate activity for sync readiness
     * Checks all required fields and data integrity
     */
    fun validateActivity(activity: Activity): ValidationResult {
        val issues = mutableListOf<ValidationIssue>()

        // Required field validations
        validateRequiredFields(activity, issues)

        // Data integrity validations
        validateDataIntegrity(activity, issues)

        // GPS data validations
        validateGpsData(activity, issues)

        // Calculate overall severity
        val severity = when {
            issues.any { it.severity == ValidationSeverity.ERROR } -> ValidationSeverity.ERROR
            issues.any { it.severity == ValidationSeverity.WARNING } -> ValidationSeverity.WARNING
            else -> ValidationSeverity.NONE
        }

        return ValidationResult(
            isValid = issues.none { it.severity == ValidationSeverity.ERROR },
            issues = issues,
            severity = severity
        )
    }

    /**
     * Validate required fields
     */
    private fun validateRequiredFields(activity: Activity, issues: MutableList<ValidationIssue>) {
        // ID validation
        if (activity.id.isBlank()) {
            issues.add(
                ValidationIssue(
                    field = "id",
                    message = "Trūkst ID",
                    severity = ValidationSeverity.ERROR,
                    suggestion = "Sistēmas kļūda - aktivitātei nav ID"
                )
            )
        }

        // User ID validation
        if (activity.userId.isBlank()) {
            issues.add(
                ValidationIssue(
                    field = "userId",
                    message = "Trūkst lietotāja ID",
                    severity = ValidationSeverity.ERROR,
                    suggestion = "Sistēmas kļūda - aktivitātei nav piesaistīts lietotājs"
                )
            )
        }

        // Name validation
        if (activity.name.isBlank()) {
            issues.add(
                ValidationIssue(
                    field = "name",
                    message = "Trūkst nosaukums",
                    severity = ValidationSeverity.ERROR,
                    suggestion = "Pievienojiet aktivitātes nosaukumu"
                )
            )
        }

        // Start time validation
        if (activity.startTime.time <= 0) {
            issues.add(
                ValidationIssue(
                    field = "startTime",
                    message = "Trūkst sākuma laiks",
                    severity = ValidationSeverity.ERROR,
                    suggestion = "Aktivitātei jābūt derīgam sākuma laikam"
                )
            )
        }

        // Status validation
        if (activity.status != ActivityStatus.COMPLETED) {
            issues.add(
                ValidationIssue(
                    field = "status",
                    message = "Aktivitāte nav pabeigta",
                    severity = ValidationSeverity.WARNING,
                    suggestion = "Tikai pabeigtās aktivitātes var sinhronizēt"
                )
            )
        }
    }

    /**
     * Validate data integrity (distances, durations, calculations)
     */
    private fun validateDataIntegrity(activity: Activity, issues: MutableList<ValidationIssue>) {
        // Distance validation
        when {
            activity.totalDistance <= 0 -> {
                issues.add(
                    ValidationIssue(
                        field = "totalDistance",
                        message = "Distance ir 0 vai negatīva",
                        severity = ValidationSeverity.ERROR,
                        suggestion = "Pārbaudiet vai GPS ierakstīja distances datus"
                    )
                )
            }
            activity.totalDistance < 100 -> {
                issues.add(
                    ValidationIssue(
                        field = "totalDistance",
                        message = "Distance ir ļoti maza (< 100m)",
                        severity = ValidationSeverity.WARNING,
                        suggestion = "Vai aktivitāte bija īsāka par 100 metriem?"
                    )
                )
            }
            activity.totalDistance > 500000 -> { // > 500km
                issues.add(
                    ValidationIssue(
                        field = "totalDistance",
                        message = "Distance ir nereāli liela (> 500km)",
                        severity = ValidationSeverity.WARNING,
                        suggestion = "Pārbaudiet GPS datu pareizību"
                    )
                )
            }
        }

        // Duration validation
        when {
            activity.totalDuration <= 0 -> {
                issues.add(
                    ValidationIssue(
                        field = "totalDuration",
                        message = "Ilgums ir 0 vai negatīvs",
                        severity = ValidationSeverity.ERROR,
                        suggestion = "Aktivitātei jābūt derīgam ilgumam"
                    )
                )
            }
            activity.totalDuration < 60000 -> { // < 1 minute
                issues.add(
                    ValidationIssue(
                        field = "totalDuration",
                        message = "Ilgums ir ļoti īss (< 1 min)",
                        severity = ValidationSeverity.WARNING,
                        suggestion = "Vai aktivitāte bija īsāka par 1 minūti?"
                    )
                )
            }
            activity.totalDuration > 43200000 -> { // > 12 hours
                issues.add(
                    ValidationIssue(
                        field = "totalDuration",
                        message = "Ilgums ir nereāli garš (> 12h)",
                        severity = ValidationSeverity.WARNING,
                        suggestion = "Pārbaudiet vai laika uzskaite bija pareiza"
                    )
                )
            }
        }

        // End time validation (should be after start time)
        activity.endTime?.let { endTime ->
            if (endTime.time <= activity.startTime.time) {
                issues.add(
                    ValidationIssue(
                        field = "endTime",
                        message = "Beigu laiks ir pirms sākuma laika",
                        severity = ValidationSeverity.ERROR,
                        suggestion = "Laika uzskaites kļūda"
                    )
                )
            }

            // Cross-check duration with start/end times
            val calculatedDuration = endTime.time - activity.startTime.time
            val durationDifference = kotlin.math.abs(calculatedDuration - activity.totalDuration)

            if (durationDifference > 5000) { // > 5 seconds difference
                issues.add(
                    ValidationIssue(
                        field = "totalDuration",
                        message = "Ilgums nesakrīt ar sākuma/beigu laiku (starpība: ${durationDifference / 1000}s)",
                        severity = ValidationSeverity.WARNING,
                        suggestion = "Iespējama pauzes laika kļūda"
                    )
                )
            }
        }

        // Average pace validation (must be realistic)
        if (activity.averagePace > 0) {
            when {
                activity.averagePace < 120 -> { // < 2 min/km (too fast for running)
                    issues.add(
                        ValidationIssue(
                            field = "averagePace",
                            message = "Ātrums ir nereāli ātrs (< 2:00/km)",
                            severity = ValidationSeverity.WARNING,
                            suggestion = "Pārbaudiet GPS datu pareizību"
                        )
                    )
                }
                activity.averagePace > 1200 -> { // > 20 min/km (too slow)
                    issues.add(
                        ValidationIssue(
                            field = "averagePace",
                            message = "Ātrums ir ļoti lēns (> 20:00/km)",
                            severity = ValidationSeverity.WARNING,
                            suggestion = "Vai aktivitāte bija walking vai hiking?"
                        )
                    )
                }
            }

            // Cross-validate pace with distance and duration
            if (activity.totalDistance > 0 && activity.totalDuration > 0) {
                val calculatedPace = (activity.totalDuration / 1000.0) / (activity.totalDistance / 1000.0)
                val paceDifference = kotlin.math.abs(calculatedPace - activity.averagePace)

                if (paceDifference > 30) { // > 30 seconds difference
                    issues.add(
                        ValidationIssue(
                            field = "averagePace",
                            message = "Ātrums nesakrīt ar distances/ilguma aprēķinu",
                            severity = ValidationSeverity.WARNING,
                            suggestion = "Pārrēķināt vidējo ātrumu"
                        )
                    )
                }
            }
        }

        // Calories validation
        if (activity.calories < 0) {
            issues.add(
                ValidationIssue(
                    field = "calories",
                    message = "Kalorijas ir negatīvas",
                    severity = ValidationSeverity.WARNING,
                    suggestion = "Kaloriju aprēķina kļūda"
                )
            )
        }
    }

    /**
     * Validate GPS data quality
     */
    private fun validateGpsData(activity: Activity, issues: MutableList<ValidationIssue>) {
        when {
            activity.gpsPoints.isEmpty() -> {
                issues.add(
                    ValidationIssue(
                        field = "gpsPoints",
                        message = "Nav GPS punktu",
                        severity = ValidationSeverity.ERROR,
                        suggestion = "Aktivitātei jābūt vismaz vienam GPS punktam"
                    )
                )
            }
            activity.gpsPoints.size < 10 -> {
                issues.add(
                    ValidationIssue(
                        field = "gpsPoints",
                        message = "Pārāk maz GPS punktu (< 10)",
                        severity = ValidationSeverity.WARNING,
                        suggestion = "GPS ieraksts var būt nepilnīgs"
                    )
                )
            }
        }

        // Check GPS accuracy if data is available
        if (activity.gpsPoints.isNotEmpty()) {
            val pointsWithAccuracy = activity.gpsPoints.count { it.accuracy != null }
            val poorAccuracyPoints = activity.gpsPoints.count { it.accuracy != null && it.accuracy!! > 20f }

            if (pointsWithAccuracy > 0) {
                val poorAccuracyPercentage = (poorAccuracyPoints.toFloat() / pointsWithAccuracy) * 100

                if (poorAccuracyPercentage > 50) {
                    issues.add(
                        ValidationIssue(
                            field = "gpsPoints",
                            message = "Vairāk nekā 50% GPS punktu ar zemu precizitāti",
                            severity = ValidationSeverity.WARNING,
                            suggestion = "GPS signāls bija vājš aktivitātes laikā"
                        )
                    )
                }
            }

            // Check for duplicate/stationary points
            val stationaryPoints = countStationaryPoints(activity.gpsPoints)
            if (stationaryPoints > activity.gpsPoints.size * 0.3) { // > 30% stationary
                issues.add(
                    ValidationIssue(
                        field = "gpsPoints",
                        message = "Vairāk nekā 30% GPS punktu ir stacionāri",
                        severity = ValidationSeverity.WARNING,
                        suggestion = "Vai aktivitātē bija daudz pauzes?"
                    )
                )
            }
        }
    }

    /**
     * Count stationary GPS points (points with same coordinates)
     */
    private fun countStationaryPoints(points: List<com.deyarun.mobile.data.model.GpsPoint>): Int {
        if (points.size < 2) return 0

        var stationaryCount = 0
        for (i in 1 until points.size) {
            val prev = points[i - 1]
            val curr = points[i]

            // Check if coordinates are identical (or very close)
            val latDiff = kotlin.math.abs(prev.latitude - curr.latitude)
            val lonDiff = kotlin.math.abs(prev.longitude - curr.longitude)

            if (latDiff < 0.0001 && lonDiff < 0.0001) { // ~10 meters
                stationaryCount++
            }
        }

        return stationaryCount
    }

    /**
     * Quick validation check - returns true if activity is sync-ready
     */
    fun isActivitySyncReady(activity: Activity): Boolean {
        return validateActivity(activity).isValid
    }

    /**
     * Get validation icon based on validation result
     */
    fun getValidationIcon(result: ValidationResult): String {
        return when {
            result.isValid && result.issues.isEmpty() -> "✅" // Perfect
            result.isValid && result.hasWarnings -> "⚠️" // Valid but has warnings
            result.hasErrors -> "❌" // Has errors, cannot sync
            else -> "❓" // Unknown state
        }
    }

    /**
     * Get validation status text
     */
    fun getValidationStatusText(result: ValidationResult): String {
        return when {
            result.isValid && result.issues.isEmpty() -> "Gatava sinhronizācijai"
            result.isValid && result.hasWarnings -> "Gatava ar brīdinājumiem (${result.warningCount})"
            result.hasErrors -> "Nav gatava - ${result.errorCount} kļūdas"
            else -> "Nav validēta"
        }
    }
}
