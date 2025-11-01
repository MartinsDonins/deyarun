package com.deyarun.mobile.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.deyarun.mobile.data.model.Activity
import com.deyarun.mobile.data.model.ActivityStatus
import com.deyarun.mobile.data.repository.ActivityRepository
import com.deyarun.mobile.data.repository.AuthRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

/**
 * ViewModel for Dashboard screen with real-time statistics
 * Replaces hardcoded mock data with real activity calculations
 */
class DashboardViewModel(
    private val activityRepository: ActivityRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private var currentUserId: String? = null

    init {
        println("DEBUG DashboardViewModel: Initializing...")
        initializeUser()
    }

    /**
     * Initialize user and load dashboard data
     */
    private fun initializeUser() {
        viewModelScope.launch {
            try {
                val authResult = authRepository.getCurrentUser()
                if (authResult is com.deyarun.mobile.data.model.AuthResult.Success) {
                    currentUserId = authResult.user.id
                    println("DEBUG DashboardViewModel: Using authenticated userId: '${authResult.user.id}'")

                    // Migrate old activities to current user
                    migrateOldActivities(authResult.user.id)

                    loadDashboardData()
                } else {
                    // Use demo user ID if not authenticated
                    currentUserId = "demo_user"
                    println("DEBUG DashboardViewModel: Using demo userId: 'demo_user' (not authenticated)")
                    loadDashboardData()
                }
            } catch (e: Exception) {
                currentUserId = "demo_user"
                println("DEBUG DashboardViewModel: Using demo userId: 'demo_user' (exception: ${e.message})")
                loadDashboardData()
            }
        }
    }

    /**
     * Load all dashboard data including stats, recent activities, and goals
     */
    private fun loadDashboardData() {
        currentUserId?.let { userId ->
            println("DEBUG DashboardViewModel: Loading dashboard data for userId: '$userId'")
            viewModelScope.launch {
                activityRepository.getAllActivitiesForUser(userId)
                    .catch { exception ->
                        println("DEBUG DashboardViewModel: Error loading activities: ${exception.message}")
                        _uiState.value = _uiState.value.copy(
                            error = exception.message ?: "Failed to load dashboard data",
                            isLoading = false
                        )
                    }
                    .collect { activities ->
                        println("DEBUG DashboardViewModel: Received ${activities.size} activities")

                        // Show only COMPLETED activities with valid endTime
                        // FIX-052.1: Safe null handling in sortedByDescending to prevent NullPointerException
                        val completedActivities = activities.filter {
                            it.status == ActivityStatus.COMPLETED && it.endTime != null
                        }.sortedByDescending { it.endTime ?: java.util.Date(0) }

                        println("DEBUG DashboardViewModel: ${completedActivities.size} completed activities")

                        // Calculate all dashboard metrics
                        val weeklyStats = calculateWeeklyStats(completedActivities)
                        val recentActivities = completedActivities.take(3)
                        val weeklyGoals = calculateWeeklyGoals(completedActivities)

                        _uiState.value = _uiState.value.copy(
                            weeklyDistance = weeklyStats.distance,
                            weeklyTime = weeklyStats.time,
                            averagePace = weeklyStats.pace,
                            recentActivities = recentActivities,
                            weeklyDistanceGoal = weeklyGoals.distanceGoal,
                            weeklyRunsGoal = weeklyGoals.runsGoal,
                            isLoading = false,
                            error = null
                        )

                        println("DEBUG DashboardViewModel: Dashboard state updated - Distance: ${weeklyStats.distance}, Recent: ${recentActivities.size}")
                    }
            }
        }
    }

    /**
     * Calculate weekly statistics
     */
    private fun calculateWeeklyStats(activities: List<Activity>): WeeklyStats {
        val oneWeekAgo = System.currentTimeMillis() - (7 * 24 * 60 * 60 * 1000)
        val weeklyActivities = activities.filter {
            it.endTime?.time ?: 0 > oneWeekAgo
        }

        println("DEBUG DashboardViewModel: Found ${weeklyActivities.size} activities in last 7 days")

        val totalDistanceMeters = weeklyActivities.sumOf { it.totalDistance }
        val totalDistanceKm = totalDistanceMeters / 1000.0

        val totalDurationMs = weeklyActivities.sumOf { it.totalDuration }
        val totalDurationMinutes = totalDurationMs / (1000 * 60)

        println("DEBUG DashboardViewModel: Total distance: ${String.format("%.2f", totalDistanceKm)}km, Duration: ${totalDurationMinutes}min")

        val avgPaceSeconds = if (weeklyActivities.isNotEmpty()) {
            weeklyActivities.map { it.averagePace }.average()
        } else 0.0

        return WeeklyStats(
            distance = String.format("%.1f", totalDistanceKm),
            time = formatDuration(totalDurationMinutes),
            pace = formatPace(avgPaceSeconds)
        )
    }

    /**
     * Calculate weekly goals progress
     */
    private fun calculateWeeklyGoals(activities: List<Activity>): WeeklyGoals {
        val oneWeekAgo = System.currentTimeMillis() - (7 * 24 * 60 * 60 * 1000)
        val weeklyActivities = activities.filter {
            it.endTime?.time ?: 0 > oneWeekAgo
        }

        // Weekly distance goal: 20 km target
        val currentDistanceKm = weeklyActivities.sumOf { it.totalDistance } / 1000.0
        val distanceTarget = 20.0
        val distanceProgress = if (distanceTarget > 0) {
            (currentDistanceKm / distanceTarget).coerceIn(0.0, 1.0).toFloat()
        } else 0f

        // Weekly runs goal: 4 runs target
        val currentRuns = weeklyActivities.size
        val runsTarget = 4
        val runsProgress = if (runsTarget > 0) {
            (currentRuns.toFloat() / runsTarget).coerceIn(0f, 1f)
        } else 0f

        return WeeklyGoals(
            distanceGoal = GoalProgress(
                current = String.format("%.1f km", currentDistanceKm),
                target = String.format("%.0f km", distanceTarget),
                progress = distanceProgress
            ),
            runsGoal = GoalProgress(
                current = "$currentRuns runs",
                target = "$runsTarget runs",
                progress = runsProgress
            )
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
        if (paceInSeconds <= 0) return "0:00"

        val minutes = (paceInSeconds / 60).toInt()
        val seconds = (paceInSeconds % 60).toInt()
        return String.format("%d:%02d", minutes, seconds)
    }

    /**
     * Migrate old activities to current authenticated user
     */
    private suspend fun migrateOldActivities(authenticatedUserId: String) {
        try {
            println("DEBUG DashboardViewModel: Migrating old activities to userId: '$authenticatedUserId'")
            val migratedCount = activityRepository.migrateActivitiesToUser(authenticatedUserId)
            println("DEBUG DashboardViewModel: Migrated $migratedCount activities to userId: '$authenticatedUserId'")
        } catch (e: Exception) {
            println("DEBUG DashboardViewModel: Error migrating activities: ${e.message}")
            e.printStackTrace()
        }
    }

    /**
     * Refresh dashboard data
     */
    fun refresh() {
        println("DEBUG DashboardViewModel: Refreshing dashboard for user: $currentUserId")
        _uiState.value = _uiState.value.copy(isLoading = true)
        loadDashboardData()
    }

    /**
     * Clear error message
     */
    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

/**
 * UI State for Dashboard screen
 */
data class DashboardUiState(
    val weeklyDistance: String = "0.0",
    val weeklyTime: String = "0m",
    val averagePace: String = "0:00",
    val recentActivities: List<Activity> = emptyList(),
    val weeklyDistanceGoal: GoalProgress = GoalProgress("0.0 km", "20 km", 0f),
    val weeklyRunsGoal: GoalProgress = GoalProgress("0 runs", "4 runs", 0f),
    val isLoading: Boolean = true,
    val error: String? = null
)

/**
 * Weekly statistics data
 */
data class WeeklyStats(
    val distance: String,
    val time: String,
    val pace: String
)

/**
 * Weekly goals data
 */
data class WeeklyGoals(
    val distanceGoal: GoalProgress,
    val runsGoal: GoalProgress
)

/**
 * Goal progress data
 */
data class GoalProgress(
    val current: String,
    val target: String,
    val progress: Float
)

/**
 * Factory for creating DashboardViewModel
 */
class DashboardViewModelFactory(
    private val activityRepository: ActivityRepository,
    private val authRepository: AuthRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(DashboardViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return DashboardViewModel(activityRepository, authRepository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
