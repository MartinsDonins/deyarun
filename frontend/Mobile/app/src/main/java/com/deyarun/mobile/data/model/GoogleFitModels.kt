package com.deyarun.mobile.data.model

import com.google.gson.annotations.SerializedName

/**
 * Google Fit connection info
 */
data class GoogleFitConnectionInfo(
    @SerializedName("connected")
    val connected: Boolean = false,

    @SerializedName("connectedAt")
    val connectedAt: String? = null,

    @SerializedName("tokenType")
    val tokenType: String? = null,

    @SerializedName("hasValidToken")
    val hasValidToken: Boolean = false
)

/**
 * Google Fit OAuth tokens
 */
data class GoogleFitTokens(
    @SerializedName("access_token")
    val accessToken: String,

    @SerializedName("refresh_token")
    val refreshToken: String?,

    @SerializedName("token_type")
    val tokenType: String,

    @SerializedName("expiry_date")
    val expiryDate: Long?
)

/**
 * Google Fit status response
 */
data class GoogleFitStatusResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("connected")
    val connected: Boolean,

    @SerializedName("connectionInfo")
    val connectionInfo: GoogleFitConnectionInfo?
)

/**
 * Google Fit fitness data response
 */
data class GoogleFitDataResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("data")
    val data: GoogleFitData?,

    @SerializedName("message")
    val message: String?,

    @SerializedName("needsReauth")
    val needsReauth: Boolean? = false
)

/**
 * Google Fit comprehensive fitness data
 */
data class GoogleFitData(
    @SerializedName("steps")
    val steps: StepsData? = null,

    @SerializedName("distance")
    val distance: DistanceData? = null,

    @SerializedName("calories")
    val calories: CaloriesData? = null,

    @SerializedName("heartRate")
    val heartRate: HeartRateData? = null,

    @SerializedName("activities")
    val activities: ActivitiesData? = null,

    @SerializedName("timeRange")
    val timeRange: TimeRange
)

/**
 * Steps data
 */
data class StepsData(
    @SerializedName("totalSteps")
    val totalSteps: Int,

    @SerializedName("dailySteps")
    val dailySteps: List<DailyValue<Int>>,

    @SerializedName("averageSteps")
    val averageSteps: Int,

    @SerializedName("error")
    val error: String? = null
)

/**
 * Distance data
 */
data class DistanceData(
    @SerializedName("totalDistance")
    val totalDistance: Double,

    @SerializedName("dailyDistance")
    val dailyDistance: List<DailyValue<Double>>,

    @SerializedName("averageDistance")
    val averageDistance: Double,

    @SerializedName("error")
    val error: String? = null
)

/**
 * Calories data
 */
data class CaloriesData(
    @SerializedName("totalCalories")
    val totalCalories: Double,

    @SerializedName("dailyCalories")
    val dailyCalories: List<DailyValue<Double>>,

    @SerializedName("averageCalories")
    val averageCalories: Double,

    @SerializedName("error")
    val error: String? = null
)

/**
 * Heart rate data
 */
data class HeartRateData(
    @SerializedName("readings")
    val readings: List<HeartRateReading>,

    @SerializedName("averageHeartRate")
    val averageHeartRate: Double,

    @SerializedName("minHeartRate")
    val minHeartRate: Int,

    @SerializedName("maxHeartRate")
    val maxHeartRate: Int,

    @SerializedName("totalReadings")
    val totalReadings: Int,

    @SerializedName("error")
    val error: String? = null
)

/**
 * Heart rate reading
 */
data class HeartRateReading(
    @SerializedName("timestamp")
    val timestamp: String,

    @SerializedName("bpm")
    val bpm: Int
)

/**
 * Activities data
 */
data class ActivitiesData(
    @SerializedName("totalActivities")
    val totalActivities: Int,

    @SerializedName("activities")
    val activities: List<GoogleFitActivity>,

    @SerializedName("error")
    val error: String? = null
)

/**
 * Google Fit activity
 */
data class GoogleFitActivity(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("activityType")
    val activityType: String,

    @SerializedName("startTime")
    val startTime: String,

    @SerializedName("endTime")
    val endTime: String,

    @SerializedName("durationMinutes")
    val durationMinutes: Int
)

/**
 * Daily value wrapper
 */
data class DailyValue<T>(
    @SerializedName("date")
    val date: String,

    @SerializedName("value")
    val value: T
)

/**
 * Time range
 */
data class TimeRange(
    @SerializedName("startTime")
    val startTime: String,

    @SerializedName("endTime")
    val endTime: String
)

/**
 * Google Fit sync result
 */
data class GoogleFitSyncResult(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("message")
    val message: String,

    @SerializedName("summary")
    val summary: SyncSummary?,

    @SerializedName("timeRange")
    val timeRange: TimeRange?,

    @SerializedName("errors")
    val errors: List<SyncError>?,

    @SerializedName("needsReauth")
    val needsReauth: Boolean? = false
)

/**
 * Sync summary
 */
data class SyncSummary(
    @SerializedName("totalActivities")
    val totalActivities: Int,

    @SerializedName("syncedCount")
    val syncedCount: Int,

    @SerializedName("skippedCount")
    val skippedCount: Int,

    @SerializedName("errorsCount")
    val errorsCount: Int
)

/**
 * Sync error
 */
data class SyncError(
    @SerializedName("activityId")
    val activityId: String,

    @SerializedName("error")
    val error: String
)

/**
 * Google Fit auth URL response
 */
data class GoogleFitAuthUrlResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("data")
    val data: AuthUrlData?,

    @SerializedName("message")
    val message: String?
)

/**
 * Auth URL data
 */
data class AuthUrlData(
    @SerializedName("authUrl")
    val authUrl: String
)

/**
 * Google Fit callback response
 */
data class GoogleFitCallbackResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("message")
    val message: String,

    @SerializedName("data")
    val data: CallbackData?
)

/**
 * Callback data
 */
data class CallbackData(
    @SerializedName("connectedAt")
    val connectedAt: String
)

/**
 * Google Fit disconnect response
 */
data class GoogleFitDisconnectResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("message")
    val message: String
)
