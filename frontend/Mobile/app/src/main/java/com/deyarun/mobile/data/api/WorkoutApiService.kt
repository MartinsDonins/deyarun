package com.deyarun.mobile.data.api

import com.deyarun.mobile.data.model.Activity
import com.deyarun.mobile.data.model.ActivityType
import com.deyarun.mobile.data.model.GpsPoint
import retrofit2.Response
import retrofit2.http.*

/**
 * Workout API Service for DeyaRun backend integration
 * Base URL: https://api.deyarun.com/api/workouts
 */
interface WorkoutApiService {

    /**
     * Upload completed workout to backend
     * POST /api/workouts/complete-upload
     */
    @POST("api/workouts/complete-upload")
    suspend fun uploadCompletedWorkout(
        @Header("Authorization") authToken: String,
        @Body workout: WorkoutUploadRequest
    ): Response<WorkoutUploadResponse>

    /**
     * Start a new workout session
     * POST /api/workouts/start
     */
    @POST("api/workouts/start")
    suspend fun startWorkout(
        @Header("Authorization") authToken: String,
        @Body request: WorkoutStartRequest
    ): Response<WorkoutStartResponse>

    /**
     * Upload GPS point during active workout
     * PUT /api/workouts/{id}/gps
     */
    @PUT("api/workouts/{id}/gps")
    suspend fun uploadGpsPoint(
        @Header("Authorization") authToken: String,
        @Path("id") workoutId: String,
        @Body gpsPoint: GpsPointRequest
    ): Response<GpsPointResponse>

    /**
     * Complete workout on server
     * PUT /api/workouts/{id}/complete
     */
    @PUT("api/workouts/{id}/complete")
    suspend fun completeWorkout(
        @Header("Authorization") authToken: String,
        @Path("id") workoutId: String,
        @Body request: WorkoutCompleteRequest
    ): Response<WorkoutCompleteResponse>

    /**
     * Get user's workouts from server
     * GET /api/workouts
     */
    @GET("api/workouts")
    suspend fun getUserWorkouts(
        @Header("Authorization") authToken: String,
        @Query("limit") limit: Int = 50
    ): Response<WorkoutsListResponse>

    /**
     * Delete workout from server
     * DELETE /api/workouts/{id}
     */
    @DELETE("api/workouts/{id}")
    suspend fun deleteWorkout(
        @Header("Authorization") authToken: String,
        @Path("id") workoutId: String
    ): Response<DeleteWorkoutResponse>
}

// Request models
data class WorkoutUploadRequest(
    val id: String,
    val userId: String,
    val type: String,
    val name: String,
    val startTime: Long,
    val endTime: Long?,
    val totalDistance: Double,
    val totalDuration: Long,
    val averagePace: Double,
    val calories: Int,
    val gpsPoints: List<GpsPointData>,
    val status: String
)

data class GpsPointData(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double?,
    val accuracy: Float?,
    val timestamp: Long,
    val speed: Float?
)

data class WorkoutStartRequest(
    val startTime: Long,
    val type: String,
    val status: String = "in_progress"
)

data class GpsPointRequest(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double?,
    val accuracy: Float?,
    val timestamp: Long,
    val speed: Float?,
    val heading: Float?,
    val elapsedTime: Long?,
    val heartRate: Int?,
    val distance: Double?
)

data class WorkoutCompleteRequest(
    val endTime: Long,
    val duration: Long,
    val calories: Int?,
    val effortLevel: Int?,
    val mood: String?,
    val notes: String?
)

// Response models
data class WorkoutUploadResponse(
    val success: Boolean,
    val message: String?,
    val workout: WorkoutData?
)

data class WorkoutStartResponse(
    val success: Boolean,
    val message: String?,
    val workout: WorkoutData?
)

data class GpsPointResponse(
    val success: Boolean,
    val message: String?
)

data class WorkoutCompleteResponse(
    val success: Boolean,
    val message: String?,
    val workout: WorkoutData?
)

data class WorkoutsListResponse(
    val success: Boolean,
    val workouts: List<WorkoutData>
)

data class DeleteWorkoutResponse(
    val success: Boolean,
    val message: String?
)

data class WorkoutData(
    val id: String,
    val userId: String?,
    val type: String?,
    val name: String?,
    val status: String?,
    val startedAt: Long?,
    val completedAt: Long?,
    val duration: Long?,
    val distance: Double?,
    val averagePace: Double?,
    val calories: Int?,
    val route: RouteData?
)

data class RouteData(
    val type: String,
    val coordinates: List<List<Double>>
)

/**
 * Helper to convert Activity to WorkoutUploadRequest
 */
fun Activity.toWorkoutUploadRequest(): WorkoutUploadRequest {
    return WorkoutUploadRequest(
        id = this.id,
        userId = this.userId,
        type = this.type.name.lowercase(),
        name = this.name,
        startTime = this.startTime.time,
        endTime = this.endTime?.time,
        totalDistance = this.totalDistance,
        totalDuration = this.totalDuration,
        averagePace = this.averagePace,
        calories = this.calories,
        gpsPoints = this.gpsPoints.map { it.toGpsPointData() },
        status = this.status.name.lowercase()
    )
}

/**
 * Helper to convert GpsPoint to GpsPointData
 */
fun GpsPoint.toGpsPointData(): GpsPointData {
    return GpsPointData(
        latitude = this.latitude,
        longitude = this.longitude,
        altitude = this.altitude,
        accuracy = this.accuracy,
        timestamp = this.timestamp.time,
        speed = this.speed
    )
}
