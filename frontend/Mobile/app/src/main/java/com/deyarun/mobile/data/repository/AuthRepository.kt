package com.deyarun.mobile.data.repository

import android.content.Context
import com.deyarun.mobile.data.api.ApiClient
import com.deyarun.mobile.data.api.AuthApi
import com.deyarun.mobile.data.api.FirebaseAuthRequest
import com.deyarun.mobile.data.model.AuthResult
import com.deyarun.mobile.data.model.LoginRequest
import com.deyarun.mobile.data.model.SignupRequest
import com.deyarun.mobile.data.model.ForgotPasswordRequest
import com.deyarun.mobile.data.storage.TokenManager
import java.io.IOException

class AuthRepository(context: Context? = null) {

    private val tokenManager = context?.let { TokenManager(it) }
    private val authApi = tokenManager?.let { ApiClient.create(it) }

    suspend fun login(loginRequest: LoginRequest): AuthResult {
        return try {
            // Use real API call
            val response = authApi?.login(loginRequest)

            if (response?.isSuccessful == true) {
                val loginResponse = response.body()

                if (loginResponse?.success == true && loginResponse.user != null && loginResponse.token != null) {
                    tokenManager?.saveToken(loginResponse.token)
                    AuthResult.Success(loginResponse.user)
                } else {
                    AuthResult.Error(loginResponse?.message ?: "Login failed")
                }
            } else {
                val errorMessage = when (response?.code()) {
                    401 -> "Invalid email or password"
                    404 -> "User not found"
                    500 -> "Server error. Please try again later"
                    else -> "Login failed. Please try again"
                }
                AuthResult.Error(errorMessage)
            }
        } catch (e: IOException) {
            AuthResult.Error("Network error. Please check your connection")
        } catch (e: Exception) {
            AuthResult.Error(e.message ?: "Unknown error occurred")
        }
    }

    suspend fun isLoggedIn(): Boolean {
        return try {
            tokenManager?.hasToken() == true
        } catch (e: Exception) {
            false
        }
    }

    suspend fun getCurrentUser(): AuthResult {
        return try {
            if (tokenManager?.hasToken() != true) {
                return AuthResult.Error("No authentication token found")
            }

            // Use real API call
            val response = authApi?.getCurrentUser()

            if (response?.isSuccessful == true) {
                val userResponse = response.body()

                if (userResponse?.success == true && userResponse.user != null) {
                    AuthResult.Success(userResponse.user)
                } else {
                    AuthResult.Error(userResponse?.message ?: "Failed to get user data")
                }
            } else {
                when (response?.code()) {
                    401, 403 -> {
                        tokenManager?.clearToken()
                        AuthResult.Error("Authentication expired. Please login again")
                    }
                    else -> AuthResult.Error("Failed to verify authentication")
                }
            }
        } catch (e: IOException) {
            AuthResult.Error("Network error. Please check your connection")
        } catch (e: Exception) {
            AuthResult.Error(e.message ?: "Unknown error occurred")
        }
    }

    suspend fun logout(): AuthResult {
        return try {
            authApi?.logout()
            tokenManager?.clearToken()
            AuthResult.Success(
                com.deyarun.mobile.data.model.User(
                    id = "",
                    email = "",
                    createdAt = "",
                    updatedAt = ""
                )
            )
        } catch (e: Exception) {
            tokenManager?.clearToken()
            AuthResult.Error("Logout completed with errors: ${e.message}")
        }
    }

    suspend fun signup(signupRequest: SignupRequest): AuthResult {
        return try {
            val response = authApi?.signup(signupRequest)

            if (response?.isSuccessful == true) {
                val signupResponse = response.body()

                if (signupResponse?.success == true && signupResponse.user != null && signupResponse.token != null) {
                    tokenManager?.saveToken(signupResponse.token)
                    AuthResult.Success(signupResponse.user)
                } else {
                    AuthResult.Error(signupResponse?.message ?: "Signup failed")
                }
            } else {
                val errorMessage = when (response?.code()) {
                    400 -> "Invalid signup data. Please check your information"
                    409 -> "User already exists with this email or username"
                    422 -> "Invalid email format or weak password"
                    500 -> "Server error. Please try again later"
                    else -> "Signup failed. Please try again"
                }
                AuthResult.Error(errorMessage)
            }
        } catch (e: IOException) {
            AuthResult.Error("Network error. Please check your connection")
        } catch (e: Exception) {
            AuthResult.Error(e.message ?: "Signup failed")
        }
    }

    /**
     * Authenticate with backend using a Firebase ID token (from Google Sign-In).
     * Backend verifies the token and returns our app JWT.
     */
    suspend fun loginWithFirebase(firebaseIdToken: String, provider: String = "google"): AuthResult {
        return try {
            val request = FirebaseAuthRequest(idToken = firebaseIdToken, provider = provider)
            val response = authApi?.firebaseAuth(request)

            if (response?.isSuccessful == true) {
                val body = response.body()
                if (body?.success == true && body.user != null && body.token != null) {
                    tokenManager?.saveToken(body.token)
                    AuthResult.Success(body.user)
                } else {
                    AuthResult.Error(body?.msg ?: body?.message ?: "Google Sign-In failed")
                }
            } else {
                val errorMessage = when (response?.code()) {
                    401 -> "Google authentication token expired. Please try again."
                    400 -> "Invalid Google token. Please try again."
                    500 -> "Server error. Please try again later."
                    else -> "Google Sign-In failed. Please try again."
                }
                AuthResult.Error(errorMessage)
            }
        } catch (e: IOException) {
            AuthResult.Error("Network error. Please check your connection.")
        } catch (e: Exception) {
            AuthResult.Error(e.message ?: "Google Sign-In failed")
        }
    }

    suspend fun forgotPassword(forgotPasswordRequest: ForgotPasswordRequest): AuthResult {
        return try {
            val response = authApi?.forgotPassword(forgotPasswordRequest)

            if (response?.isSuccessful == true) {
                val forgotPasswordResponse = response.body()

                if (forgotPasswordResponse?.success == true) {
                    AuthResult.Success(
                        com.deyarun.mobile.data.model.User(
                            id = "",
                            email = forgotPasswordRequest.email,
                            createdAt = "",
                            updatedAt = ""
                        )
                    )
                } else {
                    AuthResult.Error(forgotPasswordResponse?.message ?: "Failed to send reset email")
                }
            } else {
                val errorMessage = when (response?.code()) {
                    404 -> "No account found with this email address"
                    429 -> "Too many requests. Please wait before trying again"
                    500 -> "Server error. Please try again later"
                    else -> "Failed to send reset email. Please try again"
                }
                AuthResult.Error(errorMessage)
            }
        } catch (e: IOException) {
            AuthResult.Error("Network error. Please check your connection")
        } catch (e: Exception) {
            AuthResult.Error(e.message ?: "Failed to send reset email")
        }
    }
}