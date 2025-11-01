package com.deyarun.mobile.data.api

import retrofit2.Response
import retrofit2.http.*

/**
 * Extension API endpoints for DeyaRun activities and sync
 */
interface CloudApiExtensions {

    /**
     * Upload activity (workout) data
     */
    @POST("activities")
    suspend fun uploadActivity(
        @Body activity: Map<String, Any>
    ): Response<ActivityUploadResponse>

    /**
     * Get activities since timestamp
     */
    @GET("activities")
    suspend fun getActivitiesSince(
        @Query("since") timestamp: Long
    ): Response<List<Map<String, Any>>>

    /**
     * Health check endpoint
     */
    @GET("health")
    suspend fun healthCheck(): Response<HealthResponse>

    /**
     * Get user's activity statistics
     */
    @GET("user/statistics")
    suspend fun getUserStatistics(): Response<UserStatistics>
}

// Additional response models for activities
data class ActivityUploadResponse(
    val success: Boolean,
    val id: String,
    val cloudId: String? = null,
    val message: String? = null
)

data class HealthResponse(
    val status: String,
    val timestamp: Long
)

data class UserStatistics(
    val totalActivities: Int,
    val totalDistance: Double,
    val totalDuration: Long,
    val averagePace: Double,
    val lastActivity: Long?
)