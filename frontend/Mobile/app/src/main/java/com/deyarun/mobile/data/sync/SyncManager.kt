package com.deyarun.mobile.data.sync

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.util.Log
import androidx.work.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import java.util.concurrent.TimeUnit
import com.deyarun.mobile.data.local.LocalDatabase
import com.deyarun.mobile.data.api.CloudApi
import com.deyarun.mobile.data.storage.TokenManager

/**
 * Central manager for all cloud synchronization operations
 * Handles offline-first data strategy with intelligent conflict resolution
 */
class SyncManager(
    private val context: Context,
    private val localDatabase: LocalDatabase,
    private val cloudApi: CloudApi,
    private val tokenManager: TokenManager
) {
    private val TAG = "SyncManager"
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // Use real cloud sync service with API integration
    private val cloudSyncService = CloudSyncService(context, localDatabase, cloudApi, tokenManager)

    // Network monitoring
    private val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    private val _isOnline = MutableStateFlow(false)
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    // Sync state
    private val _syncState = MutableStateFlow(SyncState())
    val syncState: StateFlow<SyncState> = _syncState.asStateFlow()

    data class SyncState(
        val isInitialized: Boolean = false,
        val isOnline: Boolean = false,
        val lastFullSync: Long = 0L,
        val pendingUploads: Int = 0,
        val pendingConflicts: Int = 0,
        val autoSyncEnabled: Boolean = true,
        val wifiOnlySync: Boolean = true
    )

    /**
     * Initialize the sync manager
     */
    fun initialize() {
        Log.d(TAG, "Initializing SyncManager")

        scope.launch {
            try {
                // Initialize cloud sync service
                cloudSyncService.initialize()

                // Start network monitoring
                startNetworkMonitoring()

                // Schedule periodic background sync
                schedulePeriodicSync()

                // Update state
                _syncState.value = _syncState.value.copy(isInitialized = true)

                Log.d(TAG, "SyncManager initialized successfully")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to initialize SyncManager", e)
            }
        }
    }

    /**
     * Manual full sync trigger
     */
    suspend fun triggerFullSync(): SyncResult {
        return withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Triggering manual full sync")

                if (!_syncState.value.isOnline) {
                    return@withContext SyncResult.Error("No internet connection")
                }

                val result = cloudSyncService.triggerManualSync()

                if (result is SyncResult.Success) {
                    _syncState.value = _syncState.value.copy(
                        lastFullSync = System.currentTimeMillis()
                    )
                }

                result
            } catch (e: Exception) {
                Log.e(TAG, "Manual sync failed", e)
                SyncResult.Error(e.message ?: "Unknown error")
            }
        }
    }

    /**
     * Sync specific data type
     */
    suspend fun syncDataType(dataType: DataType): SyncResult {
        return if (_syncState.value.isOnline) {
            cloudSyncService.syncDataType(dataType)
        } else {
            SyncResult.Error("No internet connection")
        }
    }

    /**
     * Queue data for upload when connectivity is restored
     */
    suspend fun queueForUpload(data: SyncableData, priority: Int = 0) {
        withContext(Dispatchers.IO) {
            try {
                cloudSyncService.queueForUpload(data)

                // Update pending uploads count
                val pendingCount = localDatabase.pendingUploadsDao().getCount()
                _syncState.value = _syncState.value.copy(pendingUploads = pendingCount)

                Log.d(TAG, "Data queued for upload: ${data.id}, pending: $pendingCount")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to queue data for upload", e)
            }
        }
    }

    /**
     * Get pending upload count
     */
    suspend fun getPendingUploadsCount(): Int {
        return localDatabase.pendingUploadsDao().getCount()
    }

    /**
     * Get conflict count
     */
    suspend fun getConflictsCount(): Int {
        return localDatabase.conflictsDao().getCount()
    }

    /**
     * Get sync statistics
     */
    suspend fun getSyncStatistics(): SyncStatistics {
        return withContext(Dispatchers.IO) {
            val pendingUploads = localDatabase.pendingUploadsDao().getCount()
            val conflicts = localDatabase.conflictsDao().getCount()
            val lastSync = _syncState.value.lastFullSync

            SyncStatistics(
                pendingUploads = pendingUploads,
                pendingConflicts = conflicts,
                lastFullSync = lastSync,
                isOnline = _syncState.value.isOnline,
                autoSyncEnabled = _syncState.value.autoSyncEnabled
            )
        }
    }

    /**
     * Enable/disable auto sync
     */
    fun setAutoSyncEnabled(enabled: Boolean) {
        _syncState.value = _syncState.value.copy(autoSyncEnabled = enabled)

        if (enabled && _syncState.value.isOnline) {
            scope.launch {
                triggerAutoSync()
            }
        }
    }

    /**
     * Enable/disable WiFi-only sync
     */
    fun setWifiOnlySync(wifiOnly: Boolean) {
        _syncState.value = _syncState.value.copy(wifiOnlySync = wifiOnly)
    }

    /**
     * Force upload all pending data (user initiated)
     */
    suspend fun forceUploadAll(): SyncResult {
        return withContext(Dispatchers.IO) {
            try {
                if (!_syncState.value.isOnline) {
                    return@withContext SyncResult.Error("No internet connection")
                }

                val pendingUploads = localDatabase.pendingUploadsDao().getAll()
                var successCount = 0
                val errors = mutableListOf<String>()

                pendingUploads.forEach { upload ->
                    try {
                        val response = cloudApi.uploadData(upload.dataType, upload.data)
                        if (response.isSuccessful) {
                            localDatabase.pendingUploadsDao().deleteById(upload.id)
                            successCount++
                        } else {
                            errors.add("Failed to upload ${upload.id}: ${response.message()}")
                        }
                    } catch (e: Exception) {
                        errors.add("Upload error for ${upload.id}: ${e.message}")
                    }
                }

                // Update pending count
                val remainingCount = localDatabase.pendingUploadsDao().getCount()
                _syncState.value = _syncState.value.copy(pendingUploads = remainingCount)

                if (errors.isEmpty()) {
                    SyncResult.Success
                } else {
                    SyncResult.PartialSuccess(errors)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Force upload failed", e)
                SyncResult.Error(e.message ?: "Unknown error")
            }
        }
    }

    /**
     * Clear all sync data (reset)
     */
    suspend fun clearAllSyncData() {
        withContext(Dispatchers.IO) {
            try {
                localDatabase.pendingUploadsDao().deleteAll()
                localDatabase.conflictsDao().deleteAll()

                _syncState.value = _syncState.value.copy(
                    pendingUploads = 0,
                    pendingConflicts = 0,
                    lastFullSync = 0L
                )

                Log.d(TAG, "All sync data cleared")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to clear sync data", e)
            }
        }
    }

    private fun startNetworkMonitoring() {
        val networkRequest = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        val networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                super.onAvailable(network)
                Log.d(TAG, "Network available")
                _isOnline.value = true
                _syncState.value = _syncState.value.copy(isOnline = true)

                // Trigger auto sync when connection is restored
                if (_syncState.value.autoSyncEnabled) {
                    scope.launch {
                        delay(2000) // Wait a bit for connection to stabilize
                        triggerAutoSync()
                    }
                }
            }

            override fun onLost(network: Network) {
                super.onLost(network)
                Log.d(TAG, "Network lost")
                _isOnline.value = false
                _syncState.value = _syncState.value.copy(isOnline = false)
            }
        }

        connectivityManager.registerNetworkCallback(networkRequest, networkCallback)

        // Check initial network state
        val currentNetwork = connectivityManager.activeNetwork
        val capabilities = connectivityManager.getNetworkCapabilities(currentNetwork)
        val isConnected = capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true

        _isOnline.value = isConnected
        _syncState.value = _syncState.value.copy(isOnline = isConnected)
    }

    private suspend fun triggerAutoSync() {
        if (!_syncState.value.autoSyncEnabled || !_syncState.value.isOnline) {
            return
        }

        // Check if WiFi-only is enabled and we're not on WiFi
        if (_syncState.value.wifiOnlySync && !isOnWifi()) {
            Log.d(TAG, "Auto sync skipped - WiFi only mode and not on WiFi")
            return
        }

        // Check if enough time has passed since last sync
        val timeSinceLastSync = System.currentTimeMillis() - _syncState.value.lastFullSync
        val minSyncInterval = TimeUnit.MINUTES.toMillis(30) // 30 minutes

        if (timeSinceLastSync < minSyncInterval) {
            Log.d(TAG, "Auto sync skipped - too soon since last sync")
            return
        }

        try {
            Log.d(TAG, "Triggering auto sync")
            triggerFullSync()
        } catch (e: Exception) {
            Log.e(TAG, "Auto sync failed", e)
        }
    }

    private fun isOnWifi(): Boolean {
        val capabilities = connectivityManager.getNetworkCapabilities(connectivityManager.activeNetwork)
        return capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true
    }

    private fun schedulePeriodicSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(
                if (_syncState.value.wifiOnlySync) {
                    NetworkType.UNMETERED
                } else {
                    NetworkType.CONNECTED
                }
            )
            .setRequiresBatteryNotLow(true)
            .build()

        val syncWorkRequest = PeriodicWorkRequestBuilder<SyncWorker>(
            repeatInterval = 4, // Every 4 hours
            repeatIntervalTimeUnit = TimeUnit.HOURS,
            flexTimeInterval = 1, // 1 hour flex
            flexTimeIntervalUnit = TimeUnit.HOURS
        )
            .setConstraints(constraints)
            .setBackoffCriteria(
                BackoffPolicy.EXPONENTIAL,
                WorkRequest.MIN_BACKOFF_MILLIS,
                TimeUnit.MILLISECONDS
            )
            .build()

        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(
                "cloud_sync",
                ExistingPeriodicWorkPolicy.KEEP,
                syncWorkRequest
            )
    }

    fun destroy() {
        scope.cancel()
        cloudSyncService.destroy()
    }

    data class SyncStatistics(
        val pendingUploads: Int,
        val pendingConflicts: Int,
        val lastFullSync: Long,
        val isOnline: Boolean,
        val autoSyncEnabled: Boolean
    )
}

/**
 * WorkManager worker for background sync
 */
class SyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            // Get sync manager instance and trigger sync
            // This would be injected via dependency injection in real app

            Log.d("SyncWorker", "Background sync started")

            // Perform lightweight sync operations
            // - Upload pending changes
            // - Download critical updates
            // - Resolve simple conflicts

            Result.success()
        } catch (e: Exception) {
            Log.e("SyncWorker", "Background sync failed", e)
            Result.retry()
        }
    }
}