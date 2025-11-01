package com.deyarun.mobile.data.local.converter

import androidx.room.TypeConverter
import com.deyarun.mobile.data.model.ActivityStatus
import com.deyarun.mobile.data.model.ActivityType
import com.deyarun.mobile.data.model.GpsPoint
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.util.*

class Converters {
    private val gson = Gson()

    @TypeConverter
    fun fromTimestamp(value: Long?): Date? {
        return value?.let { Date(it) }
    }

    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? {
        return date?.time
    }

    @TypeConverter
    fun fromActivityType(type: ActivityType): String {
        return type.name
    }

    @TypeConverter
    fun toActivityType(type: String): ActivityType {
        return ActivityType.valueOf(type)
    }

    @TypeConverter
    fun fromActivityStatus(status: ActivityStatus): String {
        return status.name
    }

    @TypeConverter
    fun toActivityStatus(status: String): ActivityStatus {
        return ActivityStatus.valueOf(status)
    }

    @TypeConverter
    fun fromGpsPointList(gpsPoints: List<GpsPoint>): String {
        return gson.toJson(gpsPoints)
    }

    @TypeConverter
    fun toGpsPointList(gpsPointsString: String): List<GpsPoint> {
        // FIX-054: Safe JSON parsing with error handling
        return try {
            if (gpsPointsString.isBlank()) return emptyList()
            val listType = object : TypeToken<List<GpsPoint>>() {}.type
            gson.fromJson(gpsPointsString, listType) ?: emptyList()
        } catch (e: Exception) {
            println("ERROR Converters: Failed to parse GPS points: ${e.message}")
            emptyList()
        }
    }
}