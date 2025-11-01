package com.deyarun.mobile.data.api

import retrofit2.Response
import retrofit2.http.*
import com.deyarun.mobile.data.model.User
import com.deyarun.mobile.data.model.LoginRequest
import com.deyarun.mobile.data.model.SignupRequest
import com.deyarun.mobile.data.model.ForgotPasswordRequest
import com.deyarun.mobile.data.model.ApiResponse

data class LoginResponse(
    val success: Boolean,
    val message: String,
    val user: User? = null,
    val token: String? = null
)

data class UserResponse(
    val success: Boolean,
    val message: String,
    val user: User? = null
)

interface AuthApi {

    @POST("api/auth/login")
    suspend fun login(@Body loginRequest: LoginRequest): Response<LoginResponse>

    @GET("api/auth/me")
    suspend fun getCurrentUser(): Response<UserResponse>

    @POST("api/auth/logout")
    suspend fun logout(): Response<Unit>

    @POST("api/auth/signup")
    suspend fun signup(@Body signupRequest: SignupRequest): Response<LoginResponse>

    @POST("api/auth/forgot-password")
    suspend fun forgotPassword(@Body forgotPasswordRequest: ForgotPasswordRequest): Response<ApiResponse>
}