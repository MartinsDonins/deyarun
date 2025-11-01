package com.deyarun.mobile.data.sync

import android.content.Context
import android.util.Log
import androidx.work.*
import com.deyarun.mobile.data.di.NetworkModule
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

/**
 * Background worker for periodic Strava activity sync
 * Runs every 6 hours to sync activities bidirectionally
 */
class StravaSyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Starting Strava periodic sync")

            val stravaRepository = NetworkModule.provideStravaRepository(applicationContext)

            // Check if user is connected to Strava
            if (!stravaRepository.isConnected()) {
                Log.d(TAG, "User not connected to Strava, skipping sync")
                return@withContext Result.success()
            }

            // Trigger manual sync with auto-create workouts enabled
            val syncResult = stravaRepository.syncActivities(autoCreateWorkouts = true)

            if (syncResult.isSuccess) {
                val result = syncResult.getOrNull()
                if (result?.success == true) {
                    Log.d(TAG, "Sync completed successfully: synced ${result.syncedCount} activities")
                    Result.success()
                } else {
                    Log.w(TAG, "Sync failed: ${result?.error}")
                    Result.retry()
                }
            } else {
                Log.e(TAG, "Sync exception: ${syncResult.exceptionOrNull()?.message}")
                Result.retry()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Unexpected error during sync", e)
            Result.failure()
        }
    }

    companion object {
        private const val TAG = "StravaSyncWorker"
        private const val WORK_NAME = "strava_periodic_sync"

        /**
         * Schedule periodic Strava sync (every 6 hours)
         * Only runs when:
         * - Network is connected
         * - Battery is not low
         */
        fun schedule(context: Context) {
            Log.d(TAG, "Scheduling periodic Strava sync")

            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build()

            val syncRequest = PeriodicWorkRequestBuilder<StravaSyncWorker>(
                repeatInterval = 6,
                repeatIntervalTimeUnit = TimeUnit.HOURS
            )
                .setConstraints(constraints)
                .setBackoffCriteria(
                    BackoffPolicy.EXPONENTIAL,
                    WorkRequest.MIN_BACKOFF_MILLIS,
                    TimeUnit.MILLISECONDS
                )
                .addTag("strava_sync")
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP, // Keep existing if already scheduled
                syncRequest
            )

            Log.d(TAG, "Periodic sync scheduled successfully")
        }

        /**
         * Cancel periodic sync (e.g., when user disconnects)
         */
        fun cancel(context: Context) {
            Log.d(TAG, "Cancelling periodic Strava sync")
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }

        /**
         * Trigger immediate one-time sync (for manual sync button)
         */
        fun triggerImmediateSync(context: Context) {
            Log.d(TAG, "Triggering immediate Strava sync")

            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val syncRequest = OneTimeWorkRequestBuilder<StravaSyncWorker>()
                .setConstraints(constraints)
                .addTag("strava_sync_manual")
                .build()

            WorkManager.getInstance(context).enqueue(syncRequest)
        }
    }
}
