package com.deyarun.mobile.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.deyarun.mobile.data.model.*
import com.deyarun.mobile.data.repository.StravaRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

/**
 * UI state for Strava integration screen
 */
data class StravaUiState(
    val isLoading: Boolean = false,
    val isConnected: Boolean = false,
    val athlete: StravaAthlete? = null,
    val activities: List<StravaActivity> = emptyList(),
    val activityStats: StravaActivityStats? = null,
    val syncStatus: StravaSyncStatus? = null,
    val lastSyncResult: StravaSyncResult? = null,
    val syncPreferences: StravaSyncPreferences = StravaSyncPreferences(),
    val error: String? = null,
    val isRefreshing: Boolean = false,
    val isSyncing: Boolean = false
)

/**
 * ViewModel for Strava integration
 */
class StravaViewModel(
    private val stravaRepository: StravaRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(StravaUiState())
    val uiState: StateFlow<StravaUiState> = _uiState.asStateFlow()

    init {
        loadConnectionStatus()
    }

    /**
     * Load Strava connection status and data
     */
    fun loadConnectionStatus() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            try {
                val connection = stravaRepository.getConnectionStatus()

                _uiState.update { currentState ->
                    currentState.copy(
                        isLoading = false,
                        isConnected = connection.isConnected,
                        athlete = connection.athlete,
                        syncPreferences = connection.syncPreferences ?: StravaSyncPreferences()
                    )
                }

                // If connected, load additional data
                if (connection.isConnected) {
                    loadActivities()
                    loadSyncStatus()
                    loadActivityStats()
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load connection status"
                    )
                }
            }
        }
    }

    /**
     * Start Strava OAuth flow via backend
     */
    fun connectToStrava() {
        viewModelScope.launch {
            try {
                android.util.Log.d("StravaViewModel", "Starting Strava connection flow via backend")
                _uiState.update { it.copy(isLoading = true, error = null) }

                // Get auth URL from backend
                stravaRepository.getAuthUrl()
                    .onSuccess { authUrl ->
                        android.util.Log.d("StravaViewModel", "Got auth URL, opening browser")

                        // Open browser with auth URL
                        stravaRepository.openAuthUrl(authUrl)

                        // Show message and start polling
                        _uiState.update {
                            it.copy(
                                isLoading = true,
                                error = "Pārlūks ir atvērts. Lūdzu, autorizējiet Strava..."
                            )
                        }

                        // Start polling for connection status
                        pollForConnection()
                    }
                    .onFailure { error ->
                        android.util.Log.e("StravaViewModel", "Failed to get auth URL", error)
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                error = error.message ?: "Neizdevās sākt autentifikāciju"
                            )
                        }
                    }

            } catch (e: Exception) {
                android.util.Log.e("StravaViewModel", "Failed to start OAuth flow", e)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Neizdevās sākt autentifikāciju"
                    )
                }
            }
        }
    }

    /**
     * Poll backend for connection status after opening auth URL
     */
    private fun pollForConnection() {
        viewModelScope.launch {
            android.util.Log.d("StravaViewModel", "Starting connection polling...")

            stravaRepository.pollConnectionStatus()
                .onSuccess {
                    android.util.Log.d("StravaViewModel", "✅ Connection successful!")
                    _uiState.update { it.copy(isLoading = false, error = null) }
                    loadConnectionStatus() // Reload to get fresh data
                }
                .onFailure { error ->
                    android.util.Log.e("StravaViewModel", "Connection polling failed", error)
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = error.message ?: "Savienojuma gaidīšana pārsniegta"
                        )
                    }
                }
        }
    }

    /**
     * Disconnect from Strava
     */
    fun disconnectFromStrava() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            try {
                stravaRepository.disconnect()
                _uiState.update {
                    StravaUiState() // Reset to initial state
                }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to disconnect"
                    )
                }
            }
        }
    }

    /**
     * Load recent activities
     */
    fun loadActivities(refresh: Boolean = false) {
        viewModelScope.launch {
            if (refresh) {
                _uiState.update { it.copy(isRefreshing = true, error = null) }
            }

            stravaRepository.getActivities(30)
                .onSuccess { activities ->
                    _uiState.update {
                        it.copy(
                            activities = activities,
                            isRefreshing = false
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isRefreshing = false,
                            error = error.message ?: "Failed to load activities"
                        )
                    }
                }
        }
    }

    /**
     * Trigger manual sync with backend
     */
    fun syncActivities() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSyncing = true, error = null) }

            val currentPrefs = _uiState.value.syncPreferences
            stravaRepository.syncActivities(currentPrefs.autoSync)
                .onSuccess { result ->
                    _uiState.update {
                        it.copy(
                            isSyncing = false,
                            lastSyncResult = result
                        )
                    }
                    // Refresh activities after sync
                    loadActivities()
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isSyncing = false,
                            error = error.message ?: "Sync failed"
                        )
                    }
                }
        }
    }

    /**
     * Load sync status from backend
     */
    private fun loadSyncStatus() {
        viewModelScope.launch {
            try {
                val syncStatus = stravaRepository.getSyncStatus()
                _uiState.update { it.copy(syncStatus = syncStatus) }
            } catch (e: Exception) {
                // Silently fail for sync status
            }
        }
    }

    /**
     * Load activity statistics
     */
    private fun loadActivityStats() {
        viewModelScope.launch {
            try {
                val stats = stravaRepository.getActivityStats("month")
                _uiState.update { it.copy(activityStats = stats) }
            } catch (e: Exception) {
                // Silently fail for stats
            }
        }
    }

    /**
     * Update sync preferences
     */
    fun updateSyncPreferences(preferences: StravaSyncPreferences) {
        viewModelScope.launch {
            try {
                stravaRepository.updateSyncPreferences(preferences)
                _uiState.update { it.copy(syncPreferences = preferences) }
            } catch (e: Exception) {
                _uiState.update {
                    it.copy(error = e.message ?: "Failed to update preferences")
                }
            }
        }
    }

    /**
     * Clear error state
     */
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    /**
     * Refresh all data
     */
    fun refreshAll() {
        loadConnectionStatus()
    }

    /**
     * Upload activity to Strava
     */
    fun uploadActivity(
        name: String,
        type: String,
        startDate: String,
        elapsedTime: Int,
        distance: Double,
        description: String?
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            val uploadRequest = StravaUploadRequest(
                name = name,
                type = type,
                startDateLocal = startDate,
                elapsedTime = elapsedTime,
                distance = distance,
                description = description
            )

            stravaRepository.uploadActivity(uploadRequest)
                .onSuccess { result ->
                    _uiState.update { it.copy(isLoading = false) }
                    if (result.success) {
                        // Refresh activities to show the new upload
                        loadActivities()
                    } else {
                        _uiState.update {
                            it.copy(error = result.error ?: "Upload failed")
                        }
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = error.message ?: "Upload failed"
                        )
                    }
                }
        }
    }
}