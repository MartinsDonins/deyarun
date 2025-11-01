package com.deyarun.mobile.data.sync

import android.content.Context
import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import com.deyarun.mobile.data.local.dao.ActivityDao
import com.deyarun.mobile.data.model.Activity
import com.deyarun.mobile.data.model.ActivityStatus
import com.deyarun.mobile.data.api.ApiClient
import com.deyarun.mobile.data.api.WorkoutApiService
import com.deyarun.mobile.data.api.toWorkoutUploadRequest
import com.deyarun.mobile.data.storage.TokenManager
import java.util.*

/**
 * Activity Sync Manager for offline-first workout synchronization
 * Handles automatic background sync of activities to cloud server with real API integration
 */
class ActivitySyncManager(
    private val context: Context,
    private val activityDao: ActivityDao,
    private val userId: String
) {
    private val TAG = "ActivitySyncManager"

    // API service and token manager
    private val tokenManager = TokenManager(context)
    private val workoutApi: WorkoutApiService by lazy {
        ApiClient.createWorkoutApi(tokenManager)
    }

    // Use application scope to prevent premature cancellation
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob() + CoroutineName("ActivitySyncManager"))

    // Sync state
    private val _syncState = MutableStateFlow(ActivitySyncState())
    val syncState: StateFlow<ActivitySyncState> = _syncState.asStateFlow()

    // FIX-052.4: Mutex to prevent race conditions when syncing
    private val syncMutex = Mutex()

    // Auto-sync timer
    private var syncJob: Job? = null

    // Store last 50 sync errors in memory for diagnostics
    private val errorLog = mutableListOf<SyncError>()
    private val MAX_ERROR_LOG_SIZE = 50

    /**
     * Enhanced activity sync state with error tracking
     */
    data class ActivitySyncState(
        val isOnline: Boolean = false,
        val isSyncing: Boolean = false,
        val lastSyncTime: Long = 0L,
        val pendingUploads: Int = 0,
        val syncErrors: List<SyncError> = emptyList()
    )

    /**
     * Detailed sync error with categorization
     */
    data class SyncError(
        val type: ErrorType,
        val message: String,
        val timestamp: Long,
        val activityId: String? = null,
        val details: String? = null
    )

    /**
     * Error type categorization for diagnostics
     */
    enum class ErrorType {
        NETWORK,      // Network connectivity issues
        AUTH,         // Authentication/token errors
        API,          // API endpoint errors
        SERVER,       // Server-side errors (5xx)
        DATA,         // Data validation/parsing errors
        UNKNOWN       // Unknown error types
    }

    /**
     * Log sync error with categorization and timestamps
     */
    private fun logSyncError(type: ErrorType, message: String, activityId: String? = null, details: String? = null, exception: Exception? = null) {
        val timestamp = System.currentTimeMillis()
        val error = SyncError(
            type = type,
            message = message,
            timestamp = timestamp,
            activityId = activityId,
            details = details ?: exception?.message
        )

        synchronized(errorLog) {
            errorLog.add(0, error) // Add to beginning
            if (errorLog.size > MAX_ERROR_LOG_SIZE) {
                errorLog.removeAt(errorLog.size - 1) // Remove oldest
            }
        }

        // Update sync state with latest errors
        _syncState.value = _syncState.value.copy(
            syncErrors = errorLog.take(10) // Keep last 10 in state
        )

        // Enhanced logging for UI debugging
        println("DEBUG ActivitySyncManager: Sync error logged and state updated. Total errors in log: ${errorLog.size}")

        // Log to Android logcat with appropriate level
        val logMessage = "[$type] $message${activityId?.let { " (Activity: $it)" } ?: ""}${details?.let { " - $it" } ?: ""}"
        when (type) {
            ErrorType.NETWORK, ErrorType.AUTH -> Log.w(TAG, logMessage, exception)
            ErrorType.SERVER, ErrorType.API -> Log.e(TAG, logMessage, exception)
            else -> Log.d(TAG, logMessage, exception)
        }
    }

    /**
     * Get all sync errors from log
     */
    fun getSyncErrorLog(): List<SyncError> {
        return synchronized(errorLog) {
            errorLog.toList()
        }
    }

    /**
     * Clear sync error log
     */
    fun clearSyncErrorLog() {
        synchronized(errorLog) {
            errorLog.clear()
        }
        _syncState.value = _syncState.value.copy(syncErrors = emptyList())
    }

    /**
     * Initialize the sync manager
     */
    fun initialize() {
        Log.d(TAG, "Initializing Activity Sync Manager")

        scope.launch {
            try {
                // Check for unsynced activities on startup
                checkUnsyncedActivities()

                // Start periodic sync
                startPeriodicSync()
            } catch (e: Exception) {
                logSyncError(ErrorType.UNKNOWN, "Error during initialization", exception = e)
            }
        }
    }

    /**
     * Check for unsynced activities and update state
     */
    private suspend fun checkUnsyncedActivities() {
        try {
            val unsyncedActivities = activityDao.getUnsyncedActivities(userId)

            _syncState.value = _syncState.value.copy(
                pendingUploads = unsyncedActivities.size
            )

            Log.d(TAG, "Found ${unsyncedActivities.size} unsynced activities")

            // If we have unsynced activities, attempt sync
            if (unsyncedActivities.isNotEmpty()) {
                attemptSyncUnsyncedActivities()
            }

        } catch (e: Exception) {
            logSyncError(ErrorType.DATA, "Error checking unsynced activities", exception = e)
        }
    }

    /**
     * Start periodic background sync every 5 minutes with improved cancellation handling
     */
    private fun startPeriodicSync() {
        syncJob?.cancel()

        syncJob = scope.launch {
            try {
                while (isActive) {
                    delay(5 * 60 * 1000) // 5 minutes

                    // Check for cancellation before attempting sync
                    ensureActive()

                    if (!_syncState.value.isSyncing) {
                        try {
                            checkUnsyncedActivities()
                        } catch (e: CancellationException) {
                            Log.w(TAG, "Periodic sync cancelled during checkUnsyncedActivities")
                            throw e
                        } catch (e: Exception) {
                            logSyncError(ErrorType.UNKNOWN, "Error during periodic sync", exception = e)
                            // Continue periodic sync even if one cycle fails
                        }
                    }
                }
            } catch (e: CancellationException) {
                Log.d(TAG, "Periodic sync job cancelled")
                // Normal cancellation, don't log as error
            } catch (e: Exception) {
                Log.e(TAG, "Periodic sync job failed", e)
            }
        }
    }

    /**
     * FIX-052.4: Attempt to sync all unsynced activities with Mutex protection
     * Prevents race conditions when immediate sync and background sync run simultaneously
     */
    suspend fun attemptSyncUnsyncedActivities() {
        // FIX-052.4: Use Mutex to ensure only one sync runs at a time
        syncMutex.withLock {
            // Double-check sync status inside mutex
            if (_syncState.value.isSyncing) {
                Log.d(TAG, "Sync already in progress, skipping")
                return
            }

            _syncState.value = _syncState.value.copy(isSyncing = true)

            try {
                // Perform sync in current coroutine context to respect cancellation
                withContext(Dispatchers.IO) {
                    val unsyncedActivities = activityDao.getUnsyncedActivities(userId)
                    Log.d(TAG, "Starting sync for ${unsyncedActivities.size} activities")

                    var successCount = 0
                    val errors = mutableListOf<String>()

                    for (activity in unsyncedActivities) {
                        // Check for cancellation before each activity
                        ensureActive()

                        try {
                            val syncSuccess = syncActivityToCloud(activity)

                            if (syncSuccess) {
                                // Mark as synced
                                activityDao.markActivityAsSynced(activity.id)
                                successCount++
                                Log.d(TAG, "✅ Synced activity: ${activity.id}")
                            } else {
                                val errorMsg = "Failed to sync activity: ${activity.name}"
                                errors.add(errorMsg)
                                logSyncError(ErrorType.API, errorMsg, activityId = activity.id)
                            }

                        } catch (e: CancellationException) {
                            Log.w(TAG, "Sync cancelled for activity: ${activity.id}")
                            throw e // Re-throw cancellation to stop processing
                        } catch (e: Exception) {
                            val errorType = when {
                                e.message?.contains("Unable to resolve host", ignoreCase = true) == true -> ErrorType.NETWORK
                                e.message?.contains("401") == true -> ErrorType.AUTH
                                e.message?.contains("timeout", ignoreCase = true) == true -> ErrorType.NETWORK
                                e.message?.contains("5") == true && e.message?.contains("0") == true -> ErrorType.SERVER
                                else -> ErrorType.UNKNOWN
                            }
                            errors.add("Error syncing ${activity.name}: ${e.message}")
                            logSyncError(errorType, "Error syncing activity", activityId = activity.id, exception = e)
                        }

                        // Small delay between syncs to avoid overwhelming server
                        // Use delay() which respects cancellation
                        delay(500) // Reduced delay for better responsiveness
                    }

                    // Update state after successful completion
                    val remainingUnsynced = activityDao.getUnsyncedActivities(userId).size

                    _syncState.value = _syncState.value.copy(
                        isSyncing = false,
                        lastSyncTime = System.currentTimeMillis(),
                        pendingUploads = remainingUnsynced,
                        syncErrors = synchronized(errorLog) { errorLog.toList() }
                    )

                    Log.d(TAG, "Sync completed: $successCount success, ${errors.size} errors, $remainingUnsynced remaining")
                }

            } catch (e: CancellationException) {
                Log.w(TAG, "Sync operation was cancelled")
                _syncState.value = _syncState.value.copy(isSyncing = false)
                // Re-throw to respect cancellation
                throw e
            } catch (e: Exception) {
                logSyncError(ErrorType.UNKNOWN, "Sync process failed", exception = e)
                _syncState.value = _syncState.value.copy(
                    isSyncing = false
                )
            }
        }
    }

    /**
     * Sync single activity to cloud server
     */
    private suspend fun syncActivityToCloud(activity: Activity): Boolean {
        return try {
            Log.d(TAG, "Syncing activity to cloud: ${activity.id}")

            // Convert activity to cloud format
            val cloudData = mapOf(
                "id" to activity.id,
                "userId" to activity.userId,
                "type" to activity.type.name.lowercase(),  // Backend expects lowercase
                "name" to activity.name,
                "startTime" to activity.startTime.time,
                "endTime" to activity.endTime?.time,
                "totalDistance" to activity.totalDistance,
                "totalDuration" to activity.totalDuration,
                "averagePace" to activity.averagePace,
                "calories" to activity.calories,
                "gpsPoints" to activity.gpsPoints.map { point ->
                    mapOf(
                        "latitude" to point.latitude,
                        "longitude" to point.longitude,
                        "altitude" to point.altitude,
                        "accuracy" to point.accuracy,
                        "timestamp" to point.timestamp.time,
                        "speed" to point.speed
                    )
                },
                "status" to activity.status.name.lowercase(),  // Consistent lowercase formatting
                "createdAt" to activity.createdAt.time,
                "updatedAt" to activity.updatedAt.time
            )

            // Upload to real cloud API
            uploadActivityToCloud(activity)

        } catch (e: Exception) {
            Log.e(TAG, "Failed to sync activity ${activity.id}", e)
            false
        }
    }

    /**
     * Upload activity to cloud via real API
     */
    private suspend fun uploadActivityToCloud(activity: Activity): Boolean {
        return try {
            Log.d(TAG, "Uploading activity ${activity.id} to cloud API")

            // Check if we have authentication token
            val token = tokenManager.getToken()
            if (token.isNullOrEmpty()) {
                Log.w(TAG, "No auth token available, skipping upload")
                return false
            }

            // Convert activity to API request format
            val uploadRequest = activity.toWorkoutUploadRequest()

            // Make API call with retry logic
            var retries = 3
            var lastException: Exception? = null

            while (retries > 0) {
                try {
                    val response = workoutApi.uploadCompletedWorkout(
                        authToken = "Bearer $token",
                        workout = uploadRequest
                    )

                    if (response.isSuccessful && response.body()?.success == true) {
                        Log.d(TAG, "✅ Activity ${activity.id} uploaded successfully")
                        return true
                    } else {
                        val errorBody = response.errorBody()?.string()
                        val errorCode = response.code()

                        Log.w(TAG, "❌ Upload failed with code $errorCode: $errorBody")

                        // Categorize error for better debugging
                        val errorType = when (errorCode) {
                            400 -> "DATA_VALIDATION"     // Bad request - data validation
                            401 -> "AUTH_FAILED"         // Unauthorized
                            403 -> "USER_MISMATCH"       // User ID mismatch
                            404 -> "ENDPOINT_NOT_FOUND"  // Endpoint not found
                            in 500..599 -> "SERVER_ERROR"  // Server error
                            else -> "UNKNOWN"
                        }

                        Log.w(TAG, "Error type: $errorType, Activity: ${activity.name} (${activity.id})")

                        logSyncError(
                            type = if (errorCode in 400..499) ErrorType.DATA else ErrorType.SERVER,
                            message = "Upload failed: HTTP $errorCode ($errorType)",
                            activityId = activity.id,
                            details = errorBody
                        )

                        // Don't retry on 4xx errors (client errors)
                        if (errorCode in 400..499) {
                            return false
                        }
                    }
                } catch (e: Exception) {
                    lastException = e
                    Log.w(TAG, "Upload attempt failed (${retries - 1} retries left): ${e.message}")
                    Log.w(TAG, "Exception details: ${e.javaClass.simpleName} - ${e.localizedMessage}")
                    e.printStackTrace()
                }

                retries--
                if (retries > 0) {
                    delay(2000) // Wait 2 seconds before retry
                }
            }

            // Log detailed error information for debugging
            val errorMessage = when {
                lastException?.message?.contains("Unable to resolve host") == true -> "Network error: Cannot reach API server"
                lastException?.message?.contains("timeout") == true -> "Network error: Request timed out"
                lastException?.message?.contains("401") == true -> "Authentication error: Invalid or expired token"
                lastException?.message?.contains("403") == true -> "Authorization error: Access denied"
                lastException?.message?.contains("404") == true -> "API error: Endpoint not found"
                lastException?.message?.contains("500") == true -> "Server error: Backend issue"
                else -> "Unknown error: ${lastException?.message}"
            }
            Log.e(TAG, "❌ Failed to upload activity after all retries: $errorMessage", lastException)
            false

        } catch (e: Exception) {
            Log.e(TAG, "❌ Unexpected error uploading activity: ${e.message}", e)
            false
        }
    }

    /**
     * Manually trigger sync with cancellation handling
     */
    suspend fun manualSync() {
        Log.d(TAG, "Manual sync triggered")
        try {
            attemptSyncUnsyncedActivities()
        } catch (e: CancellationException) {
            Log.w(TAG, "Manual sync was cancelled")
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "Manual sync failed", e)
            throw e
        }
    }

    /**
     * Get all unsynced activities for user review
     */
    suspend fun getUnsyncedActivities(): List<Activity> {
        return withContext(Dispatchers.IO) {
            activityDao.getUnsyncedActivities(userId)
        }
    }

    /**
     * Delete specific unsynced activity (for problematic activities)
     */
    suspend fun deleteUnsyncedActivity(activityId: String) {
        withContext(Dispatchers.IO) {
            try {
                val activity = activityDao.getActivityById(activityId)
                if (activity != null) {
                    activityDao.deleteActivity(activity)

                    // Update sync state
                    val remainingUnsynced = activityDao.getUnsyncedActivities(userId).size
                    _syncState.value = _syncState.value.copy(
                        pendingUploads = remainingUnsynced
                    )

                    Log.d(TAG, "Deleted unsynced activity: $activityId")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to delete activity: $activityId", e)
                throw e
            }
        }
    }

    /**
     * Retry sync for specific activity
     */
    suspend fun retrySyncActivity(activityId: String) {
        withContext(Dispatchers.IO) {
            try {
                val activity = activityDao.getActivityById(activityId)
                if (activity != null && !activity.syncedToBackend) {
                    val success = syncActivityToCloud(activity)
                    if (success) {
                        activityDao.markActivityAsSynced(activityId)
                        Log.d(TAG, "✅ Retry sync successful for: $activityId")

                        // Update state
                        val remainingUnsynced = activityDao.getUnsyncedActivities(userId).size
                        _syncState.value = _syncState.value.copy(
                            pendingUploads = remainingUnsynced
                        )
                    } else {
                        logSyncError(ErrorType.API, "Retry sync failed", activityId = activityId)
                    }
                }
            } catch (e: Exception) {
                logSyncError(ErrorType.UNKNOWN, "Retry sync error", activityId = activityId, exception = e)
                throw e
            }
        }
    }

    /**
     * Delete all unsynced activities (for debugging/development)
     * WARNING: This permanently deletes all local unsynced data!
     */
    suspend fun deleteAllUnsyncedActivities(): Int {
        return withContext(Dispatchers.IO) {
            try {
                val unsyncedActivities = activityDao.getUnsyncedActivities(userId)
                val count = unsyncedActivities.size

                Log.d(TAG, "Deleting $count unsynced activities")

                unsyncedActivities.forEach { activity ->
                    activityDao.deleteActivity(activity)
                }

                // Update sync state
                _syncState.value = _syncState.value.copy(
                    pendingUploads = 0
                )

                Log.d(TAG, "Successfully deleted $count unsynced activities")
                count
            } catch (e: Exception) {
                Log.e(TAG, "Failed to delete unsynced activities", e)
                logSyncError(ErrorType.DATA, "Failed to delete unsynced activities", exception = e)
                0
            }
        }
    }

    /**
     * Stop the sync manager with proper cleanup
     */
    fun stop() {
        Log.d(TAG, "Stopping Activity Sync Manager")
        try {
            // Cancel periodic sync job first
            syncJob?.cancel()

            // Reset sync state
            _syncState.value = _syncState.value.copy(
                isSyncing = false,
                syncErrors = emptyList()
            )

            // Cancel the scope and all child jobs
            scope.cancel("ActivitySyncManager stopped")

            Log.d(TAG, "Activity Sync Manager stopped successfully")
        } catch (e: Exception) {
            Log.w(TAG, "Error stopping Activity Sync Manager", e)
        }
    }
}