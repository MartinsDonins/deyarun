package com.deyarun.mobile.data.api

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import com.deyarun.mobile.data.storage.TokenManager
// FIX-052.4: Removed runBlocking - using cached token approach instead

class AuthInterceptor(private val tokenManager: TokenManager) : Interceptor {
    // FIX-052.4: Cache token to avoid blocking main thread
    // Token will be refreshed periodically by TokenManager
    private var cachedToken: String? = null

    // Method to update cached token (called by TokenManager when token changes)
    fun updateCachedToken(token: String?) {
        cachedToken = token
    }

    override fun intercept(chain: Interceptor.Chain): okhttp3.Response {
        val originalRequest = chain.request()

        // FIX-052.4: Use cached token instead of runBlocking
        // This prevents ANR on main thread
        val newRequest = if (cachedToken != null) {
            originalRequest.newBuilder()
                .addHeader("Authorization", "Bearer $cachedToken")
                .build()
        } else {
            originalRequest
        }

        return chain.proceed(newRequest)
    }
}

object ApiClient {
    private const val BASE_URL = "https://api.deyarun.com/"

    private fun createOkHttpClient(tokenManager: TokenManager): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val authInterceptor = AuthInterceptor(tokenManager)

        return OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .addInterceptor(authInterceptor)
            .build()
    }

    private fun createRetrofit(tokenManager: TokenManager): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(createOkHttpClient(tokenManager))
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    fun create(tokenManager: TokenManager): AuthApi {
        return createRetrofit(tokenManager).create(AuthApi::class.java)
    }

    fun createWorkoutApi(tokenManager: TokenManager): WorkoutApiService {
        return createRetrofit(tokenManager).create(WorkoutApiService::class.java)
    }

    fun createGdprApi(tokenManager: TokenManager): GdprApiService {
        return createRetrofit(tokenManager).create(GdprApiService::class.java)
    }
}