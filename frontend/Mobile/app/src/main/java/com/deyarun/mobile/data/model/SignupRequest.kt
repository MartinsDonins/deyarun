package com.deyarun.mobile.data.model

import kotlinx.serialization.Serializable

@Serializable
data class SignupRequest(
    val firstName: String,
    val lastName: String,
    val username: String,
    val email: String,
    val password: String
)