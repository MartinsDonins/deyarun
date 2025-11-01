package com.deyarun.mobile.utils

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Permission types that the app requires
 */
enum class AppPermission(
    val permission: String,
    val title: String,
    val description: String,
    val isRequired: Boolean = true,
    val icon: String = "🔒"
) {
    LOCATION_FINE(
        Manifest.permission.ACCESS_FINE_LOCATION,
        "Precīza atrašanās vieta",
        "Nepieciešama GPS treniņu ierakstīšanai un maršrutu sekošanai",
        true,
        "📍"
    ),
    LOCATION_COARSE(
        Manifest.permission.ACCESS_COARSE_LOCATION,
        "Aptuvena atrašanās vieta",
        "Papildu atbalsts atrašanās vietas noteikšanai",
        true,
        "📍"
    ),
    CAMERA(
        Manifest.permission.CAMERA,
        "Kamera",
        "Profila attēlu uzņemšanai un aktivitāšu fotogrāfiju pievienošanai",
        false,
        "📷"
    ),
    STORAGE_READ(
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            Manifest.permission.READ_MEDIA_IMAGES
        } else {
            Manifest.permission.READ_EXTERNAL_STORAGE
        },
        "Attēlu lasīšana",
        "Profila attēlu izvēlei no galerijas",
        false,
        "🖼️"
    ),
    NOTIFICATION(
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            Manifest.permission.POST_NOTIFICATIONS
        } else {
            ""
        },
        "Paziņojumi",
        "Treniņu atgādinājumi un aktivitāšu paziņojumi",
        false,
        "🔔"
    ),
    ACTIVITY_RECOGNITION(
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            Manifest.permission.ACTIVITY_RECOGNITION
        } else {
            ""
        },
        "Aktivitāšu atpazīšana",
        "Automātiska treniņu veida noteikšana",
        false,
        "🏃"
    )
}

/**
 * Permission status data class
 */
data class PermissionStatus(
    val permission: AppPermission,
    val isGranted: Boolean,
    val shouldShowRationale: Boolean = false,
    val isPermanentlyDenied: Boolean = false
)

/**
 * Permission summary data class
 */
data class PermissionSummary(
    val totalPermissions: Int,
    val grantedPermissions: Int,
    val requiredPermissions: Int,
    val grantedRequiredPermissions: Int,
    val allRequiredGranted: Boolean
)

class PermissionManager(private val context: Context) {

    companion object {
        val CAMERA_PERMISSIONS = arrayOf(
            Manifest.permission.CAMERA
        )

        val MEDIA_PERMISSIONS = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(Manifest.permission.READ_MEDIA_IMAGES)
        } else {
            arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        }

        val LOCATION_PERMISSIONS = arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )

        val ALL_MEDIA_PERMISSIONS = CAMERA_PERMISSIONS + MEDIA_PERMISSIONS
    }

    private val _permissionStates = MutableStateFlow<Map<AppPermission, PermissionStatus>>(emptyMap())
    val permissionStates: StateFlow<Map<AppPermission, PermissionStatus>> = _permissionStates.asStateFlow()

    private var permissionCallback: ((Boolean) -> Unit)? = null

    // Lazy initialization to avoid lifecycle issues
    private var permissionLauncher: ActivityResultLauncher<Array<String>>? = null

    private fun getPermissionLauncher(activity: ComponentActivity): ActivityResultLauncher<Array<String>> {
        if (permissionLauncher == null) {
            try {
                permissionLauncher = activity.registerForActivityResult(
                    ActivityResultContracts.RequestMultiplePermissions()
                ) { permissions ->
                    val allGranted = permissions.values.all { it }
                    permissionCallback?.invoke(allGranted)
                }
            } catch (e: IllegalStateException) {
                // If registration fails, return null and handle gracefully
                android.util.Log.e("PermissionManager", "Failed to register for activity result: ${e.message}")
            }
        }
        return permissionLauncher!!
    }

    fun hasPermissions(permissions: Array<String>): Boolean {
        return permissions.all { permission ->
            ContextCompat.checkSelfPermission(
                context,
                permission
            ) == PackageManager.PERMISSION_GRANTED
        }
    }

    fun hasCameraPermission(): Boolean {
        return hasPermissions(CAMERA_PERMISSIONS)
    }

    fun hasMediaPermissions(): Boolean {
        return hasPermissions(MEDIA_PERMISSIONS)
    }

    fun hasAllMediaPermissions(): Boolean {
        return hasPermissions(ALL_MEDIA_PERMISSIONS)
    }

    fun hasLocationPermissions(): Boolean {
        return hasPermissions(LOCATION_PERMISSIONS)
    }

    fun requestPermissions(
        activity: ComponentActivity,
        permissions: Array<String>,
        callback: (Boolean) -> Unit
    ) {
        if (hasPermissions(permissions)) {
            callback(true)
            return
        }

        try {
            permissionCallback = callback
            val launcher = getPermissionLauncher(activity)
            launcher.launch(permissions)
        } catch (e: Exception) {
            android.util.Log.e("PermissionManager", "Failed to request permissions: ${e.message}")
            // Fallback: just check current permissions
            callback(hasPermissions(permissions))
        }
    }

    fun requestCameraPermissions(activity: ComponentActivity, callback: (Boolean) -> Unit) {
        requestPermissions(activity, CAMERA_PERMISSIONS, callback)
    }

    fun requestMediaPermissions(activity: ComponentActivity, callback: (Boolean) -> Unit) {
        requestPermissions(activity, MEDIA_PERMISSIONS, callback)
    }

    fun requestAllMediaPermissions(activity: ComponentActivity, callback: (Boolean) -> Unit) {
        requestPermissions(activity, ALL_MEDIA_PERMISSIONS, callback)
    }

    fun requestLocationPermissions(activity: ComponentActivity, callback: (Boolean) -> Unit) {
        requestPermissions(activity, LOCATION_PERMISSIONS, callback)
    }

    fun shouldShowRationale(activity: ComponentActivity, permission: String): Boolean {
        return ActivityCompat.shouldShowRequestPermissionRationale(activity, permission)
    }

    fun shouldShowMediaRationale(activity: ComponentActivity): Boolean {
        return MEDIA_PERMISSIONS.any { shouldShowRationale(activity, it) }
    }

    fun shouldShowCameraRationale(activity: ComponentActivity): Boolean {
        return CAMERA_PERMISSIONS.any { shouldShowRationale(activity, it) }
    }

    fun shouldShowLocationRationale(activity: ComponentActivity): Boolean {
        return LOCATION_PERMISSIONS.any { shouldShowRationale(activity, it) }
    }

    // New enhanced permission management functions

    /**
     * Initialize and check all permissions
     */
    fun initializePermissions() {
        checkAllPermissions()
    }

    /**
     * Check all permissions and update states
     */
    fun checkAllPermissions() {
        val currentStates = mutableMapOf<AppPermission, PermissionStatus>()

        AppPermission.values().forEach { appPermission ->
            // Skip empty permissions (for older Android versions)
            if (appPermission.permission.isNotEmpty()) {
                val status = getPermissionStatus(appPermission)
                currentStates[appPermission] = status
            }
        }

        _permissionStates.value = currentStates
    }

    /**
     * Get status for a specific permission
     */
    private fun getPermissionStatus(appPermission: AppPermission): PermissionStatus {
        val isGranted = ContextCompat.checkSelfPermission(
            context,
            appPermission.permission
        ) == PackageManager.PERMISSION_GRANTED

        // For checking rationale, we need activity context
        val shouldShowRationale = false // Will be updated when activity is available

        // Check if permission is permanently denied
        val isPermanentlyDenied = !isGranted && !shouldShowRationale &&
                hasPermissionBeenRequested(appPermission.permission)

        return PermissionStatus(
            permission = appPermission,
            isGranted = isGranted,
            shouldShowRationale = shouldShowRationale,
            isPermanentlyDenied = isPermanentlyDenied
        )
    }

    /**
     * Check if permission has been requested before
     */
    private fun hasPermissionBeenRequested(permission: String): Boolean {
        val prefs = context.getSharedPreferences("permission_prefs", Context.MODE_PRIVATE)
        return prefs.getBoolean("requested_$permission", false)
    }

    /**
     * Mark permission as requested
     */
    private fun markPermissionAsRequested(permission: String) {
        val prefs = context.getSharedPreferences("permission_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("requested_$permission", true).apply()
    }

    /**
     * Request specific app permissions
     */
    fun requestAppPermissions(
        activity: ComponentActivity,
        permissions: List<AppPermission>,
        callback: (Boolean) -> Unit
    ) {
        val permissionsToRequest = permissions
            .filter { it.permission.isNotEmpty() }
            .map { it.permission }
            .filter { permission ->
                ContextCompat.checkSelfPermission(context, permission) != PackageManager.PERMISSION_GRANTED
            }

        if (permissionsToRequest.isEmpty()) {
            callback(true)
            return
        }

        // Mark permissions as requested
        permissionsToRequest.forEach { markPermissionAsRequested(it) }

        requestPermissions(activity, permissionsToRequest.toTypedArray(), callback)
    }

    /**
     * Request single app permission
     */
    fun requestAppPermission(
        activity: ComponentActivity,
        permission: AppPermission,
        callback: (Boolean) -> Unit
    ) {
        requestAppPermissions(activity, listOf(permission), callback)
    }

    /**
     * Request all required permissions
     */
    fun requestRequiredPermissions(
        activity: ComponentActivity,
        callback: (Boolean) -> Unit
    ) {
        val requiredPermissions = AppPermission.values().filter { it.isRequired }
        requestAppPermissions(activity, requiredPermissions, callback)
    }

    /**
     * Open app settings for manual permission management
     */
    fun openAppSettings() {
        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = Uri.fromParts("package", context.packageName, null)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }

    /**
     * Check if all required permissions are granted
     */
    fun areRequiredPermissionsGranted(): Boolean {
        return AppPermission.values()
            .filter { it.isRequired && it.permission.isNotEmpty() }
            .all { permission ->
                ContextCompat.checkSelfPermission(
                    context,
                    permission.permission
                ) == PackageManager.PERMISSION_GRANTED
            }
    }

    /**
     * Get missing required permissions
     */
    fun getMissingRequiredPermissions(): List<AppPermission> {
        return AppPermission.values()
            .filter { it.isRequired && it.permission.isNotEmpty() }
            .filter { permission ->
                ContextCompat.checkSelfPermission(
                    context,
                    permission.permission
                ) != PackageManager.PERMISSION_GRANTED
            }
    }

    /**
     * Get permission status summary
     */
    fun getPermissionSummary(): PermissionSummary {
        val states = _permissionStates.value
        val totalPermissions = states.size
        val grantedPermissions = states.values.count { it.isGranted }
        val requiredPermissions = states.values.filter { it.permission.isRequired }
        val grantedRequiredPermissions = requiredPermissions.count { it.isGranted }

        return PermissionSummary(
            totalPermissions = totalPermissions,
            grantedPermissions = grantedPermissions,
            requiredPermissions = requiredPermissions.size,
            grantedRequiredPermissions = grantedRequiredPermissions,
            allRequiredGranted = grantedRequiredPermissions == requiredPermissions.size
        )
    }

    /**
     * Get specific permission status
     */
    fun getAppPermissionStatus(permission: AppPermission): PermissionStatus? {
        return _permissionStates.value[permission]
    }

    /**
     * Check if specific app permission is granted
     */
    fun isAppPermissionGranted(permission: AppPermission): Boolean {
        return if (permission.permission.isNotEmpty()) {
            ContextCompat.checkSelfPermission(
                context,
                permission.permission
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true // Permission not applicable for this Android version
        }
    }

    /**
     * Get permissions by type
     */
    fun getRequiredPermissions(): List<AppPermission> {
        return AppPermission.values().filter { it.isRequired }
    }

    fun getOptionalPermissions(): List<AppPermission> {
        return AppPermission.values().filter { !it.isRequired }
    }
}