package com.deyarun.mobile.presentation.strava

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.lifecycle.viewmodel.compose.viewModel
import com.deyarun.mobile.data.model.StravaActivity
import com.deyarun.mobile.data.model.StravaAthlete
import com.deyarun.mobile.data.model.StravaSyncPreferences
import com.deyarun.mobile.presentation.theme.DeyaRunColors
import com.deyarun.mobile.presentation.viewmodel.StravaViewModel
import java.text.SimpleDateFormat
import java.util.*

/**
 * Main Strava integration screen
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StravaIntegrationScreen(
    onNavigateBack: () -> Unit,
    viewModel: StravaViewModel
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val lifecycleOwner = LocalLifecycleOwner.current

    // Load status on initial load
    LaunchedEffect(Unit) {
        viewModel.loadConnectionStatus()
    }

    // Auto-refresh when returning from browser (onResume)
    DisposableEffect(lifecycleOwner) {
        val observer = androidx.lifecycle.LifecycleEventObserver { _, event ->
            if (event == androidx.lifecycle.Lifecycle.Event.ON_RESUME) {
                android.util.Log.d("StravaIntegrationScreen", "Screen resumed, refreshing status...")
                viewModel.loadConnectionStatus()
            }
        }

        lifecycleOwner.lifecycle.addObserver(observer)

        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Strava integrācija") },
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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            if (uiState.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center)
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    if (uiState.isConnected) {
                        // Connected state
                        item {
                            ConnectedSection(
                                athlete = uiState.athlete,
                                onDisconnect = { viewModel.disconnectFromStrava() },
                                onSync = { viewModel.syncActivities() },
                                isSyncing = uiState.isSyncing,
                                lastSyncResult = uiState.lastSyncResult
                            )
                        }

                        item {
                            SyncPreferencesSection(
                                preferences = uiState.syncPreferences,
                                onPreferencesChanged = { viewModel.updateSyncPreferences(it) }
                            )
                        }

                        if (uiState.activityStats != null) {
                            item {
                                ActivityStatsSection(stats = uiState.activityStats!!)
                            }
                        }

                        if (uiState.activities.isNotEmpty()) {
                            item {
                                Text(
                                    text = "Pēdējās aktivitātes",
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            items(uiState.activities) { activity ->
                                ActivityCard(activity = activity)
                            }
                        }
                    } else {
                        // Not connected state
                        item {
                            NotConnectedSection(
                                onConnect = { viewModel.connectToStrava() }
                            )
                        }
                    }
                }
            }

            // Error snackbar
            uiState.error?.let { error ->
                Snackbar(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp),
                    action = {
                        TextButton(onClick = { viewModel.clearError() }) {
                            Text("Aizvērt", color = MaterialTheme.colorScheme.primary)
                        }
                    }
                ) {
                    Text(error)
                }

                LaunchedEffect(error) {
                    kotlinx.coroutines.delay(5000) // Auto-dismiss after 5 seconds
                    viewModel.clearError()
                }
            }
        }
    }
}

/**
 * Section shown when connected to Strava
 */
@Composable
private fun ConnectedSection(
    athlete: StravaAthlete?,
    onDisconnect: () -> Unit,
    onSync: () -> Unit,
    isSyncing: Boolean,
    lastSyncResult: com.deyarun.mobile.data.model.StravaSyncResult?
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
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
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = null,
                    tint = Color.Green
                )
                Text(
                    text = "Savienots ar Strava",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = Color.Green
                )
            }

            athlete?.let { ath ->
                Text(
                    text = "${ath.firstname ?: ""} ${ath.lastname ?: ""}".trim(),
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )

                if (!ath.city.isNullOrEmpty()) {
                    Text(
                        text = "${ath.city}${if (!ath.country.isNullOrEmpty()) ", ${ath.country}" else ""}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            lastSyncResult?.let { result ->
                Text(
                    text = "Pēdējā sinhronizācija: ${result.syncedCount} aktivitātes",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onSync,
                    enabled = !isSyncing,
                    modifier = Modifier.weight(1f)
                ) {
                    if (isSyncing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Icon(Icons.Default.Refresh, contentDescription = null)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (isSyncing) "Sinhronizē..." else "Sinhronizēt")
                }

                OutlinedButton(
                    onClick = onDisconnect,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Close, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Atvienot")
                }
            }
        }
    }
}

/**
 * Section shown when not connected to Strava
 */
@Composable
private fun NotConnectedSection(
    onConnect: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Add,
                contentDescription = null,
                modifier = Modifier.size(64.dp),
                tint = MaterialTheme.colorScheme.primary
            )

            Text(
                text = "Savienot ar Strava",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )

            Text(
                text = "Sinhronizējiet savas aktivitātes no Strava un saglabājiet visu savu treniņu vēsturi vienuviet.",
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Button(
                onClick = {
                    android.util.Log.d("StravaIntegrationScreen", "Connect button clicked")
                    onConnect()
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Savienot ar Strava")
            }

            // Debug info for developers
            Text(
                text = "Debug: Tiks atvērts pārlūks OAuth autorizācijai.\nAtgriešanās URL: runningacademy://strava",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

/**
 * Sync preferences section
 */
@Composable
private fun SyncPreferencesSection(
    preferences: StravaSyncPreferences,
    onPreferencesChanged: (StravaSyncPreferences) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Sinhronizācijas iestatījumi",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Automātiskā sinhronizācija",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = "Sinhronizēt aktivitātes automātiski",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Switch(
                    checked = preferences.autoSync,
                    onCheckedChange = { autoSync ->
                        onPreferencesChanged(preferences.copy(autoSync = autoSync))
                    }
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Privātās aktivitātes",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = "Iekļaut privātās aktivitātes sinhronizācijā",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Switch(
                    checked = preferences.syncPrivateActivities,
                    onCheckedChange = { syncPrivate ->
                        onPreferencesChanged(preferences.copy(syncPrivateActivities = syncPrivate))
                    }
                )
            }
        }
    }
}

/**
 * Activity statistics section
 */
@Composable
private fun ActivityStatsSection(
    stats: com.deyarun.mobile.data.model.StravaActivityStats
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Aktivitāšu statistika",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem(
                    label = "Aktivitātes",
                    value = stats.totalActivities.toString()
                )
                StatItem(
                    label = "Attālums",
                    value = "${String.format("%.1f", stats.totalDistance / 1000)} km"
                )
                StatItem(
                    label = "Laiks",
                    value = "${stats.totalMovingTime / 3600}h"
                )
            }
        }
    }
}

/**
 * Single stat item
 */
@Composable
private fun StatItem(
    label: String,
    value: String
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

/**
 * Individual activity card
 */
@Composable
private fun ActivityCard(
    activity: StravaActivity
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Text(
                    text = activity.name,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.weight(1f)
                )

                Text(
                    text = activity.type,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "${String.format("%.2f", activity.distance / 1000)} km",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        text = "${activity.movingTime / 60} min",
                        style = MaterialTheme.typography.bodySmall
                    )
                }

                val dateFormat = SimpleDateFormat("dd.MM.yyyy", Locale.getDefault())
                val date = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault())
                    .parse(activity.startDate)

                Text(
                    text = date?.let { dateFormat.format(it) } ?: "",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}