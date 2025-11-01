package com.deyarun.mobile.presentation.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.deyarun.mobile.data.di.NetworkModule

/**
 * Factory for creating GoogleFitViewModel instances
 */
class GoogleFitViewModelFactory(
    private val context: Context
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(GoogleFitViewModel::class.java)) {
            val repository = NetworkModule.provideGoogleFitRepository(context)
            return GoogleFitViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
    }
}
