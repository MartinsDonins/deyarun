package com.deyarun.mobile.data.model

import kotlinx.serialization.Serializable

@Serializable
data class ApiResponse(
    val success: Boolean,
    val message: String,
    val data: String? = null
)