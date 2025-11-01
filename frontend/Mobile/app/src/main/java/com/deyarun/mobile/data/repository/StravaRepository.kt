package com.deyarun.mobile.data.repository

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.deyarun.mobile.data.api.StravaApiService
import com.deyarun.mobile.data.api.StravaBackendService
import com.deyarun.mobile.data.config.StravaConfig
import com.deyarun.mobile.data.model.*
import com.google.gson.Gson
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map

/**
 * Repository for Strava API operations
 * Handles authentication, data storage, and API communication
 */
class StravaRepository(
    private val context: Context,
    private val stravaApiService: StravaApiService,
    private val stravaBackendService: StravaBackendService,
    private val sharedPreferences: SharedPreferences,
    private val gson: Gson
) {

    companion object {
        private const val PREF_ACCESS_TOKEN = "access_token"
    }

    // DataStore keys
    private val tokensKey = stringPreferencesKey(StravaConfig.STORAGE_KEY_TOKENS)
    private val athleteKey = stringPreferencesKey(StravaConfig.STORAGE_KEY_ATHLETE)
    private val syncPreferencesKey = stringPreferencesKey(StravaConfig.STORAGE_KEY_SYNC_PREFERENCES)

    /**
     * Start OAuth flow via backend (uses backend redirect URI)
     * Returns auth URL from backend that includes state token
     */
    suspend fun getAuthUrl(): Result<String> {
        return try {
            val authToken = getAuthToken()
            android.util.Log.d("StravaRepository", "Requesting auth URL from backend")

            val response = stravaBackendService.getAuthUrl("Bearer $authToken")

            if (response.isSuccessful) {
                val body = response.body()
                val authUrl = body?.authUrl

                if (authUrl != null) {
                    android.util.Log.d("StravaRepository", "Got auth URL from backend: $authUrl")
                    Result.success(authUrl)
                } else {
                    android.util.Log.e("StravaRepository", "No auth URL in response")
                    Result.failure(Exception("No auth URL received from backend"))
                }
            } else {
                android.util.Log.e("StravaRepository", "Backend auth URL request failed: ${response.code()}")
                Result.failure(Exception("Failed to get auth URL: ${response.code()}"))
            }
        } catch (e: Exception) {
            android.util.Log.e("StravaRepository", "Error getting auth URL", e)
            Result.failure(e)
        }
    }

    /**
     * Open browser with auth URL
     */
    fun openAuthUrl(authUrl: String) {
        try {
            android.util.Log.d("StravaRepository", "Opening browser with auth URL")

            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(authUrl))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)

            android.util.Log.d("StravaRepository", "Browser opened successfully")
        } catch (e: Exception) {
            android.util.Log.e("StravaRepository", "Failed to open browser", e)
            throw e
        }
    }

    /**
     * Poll connection status after opening auth URL
     * Backend will update user's Strava connection after OAuth callback
     */
    suspend fun pollConnectionStatus(
        maxAttempts: Int = 30,
        delayMs: Long = 2000
    ): Result<Boolean> {
        return try {
            android.util.Log.d("StravaRepository", "Starting connection status polling...")

            repeat(maxAttempts) { attempt ->
                android.util.Log.d("StravaRepository", "Polling attempt ${attempt + 1}/$maxAttempts")

                val authToken = getAuthToken()
                val response = stravaBackendService.getConnectionStatus("Bearer $authToken")

                if (response.isSuccessful) {
                    val status = response.body()

                    // DEBUG: Log full status response
                    android.util.Log.d("StravaRepository", "📊 Status response: connected=${status?.connected}, " +
                        "athleteId=${status?.athleteId}, " +
                        "hasAthlete=${status?.athlete != null}")

                    if (status?.connected == true) {
                        android.util.Log.d("StravaRepository", "✅ Strava connected successfully!")

                        // NOTE: Backend /status endpoint does NOT return tokens for security reasons
                        // Tokens are stored in backend MongoDB and accessed via backend API proxy
                        // Mobile app relies on backend to manage token refresh automatically

                        // Store athlete info from status
                        status.athlete?.let { athlete ->
                            android.util.Log.d("StravaRepository", "👤 Saving athlete: ${athlete.firstname} ${athlete.lastname}")
                            val athleteJson = gson.toJson(athlete)
                            sharedPreferences.edit()
                                .putString(StravaConfig.STORAGE_KEY_ATHLETE, athleteJson)
                                .apply()
                            android.util.Log.d("StravaRepository", "✅ Athlete info saved")
                        } ?: android.util.Log.e("StravaRepository", "⚠️ No athlete info in status response")

                        // Store connection status
                        sharedPreferences.edit()
                            .putBoolean("strava_connected", true)
                            .apply()

                        // Schedule periodic sync after successful connection
                        com.deyarun.mobile.data.sync.StravaSyncWorker.schedule(context)

                        return Result.success(true)
                    } else {
                        android.util.Log.d("StravaRepository", "⏳ Not connected yet, will retry...")
                    }
                }

                // Wait before next attempt (except on last attempt)
                if (attempt < maxAttempts - 1) {
                    kotlinx.coroutines.delay(delayMs)
                }
            }

            android.util.Log.e("StravaRepository", "Connection polling timed out")
            Result.failure(Exception("Connection timeout - please try again"))

        } catch (e: Exception) {
            android.util.Log.e("StravaRepository", "Connection polling failed", e)
            Result.failure(e)
        }
    }

    /**
     * Get stored tokens, refresh if needed
     */
    suspend fun getTokens(): StravaTokens? {
        return try {
            val tokensJson = sharedPreferences.getString(StravaConfig.STORAGE_KEY_TOKENS, null)
            if (tokensJson != null) {
                val tokens = gson.fromJson(tokensJson, StravaTokens::class.java)

                // Check if tokens are expired
                if (areTokensExpired(tokens)) {
                    refreshTokens(tokens.refreshToken)
                } else {
                    tokens
                }
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Check if tokens are expired
     */
    private fun areTokensExpired(tokens: StravaTokens): Boolean {
        val now = System.currentTimeMillis() / 1000
        return tokens.expiresAt <= now
    }

    /**
     * Refresh expired tokens via backend
     */
    private suspend fun refreshTokens(refreshToken: String): StravaTokens? {
        return try {
            val authToken = getAuthToken()
            val response = stravaBackendService.refreshTokens(
                authorization = "Bearer $authToken",
                request = StravaRefreshRequest(refreshToken)
            )

            if (response.isSuccessful) {
                val newTokens = response.body()
                if (newTokens != null) {
                    storeTokens(newTokens)
                }
                newTokens
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Store tokens securely
     */
    private fun storeTokens(tokens: StravaTokens) {
        val tokensJson = gson.toJson(tokens)
        sharedPreferences.edit()
            .putString(StravaConfig.STORAGE_KEY_TOKENS, tokensJson)
            .apply()
    }

    /**
     * Get user auth token for backend calls
     */
    private fun getAuthToken(): String {
        return sharedPreferences.getString(PREF_ACCESS_TOKEN, "") ?: ""
    }

    /**
     * Fetch and store athlete info
     */
    private suspend fun fetchAndStoreAthlete(accessToken: String) {
        try {
            val response = stravaApiService.getAthlete("Bearer $accessToken")
            if (response.isSuccessful) {
                val athlete = response.body()
                if (athlete != null) {
                    val athleteJson = gson.toJson(athlete)
                    sharedPreferences.edit()
                        .putString(StravaConfig.STORAGE_KEY_ATHLETE, athleteJson)
                        .apply()
                }
            }
        } catch (e: Exception) {
            // Silently fail
        }
    }

    /**
     * Get stored athlete info
     */
    suspend fun getAthlete(): StravaAthlete? {
        return try {
            val athleteJson = sharedPreferences.getString(StravaConfig.STORAGE_KEY_ATHLETE, null)
            if (athleteJson != null) {
                gson.fromJson(athleteJson, StravaAthlete::class.java)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Check if user is connected to Strava
     * Since tokens are managed by backend, check local connection flag
     */
    suspend fun isConnected(): Boolean {
        return sharedPreferences.getBoolean("strava_connected", false)
    }

    /**
     * Get connection status with athlete info
     */
    suspend fun getConnectionStatus(): StravaConnection {
        val isConnected = isConnected()
        val athlete = getAthlete()
        val syncPrefs = getSyncPreferences()

        return StravaConnection(
            isConnected = isConnected,
            athlete = athlete,
            lastSyncAt = null, // TODO: implement sync tracking
            syncPreferences = syncPrefs
        )
    }

    /**
     * Disconnect from Strava
     */
    suspend fun disconnect() {
        // Cancel periodic sync worker
        com.deyarun.mobile.data.sync.StravaSyncWorker.cancel(context)

        // Clear stored data
        sharedPreferences.edit()
            .remove("strava_connected")
            .remove(StravaConfig.STORAGE_KEY_ATHLETE)
            .remove(StravaConfig.STORAGE_KEY_SYNC_PREFERENCES)
            .apply()
    }

    /**
     * Get recent activities via backend proxy
     * Backend manages Strava tokens automatically
     */
    suspend fun getActivities(limit: Int = 30): Result<List<StravaActivity>> {
        return try {
            android.util.Log.d("StravaRepository", "🔄 Fetching activities from backend proxy (limit: $limit)")

            val authToken = getAuthToken()
            android.util.Log.d("StravaRepository", "🔑 Using auth token for backend (length: ${authToken.length})")

            val response = stravaBackendService.getActivities(
                authorization = "Bearer $authToken",
                perPage = limit
            )

            if (response.isSuccessful) {
                val body = response.body()
                val activities = body?.activities ?: emptyList()
                android.util.Log.d("StravaRepository", "✅ Fetched ${activities.size} activities from backend")
                if (activities.isNotEmpty()) {
                    android.util.Log.d("StravaRepository", "📋 Sample activity: ${activities.first().name} " +
                        "(${activities.first().distance}m, ${activities.first().type})")
                }
                Result.success(activities)
            } else {
                android.util.Log.e("StravaRepository", "❌ Failed to fetch activities: ${response.code()} ${response.message()}")
                Result.failure(Exception("Failed to fetch activities: ${response.code()}"))
            }
        } catch (e: Exception) {
            android.util.Log.e("StravaRepository", "❌ Exception fetching activities", e)
            Result.failure(e)
        }
    }

    /**
     * Sync activities with backend
     */
    suspend fun syncActivities(autoCreateWorkouts: Boolean = true): Result<StravaSyncResult> {
        return try {
            val authToken = getAuthToken()
            val response = stravaBackendService.triggerManualSync(
                authorization = "Bearer $authToken",
                options = StravaSyncOptions(autoCreateWorkouts)
            )

            if (response.isSuccessful) {
                val syncResult = response.body()
                if (syncResult != null) {
                    Result.success(syncResult)
                } else {
                    Result.failure(Exception("Sync failed"))
                }
            } else {
                Result.failure(Exception("Sync request failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Get sync status from backend
     */
    suspend fun getSyncStatus(): StravaSyncStatus {
        return try {
            val authToken = getAuthToken()
            val response = stravaBackendService.getSyncStatus("Bearer $authToken")

            if (response.isSuccessful) {
                response.body() ?: StravaSyncStatus(false, null, null)
            } else {
                StravaSyncStatus(false, null, null)
            }
        } catch (e: Exception) {
            StravaSyncStatus(false, null, null)
        }
    }

    /**
     * Upload activity to Strava
     */
    suspend fun uploadActivity(activity: StravaUploadRequest): Result<StravaUploadResult> {
        return try {
            val tokens = getTokens()
                ?: return Result.failure(Exception("Not connected to Strava"))

            val response = stravaApiService.uploadActivity(
                authorization = "Bearer ${tokens.accessToken}",
                activity = activity
            )

            if (response.isSuccessful) {
                Result.success(response.body() ?: StravaUploadResult(false, null, "No response"))
            } else {
                Result.failure(Exception("Upload failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Get sync preferences
     */
    private fun getSyncPreferences(): StravaSyncPreferences {
        return try {
            val prefsJson = sharedPreferences.getString(StravaConfig.STORAGE_KEY_SYNC_PREFERENCES, null)
            if (prefsJson != null) {
                gson.fromJson(prefsJson, StravaSyncPreferences::class.java)
            } else {
                StravaSyncPreferences() // Default preferences
            }
        } catch (e: Exception) {
            StravaSyncPreferences() // Default preferences
        }
    }

    /**
     * Update sync preferences
     */
    suspend fun updateSyncPreferences(preferences: StravaSyncPreferences) {
        val prefsJson = gson.toJson(preferences)
        sharedPreferences.edit()
            .putString(StravaConfig.STORAGE_KEY_SYNC_PREFERENCES, prefsJson)
            .apply()
    }

    /**
     * Get activity stats (mock for now)
     */
    suspend fun getActivityStats(period: String): StravaActivityStats {
        // TODO: Implement real stats from backend
        return StravaActivityStats(
            totalActivities = 0,
            totalDistance = 0.0,
            totalMovingTime = 0,
            totalElevationGain = 0.0
        )
    }
}