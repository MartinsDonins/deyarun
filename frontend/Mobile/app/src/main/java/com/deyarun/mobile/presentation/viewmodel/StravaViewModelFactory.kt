package com.deyarun.mobile.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.deyarun.mobile.data.repository.StravaRepository

/**
 * Factory for creating StravaViewModel with dependencies
 */
class StravaViewModelFactory(
    private val stravaRepository: StravaRepository
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(StravaViewModel::class.java)) {
            return StravaViewModel(stravaRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}