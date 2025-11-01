package com.deyarun.mobile.data.local

import android.content.Context
import androidx.room.*
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.deyarun.mobile.data.sync.DataType
import com.deyarun.mobile.data.sync.SyncableData
import com.deyarun.mobile.data.local.dao.*

/**
 * Local SQLite database for offline-first data storage
 */
@Database(
    entities = [
        RunningActivity::class,
        UserGoal::class,
        UserPreference::class,
        SyncMetadata::class,
        PendingUploadEntity::class,
        ConflictEntity::class,
        com.deyarun.mobile.data.model.Activity::class
    ],
    version = 3,
    exportSchema = false
)
@TypeConverters(Converters::class, com.deyarun.mobile.data.local.converter.Converters::class)
abstract class LocalDatabase : RoomDatabase() {

    abstract fun activitiesDao(): ActivitiesDao
    abstract fun goalsDao(): GoalsDao
    abstract fun preferencesDao(): PreferencesDao
    abstract fun syncMetadataDao(): SyncMetadataDao
    abstract fun pendingUploadsDao(): PendingUploadsDao
    abstract fun conflictsDao(): ConflictsDao
    abstract fun activityDao(): com.deyarun.mobile.data.local.dao.ActivityDao

    // Generic methods for sync service
    suspend fun getDataById(id: String): SyncableData? {
        // Check all DAOs for the given ID
        activitiesDao().getById(id)?.let { return it }
        goalsDao().getById(id)?.let { return it }
        preferencesDao().getById(id)?.let { return it }
        return null
    }

    suspend fun updateData(data: SyncableData) {
        when (data.type) {
            DataType.ACTIVITIES -> activitiesDao().update(data as RunningActivity)
            DataType.GOALS -> goalsDao().update(data as UserGoal)
            DataType.PREFERENCES -> preferencesDao().update(data as UserPreference)
            else -> { /* Handle other types */ }
        }
    }

    suspend fun insertData(data: SyncableData) {
        when (data.type) {
            DataType.ACTIVITIES -> activitiesDao().insert(data as RunningActivity)
            DataType.GOALS -> goalsDao().insert(data as UserGoal)
            DataType.PREFERENCES -> preferencesDao().insert(data as UserPreference)
            else -> { /* Handle other types */ }
        }
    }

    suspend fun deleteData(id: String) {
        activitiesDao().deleteById(id)
        goalsDao().deleteById(id)
        preferencesDao().deleteById(id)
    }

    companion object {
        @Volatile
        private var INSTANCE: LocalDatabase? = null

        fun getDatabase(context: Context): LocalDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    LocalDatabase::class.java,
                    "deya_run_database"
                )
                .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
                .build()
                INSTANCE = instance
                instance
            }
        }

        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(database: SupportSQLiteDatabase) {
                // Handle database migration if needed
                database.execSQL("""
                    CREATE TABLE IF NOT EXISTS `activities` (
                        `id` TEXT NOT NULL,
                        `userId` TEXT NOT NULL,
                        `type` TEXT NOT NULL,
                        `name` TEXT NOT NULL,
                        `startTime` INTEGER NOT NULL,
                        `endTime` INTEGER,
                        `totalDistance` REAL NOT NULL,
                        `totalDuration` INTEGER NOT NULL,
                        `averagePace` REAL NOT NULL,
                        `calories` INTEGER NOT NULL,
                        `status` TEXT NOT NULL,
                        `gpsPoints` TEXT NOT NULL,
                        `createdAt` INTEGER NOT NULL,
                        `updatedAt` INTEGER NOT NULL,
                        `syncedToBackend` INTEGER NOT NULL,
                        `cloudId` TEXT,
                        PRIMARY KEY(`id`)
                    )
                """.trimIndent())
            }
        }

        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(database: SupportSQLiteDatabase) {
                // Schema hash update after code refactoring (FIX-051/052)
                // No actual table changes needed - Room just needed version increment
                // to match updated schema expectations
            }
        }
    }
}

// Entity classes
@Entity(tableName = "running_activities")
data class RunningActivity(
    @PrimaryKey override val id: String,
    val userId: String,
    val distance: Double, // in kilometers
    val duration: Long, // in milliseconds
    val averagePace: Double, // min/km
    val calories: Int,
    val startTime: Long,
    val endTime: Long,
    val gpsRoute: String? = null, // JSON string of GPS coordinates
    val weather: String? = null,
    val notes: String? = null,
    val isManual: Boolean = false,
    @ColumnInfo(name = "last_modified") override val lastModified: Long = System.currentTimeMillis(),
    val syncStatus: SyncStatus = SyncStatus.PENDING
) : SyncableData {
    override val type: DataType get() = DataType.ACTIVITIES

    override fun serialize(): String {
        return """
            {
                "id": "$id",
                "userId": "$userId",
                "distance": $distance,
                "duration": $duration,
                "averagePace": $averagePace,
                "calories": $calories,
                "startTime": $startTime,
                "endTime": $endTime,
                "gpsRoute": ${gpsRoute?.let { "\"$it\"" } ?: "null"},
                "weather": ${weather?.let { "\"$it\"" } ?: "null"},
                "notes": ${notes?.let { "\"$it\"" } ?: "null"},
                "isManual": $isManual,
                "lastModified": $lastModified
            }
        """.trimIndent()
    }
}

@Entity(tableName = "user_goals")
data class UserGoal(
    @PrimaryKey override val id: String,
    val userId: String,
    val goalType: GoalType, // WEEKLY_DISTANCE, MONTHLY_RUNS, etc.
    val targetValue: Double,
    val currentValue: Double = 0.0,
    val unit: String, // km, runs, minutes
    val startDate: Long,
    val endDate: Long,
    val isCompleted: Boolean = false,
    @ColumnInfo(name = "last_modified") override val lastModified: Long = System.currentTimeMillis(),
    val syncStatus: SyncStatus = SyncStatus.PENDING
) : SyncableData {
    override val type: DataType get() = DataType.GOALS

    override fun serialize(): String {
        return """
            {
                "id": "$id",
                "userId": "$userId",
                "type": "$goalType",
                "targetValue": $targetValue,
                "currentValue": $currentValue,
                "unit": "$unit",
                "startDate": $startDate,
                "endDate": $endDate,
                "isCompleted": $isCompleted,
                "lastModified": $lastModified
            }
        """.trimIndent()
    }
}

@Entity(tableName = "user_preferences")
data class UserPreference(
    @PrimaryKey override val id: String,
    val userId: String,
    val key: String,
    val value: String,
    val dataType: String, // STRING, BOOLEAN, INTEGER, DOUBLE
    @ColumnInfo(name = "last_modified") override val lastModified: Long = System.currentTimeMillis(),
    val syncStatus: SyncStatus = SyncStatus.PENDING
) : SyncableData {
    override val type: DataType get() = DataType.PREFERENCES

    override fun serialize(): String {
        return """
            {
                "id": "$id",
                "userId": "$userId",
                "key": "$key",
                "value": "$value",
                "dataType": "$dataType",
                "lastModified": $lastModified
            }
        """.trimIndent()
    }
}

@Entity(tableName = "sync_metadata")
data class SyncMetadata(
    @PrimaryKey val dataType: DataType,
    val lastSyncTimestamp: Long,
    val lastSuccessfulSync: Long,
    val syncVersion: Long,
    val errorCount: Int = 0,
    val lastError: String? = null
)

@Entity(tableName = "pending_uploads")
data class PendingUploadEntity(
    @PrimaryKey val id: String,
    val dataType: DataType,
    val data: String,
    val timestamp: Long,
    val retryCount: Int = 0,
    val priority: Int = 0 // Higher number = higher priority
)

@Entity(tableName = "sync_conflicts")
data class ConflictEntity(
    @PrimaryKey val id: String,
    val localData: String, // JSON serialized
    val serverData: String, // JSON serialized
    val dataType: DataType,
    val conflictType: String,
    val timestamp: Long
)

// Enums
enum class SyncStatus {
    PENDING, SYNCED, CONFLICT, ERROR
}

enum class GoalType {
    WEEKLY_DISTANCE,
    WEEKLY_RUNS,
    MONTHLY_DISTANCE,
    MONTHLY_RUNS,
    YEARLY_DISTANCE,
    PERSONAL_BEST_5K,
    PERSONAL_BEST_10K,
    PERSONAL_BEST_HALF_MARATHON,
    PERSONAL_BEST_MARATHON
}

// Type converters for Room
class Converters {
    @TypeConverter
    fun fromDataType(dataType: DataType): String = dataType.name

    @TypeConverter
    fun toDataType(dataType: String): DataType = DataType.valueOf(dataType)

    @TypeConverter
    fun fromSyncStatus(status: SyncStatus): String = status.name

    @TypeConverter
    fun toSyncStatus(status: String): SyncStatus = SyncStatus.valueOf(status)

    @TypeConverter
    fun fromGoalType(goalType: GoalType): String = goalType.name

    @TypeConverter
    fun toGoalType(goalType: String): GoalType = GoalType.valueOf(goalType)
}