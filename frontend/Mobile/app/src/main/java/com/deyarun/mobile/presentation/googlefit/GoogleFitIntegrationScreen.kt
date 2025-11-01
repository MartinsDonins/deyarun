package com.deyarun.mobile.presentation.googlefit

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.deyarun.mobile.presentation.viewmodel.GoogleFitViewModel

/**
 * Google Fit integration screen
 * Shows connection status and allows user to connect/disconnect Google Fit
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GoogleFitIntegrationScreen(
    onNavigateBack: () -> Unit,
    viewModel: GoogleFitViewModel
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.loadConnectionStatus()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Google Fit integrācija") },
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
                    item {
                        GoogleFitCard(
                            isConnected = uiState.isConnected,
                            connectedAt = uiState.connectedAt,
                            onConnect = { viewModel.connectToGoogleFit() },
                            onDisconnect = { viewModel.disconnectFromGoogleFit() }
                        )
                    }

                    if (uiState.isConnected) {
                        item {
                            FitnessDataPreview(
                                fitnessData = uiState.fitnessData,
                                onLoadData = { viewModel.loadFitnessData() },
                                isLoadingData = uiState.isLoadingData
                            )
                        }

                        item {
                            SyncSection(
                                onSync = { viewModel.syncActivities() },
                                isSyncing = uiState.isSyncing,
                                lastSyncResult = uiState.lastSyncResult
                            )
                        }
                    } else {
                        item {
                            FeaturesSection()
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
                    kotlinx.coroutines.delay(5000)
                    viewModel.clearError()
                }
            }
        }
    }
}

/**
 * Google Fit connection card
 */
@Composable
private fun GoogleFitCard(
    isConnected: Boolean,
    connectedAt: String?,
    onConnect: () -> Unit,
    onDisconnect: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = if (isConnected) Color(0xFF4CAF50) else Color(0xFF2196F3)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Google Fit",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = if (isConnected) "Savienots" else "Nav savienots",
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.White.copy(alpha = 0.9f)
                    )
                }

                Icon(
                    imageVector = if (isConnected) Icons.Default.CheckCircle else Icons.Default.Star,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(48.dp)
                )
            }

            if (isConnected && connectedAt != null) {
                Text(
                    text = "Savienots: $connectedAt",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.8f)
                )
            }

            Button(
                onClick = if (isConnected) onDisconnect else onConnect,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isConnected) Color.White else Color(0xFF1976D2),
                    contentColor = if (isConnected) Color(0xFF4CAF50) else Color.White
                )
            ) {
                Icon(
                    imageVector = if (isConnected) Icons.Default.Close else Icons.Default.Add,
                    contentDescription = null
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(if (isConnected) "Atvienot" else "Savienot ar Google Fit")
            }
        }
    }
}

/**
 * Fitness data preview section
 */
@Composable
private fun FitnessDataPreview(
    fitnessData: com.deyarun.mobile.data.model.GoogleFitData?,
    onLoadData: () -> Unit,
    isLoadingData: Boolean
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp)
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
                Text(
                    text = "Fitness dati (pēdējās 7 dienas)",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Button(
                    onClick = onLoadData,
                    enabled = !isLoadingData
                ) {
                    if (isLoadingData) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text("Ielādēt")
                    }
                }
            }

            if (fitnessData != null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    fitnessData.steps?.let { steps ->
                        DataCard(
                            title = "Soļi",
                            value = "${steps.totalSteps}",
                            subtitle = "Vid: ${steps.averageSteps}/dienā"
                        )
                    }

                    fitnessData.distance?.let { distance ->
                        DataCard(
                            title = "Distance",
                            value = "${"%.1f".format(distance.totalDistance)} km",
                            subtitle = "Vid: ${"%.1f".format(distance.averageDistance)} km/dienā"
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    fitnessData.calories?.let { calories ->
                        DataCard(
                            title = "Kalorijas",
                            value = "${calories.totalCalories.toInt()}",
                            subtitle = "Vid: ${calories.averageCalories.toInt()}/dienā"
                        )
                    }

                    fitnessData.activities?.let { activities ->
                        DataCard(
                            title = "Aktivitātes",
                            value = "${activities.totalActivities}",
                            subtitle = "7 dienās"
                        )
                    }
                }
            } else {
                Text(
                    text = "Nospied 'Ielādēt', lai redzētu savus fitness datus",
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

/**
 * Small data card for metrics
 */
@Composable
private fun RowScope.DataCard(
    title: String,
    value: String,
    subtitle: String
) {
    Card(
        modifier = Modifier.weight(1f),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

/**
 * Sync section
 */
@Composable
private fun SyncSection(
    onSync: () -> Unit,
    isSyncing: Boolean,
    lastSyncResult: String?
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Sinhronizācija",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Text(
                text = "Sinhronizē Google Fit aktivitātes ar DeyaRun treniņiem",
                style = MaterialTheme.typography.bodyMedium
            )

            Button(
                onClick = onSync,
                enabled = !isSyncing,
                modifier = Modifier.fillMaxWidth()
            ) {
                if (isSyncing) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Sinhronizē...")
                } else {
                    Icon(Icons.Default.Refresh, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Sinhronizēt aktivitātes")
                }
            }

            lastSyncResult?.let { result ->
                Text(
                    text = result,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

/**
 * Features section (shown when not connected)
 */
@Composable
private fun FeaturesSection() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Ko piedāvā Google Fit?",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            FeatureItem(
                icon = Icons.Default.PlayArrow,
                text = "Automātiska aktivitāšu sinhronizācija"
            )
            FeatureItem(
                icon = Icons.Default.Star,
                text = "Soļu, distances un kaloriju uzskaite"
            )
            FeatureItem(
                icon = Icons.Default.Favorite,
                text = "Sirdsdarbības datu integrācija"
            )
            FeatureItem(
                icon = Icons.Default.KeyboardArrowUp,
                text = "Labāki ieskati un treniņu rekomendācijas"
            )
        }
    }
}

@Composable
private fun FeatureItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    text: String
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary
        )
        Text(
            text = text,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}
