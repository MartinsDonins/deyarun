package com.deyarun.mobile.presentation.settings

import android.app.Application
import android.content.Context
import android.content.res.Configuration
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.deyarun.mobile.data.storage.LanguagePreferenceManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.*

/**
 * ViewModel for Language Selection
 *
 * Manages language preference state and applies language changes to the app.
 * Changes are persisted via LanguagePreferenceManager and applied immediately.
 *
 * MOBILE-V2-001: Language Selection System
 */
class LanguageViewModel(application: Application) : AndroidViewModel(application) {

    private val languagePreferenceManager = LanguagePreferenceManager(application)

    private val _currentLanguage = MutableStateFlow(getCurrentLanguage())
    val currentLanguage: StateFlow<String> = _currentLanguage.asStateFlow()

    private val _languageChangeStatus = MutableStateFlow<LanguageChangeStatus>(LanguageChangeStatus.Idle)
    val languageChangeStatus: StateFlow<LanguageChangeStatus> = _languageChangeStatus.asStateFlow()

    init {
        // Load saved language preference on init
        loadSavedLanguage()
    }

    /**
     * Get current system language
     */
    private fun getCurrentLanguage(): String {
        return languagePreferenceManager.getCurrentLanguage()
    }

    /**
     * Load saved language preference
     */
    private fun loadSavedLanguage() {
        viewModelScope.launch {
            val savedLanguage = languagePreferenceManager.getCurrentLanguage()
            _currentLanguage.value = savedLanguage
        }
    }

    /**
     * Change app language
     */
    fun changeLanguage(languageCode: String) {
        if (languageCode == _currentLanguage.value) {
            return // Already using this language
        }

        viewModelScope.launch {
            try {
                // Save language preference
                languagePreferenceManager.setLanguage(languageCode)

                // Apply language change
                applyLanguage(languageCode)

                // Update state
                _currentLanguage.value = languageCode
                _languageChangeStatus.value = LanguageChangeStatus.Success(languageCode)

            } catch (e: Exception) {
                _languageChangeStatus.value = LanguageChangeStatus.Error(
                    e.message ?: "Failed to change language"
                )
            }
        }
    }

    /**
     * Apply language to app configuration
     */
    private fun applyLanguage(languageCode: String) {
        val context = getApplication<Application>().applicationContext
        val locale = Locale(languageCode)
        Locale.setDefault(locale)

        val config = Configuration(context.resources.configuration)
        config.setLocale(locale)

        @Suppress("DEPRECATION")
        context.resources.updateConfiguration(config, context.resources.displayMetrics)
    }

    /**
     * Reset language change status
     */
    fun resetStatus() {
        _languageChangeStatus.value = LanguageChangeStatus.Idle
    }

    /**
     * Get localized language name
     */
    fun getLanguageName(code: String): String {
        return when (code) {
            "lv" -> "Latviešu"
            "en" -> "English"
            else -> code
        }
    }
}

/**
 * Language change status
 */
sealed class LanguageChangeStatus {
    object Idle : LanguageChangeStatus()
    data class Success(val languageCode: String) : LanguageChangeStatus()
    data class Error(val message: String) : LanguageChangeStatus()
}
