package com.deyarun.mobile.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.deyarun.mobile.data.repository.WeeklyProgramRepository

class WeeklyProgramViewModelFactory(
    private val repository: WeeklyProgramRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(WeeklyProgramViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return WeeklyProgramViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
