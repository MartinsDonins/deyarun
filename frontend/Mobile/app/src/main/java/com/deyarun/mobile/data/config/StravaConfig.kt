package com.deyarun.mobile.data.config

/**
 * Strava API configuration constants
 * Based on the Expo mobile configuration from env.ts
 */
object StravaConfig {

    // OAuth configuration
    const val CLIENT_ID = "170946"
    // Use backend redirect URI instead of custom scheme
    const val REDIRECT_URI = "https://api.deyarun.com/api/strava/callback"
    const val SCOPE = "read,activity:read_all,profile:read_all"

    // API URLs
    const val BASE_URL = "https://www.strava.com/api/v3/"
    const val OAUTH_AUTHORIZE_URL = "https://www.strava.com/oauth/authorize"

    // Backend API endpoints
    const val BACKEND_AUTH_URL = "https://api.deyarun.com/api/strava/auth"
    const val BACKEND_STATUS_URL = "https://api.deyarun.com/api/strava/status"

    // Storage keys for SharedPreferences
    const val STORAGE_KEY_TOKENS = "strava_tokens"
    const val STORAGE_KEY_ATHLETE = "strava_athlete"
    const val STORAGE_KEY_SYNC_PREFERENCES = "strava_sync_preferences"

    /**
     * Generate OAuth authorization URL
     */
    fun generateAuthUrl(): String {
        return "${OAUTH_AUTHORIZE_URL}?" +
                "client_id=${CLIENT_ID}&" +
                "response_type=code&" +
                "redirect_uri=${REDIRECT_URI}&" +
                "approval_prompt=force&" +
                "scope=${SCOPE}"
    }

    /**
     * Check if URL is a Strava OAuth callback
     */
    fun isStravaCallback(url: String): Boolean {
        return url.startsWith(REDIRECT_URI)
    }

    /**
     * Extract auth code from callback URL
     */
    fun extractCodeFromCallback(url: String): String? {
        val uri = android.net.Uri.parse(url)
        return uri.getQueryParameter("code")
    }

    /**
     * Extract error from callback URL
     */
    fun extractErrorFromCallback(url: String): String? {
        val uri = android.net.Uri.parse(url)
        return uri.getQueryParameter("error")
    }
}