package com.deyarun.mobile.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.deyarun.mobile.data.model.GoogleFitData
import com.deyarun.mobile.data.repository.GoogleFitRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

/**
 * ViewModel for Google Fit integration
 */
class GoogleFitViewModel(
    private val repository: GoogleFitRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(GoogleFitUiState())
    val uiState: StateFlow<GoogleFitUiState> = _uiState.asStateFlow()

    /**
     * Load connection status
     */
    fun loadConnectionStatus() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            repository.getStatus()
                .onSuccess { connectionInfo ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isConnected = connectionInfo.connected,
                            connectedAt = connectionInfo.connectedAt?.let { formatDate(it) }
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = error.message
                        )
                    }
                }
        }
    }

    /**
     * Connect to Google Fit
     */
    fun connectToGoogleFit() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            repository.startAuthFlow()
                .onSuccess {
                    // Auth flow started successfully
                    // User will be redirected to browser
                    _uiState.update { it.copy(isLoading = false) }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = "Neizdevās izveidot savienojumu: ${error.message}"
                        )
                    }
                }
        }
    }

    /**
     * Handle OAuth callback
     */
    fun handleOAuthCallback(code: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            repository.handleAuthCallback(code)
                .onSuccess {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isConnected = true
                        )
                    }
                    loadConnectionStatus()
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = "Neizdevās pabeigt autentifikāciju: ${error.message}"
                        )
                    }
                }
        }
    }

    /**
     * Disconnect from Google Fit
     */
    fun disconnectFromGoogleFit() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            repository.disconnect()
                .onSuccess {
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isConnected = false,
                            connectedAt = null,
                            fitnessData = null,
                            lastSyncResult = null
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = "Neizdevās atvienot: ${error.message}"
                        )
                    }
                }
        }
    }

    /**
     * Load fitness data (last 7 days)
     */
    fun loadFitnessData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoadingData = true) }

            val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            val calendar = Calendar.getInstance()
            calendar.add(Calendar.DAY_OF_YEAR, -7)
            val weekAgo = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(calendar.time)

            repository.getFitnessData(weekAgo, today)
                .onSuccess { data ->
                    _uiState.update {
                        it.copy(
                            isLoadingData = false,
                            fitnessData = data
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isLoadingData = false,
                            error = "Neizdevās ielādēt fitness datus: ${error.message}"
                        )
                    }

                    // Check if needs reauth
                    if (error.message?.contains("expired") == true ||
                        error.message?.contains("reconnect") == true) {
                        _uiState.update {
                            it.copy(
                                isConnected = false,
                                connectedAt = null
                            )
                        }
                    }
                }
        }
    }

    /**
     * Sync activities from Google Fit
     */
    fun syncActivities() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSyncing = true) }

            val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
            val calendar = Calendar.getInstance()
            calendar.add(Calendar.DAY_OF_YEAR, -30) // Last 30 days
            val monthAgo = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(calendar.time)

            repository.syncActivities(monthAgo, today)
                .onSuccess { result ->
                    val summary = result.summary
                    val message = if (summary != null) {
                        "Sinhronizēts: ${summary.syncedCount} treniņi, " +
                        "Izlaists: ${summary.skippedCount}, " +
                        "Kļūdas: ${summary.errorsCount}"
                    } else {
                        result.message
                    }

                    _uiState.update {
                        it.copy(
                            isSyncing = false,
                            lastSyncResult = message
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(
                            isSyncing = false,
                            error = "Neizdevās sinhronizēt: ${error.message}"
                        )
                    }

                    // Check if needs reauth
                    if (error.message?.contains("expired") == true ||
                        error.message?.contains("reconnect") == true) {
                        _uiState.update {
                            it.copy(
                                isConnected = false,
                                connectedAt = null
                            )
                        }
                    }
                }
        }
    }

    /**
     * Clear error message
     */
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    private fun formatDate(dateString: String): String {
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
            val outputFormat = SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.getDefault())
            val date = inputFormat.parse(dateString)
            date?.let { outputFormat.format(it) } ?: dateString
        } catch (e: Exception) {
            dateString
        }
    }
}

/**
 * UI state for Google Fit integration
 */
data class GoogleFitUiState(
    val isLoading: Boolean = false,
    val isConnected: Boolean = false,
    val connectedAt: String? = null,
    val error: String? = null,
    val fitnessData: GoogleFitData? = null,
    val isLoadingData: Boolean = false,
    val isSyncing: Boolean = false,
    val lastSyncResult: String? = null
)
