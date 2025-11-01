package com.deyarun.mobile.presentation.permissions

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.deyarun.mobile.presentation.theme.DeyaRunColors
import com.deyarun.mobile.utils.AppPermission
import com.deyarun.mobile.utils.PermissionManager
import com.deyarun.mobile.utils.PermissionStatus
import com.deyarun.mobile.utils.PermissionSummary

/**
 * Screen for managing app permissions
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PermissionsScreen(
    onNavigateBack: () -> Unit,
    permissionManager: PermissionManager
) {
    val context = LocalContext.current
    val permissionStates by permissionManager.permissionStates.collectAsStateWithLifecycle()

    // Initialize permissions on first load
    LaunchedEffect(Unit) {
        permissionManager.initializePermissions()
    }

    val summary = remember(permissionStates) {
        permissionManager.getPermissionSummary()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Lietotnes atļaujas") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Atpakaļ")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Permission summary card
            item {
                PermissionSummaryCard(
                    summary = summary,
                    onRequestAll = {
                        // TODO: Request all missing required permissions
                    },
                    onOpenSettings = {
                        permissionManager.openAppSettings()
                    }
                )
            }

            // Required permissions section
            item {
                Text(
                    text = "Nepieciešamās atļaujas",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }

            val requiredPermissions = permissionStates.filter { it.value.permission.isRequired }
            items(requiredPermissions.toList()) { (permission, status) ->
                PermissionCard(
                    permission = permission,
                    status = status,
                    onRequestPermission = {
                        // TODO: Request specific permission
                    },
                    onOpenSettings = {
                        permissionManager.openAppSettings()
                    }
                )
            }

            // Optional permissions section
            val optionalPermissions = permissionStates.filter { !it.value.permission.isRequired }
            if (optionalPermissions.isNotEmpty()) {
                item {
                    Text(
                        text = "Papildu atļaujas",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }

                items(optionalPermissions.toList()) { (permission, status) ->
                    PermissionCard(
                        permission = permission,
                        status = status,
                        onRequestPermission = {
                            // TODO: Request specific permission
                        },
                        onOpenSettings = {
                            permissionManager.openAppSettings()
                        }
                    )
                }
            }

            // Help text
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.7f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Info,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "Par atļaujām",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Text(
                            text = "• Nepieciešamās atļaujas ir vajadzīgas lietotnes pamatfunkciju darbībai\n" +
                                    "• Papildu atļaujas uzlabo lietotnes funkcionalitāti\n" +
                                    "• Jūs varat pārvaldīt atļaujas sistēmas iestatījumos\n" +
                                    "• Dažas funkcijas nestrādās bez nepieciešamajām atļaujām",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

/**
 * Permission summary card showing overall status
 */
@Composable
private fun PermissionSummaryCard(
    summary: PermissionSummary,
    onRequestAll: () -> Unit,
    onOpenSettings: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (summary.allRequiredGranted) {
                Color(0xFF4CAF50).copy(alpha = 0.1f) // Green
            } else {
                Color(0xFFFF9800).copy(alpha = 0.1f) // Orange
            }
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = if (summary.allRequiredGranted) {
                        Icons.Default.CheckCircle
                    } else {
                        Icons.Default.Warning
                    },
                    contentDescription = null,
                    tint = if (summary.allRequiredGranted) Color(0xFF4CAF50) else Color(0xFFFF9800),
                    modifier = Modifier.size(32.dp)
                )

                Column(
                    horizontalAlignment = Alignment.End
                ) {
                    Text(
                        text = "${summary.grantedPermissions}/${summary.totalPermissions}",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "atļaujas piešķirtas",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Text(
                text = if (summary.allRequiredGranted) {
                    "Visas nepieciešamās atļaujas ir piešķirtas"
                } else {
                    "Trūkst ${summary.requiredPermissions - summary.grantedRequiredPermissions} nepieciešamas atļaujas"
                },
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )

            if (!summary.allRequiredGranted) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = onRequestAll,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Lock, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Piešķirt visas")
                    }

                    OutlinedButton(
                        onClick = onOpenSettings,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Settings, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Iestatījumi")
                    }
                }
            }
        }
    }
}

/**
 * Individual permission card
 */
@Composable
private fun PermissionCard(
    permission: AppPermission,
    status: PermissionStatus,
    onRequestPermission: () -> Unit,
    onOpenSettings: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = permission.icon,
                        style = MaterialTheme.typography.headlineMedium
                    )

                    Column {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Text(
                                text = permission.title,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )

                            if (permission.isRequired) {
                                Card(
                                    modifier = Modifier,
                                    colors = CardDefaults.cardColors(
                                        containerColor = Color.Red.copy(alpha = 0.2f)
                                    )
                                ) {
                                    Text(
                                        text = "Nepieciešama",
                                        color = Color.Red,
                                        style = MaterialTheme.typography.labelSmall,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }

                        Text(
                            text = permission.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                PermissionStatusIcon(status = status)
            }

            if (!status.isGranted) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (status.isPermanentlyDenied) {
                        OutlinedButton(
                            onClick = onOpenSettings,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Settings, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Atvērt iestatījumus")
                        }
                    } else {
                        Button(
                            onClick = onRequestPermission,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.Lock, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Piešķirt atļauju")
                        }
                    }
                }
            }
        }
    }
}

/**
 * Permission status icon
 */
@Composable
private fun PermissionStatusIcon(
    status: PermissionStatus
) {
    when {
        status.isGranted -> {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = "Piešķirta",
                tint = Color(0xFF4CAF50),
                modifier = Modifier.size(24.dp)
            )
        }
        status.isPermanentlyDenied -> {
            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = "Atteikta",
                tint = Color.Red,
                modifier = Modifier.size(24.dp)
            )
        }
        else -> {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = "Nav piešķirta",
                tint = Color(0xFFFF9800),
                modifier = Modifier.size(24.dp)
            )
        }
    }
}