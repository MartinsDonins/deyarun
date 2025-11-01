package com.deyarun.mobile.data.sync

import android.content.Context
import android.util.Log
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import com.deyarun.mobile.data.local.LocalDatabase
import com.deyarun.mobile.data.api.CloudApi
import com.deyarun.mobile.data.api.CloudApiExtensions
import com.deyarun.mobile.data.storage.TokenManager
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.ConcurrentHashMap

/**
 * Cloud Sync Service for DeyaRun
 * Manages offline-first data synchronization between local storage and cloud
 */
class CloudSyncService(
    private val context: Context,
    private val localDatabase: LocalDatabase,
    private val cloudApi: CloudApi,
    private val tokenManager: TokenManager
) {
    // Create CloudApiExtensions instance for activity uploads
    private val cloudApiExtensions: CloudApiExtensions by lazy {
        val retrofit = Retrofit.Builder()
            .baseUrl("https://api.deyarun.com/api/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        retrofit.create(CloudApiExtensions::class.java)
    }
    private val TAG = "CloudSyncService"
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // Sync state management
    private val _syncState = MutableStateFlow(SyncState())
    val syncState: StateFlow<SyncState> = _syncState.asStateFlow()

    // Track pending syncs to avoid conflicts
    private val pendingSyncs = ConcurrentHashMap<String, Job>()

    // Store last 50 sync errors in memory for diagnostics
    private val errorLog = mutableListOf<SyncError>()
    private val MAX_ERROR_LOG_SIZE = 50

    data class SyncState(
        val isOnline: Boolean = false,
        val isSyncing: Boolean = false,
        val lastSyncTime: Long = 0L,
        val pendingUploads: Int = 0,
        val pendingDownloads: Int = 0,
        val syncErrors: List<SyncError> = emptyList()
    )

    /**
     * Enhanced sync error tracking with categorization
     */
    data class SyncError(
        val type: ErrorType,
        val message: String,
        val timestamp: Long,
        val retryCount: Int = 0,
        val details: String? = null
    )

    /**
     * Error type categorization for better diagnostics
     */
    enum class ErrorType {
        NETWORK,      // Network connectivity issues
        AUTH,         // Authentication/token errors
        API,          // API endpoint errors
        SERVER,       // Server-side errors (5xx)
        DATA,         // Data validation/parsing errors
        CONFLICT,     // Sync conflict resolution errors
        UNKNOWN       // Unknown error types
    }

    /**
     * Log sync error with categorization and timestamps
     */
    private fun logSyncError(type: ErrorType, message: String, details: String? = null, exception: Exception? = null) {
        val timestamp = System.currentTimeMillis()
        val error = SyncError(
            type = type,
            message = message,
            timestamp = timestamp,
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

        // Log to Android logcat with appropriate level
        val logMessage = "[$type] $message${details?.let { " - $it" } ?: ""}"
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
     * Initialize sync service and start monitoring
     */
    fun initialize() {
        Log.d(TAG, "Initializing Cloud Sync Service")

        scope.launch {
            // Monitor network connectivity
            monitorNetworkStatus()

            // Schedule periodic background sync
            schedulePeriodicSync()

            // Process any pending offline data
            processPendingData()
        }
    }

    /**
     * Manual sync trigger (pull-to-refresh, etc.)
     */
    suspend fun triggerManualSync(): SyncResult {
        return withContext(Dispatchers.IO) {
            try {
                _syncState.value = _syncState.value.copy(isSyncing = true)

                val result = performFullSync()

                _syncState.value = _syncState.value.copy(
                    isSyncing = false,
                    lastSyncTime = System.currentTimeMillis()
                )

                result
            } catch (e: Exception) {
                logSyncError(ErrorType.UNKNOWN, "Manual sync failed", exception = e)
                _syncState.value = _syncState.value.copy(isSyncing = false)
                SyncResult.Error(e.message ?: "Unknown error")
            }
        }
    }

    /**
     * Sync specific data type
     */
    suspend fun syncDataType(dataType: DataType): SyncResult {
        val syncId = "${dataType.name}_${System.currentTimeMillis()}"

        if (pendingSyncs.containsKey(syncId)) {
            return SyncResult.Error("Sync already in progress for $dataType")
        }

        val syncJob = scope.launch {
            try {
                when (dataType) {
                    DataType.ACTIVITIES -> syncActivities()
                    DataType.GOALS -> syncGoals()
                    DataType.PREFERENCES -> syncPreferences()
                    DataType.STATISTICS -> syncStatistics()
                    DataType.ACHIEVEMENTS -> syncAchievements()
                }
            } finally {
                pendingSyncs.remove(syncId)
            }
        }

        pendingSyncs[syncId] = syncJob
        syncJob.join()

        return SyncResult.Success
    }

    /**
     * Queue data for upload when connectivity is restored
     */
    suspend fun queueForUpload(data: SyncableData) {
        withContext(Dispatchers.IO) {
            localDatabase.pendingUploadsDao().insert(
                com.deyarun.mobile.data.local.PendingUploadEntity(
                    id = data.id,
                    dataType = data.type,
                    data = data.serialize(),
                    timestamp = System.currentTimeMillis(),
                    retryCount = 0,
                    priority = 0
                )
            )

            _syncState.value = _syncState.value.copy(
                pendingUploads = _syncState.value.pendingUploads + 1
            )

            // Try immediate upload if online
            if (_syncState.value.isOnline) {
                uploadPendingData()
            }
        }
    }

    /**
     * Handle sync conflicts with server data
     */
    private suspend fun resolveConflict(
        localData: SyncableData,
        serverData: SyncableData
    ): SyncableData {
        return when {
            // Server data is newer
            serverData.lastModified > localData.lastModified -> {
                Log.d(TAG, "Using server data (newer): ${serverData.id}")
                serverData
            }
            // Local data is newer
            localData.lastModified > serverData.lastModified -> {
                Log.d(TAG, "Using local data (newer): ${localData.id}")
                localData
            }
            // Same timestamp - merge if possible
            else -> {
                Log.d(TAG, "Merging conflicting data: ${localData.id}")
                mergeData(localData, serverData)
            }
        }
    }

    /**
     * Intelligent data merging for conflicts
     */
    private fun mergeData(local: SyncableData, server: SyncableData): SyncableData {
        // Implementation depends on data type
        // For running activities - prefer local (user's device data)
        // For goals - merge both and take highest values
        // For preferences - prefer local (user's current choices)

        return when (local.type) {
            DataType.ACTIVITIES -> local // Always prefer local activity data
            DataType.GOALS -> mergeGoals(local, server)
            DataType.PREFERENCES -> local // Always prefer local preferences
            DataType.STATISTICS -> mergeStatistics(local, server)
            DataType.ACHIEVEMENTS -> mergeAchievements(local, server)
        }
    }

    /**
     * Background sync operations
     */
    private suspend fun performFullSync(): SyncResult {
        return try {
            // 1. Upload pending local changes
            uploadPendingData()

            // 2. Download latest server changes
            downloadServerChanges()

            // 3. Resolve any conflicts
            resolveAllConflicts()

            SyncResult.Success
        } catch (e: Exception) {
            Log.e(TAG, "Full sync failed", e)
            SyncResult.Error(e.message ?: "Sync failed")
        }
    }

    private suspend fun uploadPendingData() {
        val pendingUploads = localDatabase.pendingUploadsDao().getAll()

        pendingUploads.forEach { upload ->
            try {
                val response = cloudApi.uploadData(upload.dataType, upload.data)
                if (response.isSuccessful) {
                    // Remove from pending queue
                    localDatabase.pendingUploadsDao().delete(upload)
                    _syncState.value = _syncState.value.copy(
                        pendingUploads = _syncState.value.pendingUploads - 1
                    )
                }
            } catch (e: Exception) {
                val errorType = when {
                    e.message?.contains("Unable to resolve host", ignoreCase = true) == true -> ErrorType.NETWORK
                    e.message?.contains("401") == true -> ErrorType.AUTH
                    e.message?.contains("timeout", ignoreCase = true) == true -> ErrorType.NETWORK
                    else -> ErrorType.API
                }
                logSyncError(errorType, "Failed to upload data: ${upload.id}", exception = e)
                // Increment retry count
                localDatabase.pendingUploadsDao().incrementRetryCount(upload.id)
            }
        }
    }

    private suspend fun downloadServerChanges() {
        val lastSync = _syncState.value.lastSyncTime

        try {
            val changes = cloudApi.getChangesSince(lastSync)

            changes.forEach { change ->
                when (change.operation) {
                    "CREATE", "UPDATE" -> {
                        val localData = localDatabase.getDataById(change.id)
                        if (localData != null) {
                            // TODO: Resolve conflict - implement proper data conversion
                            // val resolved = resolveConflict(localData, change.data)
                            // localDatabase.updateData(resolved)
                        } else {
                            // TODO: Insert new data - implement proper data conversion
                            // localDatabase.insertData(change.data)
                        }
                    }
                    "DELETE" -> {
                        localDatabase.deleteData(change.id)
                    }
                }
            }
        } catch (e: Exception) {
            logSyncError(ErrorType.API, "Failed to download server changes", exception = e)
            throw e
        }
    }

    private suspend fun resolveAllConflicts() {
        // Check for any remaining conflicts and resolve them
        val conflicts = localDatabase.conflictsDao().getAll()

        conflicts.forEach { conflict ->
            // TODO: Implement proper conflict resolution
            // val resolved = resolveConflict(conflict.localData, conflict.serverData)
            // localDatabase.updateData(resolved)
            localDatabase.conflictsDao().deleteById(conflict.id)
        }
    }

    // Specific sync methods for different data types
    private suspend fun syncActivities() {
        Log.d(TAG, "Syncing running activities...")
        try {
            // Get local activities that need sync
            val localActivities = localDatabase.activityDao().getAllActivities()
            val unsyncedActivities = localActivities.filter { !it.syncedToBackend }

            Log.d(TAG, "Found ${unsyncedActivities.size} unsynced activities")

            unsyncedActivities.forEach { activity ->
                try {
                    val workoutData = convertActivityToSyncData(activity)
                    Log.d(TAG, "Uploading activity: ${activity.name}")

                    // Upload activity to server
                    val response = cloudApiExtensions.uploadActivity(workoutData)

                    if (response.isSuccessful && response.body()?.success == true) {
                        val cloudId = response.body()?.cloudId ?: response.body()?.id
                        val syncedActivity = activity.copy(syncedToBackend = true, cloudId = cloudId)
                        localDatabase.activityDao().updateActivity(syncedActivity)
                        Log.d(TAG, "Activity synced successfully: ${activity.name}, cloudId: $cloudId")
                    } else {
                        Log.e(TAG, "Activity upload failed: ${response.message()}")
                    }
                } catch (e: Exception) {
                    logSyncError(ErrorType.API, "Error syncing activity ${activity.id}", exception = e)
                }
            }

            // Download new activities from server
            downloadServerActivities()
        } catch (e: Exception) {
            logSyncError(ErrorType.UNKNOWN, "Activity sync failed", exception = e)
        }
    }

    private fun convertActivityToSyncData(activity: com.deyarun.mobile.data.model.Activity): Map<String, Any> {
        return mapOf(
            "localId" to activity.id,
            "userId" to activity.userId,
            "type" to activity.type.name,
            "name" to activity.name,
            "startTime" to activity.startTime.time,
            "endTime" to (activity.endTime?.time ?: 0),
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
                    "timestamp" to point.timestamp.time
                )
            },
            "status" to activity.status.name,
            "createdAt" to activity.createdAt.time,
            "updatedAt" to activity.updatedAt.time
        )
    }

    private suspend fun downloadServerActivities() {
        try {
            val lastSync = _syncState.value.lastSyncTime
            Log.d(TAG, "Downloading activities since: $lastSync")

            val response = cloudApiExtensions.getActivitiesSince(lastSync)

            if (response.isSuccessful) {
                val serverActivities = response.body() ?: emptyList()
                Log.d(TAG, "Downloaded ${serverActivities.size} activities from server")

                serverActivities.forEach { serverActivity ->
                    try {
                        val localActivity = convertServerActivityToLocal(serverActivity)
                        localDatabase.activityDao().insertActivity(localActivity)
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to save downloaded activity", e)
                    }
                }
            } else {
                Log.e(TAG, "Failed to download activities: ${response.message()}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to download server activities", e)
        }
    }

    private fun convertServerActivityToLocal(serverActivity: Map<String, Any>): com.deyarun.mobile.data.model.Activity {
        return com.deyarun.mobile.data.model.Activity(
            id = serverActivity["localId"] as? String ?: java.util.UUID.randomUUID().toString(),
            userId = serverActivity["userId"] as String,
            type = com.deyarun.mobile.data.model.ActivityType.valueOf(serverActivity["type"] as String),
            name = serverActivity["name"] as String,
            startTime = java.util.Date(serverActivity["startTime"] as Long),
            endTime = (serverActivity["endTime"] as? Long)?.let { java.util.Date(it) },
            totalDistance = (serverActivity["totalDistance"] as? Number)?.toDouble() ?: 0.0,
            totalDuration = (serverActivity["totalDuration"] as? Number)?.toLong() ?: 0L,
            averagePace = (serverActivity["averagePace"] as? Number)?.toDouble() ?: 0.0,
            calories = (serverActivity["calories"] as? Number)?.toInt() ?: 0,
            gpsPoints = (serverActivity["gpsPoints"] as? List<Map<String, Any>>)?.map { pointData ->
                com.deyarun.mobile.data.model.GpsPoint(
                    latitude = (pointData["latitude"] as Number).toDouble(),
                    longitude = (pointData["longitude"] as Number).toDouble(),
                    altitude = (pointData["altitude"] as? Number)?.toDouble(),
                    accuracy = (pointData["accuracy"] as? Number)?.toFloat(),
                    timestamp = java.util.Date(pointData["timestamp"] as Long)
                )
            } ?: emptyList(),
            status = com.deyarun.mobile.data.model.ActivityStatus.valueOf(serverActivity["status"] as String),
            syncedToBackend = true,
            cloudId = serverActivity["id"] as? String
        )
    }

    private suspend fun syncGoals() {
        Log.d(TAG, "Syncing user goals...")
        // Implementation for goals sync
    }

    private suspend fun syncPreferences() {
        Log.d(TAG, "Syncing user preferences...")
        // Implementation for preferences sync
    }

    private suspend fun syncStatistics() {
        Log.d(TAG, "Syncing statistics...")
        // Implementation for statistics sync
    }

    private suspend fun syncAchievements() {
        Log.d(TAG, "Syncing achievements...")
        // Implementation for achievements sync
    }

    private fun mergeGoals(local: SyncableData, server: SyncableData): SyncableData {
        // Merge goal data - take highest values, keep user preferences
        return local // Simplified implementation
    }

    private fun mergeStatistics(local: SyncableData, server: SyncableData): SyncableData {
        // Merge statistics - combine data points, resolve conflicts
        return local // Simplified implementation
    }

    private fun mergeAchievements(local: SyncableData, server: SyncableData): SyncableData {
        // Merge achievements - union of both sets
        return local // Simplified implementation
    }

    private suspend fun monitorNetworkStatus() {
        try {
            // Simple network check - in production would use ConnectivityManager
            val isOnline = checkNetworkConnection()
            _syncState.value = _syncState.value.copy(isOnline = isOnline)

            if (isOnline && _syncState.value.pendingUploads > 0) {
                Log.d(TAG, "Network available, processing pending uploads")
                uploadPendingData()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Network monitoring failed", e)
        }
    }

    private suspend fun checkNetworkConnection(): Boolean {
        return try {
            // Simple ping to check connectivity
            // Temporary: simulate online status
            true // cloudApi.healthCheck().isSuccessful
        } catch (e: Exception) {
            false
        }
    }

    private suspend fun schedulePeriodicSync() {
        Log.d(TAG, "Scheduling periodic sync every 30 minutes")
        // WorkManager integration would be added here
        // For now, simple coroutine-based periodic check
        scope.launch {
            while (scope.isActive) {
                delay(30 * 60 * 1000) // 30 minutes
                if (_syncState.value.isOnline) {
                    try {
                        performFullSync()
                    } catch (e: Exception) {
                        Log.e(TAG, "Periodic sync failed", e)
                    }
                }
            }
        }
    }

    private suspend fun processPendingData() {
        Log.d(TAG, "Processing pending data")
        try {
            // Count pending uploads
            val pendingCount = localDatabase.pendingUploadsDao().getCount()
            _syncState.value = _syncState.value.copy(pendingUploads = pendingCount)

            // Process any data that was queued while offline
            if (_syncState.value.isOnline && pendingCount > 0) {
                Log.d(TAG, "Found $pendingCount pending uploads")
                uploadPendingData()
            } else if (pendingCount > 0) {
                Log.d(TAG, "$pendingCount pending uploads waiting for network")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to process pending data", e)
        }
    }

    fun destroy() {
        scope.cancel()
    }
}

// Database entities for sync management
data class PendingUpload(
    val id: String,
    val dataType: DataType,
    val data: String,
    val timestamp: Long,
    val retryCount: Int
)

data class SyncConflict(
    val id: String,
    val localData: SyncableData,
    val serverData: SyncableData,
    val timestamp: Long
)