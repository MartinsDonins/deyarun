package com.deyarun.mobile.data.repository

import android.content.Context
import android.util.Log
import com.deyarun.mobile.data.api.ApiClient
import com.deyarun.mobile.data.api.DeleteAccountRequest
import com.deyarun.mobile.data.api.GdprApiService
import com.deyarun.mobile.data.api.UserDataExport
import com.deyarun.mobile.data.local.LocalDatabase
import com.deyarun.mobile.data.model.Activity
import com.deyarun.mobile.data.storage.TokenManager
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

/**
 * Repository for GDPR-related operations (data export, account deletion)
 */
class GdprRepository(private val context: Context) {

    private val TAG = "GdprRepository"
    private val tokenManager = TokenManager(context)
    private val gdprApi: GdprApiService by lazy {
        ApiClient.createGdprApi(tokenManager)
    }
    private val database = LocalDatabase.getDatabase(context)
    private val activityDao = database.activityDao()
    private val gson = Gson()

    /**
     * Export all user data to local JSON file (GDPR Article 15 - Right of Access)
     */
    suspend fun exportUserDataToFile(userId: String): Result<File> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Starting local data export for user: $userId")

            // Get all activities for user
            val activities = activityDao.getActivitiesForExport(userId)

            // Create export data structure
            val exportData = createLocalExportData(userId, activities)

            // Save to file
            val exportFile = saveExportToFile(exportData)

            Log.d(TAG, "✅ Data export completed: ${exportFile.absolutePath}")
            Result.success(exportFile)

        } catch (e: Exception) {
            Log.e(TAG, "❌ Error exporting data: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Request data export from backend server
     */
    suspend fun requestCloudDataExport(): Result<String> = withContext(Dispatchers.IO) {
        try {
            val token = tokenManager.getToken()
            if (token.isNullOrEmpty()) {
                return@withContext Result.failure(Exception("Not authenticated"))
            }

            val response = gdprApi.requestDataExport("Bearer $token")

            if (response.isSuccessful && response.body()?.success == true) {
                val exportId = response.body()?.exportId
                if (exportId != null) {
                    Log.d(TAG, "✅ Cloud export requested successfully: $exportId")
                    Result.success(exportId)
                } else {
                    Result.failure(Exception("Export ID not received"))
                }
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Unknown error"
                Log.e(TAG, "❌ Cloud export request failed: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error requesting cloud export: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Delete all local user data
     */
    suspend fun deleteLocalUserData(userId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Starting local data deletion for user: $userId")

            // Delete all activities
            val deletedCount = activityDao.deleteAllActivitiesForUser(userId)
            Log.d(TAG, "Deleted $deletedCount activities")

            // Clear auth tokens
            tokenManager.clearToken()
            Log.d(TAG, "Cleared auth tokens")

            // Clear any cached files
            clearCachedFiles()

            Log.d(TAG, "✅ Local data deletion completed")
            Result.success(Unit)

        } catch (e: Exception) {
            Log.e(TAG, "❌ Error deleting local data: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Request account deletion from backend (GDPR Article 17 - Right to Erasure)
     */
    suspend fun requestAccountDeletion(password: String?, reason: String?): Result<String> = withContext(Dispatchers.IO) {
        try {
            val token = tokenManager.getToken()
            if (token.isNullOrEmpty()) {
                return@withContext Result.failure(Exception("Not authenticated"))
            }

            val request = DeleteAccountRequest(
                confirmPassword = password,
                reason = reason
            )

            val response = gdprApi.deleteAccount("Bearer $token", request)

            if (response.isSuccessful && response.body()?.success == true) {
                val message = response.body()?.message ?: "Account deletion scheduled"
                Log.d(TAG, "✅ Account deletion requested: $message")
                Result.success(message)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Unknown error"
                Log.e(TAG, "❌ Account deletion failed: $errorMsg")
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Error requesting account deletion: ${e.message}", e)
            Result.failure(e)
        }
    }

    /**
     * Create local export data structure
     */
    private fun createLocalExportData(userId: String, activities: List<Activity>): Map<String, Any> {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())

        return mapOf(
            "exportInfo" to mapOf(
                "exportDate" to dateFormat.format(Date()),
                "dataType" to "DeyaRun User Data Export",
                "gdprCompliant" to true
            ),
            "user" to mapOf(
                "userId" to userId,
                "dataExportedAt" to System.currentTimeMillis()
            ),
            "activities" to activities.map { activity ->
                mapOf(
                    "id" to activity.id,
                    "type" to activity.type.name,
                    "name" to activity.name,
                    "startTime" to dateFormat.format(activity.startTime),
                    "endTime" to (activity.endTime?.let { dateFormat.format(it) } ?: "N/A"),
                    "distance" to "${activity.totalDistance / 1000.0} km",
                    "duration" to formatDuration(activity.totalDuration),
                    "averagePace" to formatPace(activity.averagePace),
                    "calories" to activity.calories,
                    "status" to activity.status.name,
                    "gpsPointsCount" to activity.gpsPoints.size,
                    "gpsPoints" to activity.gpsPoints.map { point ->
                        mapOf(
                            "latitude" to point.latitude,
                            "longitude" to point.longitude,
                            "altitude" to point.altitude,
                            "accuracy" to point.accuracy,
                            "timestamp" to dateFormat.format(point.timestamp),
                            "speed" to point.speed
                        )
                    }
                )
            },
            "statistics" to mapOf(
                "totalActivities" to activities.size,
                "totalDistance" to "${activities.sumOf { it.totalDistance } / 1000.0} km",
                "totalDuration" to formatDuration(activities.sumOf { it.totalDuration }),
                "totalCalories" to activities.sumOf { it.calories }
            )
        )
    }

    /**
     * Save export data to JSON file
     */
    private fun saveExportToFile(exportData: Map<String, Any>): File {
        val exportDir = File(context.getExternalFilesDir(null), "exports")
        if (!exportDir.exists()) {
            exportDir.mkdirs()
        }

        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val fileName = "deyarun_data_export_$timestamp.json"
        val exportFile = File(exportDir, fileName)

        val jsonString = gson.toJson(exportData)
        exportFile.writeText(jsonString)

        return exportFile
    }

    /**
     * Clear cached files
     */
    private fun clearCachedFiles() {
        try {
            context.cacheDir.deleteRecursively()
            context.getExternalFilesDir(null)?.deleteRecursively()
        } catch (e: Exception) {
            Log.w(TAG, "Error clearing cached files: ${e.message}")
        }
    }

    /**
     * Format duration from milliseconds
     */
    private fun formatDuration(durationMs: Long): String {
        val hours = durationMs / (1000 * 60 * 60)
        val minutes = (durationMs % (1000 * 60 * 60)) / (1000 * 60)
        val seconds = (durationMs % (1000 * 60)) / 1000

        return when {
            hours > 0 -> "${hours}h ${minutes}m ${seconds}s"
            minutes > 0 -> "${minutes}m ${seconds}s"
            else -> "${seconds}s"
        }
    }

    /**
     * Format pace from seconds per km
     */
    private fun formatPace(paceSeconds: Double): String {
        if (paceSeconds <= 0) return "N/A"
        val minutes = (paceSeconds / 60).toInt()
        val seconds = (paceSeconds % 60).toInt()
        return "${minutes}:${seconds.toString().padStart(2, '0')} /km"
    }
}
