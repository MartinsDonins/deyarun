package com.deyarun.mobile.utils

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.os.Looper
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.*
import com.deyarun.mobile.data.model.GpsPoint
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.util.*

class LocationManager(private val context: Context) {
    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    private val locationRequest = LocationRequest.Builder(
        Priority.PRIORITY_HIGH_ACCURACY,
        2000L // Update interval: 2 seconds
    ).apply {
        setMinUpdateIntervalMillis(1000L) // Fastest interval: 1 second
        setMaxUpdateDelayMillis(5000L) // Max delay: 5 seconds
    }.build()

    fun hasLocationPermission(): Boolean {
        return ActivityCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED &&
        ActivityCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun getLocationUpdates(): Flow<GpsPoint> = callbackFlow {
        if (!hasLocationPermission()) {
            close(Exception("Location permission not granted"))
            return@callbackFlow
        }

        val locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                super.onLocationResult(result)
                result.locations.forEach { location ->
                    val gpsPoint = GpsPoint(
                        latitude = location.latitude,
                        longitude = location.longitude,
                        altitude = location.altitude,
                        accuracy = location.accuracy,
                        timestamp = Date(location.time),
                        speed = location.speed
                    )
                    trySend(gpsPoint)
                }
            }
        }

        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
            )
        } catch (e: SecurityException) {
            close(e)
        }

        awaitClose {
            fusedLocationClient.removeLocationUpdates(locationCallback)
        }
    }

    suspend fun getCurrentLocation(): GpsPoint? {
        if (!hasLocationPermission()) {
            return null
        }

        return try {
            val location = fusedLocationClient.lastLocation.result
            location?.let {
                GpsPoint(
                    latitude = it.latitude,
                    longitude = it.longitude,
                    altitude = it.altitude,
                    accuracy = it.accuracy,
                    timestamp = Date(it.time),
                    speed = it.speed
                )
            }
        } catch (e: SecurityException) {
            null
        }
    }

    fun calculateDistance(point1: GpsPoint, point2: GpsPoint): Double {
        val results = FloatArray(1)
        Location.distanceBetween(
            point1.latitude, point1.longitude,
            point2.latitude, point2.longitude,
            results
        )
        return results[0].toDouble()
    }

    fun calculateSpeed(distance: Double, timeMillis: Long): Double {
        // Returns speed in m/s
        if (timeMillis <= 0) return 0.0
        return distance / (timeMillis / 1000.0)
    }

    fun calculatePace(distance: Double, timeMillis: Long): Double {
        // Returns pace in seconds per kilometer
        if (distance <= 0) return 0.0
        val distanceKm = distance / 1000.0
        val timeSeconds = timeMillis / 1000.0
        return timeSeconds / distanceKm
    }
}