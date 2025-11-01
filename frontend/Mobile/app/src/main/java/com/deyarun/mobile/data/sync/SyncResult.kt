package com.deyarun.mobile.data.sync

/**
 * Represents the result of a sync operation
 */
sealed class SyncResult {
    object Success : SyncResult()

    data class Error(
        val message: String,
        val cause: Throwable? = null
    ) : SyncResult()

    data class PartialSuccess(
        val errors: List<String>,
        val successCount: Int = 0
    ) : SyncResult()
}

/**
 * Represents different types of syncable data
 */
enum class DataType {
    ACTIVITIES,
    GOALS,
    PREFERENCES,
    STATISTICS,
    ACHIEVEMENTS
}

/**
 * Interface for all data that can be synchronized
 */
interface SyncableData {
    val id: String
    val type: DataType
    val lastModified: Long

    fun serialize(): String
}