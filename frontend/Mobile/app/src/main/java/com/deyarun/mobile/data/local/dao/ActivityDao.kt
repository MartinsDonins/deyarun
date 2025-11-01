package com.deyarun.mobile.data.local.dao

import androidx.room.*
import com.deyarun.mobile.data.model.Activity
import com.deyarun.mobile.data.model.ActivityStatus
import kotlinx.coroutines.flow.Flow

@Dao
interface ActivityDao {
    @Query("SELECT * FROM activities WHERE userId = :userId ORDER BY startTime DESC")
    fun getAllActivitiesForUser(userId: String): Flow<List<Activity>>

    @Query("SELECT * FROM activities WHERE id = :id")
    suspend fun getActivityById(id: String): Activity?

    @Query("SELECT * FROM activities WHERE status = :status AND userId = :userId LIMIT 1")
    suspend fun getActiveActivity(status: ActivityStatus, userId: String): Activity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertActivity(activity: Activity)

    @Update
    suspend fun updateActivity(activity: Activity)

    @Delete
    suspend fun deleteActivity(activity: Activity)

    @Query("DELETE FROM activities WHERE id = :id")
    suspend fun deleteActivityById(id: String)

    @Query("SELECT * FROM activities WHERE syncedToBackend = 0 AND userId = :userId")
    suspend fun getUnsyncedActivities(userId: String): List<Activity>

    @Query("UPDATE activities SET syncedToBackend = 1 WHERE id = :id")
    suspend fun markActivityAsSynced(id: String)

    @Query("SELECT * FROM activities")
    suspend fun getAllActivities(): List<Activity>

    @Query("SELECT * FROM activities WHERE cloudId = :cloudId LIMIT 1")
    suspend fun getActivityByCloudId(cloudId: String): Activity?

    @Query("UPDATE activities SET userId = :newUserId WHERE userId != :newUserId")
    suspend fun migrateActivitiesToUser(newUserId: String): Int

    /**
     * Get all activities for GDPR export
     */
    @Query("SELECT * FROM activities WHERE userId = :userId ORDER BY startTime DESC")
    suspend fun getActivitiesForExport(userId: String): List<Activity>

    /**
     * Delete all activities for user (GDPR data deletion)
     */
    @Query("DELETE FROM activities WHERE userId = :userId")
    suspend fun deleteAllActivitiesForUser(userId: String): Int
}