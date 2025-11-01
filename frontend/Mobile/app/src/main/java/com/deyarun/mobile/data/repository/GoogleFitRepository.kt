package com.deyarun.mobile.data.repository

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import com.deyarun.mobile.data.api.GoogleFitApiService
import com.deyarun.mobile.data.api.GoogleFitCallbackRequest
import com.deyarun.mobile.data.api.GoogleFitSyncRequest
import com.deyarun.mobile.data.config.GoogleFitConfig
import com.deyarun.mobile.data.model.*
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for Google Fit API operations
 * Handles authentication, data storage, and API communication
 */
class GoogleFitRepository(
    private val context: Context,
    private val googleFitApiService: GoogleFitApiService,
    private val sharedPreferences: SharedPreferences,
    private val gson: Gson
) {

    companion object {
        private const val TAG = "GoogleFitRepository"
        private const val PREF_ACCESS_TOKEN = "access_token"
    }

    /**
     * Get current connection status
     */
    suspend fun getStatus(): Result<GoogleFitConnectionInfo> = withContext(Dispatchers.IO) {
        try {
            val accessToken = getAccessToken()
            if (accessToken == null) {
                return@withContext Result.success(GoogleFitConnectionInfo(connected = false))
            }

            val response = googleFitApiService.getStatus("Bearer $accessToken")

            if (response.isSuccessful && response.body()?.success == true) {
                val connectionInfo = response.body()?.connectionInfo ?: GoogleFitConnectionInfo(connected = false)
                Result.success(connectionInfo)
            } else {
                Result.failure(Exception("Failed to get Google Fit status"))
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Error getting Google Fit status", e)
            Result.failure(e)
        }
    }

    /**
     * Start OAuth flow - get auth URL from backend and open browser
     */
    suspend fun startAuthFlow(): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val accessToken = getAccessToken()
            if (accessToken == null) {
                return@withContext Result.failure(Exception("No access token found"))
            }

            android.util.Log.d(TAG, "Getting Google Fit auth URL from backend...")
            val response = googleFitApiService.getAuthUrl("Bearer $accessToken")

            if (response.isSuccessful && response.body()?.success == true) {
                val authUrl = response.body()?.data?.authUrl
                if (authUrl != null) {
                    android.util.Log.d(TAG, "Opening auth URL in browser: $authUrl")

                    // Open browser with auth URL
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(authUrl))
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(intent)

                    Result.success(true)
                } else {
                    Result.failure(Exception("No auth URL received"))
                }
            } else {
                Result.failure(Exception(response.body()?.message ?: "Failed to get auth URL"))
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to start OAuth flow", e)
            Result.failure(e)
        }
    }

    /**
     * Handle OAuth callback from web view
     */
    suspend fun handleAuthCallback(code: String): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val accessToken = getAccessToken()
            if (accessToken == null) {
                return@withContext Result.failure(Exception("No access token found"))
            }

            android.util.Log.d(TAG, "Exchanging code for Google Fit tokens...")
            val request = GoogleFitCallbackRequest(code)
            val response = googleFitApiService.handleCallback("Bearer $accessToken", request)

            if (response.isSuccessful && response.body()?.success == true) {
                android.util.Log.d(TAG, "Google Fit connected successfully")

                // Store connection info
                val connectionInfo = GoogleFitConnectionInfo(
                    connected = true,
                    connectedAt = response.body()?.data?.connectedAt
                )
                storeConnectionInfo(connectionInfo)

                // Schedule periodic sync if worker exists
                // GoogleFitSyncWorker.schedule(context)

                Result.success(true)
            } else {
                Result.failure(Exception(response.body()?.message ?: "Failed to connect Google Fit"))
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to handle OAuth callback", e)
            Result.failure(e)
        }
    }

    /**
     * Disconnect Google Fit
     */
    suspend fun disconnect(): Result<Boolean> = withContext(Dispatchers.IO) {
        try {
            val accessToken = getAccessToken()
            if (accessToken == null) {
                return@withContext Result.failure(Exception("No access token found"))
            }

            val response = googleFitApiService.disconnect("Bearer $accessToken")

            if (response.isSuccessful && response.body()?.success == true) {
                // Clear stored data
                clearConnectionInfo()

                // Cancel sync worker if exists
                // GoogleFitSyncWorker.cancel(context)

                Result.success(true)
            } else {
                Result.failure(Exception(response.body()?.message ?: "Failed to disconnect Google Fit"))
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to disconnect Google Fit", e)
            Result.failure(e)
        }
    }

    /**
     * Get fitness data for date range
     */
    suspend fun getFitnessData(
        startDate: String,
        endDate: String,
        dataTypes: List<String>? = null
    ): Result<GoogleFitData> = withContext(Dispatchers.IO) {
        try {
            val accessToken = getAccessToken()
            if (accessToken == null) {
                return@withContext Result.failure(Exception("No access token found"))
            }

            val dataTypesParam = dataTypes?.joinToString(",")
            val response = googleFitApiService.getFitnessData(
                "Bearer $accessToken",
                startDate,
                endDate,
                dataTypesParam
            )

            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data != null) {
                    Result.success(data)
                } else {
                    Result.failure(Exception("No data received"))
                }
            } else {
                if (response.body()?.needsReauth == true) {
                    clearConnectionInfo()
                    Result.failure(Exception("Authorization expired. Please reconnect Google Fit."))
                } else {
                    Result.failure(Exception(response.body()?.message ?: "Failed to get fitness data"))
                }
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to get fitness data", e)
            Result.failure(e)
        }
    }

    /**
     * Sync Google Fit activities to DeyaRun workouts
     */
    suspend fun syncActivities(
        startDate: String,
        endDate: String,
        activityTypes: List<String> = emptyList()
    ): Result<GoogleFitSyncResult> = withContext(Dispatchers.IO) {
        try {
            val accessToken = getAccessToken()
            if (accessToken == null) {
                return@withContext Result.failure(Exception("No access token found"))
            }

            val request = GoogleFitSyncRequest(startDate, endDate, activityTypes)
            val response = googleFitApiService.syncActivities("Bearer $accessToken", request)

            if (response.isSuccessful && response.body()?.success == true) {
                // FIX-052.5: Safe null handling instead of !! operator
                Result.success(response.body() ?: throw Exception("Empty response from Google Fit sync"))
            } else {
                if (response.body()?.needsReauth == true) {
                    clearConnectionInfo()
                    Result.failure(Exception("Authorization expired. Please reconnect Google Fit."))
                } else {
                    Result.failure(Exception(response.body()?.message ?: "Failed to sync activities"))
                }
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to sync activities", e)
            Result.failure(e)
        }
    }

    /**
     * Check if Google Fit is connected
     */
    fun isConnected(): Boolean {
        val json = sharedPreferences.getString(GoogleFitConfig.STORAGE_KEY_CONNECTION, null)
        if (json != null) {
            val connectionInfo = gson.fromJson(json, GoogleFitConnectionInfo::class.java)
            return connectionInfo?.connected == true
        }
        return false
    }

    /**
     * Get stored connection info
     */
    fun getConnectionInfo(): GoogleFitConnectionInfo? {
        val json = sharedPreferences.getString(GoogleFitConfig.STORAGE_KEY_CONNECTION, null)
        return if (json != null) {
            gson.fromJson(json, GoogleFitConnectionInfo::class.java)
        } else {
            null
        }
    }

    // Private helper methods

    private fun getAccessToken(): String? {
        return sharedPreferences.getString(PREF_ACCESS_TOKEN, null)
    }

    private fun storeConnectionInfo(connectionInfo: GoogleFitConnectionInfo) {
        val json = gson.toJson(connectionInfo)
        sharedPreferences.edit()
            .putString(GoogleFitConfig.STORAGE_KEY_CONNECTION, json)
            .apply()

        android.util.Log.d(TAG, "Connection info stored successfully")
    }

    private fun clearConnectionInfo() {
        sharedPreferences.edit()
            .remove(GoogleFitConfig.STORAGE_KEY_CONNECTION)
            .remove(GoogleFitConfig.STORAGE_KEY_TOKENS)
            .apply()

        android.util.Log.d(TAG, "Connection info cleared")
    }
}
