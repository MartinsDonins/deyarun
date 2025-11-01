package com.deyarun.mobile.data.api

import retrofit2.Response
import retrofit2.http.*

/**
 * GDPR API Service for data export and account deletion
 */
interface GdprApiService {

    /**
     * Request user data export (GDPR Article 15 - Right of Access)
     * POST /api/gdpr/export
     */
    @POST("gdpr/export")
    suspend fun requestDataExport(
        @Header("Authorization") authToken: String
    ): Response<DataExportResponse>

    /**
     * Download exported user data
     * GET /api/gdpr/export/{exportId}
     */
    @GET("gdpr/export/{exportId}")
    suspend fun downloadExportedData(
        @Header("Authorization") authToken: String,
        @Path("exportId") exportId: String
    ): Response<ExportedDataResponse>

    /**
     * Delete user account and all associated data (GDPR Article 17 - Right to Erasure)
     * DELETE /api/gdpr/account
     */
    @DELETE("gdpr/account")
    suspend fun deleteAccount(
        @Header("Authorization") authToken: String,
        @Body request: DeleteAccountRequest
    ): Response<DeleteAccountResponse>

    /**
     * Request anonymization instead of full deletion
     * POST /api/gdpr/anonymize
     */
    @POST("gdpr/anonymize")
    suspend fun anonymizeAccount(
        @Header("Authorization") authToken: String
    ): Response<AnonymizeAccountResponse>
}

// Request models
data class DeleteAccountRequest(
    val confirmPassword: String?,
    val reason: String?
)

// Response models
data class DataExportResponse(
    val success: Boolean,
    val message: String?,
    val exportId: String?,
    val estimatedCompletionTime: Long? // Unix timestamp
)

data class ExportedDataResponse(
    val success: Boolean,
    val data: UserDataExport?
)

data class UserDataExport(
    val userId: String,
    val email: String,
    val firstName: String?,
    val lastName: String?,
    val createdAt: Long,
    val activities: List<ActivityExportData>,
    val preferences: Map<String, Any>,
    val exportDate: Long
)

data class ActivityExportData(
    val id: String,
    val type: String,
    val name: String,
    val startTime: Long,
    val endTime: Long?,
    val distance: Double,
    val duration: Long,
    val averagePace: Double,
    val calories: Int,
    val gpsPoints: List<GpsPointExportData>
)

data class GpsPointExportData(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double?,
    val timestamp: Long,
    val speed: Float?,
    val accuracy: Float?
)

data class DeleteAccountResponse(
    val success: Boolean,
    val message: String?,
    val scheduledDeletionDate: Long? // Unix timestamp - account will be deleted after X days
)

data class AnonymizeAccountResponse(
    val success: Boolean,
    val message: String?
)
