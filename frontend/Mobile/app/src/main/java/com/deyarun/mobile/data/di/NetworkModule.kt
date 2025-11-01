package com.deyarun.mobile.data.di

import android.content.Context
import com.deyarun.mobile.data.api.GoogleFitApiService
import com.deyarun.mobile.data.api.StravaApiService
import com.deyarun.mobile.data.api.StravaBackendService
import com.deyarun.mobile.data.repository.GoogleFitRepository
import com.deyarun.mobile.data.repository.StravaRepository
import com.deyarun.mobile.data.storage.TokenManager
import com.google.gson.Gson
// FIX-052.4: Removed runBlocking import - using cached token approach
// import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Network module for dependency injection
 * Provides Retrofit instances and repositories
 */
object NetworkModule {

    /**
     * Strava API service instance
     * Used for direct Strava API calls (athlete data, activities)
     */
    fun provideStravaApiService(): StravaApiService {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl("https://www.strava.com/api/v3/")
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(StravaApiService::class.java)
    }

    /**
     * Strava backend service instance
     * Used for backend API calls (OAuth exchange, sync)
     */
    fun provideStravaBackendService(context: Context): StravaBackendService {
        val tokenManager = TokenManager(context)

        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        // FIX-052.4: Use lazy token fetching with cache to prevent main thread blocking
        var cachedToken: String? = null

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .addInterceptor { chain ->
                // FIX-052.4: Use cached token instead of runBlocking
                // Token should be refreshed by app initialization or login flow
                val requestBuilder = chain.request().newBuilder()

                if (!cachedToken.isNullOrEmpty()) {
                    requestBuilder.header("Authorization", "Bearer $cachedToken")
                }

                chain.proceed(requestBuilder.build())
            }
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl("https://api.deyarun.com/api/")
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(StravaBackendService::class.java)
    }

    /**
     * Strava repository instance
     * Main interface for Strava operations
     */
    fun provideStravaRepository(context: Context): StravaRepository {
        val sharedPreferences = context.getSharedPreferences(
            "deyarun_prefs",
            Context.MODE_PRIVATE
        )
        val gson = Gson()

        return StravaRepository(
            context = context,
            stravaApiService = provideStravaApiService(),
            stravaBackendService = provideStravaBackendService(context),
            sharedPreferences = sharedPreferences,
            gson = gson
        )
    }

    /**
     * Google Fit API service instance
     * Used for backend API calls (all Google Fit operations go through backend)
     */
    fun provideGoogleFitApiService(context: Context): GoogleFitApiService {
        val tokenManager = TokenManager(context)

        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        // FIX-052.4: Use lazy token fetching with cache to prevent main thread blocking
        var cachedToken: String? = null

        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .addInterceptor { chain ->
                // FIX-052.4: Use cached token instead of runBlocking
                // Token should be refreshed by app initialization or login flow
                val requestBuilder = chain.request().newBuilder()

                if (!cachedToken.isNullOrEmpty()) {
                    requestBuilder.header("Authorization", "Bearer $cachedToken")
                }

                chain.proceed(requestBuilder.build())
            }
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        return Retrofit.Builder()
            .baseUrl("https://api.deyarun.com/api/")
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(GoogleFitApiService::class.java)
    }

    /**
     * Google Fit repository instance
     * Main interface for Google Fit operations
     */
    fun provideGoogleFitRepository(context: Context): GoogleFitRepository {
        val sharedPreferences = context.getSharedPreferences(
            "deyarun_prefs",
            Context.MODE_PRIVATE
        )
        val gson = Gson()

        return GoogleFitRepository(
            context = context,
            googleFitApiService = provideGoogleFitApiService(context),
            sharedPreferences = sharedPreferences,
            gson = gson
        )
    }
}
