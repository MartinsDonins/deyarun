package com.deyarun.mobile.data.api

import com.deyarun.mobile.data.model.*
import retrofit2.Response
import retrofit2.http.*

/**
 * Google Fit Backend API service
 * All Google Fit operations go through our backend for OAuth security
 */
interface GoogleFitApiService {

    /**
     * Get Google Fit authorization URL
     */
    @GET("google-fit/auth-url")
    suspend fun getAuthUrl(
        @Header("Authorization") authorization: String
    ): Response<GoogleFitAuthUrlResponse>

    /**
     * Handle OAuth callback - exchange code for tokens
     */
    @POST("google-fit/callback")
    suspend fun handleCallback(
        @Header("Authorization") authorization: String,
        @Body request: GoogleFitCallbackRequest
    ): Response<GoogleFitCallbackResponse>

    /**
     * Get Google Fit connection status
     */
    @GET("google-fit/status")
    suspend fun getStatus(
        @Header("Authorization") authorization: String
    ): Response<GoogleFitStatusResponse>

    /**
     * Disconnect Google Fit
     */
    @DELETE("google-fit/disconnect")
    suspend fun disconnect(
        @Header("Authorization") authorization: String
    ): Response<GoogleFitDisconnectResponse>

    /**
     * Get fitness data for date range
     */
    @GET("google-fit/data")
    suspend fun getFitnessData(
        @Header("Authorization") authorization: String,
        @Query("startDate") startDate: String,
        @Query("endDate") endDate: String,
        @Query("dataTypes") dataTypes: String? = null
    ): Response<GoogleFitDataResponse>

    /**
     * Sync Google Fit activities to DeyaRun workouts
     */
    @POST("google-fit/sync")
    suspend fun syncActivities(
        @Header("Authorization") authorization: String,
        @Body request: GoogleFitSyncRequest
    ): Response<GoogleFitSyncResult>
}

/**
 * Google Fit callback request
 */
data class GoogleFitCallbackRequest(
    val code: String
)

/**
 * Google Fit sync request
 */
data class GoogleFitSyncRequest(
    val startDate: String,
    val endDate: String,
    val activityTypes: List<String> = emptyList()
)
