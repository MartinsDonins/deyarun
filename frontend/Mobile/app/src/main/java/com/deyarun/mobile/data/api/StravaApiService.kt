package com.deyarun.mobile.data.api

import com.deyarun.mobile.data.model.*
import retrofit2.Response
import retrofit2.http.*

/**
 * Strava API service interface for direct Strava API calls
 */
interface StravaApiService {

    /**
     * Get current athlete info
     */
    @GET("athlete")
    suspend fun getAthlete(
        @Header("Authorization") authorization: String
    ): Response<StravaAthlete>

    /**
     * Get athlete activities
     */
    @GET("athlete/activities")
    suspend fun getActivities(
        @Header("Authorization") authorization: String,
        @Query("per_page") perPage: Int = 30,
        @Query("page") page: Int = 1
    ): Response<List<StravaActivity>>

    /**
     * Upload new activity to Strava
     */
    @POST("activities")
    suspend fun uploadActivity(
        @Header("Authorization") authorization: String,
        @Body activity: StravaUploadRequest
    ): Response<StravaUploadResult>
}

/**
 * Backend API service for Strava operations that require client secret
 */
interface StravaBackendService {

    /**
     * Get OAuth authorization URL from backend
     */
    @GET("strava/auth")
    suspend fun getAuthUrl(
        @Header("Authorization") authorization: String
    ): Response<StravaAuthUrlResponse>

    /**
     * Get Strava connection status
     */
    @GET("strava/status")
    suspend fun getConnectionStatus(
        @Header("Authorization") authorization: String
    ): Response<StravaConnectionStatus>

    /**
     * Exchange OAuth code for tokens via backend (deprecated - backend handles this automatically)
     */
    @POST("strava/oauth/token")
    suspend fun exchangeCodeForTokens(
        @Header("Authorization") authorization: String,
        @Body request: StravaTokenRequest
    ): Response<StravaTokens>

    /**
     * Refresh tokens via backend
     */
    @POST("strava/oauth/refresh")
    suspend fun refreshTokens(
        @Header("Authorization") authorization: String,
        @Body request: StravaRefreshRequest
    ): Response<StravaTokens>

    /**
     * Trigger manual sync via backend
     */
    @POST("strava/sync/manual")
    suspend fun triggerManualSync(
        @Header("Authorization") authorization: String,
        @Body options: StravaSyncOptions
    ): Response<StravaSyncResult>

    /**
     * Get sync status from backend
     */
    @GET("strava/sync/stats")
    suspend fun getSyncStatus(
        @Header("Authorization") authorization: String
    ): Response<StravaSyncStatus>

    /**
     * Get activities via backend proxy (backend manages tokens)
     */
    @GET("strava/activities")
    suspend fun getActivities(
        @Header("Authorization") authorization: String,
        @Query("per_page") perPage: Int = 30,
        @Query("page") page: Int = 1
    ): Response<StravaActivitiesResponse>
}