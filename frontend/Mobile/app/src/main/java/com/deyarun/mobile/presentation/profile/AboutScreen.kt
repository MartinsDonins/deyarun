package com.deyarun.mobile.presentation.profile

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.os.Build
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.deyarun.mobile.presentation.theme.DeyaRunColors
import com.deyarun.mobile.data.sync.ActivitySyncManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.compose.runtime.rememberCoroutineScope
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * About Screen - Displays app version and debug information
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AboutScreen(
    onBackClick: () -> Unit,
    activitySyncManager: ActivitySyncManager? = null
) {
    val context = LocalContext.current
    var showCopiedSnackbar by remember { mutableStateOf(false) }
    var syncErrors by remember { mutableStateOf<List<ActivitySyncManager.SyncError>>(emptyList()) }
    var autoRefresh by remember { mutableStateOf(true) }

    // Auto-refresh sync errors every 5 seconds
    LaunchedEffect(autoRefresh) {
        while (autoRefresh) {
            activitySyncManager?.let {
                syncErrors = it.getSyncErrorLog()
            }
            delay(5000) // 5 seconds
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Par aplikāciju") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        snackbarHost = {
            if (showCopiedSnackbar) {
                Snackbar(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text("Nokopēts starpliktuvē")
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // App Icon and Name
            Icon(
                imageVector = Icons.Default.PlayArrow,
                contentDescription = "App Icon",
                modifier = Modifier.size(80.dp),
                tint = DeyaRunColors.Primary
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "DeyaRun",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = "Skrējiena treniņu pārvaldība",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Version Info Section
            InfoSection(
                title = "Versijas informācija",
                items = listOf(
                    InfoItem(
                        icon = Icons.Default.Info,
                        label = "Versija",
                        value = getAppVersion(context),
                        copyable = true
                    ),
                    InfoItem(
                        icon = Icons.Default.CheckCircle,
                        label = "Build kods",
                        value = getAppVersionCode(context).toString(),
                        copyable = true
                    ),
                    InfoItem(
                        icon = Icons.Default.DateRange,
                        label = "Build datums",
                        value = getBuildDate(context),
                        copyable = true
                    ),
                    InfoItem(
                        icon = Icons.Default.Build,
                        label = "Build tips",
                        value = "Release",
                        copyable = false
                    )
                ),
                onCopy = { value ->
                    copyToClipboard(context, value)
                    showCopiedSnackbar = true
                }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Device Info Section
            InfoSection(
                title = "Ierīces informācija",
                items = listOf(
                    InfoItem(
                        icon = Icons.Default.Phone,
                        label = "Ierīce",
                        value = "${Build.MANUFACTURER} ${Build.MODEL}",
                        copyable = true
                    ),
                    InfoItem(
                        icon = Icons.Default.Settings,
                        label = "Android versija",
                        value = "${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})",
                        copyable = true
                    ),
                    InfoItem(
                        icon = Icons.Default.Star,
                        label = "Procesors",
                        value = Build.SUPPORTED_ABIS.firstOrNull() ?: "Unknown",
                        copyable = true
                    )
                ),
                onCopy = { value ->
                    copyToClipboard(context, value)
                    showCopiedSnackbar = true
                }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // App Info Section
            InfoSection(
                title = "Aplikācijas informācija",
                items = listOf(
                    InfoItem(
                        icon = Icons.Default.Add,
                        label = "Package ID",
                        value = context.packageName,
                        copyable = true
                    ),
                    InfoItem(
                        icon = Icons.Default.Home,
                        label = "Build Type",
                        value = "release",
                        copyable = true
                    )
                ),
                onCopy = { value ->
                    copyToClipboard(context, value)
                    showCopiedSnackbar = true
                }
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Debug Commands Section
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF1E1E1E)
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = Color(0xFFFFA726),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Debug komandas",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    DebugCommand(
                        label = "Logcat",
                        command = "adb logcat | grep DeyaRun",
                        onCopy = {
                            copyToClipboard(context, "adb logcat | grep DeyaRun")
                            showCopiedSnackbar = true
                        }
                    )

                    DebugCommand(
                        label = "Database",
                        command = "adb shell run-as ${context.packageName} ls databases/",
                        onCopy = {
                            copyToClipboard(context, "adb shell run-as ${context.packageName} ls databases/")
                            showCopiedSnackbar = true
                        }
                    )

                    DebugCommand(
                        label = "Clear data",
                        command = "adb shell pm clear ${context.packageName}",
                        onCopy = {
                            copyToClipboard(context, "adb shell pm clear ${context.packageName}")
                            showCopiedSnackbar = true
                        }
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Delete All Unsynced Activities
                    var showDeleteDialog by remember { mutableStateOf(false) }
                    var isDeleting by remember { mutableStateOf(false) }
                    val scope = rememberCoroutineScope()

                    OutlinedButton(
                        onClick = { showDeleteDialog = true },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = Color(0xFFEF5350)
                        ),
                        enabled = !isDeleting
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(if (isDeleting) "Dzēš..." else "Dzēst visas nesinhronizētās aktivitātes")
                    }

                    if (showDeleteDialog) {
                        AlertDialog(
                            onDismissRequest = { showDeleteDialog = false },
                            icon = {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = Color(0xFFEF5350),
                                    modifier = Modifier.size(48.dp)
                                )
                            },
                            title = {
                                Text("Dzēst nesinhronizētās aktivitātes?")
                            },
                            text = {
                                Text(
                                    "Šī darbība dzēsīs VISAS lokālās aktivitātes, kas vēl nav sinhronizētas ar serveri. " +
                                    "Šo darbību NEVAR atsaukt!\n\n" +
                                    "Vai tiešām vēlies turpināt?",
                                    color = Color.White
                                )
                            },
                            confirmButton = {
                                Button(
                                    onClick = {
                                        showDeleteDialog = false
                                        isDeleting = true
                                        scope.launch {
                                            try {
                                                activitySyncManager?.deleteAllUnsyncedActivities()
                                                kotlinx.coroutines.delay(1000)
                                                showCopiedSnackbar = true
                                            } catch (e: Exception) {
                                                android.util.Log.e("AboutScreen", "Failed to delete unsynced activities", e)
                                            } finally {
                                                isDeleting = false
                                            }
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFFEF5350)
                                    )
                                ) {
                                    Text("Dzēst visu")
                                }
                            },
                            dismissButton = {
                                TextButton(onClick = { showDeleteDialog = false }) {
                                    Text("Atcelt")
                                }
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Log Data Section
            LogDataSection(
                syncErrors = syncErrors,
                onCopyAll = {
                    val allLogs = syncErrors.joinToString("\n") { error ->
                        val timestamp = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date(error.timestamp))
                        "[$timestamp] [${error.type}] ${error.message}${error.activityId?.let { " (ID: $it)" } ?: ""}"
                    }
                    copyToClipboard(context, allLogs)
                    showCopiedSnackbar = true
                },
                onClearLogs = {
                    activitySyncManager?.clearSyncErrorLog()
                    syncErrors = emptyList()
                }
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Copyright
            Text(
                text = "© ${java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)} DeyaRun",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Text(
                text = "Izstrādāts ar ❤️",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }

    // Auto-hide snackbar
    LaunchedEffect(showCopiedSnackbar) {
        if (showCopiedSnackbar) {
            kotlinx.coroutines.delay(2000)
            showCopiedSnackbar = false
        }
    }
}

/**
 * Info Section Component
 */
@Composable
private fun InfoSection(
    title: String,
    items: List<InfoItem>,
    onCopy: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            items.forEachIndexed { index, item ->
                InfoRow(
                    item = item,
                    onCopy = { onCopy(item.value) }
                )
                if (index < items.size - 1) {
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                }
            }
        }
    }
}

/**
 * Info Row Component
 */
@Composable
private fun InfoRow(
    item: InfoItem,
    onCopy: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            modifier = Modifier.weight(1f),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = item.icon,
                contentDescription = null,
                modifier = Modifier.size(20.dp),
                tint = DeyaRunColors.Primary
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = item.label,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = item.value,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        if (item.copyable) {
            IconButton(onClick = onCopy) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = "Copy",
                    modifier = Modifier.size(20.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

/**
 * Debug Command Component
 */
@Composable
private fun DebugCommand(
    label: String,
    command: String,
    onCopy: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = Color(0xFFBBBBBB)
            )
            TextButton(onClick = onCopy) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = "Copy",
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text("Kopēt", fontSize = 12.sp)
            }
        }
        Text(
            text = command,
            style = MaterialTheme.typography.bodySmall,
            fontFamily = FontFamily.Monospace,
            color = Color(0xFF4CAF50),
            modifier = Modifier.padding(top = 4.dp)
        )
    }
}

/**
 * Data classes
 */
private data class InfoItem(
    val icon: ImageVector,
    val label: String,
    val value: String,
    val copyable: Boolean
)

/**
 * Helper functions
 */
private fun copyToClipboard(context: Context, text: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText("DeyaRun", text)
    clipboard.setPrimaryClip(clip)
}

private fun getAppVersion(context: Context): String {
    return try {
        val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
        packageInfo.versionName ?: "Unknown"
    } catch (e: Exception) {
        "Unknown"
    }
}

private fun getAppVersionCode(context: Context): Long {
    return try {
        val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            packageInfo.longVersionCode
        } else {
            @Suppress("DEPRECATION")
            packageInfo.versionCode.toLong()
        }
    } catch (e: Exception) {
        0L
    }
}

private fun getBuildDate(context: Context): String {
    return try {
        val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
        val buildTime = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            packageInfo.lastUpdateTime
        } else {
            @Suppress("DEPRECATION")
            packageInfo.lastUpdateTime
        }
        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
        sdf.format(Date(buildTime))
    } catch (e: Exception) {
        "Unknown"
    }
}

/**
 * Log Data Section Component
 * Displays sync errors and activity operation logs with real-time updates
 */
@Composable
private fun LogDataSection(
    syncErrors: List<ActivitySyncManager.SyncError>,
    onCopyAll: () -> Unit,
    onClearLogs: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF2D1F1F) // Red/orange theme
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = null,
                        tint = Color(0xFFFF6B6B),
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Log Dati",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Text(
                    text = "${syncErrors.size} ieraksti",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFFBBBBBB)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (syncErrors.isEmpty()) {
                // No errors message
                Text(
                    text = "Nav sinhronizācijas kļūdu",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF4CAF50),
                    modifier = Modifier.padding(vertical = 16.dp)
                )
            } else {
                // Display errors (scrollable if > 5)
                val displayErrors = syncErrors.take(10)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 300.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    displayErrors.forEach { error ->
                        LogErrorItem(error = error)
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }

                if (syncErrors.size > 10) {
                    Text(
                        text = "... un vēl ${syncErrors.size - 10} ieraksti",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFBBBBBB),
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Action buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onCopyAll,
                    modifier = Modifier.weight(1f),
                    enabled = syncErrors.isNotEmpty()
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Kopēt visus")
                }

                OutlinedButton(
                    onClick = onClearLogs,
                    modifier = Modifier.weight(1f),
                    enabled = syncErrors.isNotEmpty()
                ) {
                    Icon(
                        imageVector = Icons.Default.Clear,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Notīrīt")
                }
            }
        }
    }
}

/**
 * Log Error Item Component
 * Displays individual sync error with timestamp and details
 */
@Composable
private fun LogErrorItem(error: ActivitySyncManager.SyncError) {
    val timestamp = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date(error.timestamp))
    val errorColor = when (error.type) {
        ActivitySyncManager.ErrorType.NETWORK -> Color(0xFFFFA726) // Orange
        ActivitySyncManager.ErrorType.AUTH -> Color(0xFFEF5350) // Red
        ActivitySyncManager.ErrorType.API -> Color(0xFFFF6B6B) // Light red
        ActivitySyncManager.ErrorType.SERVER -> Color(0xFFE53935) // Dark red
        ActivitySyncManager.ErrorType.DATA -> Color(0xFFFFCA28) // Yellow
        ActivitySyncManager.ErrorType.UNKNOWN -> Color(0xFFBDBDBD) // Grey
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Color(0xFF1E1E1E),
        shape = MaterialTheme.shapes.small
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = timestamp,
                    style = MaterialTheme.typography.bodySmall,
                    fontFamily = FontFamily.Monospace,
                    color = Color(0xFFBBBBBB)
                )
                Surface(
                    color = errorColor.copy(alpha = 0.2f),
                    shape = MaterialTheme.shapes.extraSmall
                ) {
                    Text(
                        text = error.type.name,
                        style = MaterialTheme.typography.labelSmall,
                        color = errorColor,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = error.message,
                style = MaterialTheme.typography.bodySmall,
                color = Color.White
            )

            if (error.activityId != null) {
                Text(
                    text = "Activity ID: ${error.activityId}",
                    style = MaterialTheme.typography.labelSmall,
                    fontFamily = FontFamily.Monospace,
                    color = Color(0xFF888888),
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            if (!error.details.isNullOrEmpty()) {
                Text(
                    text = error.details,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFF888888),
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
    }
}
