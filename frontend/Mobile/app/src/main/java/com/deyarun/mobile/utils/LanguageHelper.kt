package com.deyarun.mobile.utils

import android.app.Activity
import android.content.Context
import android.content.res.Configuration
import android.os.Build
import java.util.Locale

/**
 * Helper class for managing app language/locale changes
 * Supports dynamic language switching without app restart
 */
object LanguageHelper {

    /**
     * Apply language to context
     * Creates a new context with the specified locale
     *
     * @param context Base context
     * @param languageCode Language code (lv or en)
     * @return Context with updated locale
     */
    fun applyLanguage(context: Context, languageCode: String): Context {
        val locale = Locale(languageCode)
        Locale.setDefault(locale)

        val configuration = Configuration(context.resources.configuration)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            configuration.setLocale(locale)
        } else {
            @Suppress("DEPRECATION")
            configuration.locale = locale
        }

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            context.createConfigurationContext(configuration)
        } else {
            @Suppress("DEPRECATION")
            context.resources.updateConfiguration(configuration, context.resources.displayMetrics)
            context
        }
    }

    /**
     * Update activity locale
     * Call this in Activity.onCreate() or when language changes
     *
     * @param activity Activity to update
     * @param languageCode Language code (lv or en)
     */
    fun updateActivityLocale(activity: Activity, languageCode: String) {
        val locale = Locale(languageCode)
        Locale.setDefault(locale)

        val configuration = Configuration(activity.resources.configuration)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            configuration.setLocale(locale)
        } else {
            @Suppress("DEPRECATION")
            configuration.locale = locale
        }

        @Suppress("DEPRECATION")
        activity.resources.updateConfiguration(configuration, activity.resources.displayMetrics)
    }

    /**
     * Get current locale language code
     *
     * @param context Application context
     * @return Current language code (e.g., "lv", "en")
     */
    fun getCurrentLanguage(context: Context): String {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            context.resources.configuration.locales[0].language
        } else {
            @Suppress("DEPRECATION")
            context.resources.configuration.locale.language
        }
    }

    /**
     * Create locale from language code
     *
     * @param languageCode Language code (lv or en)
     * @return Locale object
     */
    fun createLocale(languageCode: String): Locale {
        return Locale(languageCode)
    }

    /**
     * Check if language requires app restart
     * Modern Android versions support runtime locale changes
     *
     * @return true if restart recommended, false otherwise
     */
    fun requiresRestart(): Boolean {
        // On API 24+ (Android N+), we can change locale at runtime
        // For older versions, recommend restart for best results
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.N
    }

    /**
     * Recreate activity to apply language change
     * Call this after changing language preference
     *
     * @param activity Activity to recreate
     */
    fun recreateActivity(activity: Activity) {
        activity.recreate()
    }
}
