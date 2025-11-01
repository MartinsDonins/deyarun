package com.deyarun.mobile.data.api

import retrofit2.Response
import retrofit2.http.*
import com.deyarun.mobile.data.sync.DataType

/**
 * Cloud API for DeyaRun data synchronization
 */
interface CloudApi {

    /**
     * Upload data to cloud storage
     */
    @POST("sync/upload")
    suspend fun uploadData(
        @Query("type") dataType: DataType,
        @Body data: String
    ): Response<UploadResponse>

    /**
     * Get all changes since last sync timestamp
     */
    @GET("sync/changes")
    suspend fun getChangesSince(
        @Query("since") timestamp: Long
    ): List<DataChange>

    /**
     * Get latest version of specific data item
     */
    @GET("sync/data/{id}")
    suspend fun getDataById(
        @Path("id") id: String
    ): Response<CloudDataItem>

    /**
     * Batch upload multiple data items
     */
    @POST("sync/batch-upload")
    suspend fun batchUpload(
        @Body items: List<CloudDataItem>
    ): Response<BatchUploadResponse>

    /**
     * Get user's full data snapshot (initial sync)
     */
    @GET("sync/snapshot")
    suspend fun getFullSnapshot(): Response<DataSnapshot>

    /**
     * Delete data item from cloud
     */
    @DELETE("sync/data/{id}")
    suspend fun deleteData(
        @Path("id") id: String
    ): Response<DeleteResponse>

    /**
     * Check sync status and conflicts
     */
    @GET("sync/status")
    suspend fun getSyncStatus(): Response<SyncStatus>

    /**
     * Resolve sync conflict
     */
    @POST("sync/resolve-conflict")
    suspend fun resolveConflict(
        @Body conflictResolution: ConflictResolution
    ): Response<ConflictResponse>

    /**
     * Get current week training program
     */
    @GET("api/training-plans/weekly/current")
    suspend fun getCurrentWeekProgram(
        @Header("Authorization") token: String
    ): Response<org.json.JSONObject>

    /**
     * Generate new weekly training program
     */
    @POST("api/training-plans/weekly/generate")
    suspend fun generateWeeklyProgram(
        @Header("Authorization") token: String,
        @Body preferences: org.json.JSONObject
    ): Response<org.json.JSONObject>

    /**
     * Update workout status (completed/skipped)
     */
    @PUT("api/training-plans/weekly/workouts/{workoutId}/status")
    suspend fun updateWorkoutStatus(
        @Header("Authorization") token: String,
        @Path("workoutId") workoutId: String,
        @Body statusData: org.json.JSONObject
    ): Response<org.json.JSONObject>

    /**
     * Get AI coaching suggestions for current week
     */
    @POST("api/training-plans/weekly/ai-suggestions")
    suspend fun getAICoachingSuggestions(
        @Header("Authorization") token: String,
        @Body preferences: org.json.JSONObject
    ): Response<org.json.JSONObject>
}

// Response models
data class UploadResponse(
    val success: Boolean,
    val id: String,
    val version: Long,
    val message: String? = null
)

data class DataChange(
    val id: String,
    val operation: String, // CREATE, UPDATE, DELETE
    val data: CloudDataItem,
    val timestamp: Long,
    val version: Long
)

data class CloudDataItem(
    val id: String,
    val type: DataType,
    val data: String,
    val lastModified: Long,
    val version: Long,
    val checksum: String? = null
)

data class BatchUploadResponse(
    val success: Boolean,
    val successCount: Int,
    val failedItems: List<FailedItem>,
    val message: String? = null
)

data class FailedItem(
    val id: String,
    val error: String
)

data class DataSnapshot(
    val timestamp: Long,
    val version: Long,
    val data: Map<DataType, List<CloudDataItem>>
)

data class DeleteResponse(
    val success: Boolean,
    val message: String? = null
)

data class SyncStatus(
    val lastSync: Long,
    val serverVersion: Long,
    val conflicts: List<ConflictInfo>,
    val pendingChanges: Int
)

data class ConflictInfo(
    val id: String,
    val type: DataType,
    val localVersion: Long,
    val serverVersion: Long,
    val conflictType: String
)

data class ConflictResolution(
    val conflictId: String,
    val resolution: String, // "use_local", "use_server", "merge"
    val mergedData: String? = null
)

data class ConflictResponse(
    val success: Boolean,
    val message: String? = null
)