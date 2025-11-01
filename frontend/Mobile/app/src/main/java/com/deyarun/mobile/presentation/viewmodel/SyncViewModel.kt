package com.deyarun.mobile.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.CancellationException
import android.util.Log
import com.deyarun.mobile.data.sync.SyncManager

data class SyncViewState(
    val syncStatistics: SyncManager.SyncStatistics = SyncManager.SyncStatistics(0, 0, 0L, false, true),
    val isLoading: Boolean = false,
    val error: String? = null,
    val lastSyncMessage: String? = null
)

class SyncViewModel(
    private val syncManager: SyncManager
) : ViewModel() {

    private val TAG = "SyncViewModel"
    private val _syncState = MutableStateFlow(SyncViewState())
    val syncState: StateFlow<SyncViewState> = _syncState.asStateFlow()

    init {
        loadSyncStatistics()
        startSyncStatusMonitoring()
    }

    private fun loadSyncStatistics() {
        viewModelScope.launch {
            try {
                val statistics = syncManager.getSyncStatistics()
                _syncState.value = _syncState.value.copy(
                    syncStatistics = statistics,
                    isLoading = false,
                    error = null
                )
            } catch (e: Exception) {
                _syncState.value = _syncState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to load sync statistics"
                )
            }
        }
    }

    private fun startSyncStatusMonitoring() {
        viewModelScope.launch {
            syncManager.syncState.collect { syncState ->
                loadSyncStatistics()
            }
        }
    }

    fun triggerManualSync() {
        viewModelScope.launch {
            try {
                _syncState.value = _syncState.value.copy(isLoading = true, error = null)
                Log.d(TAG, "Triggering manual sync")

                val result = syncManager.triggerFullSync()
                val statistics = syncManager.getSyncStatistics()

                _syncState.value = _syncState.value.copy(
                    syncStatistics = statistics,
                    isLoading = false,
                    lastSyncMessage = when (result) {
                        is com.deyarun.mobile.data.sync.SyncResult.Success -> "Sync completed successfully"
                        is com.deyarun.mobile.data.sync.SyncResult.Error -> result.message
                        is com.deyarun.mobile.data.sync.SyncResult.PartialSuccess -> "Sync completed with some errors: ${result.errors.size} items failed"
                    }
                )
                Log.d(TAG, "Manual sync completed successfully")
            } catch (e: CancellationException) {
                Log.w(TAG, "Manual sync was cancelled")
                _syncState.value = _syncState.value.copy(
                    isLoading = false,
                    lastSyncMessage = "Sync was cancelled"
                )
                // Don't treat cancellation as error
            } catch (e: Exception) {
                Log.e(TAG, "Manual sync failed", e)
                _syncState.value = _syncState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Sync failed"
                )
            }
        }
    }

    fun clearAllSyncData() {
        viewModelScope.launch {
            try {
                _syncState.value = _syncState.value.copy(isLoading = true, error = null)

                syncManager.clearAllSyncData()
                val statistics = syncManager.getSyncStatistics()

                _syncState.value = _syncState.value.copy(
                    syncStatistics = statistics,
                    isLoading = false,
                    lastSyncMessage = "All sync data cleared"
                )
            } catch (e: Exception) {
                _syncState.value = _syncState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to clear sync data"
                )
            }
        }
    }

    fun enableAutoSync(enabled: Boolean) {
        syncManager.setAutoSyncEnabled(enabled)
        loadSyncStatistics()
    }

    fun enableWifiOnlySync(wifiOnly: Boolean) {
        syncManager.setWifiOnlySync(wifiOnly)
        loadSyncStatistics()
    }

    fun forceUploadAll() {
        viewModelScope.launch {
            try {
                _syncState.value = _syncState.value.copy(isLoading = true, error = null)
                Log.d(TAG, "Starting force upload all")

                val result = syncManager.forceUploadAll()
                val statistics = syncManager.getSyncStatistics()

                _syncState.value = _syncState.value.copy(
                    syncStatistics = statistics,
                    isLoading = false,
                    lastSyncMessage = when (result) {
                        is com.deyarun.mobile.data.sync.SyncResult.Success -> "All data uploaded successfully"
                        is com.deyarun.mobile.data.sync.SyncResult.Error -> result.message
                        is com.deyarun.mobile.data.sync.SyncResult.PartialSuccess -> "Upload completed with ${result.errors.size} errors"
                    }
                )
                Log.d(TAG, "Force upload completed successfully")
            } catch (e: CancellationException) {
                Log.w(TAG, "Force upload was cancelled")
                _syncState.value = _syncState.value.copy(
                    isLoading = false,
                    lastSyncMessage = "Upload was cancelled"
                )
                // Don't treat cancellation as error
            } catch (e: Exception) {
                Log.e(TAG, "Force upload failed", e)
                _syncState.value = _syncState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Upload failed"
                )
            }
        }
    }

    fun clearError() {
        _syncState.value = _syncState.value.copy(error = null)
    }

    fun clearMessage() {
        _syncState.value = _syncState.value.copy(lastSyncMessage = null)
    }
}