package com.deyarun.mobile.data.repository

import android.content.Context
import com.deyarun.mobile.data.local.LocalDatabase
import com.deyarun.mobile.data.model.Activity
import com.deyarun.mobile.data.model.ActivityStatus
import com.deyarun.mobile.data.model.ActivityType
import com.deyarun.mobile.data.model.GpsPoint
import kotlinx.coroutines.flow.Flow
import java.util.*

/**
 * Repository for managing local activity data
 * Handles CRUD operations for workout activities
 */
class ActivityRepository(private val context: Context) {

    private val database = LocalDatabase.getDatabase(context)
    private val activityDao = database.activityDao()

    /**
     * Get all activities for a specific user
     */
    fun getAllActivitiesForUser(userId: String): Flow<List<Activity>> {
        return activityDao.getAllActivitiesForUser(userId)
    }

    /**
     * Get activity by ID
     */
    suspend fun getActivityById(id: String): Activity? {
        return activityDao.getActivityById(id)
    }

    /**
     * Get currently active activity for user
     */
    suspend fun getActiveActivity(userId: String): Activity? {
        return activityDao.getActiveActivity(ActivityStatus.ACTIVE, userId)
    }

    /**
     * Start a new activity
     */
    suspend fun startActivity(
        userId: String,
        type: ActivityType,
        name: String
    ): Activity {
        val activity = Activity(
            userId = userId,
            type = type,
            name = name,
            startTime = Date(),
            endTime = null,
            status = ActivityStatus.ACTIVE,
            createdAt = Date(),
            updatedAt = Date()
        )

        activityDao.insertActivity(activity)
        return activity
    }

    /**
     * Update activity with GPS point
     */
    suspend fun addGpsPoint(activityId: String, gpsPoint: GpsPoint) {
        val activity = activityDao.getActivityById(activityId)
        if (activity != null) {
            val updatedActivity = activity.copy(
                gpsPoints = activity.gpsPoints + gpsPoint,
                updatedAt = Date()
            )
            activityDao.updateActivity(updatedActivity)
        }
    }

    /**
     * Complete an activity
     */
    suspend fun completeActivity(
        activityId: String,
        totalDistance: Double,
        totalDuration: Long,
        averagePace: Double,
        calories: Int
    ) {
        val activity = activityDao.getActivityById(activityId)
        if (activity != null) {
            val completedActivity = activity.copy(
                endTime = Date(),
                totalDistance = totalDistance,
                totalDuration = totalDuration,
                averagePace = averagePace,
                calories = calories,
                status = ActivityStatus.COMPLETED,
                updatedAt = Date()
            )
            activityDao.updateActivity(completedActivity)
        }
    }

    /**
     * Pause an activity
     */
    suspend fun pauseActivity(activityId: String) {
        val activity = activityDao.getActivityById(activityId)
        if (activity != null) {
            val pausedActivity = activity.copy(
                status = ActivityStatus.PAUSED,
                updatedAt = Date()
            )
            activityDao.updateActivity(pausedActivity)
        }
    }

    /**
     * Resume a paused activity
     */
    suspend fun resumeActivity(activityId: String) {
        val activity = activityDao.getActivityById(activityId)
        if (activity != null) {
            val resumedActivity = activity.copy(
                status = ActivityStatus.ACTIVE,
                updatedAt = Date()
            )
            activityDao.updateActivity(resumedActivity)
        }
    }

    /**
     * Cancel an activity
     */
    suspend fun cancelActivity(activityId: String) {
        val activity = activityDao.getActivityById(activityId)
        if (activity != null) {
            val cancelledActivity = activity.copy(
                status = ActivityStatus.CANCELLED,
                endTime = Date(),
                updatedAt = Date()
            )
            activityDao.updateActivity(cancelledActivity)
        }
    }

    /**
     * Delete an activity
     */
    suspend fun deleteActivity(activityId: String) {
        activityDao.deleteActivityById(activityId)
    }

    /**
     * Get unsynced activities for cloud sync
     */
    suspend fun getUnsyncedActivities(userId: String): List<Activity> {
        return activityDao.getUnsyncedActivities(userId)
    }

    /**
     * Mark activity as synced to backend
     */
    suspend fun markActivityAsSynced(activityId: String) {
        activityDao.markActivityAsSynced(activityId)
    }

    /**
     * Migrate all activities to a new userId
     */
    suspend fun migrateActivitiesToUser(newUserId: String): Int {
        return activityDao.migrateActivitiesToUser(newUserId)
    }
}