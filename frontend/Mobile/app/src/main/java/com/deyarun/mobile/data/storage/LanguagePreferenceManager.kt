package com.deyarun.mobile.data.storage

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Manages language preference storage and retrieval
 * Supported languages: Latvian (lv) and English (en)
 */
class LanguagePreferenceManager(context: Context) {

    companion object {
        private const val PREFS_NAME = "language_preferences"
        private const val KEY_LANGUAGE_CODE = "language_code"
        const val LANGUAGE_LATVIAN = "lv"
        const val LANGUAGE_ENGLISH = "en"
        private const val DEFAULT_LANGUAGE = LANGUAGE_LATVIAN // Default to Latvian
    }

    private val sharedPreferences: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    // Current language state flow
    private val _currentLanguage = MutableStateFlow(getCurrentLanguage())
    val currentLanguage: StateFlow<String> = _currentLanguage.asStateFlow()

    /**
     * Get the current saved language code
     * @return Language code (lv or en)
     */
    fun getCurrentLanguage(): String {
        return sharedPreferences.getString(KEY_LANGUAGE_CODE, DEFAULT_LANGUAGE) ?: DEFAULT_LANGUAGE
    }

    /**
     * Save language preference
     * @param languageCode Language code to save (lv or en)
     * @return true if save was successful
     */
    fun setLanguage(languageCode: String): Boolean {
        return try {
            val validLanguage = when (languageCode.lowercase()) {
                LANGUAGE_LATVIAN, LANGUAGE_ENGLISH -> languageCode.lowercase()
                else -> DEFAULT_LANGUAGE
            }

            sharedPreferences.edit()
                .putString(KEY_LANGUAGE_CODE, validLanguage)
                .apply()

            // Update state flow
            _currentLanguage.value = validLanguage
            true
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Check if current language is Latvian
     */
    fun isLatvian(): Boolean = getCurrentLanguage() == LANGUAGE_LATVIAN

    /**
     * Check if current language is English
     */
    fun isEnglish(): Boolean = getCurrentLanguage() == LANGUAGE_ENGLISH

    /**
     * Get display name for language code
     */
    fun getLanguageDisplayName(languageCode: String): String {
        return when (languageCode) {
            LANGUAGE_LATVIAN -> "Latviešu"
            LANGUAGE_ENGLISH -> "English"
            else -> "Unknown"
        }
    }

    /**
     * Clear all language preferences (reset to default)
     */
    fun clearPreferences() {
        sharedPreferences.edit().clear().apply()
        _currentLanguage.value = DEFAULT_LANGUAGE
    }
}
