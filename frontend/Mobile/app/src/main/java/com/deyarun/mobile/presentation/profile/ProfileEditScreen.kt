package com.deyarun.mobile.presentation.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.deyarun.mobile.presentation.viewmodel.AuthViewModel
import com.deyarun.mobile.utils.PermissionManager
import com.deyarun.mobile.data.storage.LanguagePreferenceManager
import com.deyarun.mobile.utils.LanguageHelper
import com.deyarun.mobile.presentation.components.LanguageSelector
import androidx.activity.ComponentActivity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileEditScreen(
    authViewModel: AuthViewModel,
    onBackClick: () -> Unit,
    onNavigateToPermissions: (() -> Unit)? = null,
    onNavigateToStrava: (() -> Unit)? = null,
    onNavigateToGoogleFit: (() -> Unit)? = null,
    onNavigateToGdpr: (() -> Unit)? = null,
    onNavigateToAbout: (() -> Unit)? = null,
    onNavigateToLanguageSettings: (() -> Unit)? = null
) {
    val context = LocalContext.current
    val activity = context as? ComponentActivity

    val permissionManager = remember { PermissionManager(context) }
    val permissionStates by permissionManager.permissionStates.collectAsStateWithLifecycle()

    val languagePreferenceManager = remember { LanguagePreferenceManager(context) }

    var showPermissionDialog by remember { mutableStateOf(false) }

    val authState by authViewModel.authState.collectAsState()

    // Initialize permissions
    LaunchedEffect(Unit) {
        permissionManager.initializePermissions()
    }

    // Profile form state
    var firstName by remember { mutableStateOf(TextFieldValue(authState.user?.firstName ?: "")) }
    var lastName by remember { mutableStateOf(TextFieldValue(authState.user?.lastName ?: "")) }
    var email by remember { mutableStateOf(TextFieldValue(authState.user?.email ?: "")) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Edit Profile") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    TextButton(
                        onClick = {
                            // Save profile changes
                            onBackClick()
                        }
                    ) {
                        Text("Save", color = MaterialTheme.colorScheme.primary)
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Profile Image Section - Simplified
            Box(
                modifier = Modifier.size(120.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .clip(CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = "Profile Picture",
                        modifier = Modifier.size(60.dp),
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Form Fields
            OutlinedTextField(
                value = firstName,
                onValueChange = { firstName = it },
                label = { Text("First Name") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = lastName,
                onValueChange = { lastName = it },
                label = { Text("Last Name") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                enabled = false // Email usually can't be changed
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Permissions Section
            PermissionsSection(
                permissionManager = permissionManager,
                permissionStates = permissionStates,
                onNavigateToPermissions = onNavigateToPermissions
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Language Settings Section
            Text(
                text = "Valoda / Language",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            // Language Selector Card - Navigate to full screen
            Card(
                modifier = Modifier.fillMaxWidth(),
                onClick = { onNavigateToLanguageSettings?.invoke() },
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Language,
                            contentDescription = null,
                            modifier = Modifier.size(32.dp),
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Column {
                            Text(
                                text = "Language / Valoda",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = languagePreferenceManager.getLanguageDisplayName(
                                    languagePreferenceManager.getCurrentLanguage()
                                ),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = "Navigate",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Integrations & Settings Section
            IntegrationsSection(
                onNavigateToStrava = onNavigateToStrava,
                onNavigateToGoogleFit = onNavigateToGoogleFit,
                onNavigateToGdpr = onNavigateToGdpr,
                onNavigateToAbout = onNavigateToAbout
            )
        }
    }
}

/**
 * Integrations and Settings section
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun IntegrationsSection(
    onNavigateToStrava: (() -> Unit)?,
    onNavigateToGoogleFit: (() -> Unit)?,
    onNavigateToGdpr: (() -> Unit)?,
    onNavigateToAbout: (() -> Unit)?
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "Integrācijas un Iestatījumi",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        // Strava Integration
        if (onNavigateToStrava != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                onClick = onNavigateToStrava,
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Share,
                            contentDescription = null,
                            tint = Color(0xFFFC4C02), // Strava orange color
                            modifier = Modifier.size(32.dp)
                        )
                        Column {
                            Text(
                                text = "Strava Integrācija",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Sinhronizē aktivitātes ar Strava",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // Google Fit Integration
        if (onNavigateToGoogleFit != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                onClick = onNavigateToGoogleFit,
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Favorite,
                            contentDescription = null,
                            tint = Color(0xFF4285F4), // Google blue color
                            modifier = Modifier.size(32.dp)
                        )
                        Column {
                            Text(
                                text = "Google Fit Integrācija",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Sinhronizē veselības datus",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // GDPR Settings
        if (onNavigateToGdpr != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                onClick = onNavigateToGdpr,
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = null,
                            tint = Color(0xFF2196F3), // Blue color
                            modifier = Modifier.size(32.dp)
                        )
                        Column {
                            Text(
                                text = "GDPR Iestatījumi",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Datu privātuma iestatījumi",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // About / Par aplikāciju
        if (onNavigateToAbout != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                onClick = onNavigateToAbout,
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = Color(0xFF9C27B0), // Purple color
                            modifier = Modifier.size(32.dp)
                        )
                        Column {
                            Text(
                                text = "Par aplikāciju",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Versija un debug informācija",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    Icon(
                        imageVector = Icons.Default.ArrowForward,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

/**
 * Permissions section in profile screen
 */
@Composable
private fun PermissionsSection(
    permissionManager: PermissionManager,
    permissionStates: Map<com.deyarun.mobile.utils.AppPermission, com.deyarun.mobile.utils.PermissionStatus>,
    onNavigateToPermissions: (() -> Unit)?
) {
    val summary = remember(permissionStates) {
        permissionManager.getPermissionSummary()
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (summary.allRequiredGranted) {
                Color(0xFF4CAF50).copy(alpha = 0.1f)
            } else {
                Color(0xFFFF9800).copy(alpha = 0.1f)
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
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = if (summary.allRequiredGranted) {
                            Icons.Default.Lock
                        } else {
                            Icons.Default.Warning
                        },
                        contentDescription = null,
                        tint = if (summary.allRequiredGranted) Color(0xFF4CAF50) else Color(0xFFFF9800)
                    )

                    Column {
                        Text(
                            text = "Lietotnes atļaujas",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (summary.allRequiredGranted) {
                                "Visas nepieciešamās atļaujas piešķirtas"
                            } else {
                                "Trūkst ${summary.requiredPermissions - summary.grantedRequiredPermissions} atļaujas"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Text(
                    text = "${summary.grantedPermissions}/${summary.totalPermissions}",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = if (summary.allRequiredGranted) Color(0xFF4CAF50) else Color(0xFFFF9800)
                )
            }

            // Quick status indicators
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val requiredPermissions = permissionStates.filter { it.value.permission.isRequired }
                requiredPermissions.forEach { (permission, status) ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = permission.icon,
                            style = MaterialTheme.typography.bodySmall
                        )
                        Icon(
                            imageVector = if (status.isGranted) {
                                Icons.Default.CheckCircle
                            } else {
                                Icons.Default.Warning
                            },
                            contentDescription = null,
                            modifier = Modifier.size(16.dp),
                            tint = if (status.isGranted) Color(0xFF4CAF50) else Color(0xFFFF9800)
                        )
                    }
                }
            }

            // Action buttons
            if (onNavigateToPermissions != null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (!summary.allRequiredGranted) {
                        Button(
                            onClick = {
                                // Quick permission request for missing required permissions
                                // TODO: Implement quick permission request
                            },
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Lock, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Piešķirt")
                        }
                    }

                    OutlinedButton(
                        onClick = onNavigateToPermissions,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Settings, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Pārvaldīt")
                    }
                }
            } else {
                // Fallback if navigation is not provided
                OutlinedButton(
                    onClick = {
                        permissionManager.openAppSettings()
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Settings, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Atvērt sistēmas iestatījumus")
                }
            }
        }
    }
}