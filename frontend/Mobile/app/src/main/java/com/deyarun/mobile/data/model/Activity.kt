package com.deyarun.mobile.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.*

@Entity(tableName = "activities")
data class Activity(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    val userId: String,
    val type: ActivityType,
    val name: String,
    val startTime: Date,
    val endTime: Date?,
    val totalDistance: Double = 0.0, // in meters
    val totalDuration: Long = 0L, // in milliseconds
    val averagePace: Double = 0.0, // in seconds per km
    val calories: Int = 0,
    val status: ActivityStatus = ActivityStatus.ACTIVE,
    val gpsPoints: List<GpsPoint> = emptyList(),
    val createdAt: Date = Date(),
    val updatedAt: Date = Date(),
    val syncedToBackend: Boolean = false,
    val cloudId: String? = null
)

enum class ActivityType {
    RUNNING,
    WALKING,
    CYCLING,
    HIKING
}

enum class ActivityStatus {
    ACTIVE,
    PAUSED,
    COMPLETED,
    CANCELLED
}

data class GpsPoint(
    val latitude: Double,
    val longitude: Double,
    val altitude: Double? = null,
    val accuracy: Float? = null,
    val timestamp: Date = Date(),
    val speed: Float = 0f // in m/s
)