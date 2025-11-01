package com.deyarun.mobile.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.deyarun.mobile.data.local.dao.ActivityDao
import com.deyarun.mobile.data.model.Activity
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

/**
 * ViewModel for ActivityDetailScreen that shows detailed activity information
 */
class ActivityDetailViewModel(
    private val activityDao: ActivityDao
) : ViewModel() {

    private val _activity = MutableStateFlow<Activity?>(null)
    val activity: StateFlow<Activity?> = _activity.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _isDeleted = MutableStateFlow(false)
    val isDeleted: StateFlow<Boolean> = _isDeleted.asStateFlow()

    /**
     * Load activity by ID
     */
    fun loadActivity(activityId: String) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null

                println("DEBUG ActivityDetailViewModel: Loading activity with ID: $activityId")

                val loadedActivity = activityDao.getActivityById(activityId)

                if (loadedActivity != null) {
                    _activity.value = loadedActivity
                    println("DEBUG ActivityDetailViewModel: Activity loaded successfully - ${loadedActivity.name}")
                    println("DEBUG ActivityDetailViewModel: Distance: ${loadedActivity.totalDistance}m, Duration: ${loadedActivity.totalDuration}ms")
                    println("DEBUG ActivityDetailViewModel: GPS Points: ${loadedActivity.gpsPoints.size}")
                } else {
                    _error.value = "Activity not found"
                    println("DEBUG ActivityDetailViewModel: Activity not found with ID: $activityId")
                }

            } catch (e: Exception) {
                _error.value = "Failed to load activity: ${e.message}"
                println("DEBUG ActivityDetailViewModel: Error loading activity: ${e.message}")
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Delete the current activity
     */
    fun deleteActivity() {
        val currentActivity = _activity.value
        if (currentActivity == null) {
            _error.value = "No activity to delete"
            return
        }

        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null

                println("DEBUG ActivityDetailViewModel: Deleting activity ${currentActivity.id} - ${currentActivity.name}")

                activityDao.deleteActivityById(currentActivity.id)

                println("DEBUG ActivityDetailViewModel: Activity deleted successfully")
                _isDeleted.value = true

            } catch (e: Exception) {
                _error.value = "Failed to delete activity: ${e.message}"
                println("DEBUG ActivityDetailViewModel: Error deleting activity: ${e.message}")
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Clear error state
     */
    fun clearError() {
        _error.value = null
    }
}

/**
 * Factory for creating ActivityDetailViewModel
 */
class ActivityDetailViewModelFactory(
    private val activityDao: ActivityDao
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ActivityDetailViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return ActivityDetailViewModel(activityDao) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}