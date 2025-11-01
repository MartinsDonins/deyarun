package com.deyarun.mobile.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.deyarun.mobile.data.local.dao.ActivityDao
import com.deyarun.mobile.data.model.Activity
import com.deyarun.mobile.data.model.ActivityStatus
import com.deyarun.mobile.data.model.ActivityType
import com.deyarun.mobile.data.model.GpsPoint
import com.deyarun.mobile.utils.LocationManager
import com.deyarun.mobile.data.sync.ActivitySyncManager
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*

data class ActivityState(
    val currentActivity: Activity? = null,
    val isTracking: Boolean = false,
    val totalDistance: Double = 0.0,
    val totalDuration: Long = 0L,
    val currentPace: Double = 0.0,
    val averagePace: Double = 0.0,
    val calories: Int = 0,
    val gpsPoints: List<GpsPoint> = emptyList(),
    val lastGpsPoint: GpsPoint? = null,
    val error: String? = null,
    val hasLocationPermission: Boolean = false
)

class ActivityViewModel(
    private val activityDao: ActivityDao,
    private val locationManager: LocationManager,
    private val syncManager: ActivitySyncManager,
    private val userId: String
) : ViewModel() {

    private val _activityState = MutableStateFlow(ActivityState())
    val activityState: StateFlow<ActivityState> = _activityState.asStateFlow()

    private var startTime: Date? = null
    private var lastUpdateTime: Date? = null
    private val gpsPoints = mutableListOf<GpsPoint>()

    init {
        println("DEBUG ActivityViewModel: Initialized with userId: '$userId'")
        checkLocationPermission()
        checkForActiveActivity()

        // Initialize sync manager
        syncManager.initialize()

        // Debug: Check all activities for this user
        debugCheckActivities()
    }

    fun checkLocationPermission() {
        _activityState.update {
            it.copy(hasLocationPermission = locationManager.hasLocationPermission())
        }
    }

    private fun checkForActiveActivity() {
        viewModelScope.launch {
            try {
                val activeActivity = activityDao.getActiveActivity(ActivityStatus.ACTIVE, userId)
                if (activeActivity != null) {
                    // Sync private gpsPoints with loaded activity
                    gpsPoints.clear()
                    gpsPoints.addAll(activeActivity.gpsPoints)

                    _activityState.update {
                        it.copy(
                            currentActivity = activeActivity,
                            isTracking = true,
                            gpsPoints = activeActivity.gpsPoints,
                            totalDistance = activeActivity.totalDistance,
                            totalDuration = activeActivity.totalDuration
                        )
                    }

                    // Immediately update duration from loaded activity
                    updateCurrentDuration()

                    // Resume tracking
                    startLocationUpdates()
                }
            } catch (e: Exception) {
                _activityState.update { it.copy(error = "Failed to check active activity: ${e.message}") }
            }
        }
    }

    fun startActivity(type: ActivityType, name: String = getDefaultActivityName(type)) {
        if (!locationManager.hasLocationPermission()) {
            _activityState.update { it.copy(error = "Location permission required") }
            return
        }

        viewModelScope.launch {
            try {
                // End any existing active activity first
                stopActivity()

                val newActivity = Activity(
                    userId = userId,
                    type = type,
                    name = name,
                    startTime = Date(),
                    endTime = null,
                    status = ActivityStatus.ACTIVE,
                    syncedToBackend = false  // Start as unsynced
                )

                println("DEBUG ActivityViewModel: Starting activity - Type: ${type.name}, Name: '$name'")
                println("DEBUG ActivityViewModel: UserId: '$userId'")

                activityDao.insertActivity(newActivity)
                println("DEBUG ActivityViewModel: Activity inserted - ID: ${newActivity.id}, Status: ${newActivity.status}, Synced: ${newActivity.syncedToBackend}")

                startTime = newActivity.startTime
                lastUpdateTime = newActivity.startTime
                gpsPoints.clear()

                println("DEBUG: Started new activity ${newActivity.id} - ${newActivity.name}")

                _activityState.update {
                    it.copy(
                        currentActivity = newActivity,
                        isTracking = true,
                        totalDistance = 0.0,
                        totalDuration = 0L,
                        gpsPoints = emptyList(),
                        error = null
                    )
                }

                // Immediately update duration to avoid 00:00 display delay
                updateCurrentDuration()

                startLocationUpdates()

                // Initialize GPS tracking
                initializeGpsTracking()
            } catch (e: Exception) {
                _activityState.update { it.copy(error = "Failed to start activity: ${e.message}") }
            }
        }
    }

    fun pauseActivity() {
        _activityState.update {
            it.copy(isTracking = false)
        }

        val currentActivity = _activityState.value.currentActivity
        if (currentActivity != null) {
            viewModelScope.launch {
                try {
                    val updatedActivity = currentActivity.copy(
                        status = ActivityStatus.PAUSED,
                        updatedAt = Date()
                    )
                    activityDao.updateActivity(updatedActivity)
                    _activityState.update { it.copy(currentActivity = updatedActivity) }
                } catch (e: Exception) {
                    _activityState.update { it.copy(error = "Failed to pause activity: ${e.message}") }
                }
            }
        }
    }

    fun resumeActivity() {
        val currentActivity = _activityState.value.currentActivity
        if (currentActivity != null && currentActivity.status == ActivityStatus.PAUSED) {
            _activityState.update {
                it.copy(isTracking = true)
            }

            viewModelScope.launch {
                try {
                    val updatedActivity = currentActivity.copy(
                        status = ActivityStatus.ACTIVE,
                        updatedAt = Date()
                    )
                    activityDao.updateActivity(updatedActivity)
                    _activityState.update { it.copy(currentActivity = updatedActivity) }

                    // Immediately update duration after resume
                    updateCurrentDuration()

                    startLocationUpdates()
                } catch (e: Exception) {
                    _activityState.update { it.copy(error = "Failed to resume activity: ${e.message}") }
                }
            }
        }
    }

    fun stopActivity() {
        _activityState.update {
            it.copy(isTracking = false)
        }

        val currentActivity = _activityState.value.currentActivity
        if (currentActivity != null) {
            viewModelScope.launch {
                try {
                    // FIX 8: Validate activity status before completion
                    if (currentActivity.status != ActivityStatus.ACTIVE &&
                        currentActivity.status != ActivityStatus.PAUSED) {
                        println("DEBUG ActivityViewModel: ⚠️ Cannot complete activity with status: ${currentActivity.status}")
                        return@launch
                    }

                    val endTime = Date()
                    val finalDuration = endTime.time - currentActivity.startTime.time
                    val finalDistance = _activityState.value.totalDistance
                    val averagePace = if (finalDistance > 0) {
                        locationManager.calculatePace(finalDistance, finalDuration)
                    } else 0.0

                    // Debug information
                    println("DEBUG: Stopping activity ${currentActivity.id}")
                    println("DEBUG: GPS Points count: ${gpsPoints.size}")
                    println("DEBUG: Final distance: $finalDistance")
                    println("DEBUG: Final duration: $finalDuration")

                    val completedActivity = currentActivity.copy(
                        endTime = endTime,
                        status = ActivityStatus.COMPLETED,
                        totalDistance = finalDistance,
                        totalDuration = finalDuration,
                        averagePace = averagePace,
                        calories = calculateCalories(finalDistance, finalDuration, currentActivity.type),
                        gpsPoints = gpsPoints.toList(),
                        updatedAt = endTime
                    )

                    println("DEBUG ActivityViewModel: ====== ACTIVITY COMPLETED ======")
                    println("DEBUG ActivityViewModel: ID: ${completedActivity.id}")
                    println("DEBUG ActivityViewModel: UserId: '${completedActivity.userId}'")
                    println("DEBUG ActivityViewModel: Name: ${completedActivity.name}")
                    println("DEBUG ActivityViewModel: Status: ${completedActivity.status}")
                    println("DEBUG ActivityViewModel: StartTime: ${completedActivity.startTime}")
                    println("DEBUG ActivityViewModel: EndTime: ${completedActivity.endTime}")
                    println("DEBUG ActivityViewModel: Distance: ${completedActivity.totalDistance}m")
                    println("DEBUG ActivityViewModel: Duration: ${completedActivity.totalDuration}ms")
                    println("DEBUG ActivityViewModel: GPS Points: ${completedActivity.gpsPoints.size}")
                    println("DEBUG ActivityViewModel: Synced: ${completedActivity.syncedToBackend}")
                    println("DEBUG ActivityViewModel: ===============================")

                    // Save to database
                    activityDao.updateActivity(completedActivity)
                    println("DEBUG: Activity saved to database successfully with userId: '${completedActivity.userId}' and status: ${completedActivity.status}")

                    // Verify it was saved
                    val savedActivity = activityDao.getActivityById(completedActivity.id)
                    if (savedActivity != null) {
                        println("DEBUG: Activity verified in database - GPS points: ${savedActivity.gpsPoints.size}")
                    } else {
                        println("DEBUG: ERROR - Activity not found in database after save!")
                    }

                    // Debug: Show all activities in database
                    debugShowAllActivitiesInDB()

                    // Save workout to cloud for sync
                    saveWorkoutToCloud(completedActivity)

                    _activityState.update {
                        it.copy(
                            currentActivity = completedActivity,
                            isTracking = false
                        )
                    }
                } catch (e: Exception) {
                    println("DEBUG: Error stopping activity: ${e.message}")
                    e.printStackTrace()
                    _activityState.update { it.copy(error = "Failed to stop activity: ${e.message}") }
                }
            }
        } else {
            println("DEBUG: No current activity to stop")
        }
    }

    private fun startLocationUpdates() {
        if (!_activityState.value.isTracking) return

        viewModelScope.launch {
            locationManager.getLocationUpdates()
                .collect { gpsPoint ->
                    if (_activityState.value.isTracking) {
                        updateLocationData(gpsPoint)
                    }
                }
        }
    }

    private fun updateLocationData(newPoint: GpsPoint) {
        val lastPoint = _activityState.value.lastGpsPoint
        var additionalDistance = 0.0

        if (lastPoint != null) {
            additionalDistance = locationManager.calculateDistance(lastPoint, newPoint)
        }

        gpsPoints.add(newPoint)
        // Only log every 10th GPS point to reduce log noise
        if (gpsPoints.size % 10 == 0) {
            println("DEBUG: Added GPS point. Total GPS points: ${gpsPoints.size}")
        }

        val currentTime = Date()
        val totalDistance = _activityState.value.totalDistance + additionalDistance
        val totalDuration = currentTime.time - (startTime?.time ?: currentTime.time)

        // Calculate current pace (last segment)
        val currentPace = if (lastPoint != null && additionalDistance > 0) {
            val segmentTime = newPoint.timestamp.time - lastPoint.timestamp.time
            locationManager.calculatePace(additionalDistance, segmentTime)
        } else 0.0

        // Calculate average pace
        val averagePace = if (totalDistance > 0) {
            locationManager.calculatePace(totalDistance, totalDuration)
        } else 0.0

        val calories = calculateCalories(totalDistance, totalDuration,
            _activityState.value.currentActivity?.type ?: ActivityType.WALKING)

        _activityState.update {
            it.copy(
                totalDistance = totalDistance,
                totalDuration = totalDuration,
                currentPace = currentPace,
                averagePace = averagePace,
                calories = calories,
                lastGpsPoint = newPoint,
                gpsPoints = gpsPoints.toList()
            )
        }

        // Update activity in database every 10 seconds
        if (lastUpdateTime == null || currentTime.time - lastUpdateTime!!.time > 10000) {
            updateActivityInDatabase()
            lastUpdateTime = currentTime
        }
    }

    private fun updateActivityInDatabase() {
        val currentActivity = _activityState.value.currentActivity
        if (currentActivity != null) {
            viewModelScope.launch {
                try {
                    val updatedActivity = currentActivity.copy(
                        totalDistance = _activityState.value.totalDistance,
                        totalDuration = _activityState.value.totalDuration,
                        averagePace = _activityState.value.averagePace,
                        calories = _activityState.value.calories,
                        gpsPoints = gpsPoints.toList(),
                        updatedAt = Date()
                    )
                    println("DEBUG: Updating activity in DB. GPS points: ${gpsPoints.size}, Distance: ${String.format("%.1f", updatedActivity.totalDistance/1000)}km")
                    activityDao.updateActivity(updatedActivity)
                    println("DEBUG: Activity updated successfully")
                } catch (e: Exception) {
                    println("DEBUG: Failed to update activity: ${e.message}")
                    e.printStackTrace()
                    _activityState.update { it.copy(error = "Failed to update activity: ${e.message}") }
                }
            }
        }
    }

    private fun calculateCalories(distance: Double, duration: Long, type: ActivityType): Int {
        // Simple calorie calculation - in production, use more sophisticated methods
        val hours = duration / (1000.0 * 60.0 * 60.0)
        val km = distance / 1000.0

        val caloriesPerHour = when (type) {
            ActivityType.RUNNING -> 600.0
            ActivityType.WALKING -> 300.0
            ActivityType.CYCLING -> 500.0
            ActivityType.HIKING -> 400.0
        }

        return (caloriesPerHour * hours).toInt()
    }

    private fun getDefaultActivityName(type: ActivityType): String {
        val date = Date()
        return when (type) {
            ActivityType.RUNNING -> "Morning Run"
            ActivityType.WALKING -> "Walk"
            ActivityType.CYCLING -> "Bike Ride"
            ActivityType.HIKING -> "Hike"
        }
    }

    fun clearError() {
        _activityState.update { it.copy(error = null) }
    }

    fun resetTrackingState() {
        println("DEBUG ActivityViewModel: Resetting tracking state")
        _activityState.update { it.copy(isTracking = false) }
    }

    /**
     * Updates current duration independently of GPS updates
     * Called every second by UI timer loop
     */
    fun updateCurrentDuration() {
        if (_activityState.value.isTracking) {
            val currentActivity = _activityState.value.currentActivity

            // Use activity startTime as fallback if local startTime is null
            val effectiveStartTime = startTime ?: currentActivity?.startTime

            if (effectiveStartTime != null) {
                val currentTime = Date()
                val totalDuration = currentTime.time - effectiveStartTime.time

                _activityState.update {
                    it.copy(totalDuration = totalDuration)
                }
            } else {
                println("DEBUG: Cannot update duration - no startTime available")
            }
        }
    }

    // Debug function to check all activities in database
    fun debugCheckActivities() {
        viewModelScope.launch {
            try {
                val allActivities = activityDao.getAllActivitiesForUser(userId)
                allActivities.collect { activities ->
                    println("DEBUG: Total activities in database: ${activities.size}")
                    activities.forEach { activity ->
                        println("DEBUG: Activity ${activity.id} - ${activity.name} - Status: ${activity.status} - GPS Points: ${activity.gpsPoints.size}")
                        println("DEBUG: Distance: ${activity.totalDistance}m, Duration: ${activity.totalDuration}ms")
                    }
                }
            } catch (e: Exception) {
                println("DEBUG: Error checking activities: ${e.message}")
                e.printStackTrace()
            }
        }
    }

    private fun saveWorkoutToCloud(activity: Activity) {
        viewModelScope.launch {
            try {
                println("DEBUG: Saving workout offline-first: ${activity.id}")

                // STEP 1: Ensure local save is complete with sync flags
                val offlineActivity = activity.copy(
                    syncedToBackend = false
                )

                // Update local database to mark as unsynced
                activityDao.updateActivity(offlineActivity)
                println("DEBUG: Activity saved locally, marked for cloud sync")

                // STEP 2: Trigger background sync manager
                triggerSyncManager()

            } catch (e: Exception) {
                println("DEBUG: Failed to save workout offline: ${e.message}")
                e.printStackTrace()
            }
        }
    }

    private suspend fun tryImmediateSync(activity: Activity) {
        try {
            println("DEBUG: Attempting immediate cloud sync for: ${activity.id}")

            // Convert activity to JSON format for cloud
            val workoutData = mapOf(
                "id" to activity.id,
                "userId" to activity.userId,
                "type" to activity.type.name,
                "name" to activity.name,
                "startTime" to activity.startTime.time,
                "endTime" to activity.endTime?.time,
                "totalDistance" to activity.totalDistance,
                "totalDuration" to activity.totalDuration,
                "averagePace" to activity.averagePace,
                "calories" to activity.calories,
                "gpsPoints" to activity.gpsPoints.map { point ->
                    mapOf(
                        "latitude" to point.latitude,
                        "longitude" to point.longitude,
                        "altitude" to point.altitude,
                        "accuracy" to point.accuracy,
                        "timestamp" to point.timestamp.time,
                        "speed" to point.speed
                    )
                },
                "status" to activity.status.name,
                "createdAt" to activity.createdAt.time,
                "updatedAt" to activity.updatedAt.time
            )

            // TODO: Replace with actual API call
            // For now, simulate immediate sync failure - let background handle it
            val syncSuccess = false

            if (syncSuccess) {
                // Mark as successfully synced
                activityDao.markActivityAsSynced(activity.id)
                println("DEBUG: ✅ Activity synced to cloud successfully")
            } else {
                println("DEBUG: ⏳ Immediate sync failed, queued for background retry")
            }

        } catch (e: Exception) {
            println("DEBUG: ❌ Immediate sync error: ${e.message}")
            // Activity remains unsynced for background retry
        }
    }

    private fun triggerSyncManager() {
        viewModelScope.launch {
            try {
                println("DEBUG: Triggering sync manager for background sync")
                syncManager.attemptSyncUnsyncedActivities()
            } catch (e: Exception) {
                println("DEBUG: Error triggering sync manager: ${e.message}")
            }
        }
    }

    // Manual sync function for UI
    fun manualSync() {
        viewModelScope.launch {
            try {
                println("DEBUG: Manual sync requested")
                syncManager.manualSync()
            } catch (e: Exception) {
                println("DEBUG: Manual sync failed: ${e.message}")
                _activityState.update { it.copy(error = "Sync failed: ${e.message}") }
            }
        }
    }

    // Get sync state for UI
    fun getSyncState() = syncManager.syncState

    private fun initializeGpsTracking() {
        println("GPS tracking initialized for activity")
        // Additional GPS initialization if needed
    }

    private fun debugShowAllActivitiesInDB() {
        viewModelScope.launch {
            try {
                val allActivities = activityDao.getAllActivities()
                println("DEBUG: === ALL ACTIVITIES IN DATABASE ===")
                println("DEBUG: Total activities: ${allActivities.size}")
                allActivities.forEach { activity ->
                    println("DEBUG: Activity ${activity.id} - userId: '${activity.userId}' - ${activity.name} - Status: ${activity.status} - Distance: ${activity.totalDistance}m")
                }
                println("DEBUG: === END DATABASE DUMP ===")
            } catch (e: Exception) {
                println("DEBUG: Error showing all activities: ${e.message}")
            }
        }
    }
}

class ActivityViewModelFactory(
    private val activityDao: ActivityDao,
    private val locationManager: LocationManager,
    private val syncManager: ActivitySyncManager,
    private val userId: String
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ActivityViewModel::class.java)) {
            return ActivityViewModel(activityDao, locationManager, syncManager, userId) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}