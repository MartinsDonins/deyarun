package com.deyarun.mobile.data.local.dao

import androidx.room.*
import kotlinx.coroutines.flow.Flow
import com.deyarun.mobile.data.local.*
import com.deyarun.mobile.data.sync.DataType

/**
 * DAO interfaces for Cloud Sync operations
 */

@Dao
interface ActivitiesDao {
    @Query("SELECT * FROM running_activities WHERE userId = :userId ORDER BY startTime DESC")
    fun getAllByUser(userId: String): Flow<List<RunningActivity>>

    @Query("SELECT * FROM running_activities WHERE id = :id")
    suspend fun getById(id: String): RunningActivity?

    @Query("SELECT * FROM running_activities WHERE syncStatus = :status")
    suspend fun getBySyncStatus(status: SyncStatus): List<RunningActivity>

    @Query("SELECT * FROM running_activities WHERE last_modified > :timestamp")
    suspend fun getModifiedSince(timestamp: Long): List<RunningActivity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(activity: RunningActivity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(activities: List<RunningActivity>)

    @Update
    suspend fun update(activity: RunningActivity)

    @Delete
    suspend fun delete(activity: RunningActivity)

    @Query("DELETE FROM running_activities WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("UPDATE running_activities SET syncStatus = :status WHERE id = :id")
    suspend fun updateSyncStatus(id: String, status: SyncStatus)

    @Query("SELECT COUNT(*) FROM running_activities WHERE userId = :userId AND startTime >= :startTime AND startTime <= :endTime")
    suspend fun getRunCountInPeriod(userId: String, startTime: Long, endTime: Long): Int

    @Query("SELECT SUM(distance) FROM running_activities WHERE userId = :userId AND startTime >= :startTime AND startTime <= :endTime")
    suspend fun getTotalDistanceInPeriod(userId: String, startTime: Long, endTime: Long): Double?
}

@Dao
interface GoalsDao {
    @Query("SELECT * FROM user_goals WHERE userId = :userId ORDER BY startDate DESC")
    fun getAllByUser(userId: String): Flow<List<UserGoal>>

    @Query("SELECT * FROM user_goals WHERE id = :id")
    suspend fun getById(id: String): UserGoal?

    @Query("SELECT * FROM user_goals WHERE userId = :userId AND isCompleted = 0")
    suspend fun getActiveGoals(userId: String): List<UserGoal>

    @Query("SELECT * FROM user_goals WHERE syncStatus = :status")
    suspend fun getBySyncStatus(status: SyncStatus): List<UserGoal>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(goal: UserGoal)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(goals: List<UserGoal>)

    @Update
    suspend fun update(goal: UserGoal)

    @Delete
    suspend fun delete(goal: UserGoal)

    @Query("DELETE FROM user_goals WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("UPDATE user_goals SET currentValue = :value, last_modified = :timestamp WHERE id = :id")
    suspend fun updateProgress(id: String, value: Double, timestamp: Long)

    @Query("UPDATE user_goals SET isCompleted = 1, last_modified = :timestamp WHERE id = :id")
    suspend fun markCompleted(id: String, timestamp: Long)
}

@Dao
interface PreferencesDao {
    @Query("SELECT * FROM user_preferences WHERE userId = :userId")
    fun getAllByUser(userId: String): Flow<List<UserPreference>>

    @Query("SELECT * FROM user_preferences WHERE id = :id")
    suspend fun getById(id: String): UserPreference?

    @Query("SELECT * FROM user_preferences WHERE userId = :userId AND key = :key")
    suspend fun getByKey(userId: String, key: String): UserPreference?

    @Query("SELECT value FROM user_preferences WHERE userId = :userId AND key = :key")
    suspend fun getValue(userId: String, key: String): String?

    @Query("SELECT * FROM user_preferences WHERE syncStatus = :status")
    suspend fun getBySyncStatus(status: SyncStatus): List<UserPreference>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(preference: UserPreference)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(preferences: List<UserPreference>)

    @Update
    suspend fun update(preference: UserPreference)

    @Delete
    suspend fun delete(preference: UserPreference)

    @Query("DELETE FROM user_preferences WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM user_preferences WHERE userId = :userId AND key = :key")
    suspend fun deleteByKey(userId: String, key: String)
}

@Dao
interface SyncMetadataDao {
    @Query("SELECT * FROM sync_metadata WHERE dataType = :dataType")
    suspend fun getByDataType(dataType: DataType): SyncMetadata?

    @Query("SELECT * FROM sync_metadata")
    suspend fun getAll(): List<SyncMetadata>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(metadata: SyncMetadata)

    @Update
    suspend fun update(metadata: SyncMetadata)

    @Query("UPDATE sync_metadata SET lastSyncTimestamp = :timestamp WHERE dataType = :dataType")
    suspend fun updateLastSync(dataType: DataType, timestamp: Long)

    @Query("UPDATE sync_metadata SET lastSuccessfulSync = :timestamp WHERE dataType = :dataType")
    suspend fun updateLastSuccessfulSync(dataType: DataType, timestamp: Long)

    @Query("UPDATE sync_metadata SET errorCount = errorCount + 1, lastError = :error WHERE dataType = :dataType")
    suspend fun incrementErrorCount(dataType: DataType, error: String)

    @Query("UPDATE sync_metadata SET errorCount = 0, lastError = NULL WHERE dataType = :dataType")
    suspend fun clearErrors(dataType: DataType)
}

@Dao
interface PendingUploadsDao {
    @Query("SELECT * FROM pending_uploads ORDER BY priority DESC, timestamp ASC")
    suspend fun getAll(): List<PendingUploadEntity>

    @Query("SELECT * FROM pending_uploads WHERE dataType = :dataType ORDER BY timestamp ASC")
    suspend fun getByDataType(dataType: DataType): List<PendingUploadEntity>

    @Query("SELECT COUNT(*) FROM pending_uploads")
    suspend fun getCount(): Int

    @Query("SELECT COUNT(*) FROM pending_uploads WHERE dataType = :dataType")
    suspend fun getCountByType(dataType: DataType): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(upload: PendingUploadEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(uploads: List<PendingUploadEntity>)

    @Delete
    suspend fun delete(upload: PendingUploadEntity)

    @Query("DELETE FROM pending_uploads WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("UPDATE pending_uploads SET retryCount = retryCount + 1 WHERE id = :id")
    suspend fun incrementRetryCount(id: String)

    @Query("DELETE FROM pending_uploads WHERE retryCount > :maxRetries")
    suspend fun deleteFailedUploads(maxRetries: Int = 5)

    @Query("DELETE FROM pending_uploads")
    suspend fun deleteAll()
}

@Dao
interface ConflictsDao {
    @Query("SELECT * FROM sync_conflicts ORDER BY timestamp DESC")
    suspend fun getAll(): List<ConflictEntity>

    @Query("SELECT * FROM sync_conflicts WHERE dataType = :dataType")
    suspend fun getByDataType(dataType: DataType): List<ConflictEntity>

    @Query("SELECT * FROM sync_conflicts WHERE id = :id")
    suspend fun getById(id: String): ConflictEntity?

    @Query("SELECT COUNT(*) FROM sync_conflicts")
    suspend fun getCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(conflict: ConflictEntity)

    @Delete
    suspend fun delete(conflict: ConflictEntity)

    @Query("DELETE FROM sync_conflicts WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM sync_conflicts WHERE dataType = :dataType")
    suspend fun deleteByDataType(dataType: DataType)

    @Query("DELETE FROM sync_conflicts")
    suspend fun deleteAll()
}