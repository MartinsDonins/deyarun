package com.deyarun.mobile.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.deyarun.mobile.data.repository.AuthRepository
import com.deyarun.mobile.data.model.User
import com.deyarun.mobile.data.model.LoginRequest
import com.deyarun.mobile.data.model.SignupRequest
import com.deyarun.mobile.data.model.ForgotPasswordRequest
import com.deyarun.mobile.data.model.AuthResult

data class AuthState(
    val isAuthenticated: Boolean = false,
    val user: User? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

class AuthViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _authState = MutableStateFlow(AuthState())
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    init {
        checkAuthStatus()
    }

    fun checkAuthStatus() {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)

            try {
                // First check if we have a token stored locally
                val result = authRepository.getCurrentUser()
                when (result) {
                    is AuthResult.Success -> {
                        _authState.value = _authState.value.copy(
                            isAuthenticated = true,
                            user = result.user,
                            isLoading = false,
                            error = null
                        )
                    }
                    is AuthResult.Error -> {
                        _authState.value = _authState.value.copy(
                            isAuthenticated = false,
                            user = null,
                            isLoading = false,
                            error = null // Don't show error on startup - user just needs to login
                        )
                    }
                }
            } catch (e: Exception) {
                _authState.value = _authState.value.copy(
                    isAuthenticated = false,
                    user = null,
                    isLoading = false,
                    error = null // Don't show error on startup
                )
            }
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)

            try {
                val loginRequest = LoginRequest(email, password)
                val result = authRepository.login(loginRequest)

                when (result) {
                    is AuthResult.Success -> {
                        _authState.value = _authState.value.copy(
                            isAuthenticated = true,
                            user = result.user,
                            isLoading = false
                        )
                    }
                    is AuthResult.Error -> {
                        _authState.value = _authState.value.copy(
                            isAuthenticated = false,
                            user = null,
                            isLoading = false,
                            error = result.message
                        )
                    }
                }
            } catch (e: Exception) {
                _authState.value = _authState.value.copy(
                    isAuthenticated = false,
                    user = null,
                    isLoading = false,
                    error = e.message ?: "Login failed"
                )
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            try {
                authRepository.logout()
                _authState.value = AuthState()
            } catch (e: Exception) {
                // Even if logout fails, clear local auth state
                _authState.value = AuthState(error = "Logout failed: ${e.message}")
            }
        }
    }

    fun clearError() {
        _authState.value = _authState.value.copy(error = null)
    }

    fun setError(message: String) {
        _authState.value = _authState.value.copy(isLoading = false, error = message)
    }

    fun signup(firstName: String, lastName: String, username: String, email: String, password: String) {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)

            try {
                val signupRequest = SignupRequest(firstName, lastName, username, email, password)
                val result = authRepository.signup(signupRequest)

                when (result) {
                    is AuthResult.Success -> {
                        _authState.value = _authState.value.copy(
                            isAuthenticated = true,
                            user = result.user,
                            isLoading = false
                        )
                    }
                    is AuthResult.Error -> {
                        _authState.value = _authState.value.copy(
                            isAuthenticated = false,
                            user = null,
                            isLoading = false,
                            error = result.message
                        )
                    }
                }
            } catch (e: Exception) {
                _authState.value = _authState.value.copy(
                    isAuthenticated = false,
                    user = null,
                    isLoading = false,
                    error = e.message ?: "Signup failed"
                )
            }
        }
    }

    /**
     * Called after GoogleAuthManager.handleSignInResult() returns a Firebase ID token.
     * Sends the token to backend POST /api/auth/firebase → receives app JWT.
     */
    fun loginWithFirebaseToken(firebaseIdToken: String) {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)

            try {
                val result = authRepository.loginWithFirebase(firebaseIdToken, provider = "google")

                when (result) {
                    is AuthResult.Success -> {
                        _authState.value = _authState.value.copy(
                            isAuthenticated = true,
                            user = result.user,
                            isLoading = false,
                            error = null
                        )
                    }
                    is AuthResult.Error -> {
                        _authState.value = _authState.value.copy(
                            isAuthenticated = false,
                            user = null,
                            isLoading = false,
                            error = result.message
                        )
                    }
                }
            } catch (e: Exception) {
                _authState.value = _authState.value.copy(
                    isAuthenticated = false,
                    user = null,
                    isLoading = false,
                    error = e.message ?: "Google Sign-In failed"
                )
            }
        }
    }

    fun forgotPassword(email: String) {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)

            try {
                val forgotPasswordRequest = ForgotPasswordRequest(email)
                val result = authRepository.forgotPassword(forgotPasswordRequest)

                when (result) {
                    is AuthResult.Success -> {
                        _authState.value = _authState.value.copy(
                            isLoading = false,
                            error = null
                        )
                    }
                    is AuthResult.Error -> {
                        _authState.value = _authState.value.copy(
                            isLoading = false,
                            error = result.message
                        )
                    }
                }
            } catch (e: Exception) {
                _authState.value = _authState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to send reset email"
                )
            }
        }
    }
}