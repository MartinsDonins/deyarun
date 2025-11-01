package com.deyarun.mobile.data.model

import com.google.gson.annotations.SerializedName

/**
 * Strava athlete data model
 */
data class StravaAthlete(
    @SerializedName("id")
    val id: Long,

    @SerializedName("username")
    val username: String?,

    @SerializedName("firstname")
    val firstname: String?,

    @SerializedName("lastname")
    val lastname: String?,

    @SerializedName("profile")
    val profile: String?,

    @SerializedName("city")
    val city: String?,

    @SerializedName("state")
    val state: String?,

    @SerializedName("country")
    val country: String?
)

/**
 * Strava activity data model
 */
data class StravaActivity(
    @SerializedName("id")
    val id: Long,

    @SerializedName("name")
    val name: String,

    @SerializedName("distance")
    val distance: Double, // meters

    @SerializedName("moving_time")
    val movingTime: Int, // seconds

    @SerializedName("elapsed_time")
    val elapsedTime: Int, // seconds

    @SerializedName("total_elevation_gain")
    val totalElevationGain: Double?, // meters

    @SerializedName("type")
    val type: String, // "Run", "Ride", etc.

    @SerializedName("start_date")
    val startDate: String, // ISO date

    @SerializedName("start_date_local")
    val startDateLocal: String,

    @SerializedName("average_speed")
    val averageSpeed: Double?, // m/s

    @SerializedName("max_speed")
    val maxSpeed: Double?, // m/s

    @SerializedName("calories")
    val calories: Int?,

    @SerializedName("description")
    val description: String?,

    @SerializedName("map")
    val map: StravaMap?
)

/**
 * Strava map data for polyline
 */
data class StravaMap(
    @SerializedName("polyline")
    val polyline: String?,

    @SerializedName("summary_polyline")
    val summaryPolyline: String?
)

/**
 * Strava OAuth tokens
 */
data class StravaTokens(
    @SerializedName("access_token")
    val accessToken: String,

    @SerializedName("refresh_token")
    val refreshToken: String,

    @SerializedName("expires_at")
    val expiresAt: Long, // Unix timestamp

    @SerializedName("scope")
    val scope: String
)

/**
 * Strava OAuth token exchange request
 */
data class StravaTokenRequest(
    @SerializedName("code")
    val code: String,

    @SerializedName("redirect_uri")
    val redirectUri: String
)

/**
 * Strava token refresh request
 */
data class StravaRefreshRequest(
    @SerializedName("refresh_token")
    val refreshToken: String
)

/**
 * Strava sync status from backend
 */
data class StravaSyncStatus(
    @SerializedName("isRunning")
    val isRunning: Boolean,

    @SerializedName("lastRun")
    val lastRun: String?,

    @SerializedName("nextRun")
    val nextRun: String?
)

/**
 * Strava sync result from backend
 */
data class StravaSyncResult(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("syncedCount")
    val syncedCount: Int,

    @SerializedName("workoutsCreated")
    val workoutsCreated: Int?,

    @SerializedName("error")
    val error: String?
)

/**
 * Strava sync options
 */
data class StravaSyncOptions(
    @SerializedName("autoCreateWorkouts")
    val autoCreateWorkouts: Boolean = true
)

/**
 * Strava connection status
 */
data class StravaConnection(
    val isConnected: Boolean,
    val athlete: StravaAthlete?,
    val lastSyncAt: String?,
    val syncPreferences: StravaSyncPreferences?
)

/**
 * Strava sync preferences
 */
data class StravaSyncPreferences(
    val syncPrivateActivities: Boolean = true,
    val autoSync: Boolean = true
)

/**
 * Strava activity stats
 */
data class StravaActivityStats(
    val totalActivities: Int,
    val totalDistance: Double,
    val totalMovingTime: Int,
    val totalElevationGain: Double
)

/**
 * Strava upload activity request
 */
data class StravaUploadRequest(
    @SerializedName("name")
    val name: String,

    @SerializedName("type")
    val type: String, // "Run", "Ride", etc.

    @SerializedName("start_date_local")
    val startDateLocal: String, // ISO format

    @SerializedName("elapsed_time")
    val elapsedTime: Int, // seconds

    @SerializedName("distance")
    val distance: Double, // meters

    @SerializedName("description")
    val description: String?
)

/**
 * Strava upload result
 */
data class StravaUploadResult(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("activity_id")
    val activityId: Long?,

    @SerializedName("error")
    val error: String?
)

/**
 * Response from backend /api/strava/auth endpoint
 */
data class StravaAuthUrlResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("authUrl")
    val authUrl: String?,

    @SerializedName("message")
    val message: String?,

    @SerializedName("demo")
    val demo: Boolean? = false
)

/**
 * Response from backend /api/strava/status endpoint
 */
data class StravaConnectionStatus(
    @SerializedName("connected")
    val connected: Boolean,

    @SerializedName("configured")
    val configured: Boolean? = true,

    @SerializedName("expired")
    val expired: Boolean? = false,

    @SerializedName("athleteId")
    val athleteId: Long? = null,

    @SerializedName("athlete")
    val athlete: StravaAthlete? = null,

    @SerializedName("connectedAt")
    val connectedAt: String? = null
)

/**
 * Response from backend /api/strava/activities endpoint
 */
data class StravaActivitiesResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("activities")
    val activities: List<StravaActivity>,

    @SerializedName("pagination")
    val pagination: StravaPagination? = null
)

/**
 * Pagination info for activities
 */
data class StravaPagination(
    @SerializedName("page")
    val page: Int,

    @SerializedName("perPage")
    val perPage: Int,

    @SerializedName("total")
    val total: Int
)