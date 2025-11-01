package com.deyarun.mobile.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.deyarun.mobile.data.model.Activity
import com.deyarun.mobile.data.model.ActivityStatus
import com.deyarun.mobile.data.model.ActivityType
import com.deyarun.mobile.data.repository.ActivityRepository
import com.deyarun.mobile.data.repository.AuthRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

/**
 * ViewModel for WorkoutScreen that shows recent workouts and statistics
 */
class WorkoutViewModel(
    private val activityRepository: ActivityRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(WorkoutUiState())
    val uiState: StateFlow<WorkoutUiState> = _uiState.asStateFlow()

    // Get current user ID from auth
    private var currentUserId: String? = null

    init {
        println("DEBUG WorkoutViewModel: Initializing...")
        initializeUser()

        // Debug database content immediately
        debugDatabaseContent()
    }

    /**
     * Initialize user and load workouts
     */
    private fun initializeUser() {
        viewModelScope.launch {
            try {
                val authResult = authRepository.getCurrentUser()
                if (authResult is com.deyarun.mobile.data.model.AuthResult.Success) {
                    currentUserId = authResult.user.id
                    println("DEBUG WorkoutViewModel: Using authenticated userId: '${authResult.user.id}'")

                    // Migrate old activities to current user
                    migrateOldActivities(authResult.user.id)

                    loadWorkouts()
                } else {
                    // Use demo user ID if not authenticated
                    currentUserId = "demo_user"
                    println("DEBUG WorkoutViewModel: Using demo userId: 'demo_user' (not authenticated)")
                    loadWorkouts()
                }
            } catch (e: Exception) {
                // Use demo user ID on error
                currentUserId = "demo_user"
                println("DEBUG WorkoutViewModel: Using demo userId: 'demo_user' (exception: ${e.message})")
                loadWorkouts()
            }
        }
    }

    /**
     * Manually refresh workouts
     */
    fun refreshWorkouts() {
        println("DEBUG WorkoutViewModel: Manual refresh triggered")
        loadWorkouts()
    }


    /**
     * Load all workouts for current user
     */
    private fun loadWorkouts() {
        currentUserId?.let { userId ->
            println("DEBUG WorkoutViewModel: Loading workouts for userId: '$userId'")
            viewModelScope.launch {
                activityRepository.getAllActivitiesForUser(userId)
                    .catch { exception ->
                        println("DEBUG WorkoutViewModel: Error loading activities: ${exception.message}")
                        _uiState.value = _uiState.value.copy(
                            error = exception.message ?: "Failed to load workouts"
                        )
                    }
                    .collect { activities ->
                        println("DEBUG WorkoutViewModel: Raw activities received: ${activities.size}")
                        activities.forEach { activity ->
                            println("DEBUG: Raw activity ${activity.id} - userId: '${activity.userId}' - ${activity.name} - Status: ${activity.status}")
                        }

                        // FIX-052.1: Safe null handling in sortedByDescending to prevent NullPointerException
                        val completedActivities = activities.filter {
                            it.status == ActivityStatus.COMPLETED
                        }.sortedByDescending { it.endTime ?: java.util.Date(0) }

                        val unsyncedActivities = activities.filter {
                            it.status == ActivityStatus.COMPLETED && !it.syncedToBackend
                        }.sortedByDescending { it.endTime ?: java.util.Date(0) }

                        // FIX-054: Show only synced activities in main list (synced to backend)
                        val syncedActivities = activities.filter {
                            it.status == ActivityStatus.COMPLETED && it.syncedToBackend
                        }.sortedByDescending { it.endTime ?: java.util.Date(0) }

                        println("DEBUG WorkoutViewModel: Loaded ${activities.size} total, ${completedActivities.size} completed, ${syncedActivities.size} synced, ${unsyncedActivities.size} unsynced")
                        syncedActivities.take(5).forEach { activity ->
                            println("DEBUG: Synced activity ${activity.id} - ${activity.name} - synced:${activity.syncedToBackend}")
                        }

                        _uiState.value = _uiState.value.copy(
                            unsyncedActivities = unsyncedActivities,
                            activities = syncedActivities,
                            weeklyStats = calculateWeeklyStats(completedActivities),
                            isLoading = false,
                            error = null
                        )

                        println("DEBUG WorkoutViewModel: UI state updated with ${syncedActivities.size} synced activities")
                    }
            }
        }
    }

    /**
     * Delete a workout
     */
    fun deleteWorkout(activityId: String) {
        viewModelScope.launch {
            try {
                activityRepository.deleteActivity(activityId)
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = e.message ?: "Failed to delete workout"
                )
            }
        }
    }

    /**
     * Calculate weekly statistics from activities
     */
    private fun calculateWeeklyStats(activities: List<Activity>): Map<String, String> {
        val oneWeekAgo = System.currentTimeMillis() - (7 * 24 * 60 * 60 * 1000)
        val weeklyActivities = activities.filter {
            it.endTime?.time ?: 0 > oneWeekAgo
        }

        val totalDistance = weeklyActivities.sumOf { it.totalDistance / 1000.0 } // Convert to km
        val totalTime = weeklyActivities.sumOf { it.totalDuration } / (1000 * 60) // Convert to minutes
        val totalCalories = weeklyActivities.sumOf { it.calories }

        val avgPace = if (weeklyActivities.isNotEmpty()) {
            weeklyActivities.map { it.averagePace }.average()
        } else 0.0

        return mapOf(
            "Total Distance" to String.format("%.1f km", totalDistance),
            "Total Time" to formatDuration(totalTime),
            "Avg Pace" to formatPace(avgPace),
            "Calories" to totalCalories.toString()
        )
    }

    /**
     * Format duration from minutes to readable format
     */
    private fun formatDuration(minutes: Long): String {
        val hours = minutes / 60
        val mins = minutes % 60
        return if (hours > 0) {
            "${hours}h ${mins}m"
        } else {
            "${mins}m"
        }
    }

    /**
     * Format pace from seconds per km to readable format
     */
    private fun formatPace(paceInSeconds: Double): String {
        if (paceInSeconds <= 0) return "0:00 /km"

        val minutes = (paceInSeconds / 60).toInt()
        val seconds = (paceInSeconds % 60).toInt()
        return String.format("%d:%02d /km", minutes, seconds)
    }

    /**
     * Clear error message
     */
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    /**
     * Toggle unsynced activities filter
     */
    fun toggleUnsyncedFilter() {
        _uiState.value = _uiState.value.copy(
            showUnsyncedOnly = !_uiState.value.showUnsyncedOnly
        )
    }

    /**
     * Delete unsynced activity
     */
    fun deleteUnsyncedActivity(activityId: String) {
        viewModelScope.launch {
            try {
                println("DEBUG WorkoutViewModel: Deleting unsynced activity $activityId")
                activityRepository.deleteActivity(activityId)
                // Refresh to update UI
                loadWorkouts()
            } catch (e: Exception) {
                println("ERROR WorkoutViewModel: Failed to delete activity: ${e.message}")
                _uiState.value = _uiState.value.copy(
                    error = e.message ?: "Failed to delete activity"
                )
            }
        }
    }

    /**
     * Refresh workouts data
     */
    fun refresh() {
        println("DEBUG WorkoutViewModel: Refreshing workouts for user: $currentUserId")
        _uiState.value = _uiState.value.copy(isLoading = true)
        refreshWorkouts()
    }

    /**
     * Migrate old activities to current authenticated user
     */
    private suspend fun migrateOldActivities(authenticatedUserId: String) {
        try {
            println("DEBUG WorkoutViewModel: Migrating old activities to userId: '$authenticatedUserId'")

            // Use repository to migrate activities
            val migratedCount = activityRepository.migrateActivitiesToUser(authenticatedUserId)
            println("DEBUG WorkoutViewModel: Migrated $migratedCount activities to userId: '$authenticatedUserId'")

        } catch (e: Exception) {
            println("DEBUG WorkoutViewModel: Error migrating activities: ${e.message}")
            e.printStackTrace()
        }
    }

    /**
     * Debug database content
     */
    private fun debugDatabaseContent() {
        viewModelScope.launch {
            try {
                println("DEBUG WorkoutViewModel: ===== DATABASE DEBUG =====")

                // Try to get all activities for demo_user
                val demoUserActivities = activityRepository.getAllActivitiesForUser("demo_user")
                demoUserActivities.collect { activities ->
                    println("DEBUG WorkoutViewModel: Found ${activities.size} activities for demo_user")
                    activities.forEach { activity ->
                        println("DEBUG WorkoutViewModel: Activity ${activity.id} - userId:'${activity.userId}' - ${activity.name} - Status:${activity.status}")
                        println("DEBUG WorkoutViewModel: Distance: ${activity.totalDistance}m, Duration: ${activity.totalDuration}ms, GPS Points: ${activity.gpsPoints.size}")
                    }
                }

                // Also check for activities with empty userId
                val emptyUserActivities = activityRepository.getAllActivitiesForUser("")
                emptyUserActivities.collect { activities ->
                    println("DEBUG WorkoutViewModel: Found ${activities.size} activities for empty userId")
                    activities.forEach { activity ->
                        println("DEBUG WorkoutViewModel: Empty userId activity ${activity.id} - userId:'${activity.userId}' - ${activity.name} - Status:${activity.status}")
                    }
                }

            } catch (e: Exception) {
                println("DEBUG WorkoutViewModel: Error in database debug: ${e.message}")
                e.printStackTrace()
            }
        }
    }
}

/**
 * UI State for Workout screen
 */
data class WorkoutUiState(
    val activities: List<Activity> = emptyList(),
    val unsyncedActivities: List<Activity> = emptyList(),
    val showUnsyncedOnly: Boolean = false,
    val weeklyStats: Map<String, String> = emptyMap(),
    val isLoading: Boolean = true,
    val error: String? = null
)

/**
 * Factory for creating WorkoutViewModel
 */
class WorkoutViewModelFactory(
    private val activityRepository: ActivityRepository,
    private val authRepository: AuthRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(WorkoutViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return WorkoutViewModel(activityRepository, authRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}