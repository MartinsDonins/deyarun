package com.deyarun.mobile.data.config

/**
 * Google Fit API configuration constants
 * OAuth and API configuration for Google Fit integration
 */
object GoogleFitConfig {

    // OAuth configuration - sync with backend .env
    // Note: For Android, we use server-side OAuth flow
    const val SCOPE = "https://www.googleapis.com/auth/fitness.activity.read " +
            "https://www.googleapis.com/auth/fitness.body.read " +
            "https://www.googleapis.com/auth/fitness.location.read " +
            "https://www.googleapis.com/auth/fitness.nutrition.read"

    // API URLs
    const val BASE_URL = "https://www.googleapis.com/fitness/v1/"
    const val OAUTH_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"

    // Storage keys for SharedPreferences
    const val STORAGE_KEY_TOKENS = "google_fit_tokens"
    const val STORAGE_KEY_CONNECTION = "google_fit_connection"
    const val STORAGE_KEY_SYNC_PREFERENCES = "google_fit_sync_preferences"

    // Data source types for Google Fit API
    object DataTypes {
        const val STEPS = "com.google.step_count.delta"
        const val DISTANCE = "com.google.distance.delta"
        const val CALORIES = "com.google.calories.expended"
        const val ACTIVE_MINUTES = "com.google.active_minutes"
        const val HEART_RATE = "com.google.heart_rate.bpm"
        const val SPEED = "com.google.speed"
        const val LOCATION = "com.google.location.sample"
        const val ACTIVITY = "com.google.activity.segment"
    }

    // Activity type mappings (Google Fit activity type IDs)
    object ActivityTypes {
        const val BIKING = 1
        const val WALKING = 7
        const val RUNNING = 8
        const val AEROBICS = 9
        const val STRENGTH_TRAINING = 24
        const val YOGA = 58
        const val SWIMMING = 70
        const val HIKING = 41
    }

    /**
     * Check if connection info exists
     */
    fun hasConnectionInfo(context: android.content.Context): Boolean {
        val prefs = context.getSharedPreferences("deyarun_prefs", android.content.Context.MODE_PRIVATE)
        return prefs.contains(STORAGE_KEY_CONNECTION)
    }

    /**
     * Check if tokens exist
     */
    fun hasTokens(context: android.content.Context): Boolean {
        val prefs = context.getSharedPreferences("deyarun_prefs", android.content.Context.MODE_PRIVATE)
        return prefs.contains(STORAGE_KEY_TOKENS)
    }
}
