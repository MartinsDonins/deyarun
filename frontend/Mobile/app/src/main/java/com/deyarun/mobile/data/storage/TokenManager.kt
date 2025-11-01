package com.deyarun.mobile.data.storage

import android.content.Context
import android.util.Base64
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import org.json.JSONObject

private val Context.dataStore by preferencesDataStore("auth_prefs")

class TokenManager(private val context: Context) {

    private val tokenKey = stringPreferencesKey("auth_token")

    suspend fun saveToken(token: String) {
        context.dataStore.edit { preferences ->
            preferences[tokenKey] = token
        }
    }

    suspend fun getToken(): String? {
        return try {
            context.dataStore.data.map { preferences ->
                preferences[tokenKey]
            }.firstOrNull()
        } catch (e: Exception) {
            null
        }
    }

    suspend fun clearToken() {
        context.dataStore.edit { preferences ->
            preferences.remove(tokenKey)
        }
    }

    suspend fun hasToken(): Boolean {
        return try {
            getToken() != null
        } catch (e: Exception) {
            false
        }
    }

    /**
     * FIX-052.2: Synchronous token getter to prevent runBlocking on main thread
     * Used by API interceptors that can't suspend
     */
    fun getTokenSync(): String? {
        return try {
            // Read directly from SharedPreferences (synchronous operation)
            val sharedPreferences = context.getSharedPreferences("auth_prefs_sync", Context.MODE_PRIVATE)
            sharedPreferences.getString("auth_token_sync", null)
        } catch (e: Exception) {
            println("ERROR TokenManager: Failed to get token sync: ${e.message}")
            null
        }
    }

    /**
     * FIX-052.2: Save token to both DataStore (async) and SharedPreferences (sync)
     * This allows both suspend and non-suspend access
     */
    suspend fun saveTokenWithSync(token: String) {
        // Save to DataStore (async)
        saveToken(token)

        // Save to SharedPreferences (sync) for interceptors
        try {
            val sharedPreferences = context.getSharedPreferences("auth_prefs_sync", Context.MODE_PRIVATE)
            sharedPreferences.edit()
                .putString("auth_token_sync", token)
                .apply()
        } catch (e: Exception) {
            println("ERROR TokenManager: Failed to save token sync: ${e.message}")
        }
    }

    /**
     * Extract userId from JWT token payload
     * Returns null if token is invalid or userId not found
     */
    suspend fun getUserIdFromToken(): String? {
        return try {
            val token = getToken() ?: return null

            // JWT format: header.payload.signature
            val parts = token.split(".")
            if (parts.size != 3) {
                println("DEBUG TokenManager: Invalid JWT format (${parts.size} parts)")
                return null
            }

            // Decode payload (second part)
            val payload = parts[1]
            val decodedBytes = Base64.decode(payload, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
            val decodedString = String(decodedBytes)

            println("DEBUG TokenManager: JWT payload decoded: $decodedString")

            // Parse JSON and extract userId
            val json = JSONObject(decodedString)
            val userId = json.optString("userId", null)

            if (userId != null) {
                println("DEBUG TokenManager: Extracted userId from JWT: $userId")
            } else {
                println("DEBUG TokenManager: No userId found in JWT payload")
            }

            userId
        } catch (e: Exception) {
            println("ERROR TokenManager: Failed to decode JWT: ${e.message}")
            e.printStackTrace()
            null
        }
    }
}