package com.deyarun.mobile.presentation.activity

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.deyarun.mobile.data.model.ActivityStatus
import com.deyarun.mobile.data.model.ActivityType
import com.deyarun.mobile.presentation.theme.DeyaRunColors
import com.deyarun.mobile.presentation.viewmodel.ActivityViewModel
import kotlinx.coroutines.delay
import com.deyarun.mobile.presentation.viewmodel.ActivityViewModelFactory
import com.deyarun.mobile.utils.LocationManager
import com.deyarun.mobile.data.local.dao.ActivityDao
import com.deyarun.mobile.data.sync.ActivitySyncManager
import com.deyarun.mobile.presentation.components.ActivitySyncIndicator
import java.util.concurrent.TimeUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActiveActivityScreen(
    activityDao: ActivityDao,
    userId: String,
    onActivityComplete: () -> Unit,
    onBackClick: () -> Unit
) {
    val context = LocalContext.current
    val locationManager = remember { LocationManager(context) }
    val syncManager = remember { ActivitySyncManager(context, activityDao, userId) }
    val activityViewModelFactory = remember {
        ActivityViewModelFactory(activityDao, locationManager, syncManager, userId)
    }
    val activityViewModel: ActivityViewModel = viewModel(factory = activityViewModelFactory)
    val activityState by activityViewModel.activityState.collectAsState()

    var showStopDialog by remember { mutableStateOf(false) }

    // Animation
    val infiniteTransition = rememberInfiniteTransition(label = "")
    val animatedAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ), label = ""
    )

    val animatedScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ), label = ""
    )

    // Navigate to complete when activity is completed
    LaunchedEffect(activityState.currentActivity?.status) {
        if (activityState.currentActivity?.status == ActivityStatus.COMPLETED) {
            // FIX 5: IMMEDIATE sync attempt after activity completion
            try {
                println("DEBUG ActiveActivityScreen: Triggering immediate sync after completion")
                syncManager.attemptSyncUnsyncedActivities()
                println("DEBUG ActiveActivityScreen: Immediate sync triggered successfully")
            } catch (e: Exception) {
                println("DEBUG ActiveActivityScreen: Immediate sync failed (will retry in background): ${e.message}")
                // Silent fail - background sync will retry
            }

            onActivityComplete()
        }
    }

    // Timer update loop - runs independently of GPS updates
    LaunchedEffect(activityState.isTracking) {
        while (activityState.isTracking) {
            activityViewModel.updateCurrentDuration()
            delay(1000) // Update every second
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(activityState.currentActivity?.name ?: "Activity")
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showStopDialog = true }) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Stop Activity",
                            tint = DeyaRunColors.Error
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            DeyaRunColors.Primary.copy(alpha = 0.05f),
                            DeyaRunColors.Dark.Background
                        )
                    )
                )
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Status Indicator
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = DeyaRunColors.Dark.Surface
                    ),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .clip(CircleShape)
                                .background(
                                    if (activityState.isTracking) DeyaRunColors.Success
                                    else DeyaRunColors.Warning
                                )
                                .alpha(animatedAlpha)
                        )

                        Spacer(modifier = Modifier.width(8.dp))

                        Text(
                            text = if (activityState.isTracking) "Recording" else "Paused",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (activityState.isTracking) DeyaRunColors.Success
                                   else DeyaRunColors.Warning
                        )

                        Spacer(modifier = Modifier.width(8.dp))

                        Icon(
                            imageVector = getActivityTypeIcon(activityState.currentActivity?.type),
                            contentDescription = null,
                            modifier = Modifier.size(20.dp),
                            tint = DeyaRunColors.Primary
                        )
                    }
                }

                // Main Stats
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = DeyaRunColors.Dark.Surface
                    ),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Duration - Largest display
                        Text(
                            text = formatDuration(activityState.totalDuration),
                            fontSize = 48.sp,
                            fontWeight = FontWeight.Bold,
                            color = DeyaRunColors.Primary,
                            modifier = Modifier.scale(animatedScale)
                        )

                        Text(
                            text = "Duration",
                            fontSize = 14.sp,
                            color = DeyaRunColors.Dark.TextSecondary
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        // Distance and Pace Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            StatColumn(
                                value = formatDistance(activityState.totalDistance),
                                label = "Distance",
                                modifier = Modifier.weight(1f)
                            )

                            StatColumn(
                                value = formatPace(activityState.averagePace),
                                label = "Avg Pace",
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }

                // Secondary Stats
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(
                            containerColor = DeyaRunColors.Dark.Surface
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        StatColumn(
                            value = formatPace(activityState.currentPace),
                            label = "Current Pace",
                            modifier = Modifier.padding(16.dp)
                        )
                    }

                    Card(
                        modifier = Modifier.weight(1f),
                        colors = CardDefaults.cardColors(
                            containerColor = DeyaRunColors.Dark.Surface
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        StatColumn(
                            value = "${activityState.calories}",
                            label = "Calories",
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }

                // GPS Status
                if (activityState.lastGpsPoint != null) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = DeyaRunColors.Success.copy(alpha = 0.1f)
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.LocationOn,
                                contentDescription = null,
                                tint = DeyaRunColors.Success,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "GPS Signal: ${activityState.gpsPoints.size} points recorded",
                                fontSize = 12.sp,
                                color = DeyaRunColors.Success
                            )
                        }
                    }
                }

                // Sync Status Indicator
                ActivitySyncIndicator(
                    syncManager = syncManager,
                    onManualSync = { activityViewModel.manualSync() }
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Control Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Pause/Resume Button
                    Button(
                        onClick = {
                            if (activityState.isTracking) {
                                activityViewModel.pauseActivity()
                            } else {
                                activityViewModel.resumeActivity()
                            }
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(56.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (activityState.isTracking) DeyaRunColors.Warning
                                           else DeyaRunColors.Success,
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(28.dp)
                    ) {
                        Icon(
                            imageVector = if (activityState.isTracking) Icons.Default.Clear
                                         else Icons.Default.PlayArrow,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (activityState.isTracking) "Pause" else "Resume",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    // Stop Button
                    Button(
                        onClick = { showStopDialog = true },
                        modifier = Modifier
                            .weight(1f)
                            .height(56.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = DeyaRunColors.Error,
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(28.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = null,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Stop",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            // Stop Activity Dialog
            if (showStopDialog) {
                AlertDialog(
                    onDismissRequest = { showStopDialog = false },
                    title = { Text("Stop Activity") },
                    text = {
                        Text("Are you sure you want to stop this activity? Your progress will be saved.")
                    },
                    confirmButton = {
                        TextButton(
                            onClick = {
                                showStopDialog = false
                                println("DEBUG ActiveActivityScreen: User confirmed stop activity")
                                activityViewModel.stopActivity()
                            }
                        ) {
                            Text("Stop", color = DeyaRunColors.Error)
                        }
                    },
                    dismissButton = {
                        TextButton(
                            onClick = { showStopDialog = false }
                        ) {
                            Text("Continue")
                        }
                    }
                )
            }
        }
    }
}

@Composable
private fun StatColumn(
    value: String,
    label: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = DeyaRunColors.Dark.OnSurface,
            textAlign = TextAlign.Center
        )
        Text(
            text = label,
            fontSize = 12.sp,
            color = DeyaRunColors.Dark.TextSecondary,
            textAlign = TextAlign.Center
        )
    }
}

private fun formatDuration(durationMs: Long): String {
    val hours = TimeUnit.MILLISECONDS.toHours(durationMs)
    val minutes = TimeUnit.MILLISECONDS.toMinutes(durationMs) % 60
    val seconds = TimeUnit.MILLISECONDS.toSeconds(durationMs) % 60

    return if (hours > 0) {
        String.format("%02d:%02d:%02d", hours, minutes, seconds)
    } else {
        String.format("%02d:%02d", minutes, seconds)
    }
}

private fun formatDistance(distanceMeters: Double): String {
    return if (distanceMeters >= 1000) {
        String.format("%.2f km", distanceMeters / 1000)
    } else {
        String.format("%.0f m", distanceMeters)
    }
}

private fun formatPace(paceSecondsPerKm: Double): String {
    if (paceSecondsPerKm <= 0 || paceSecondsPerKm.isInfinite() || paceSecondsPerKm.isNaN()) {
        return "--:--"
    }

    val minutes = (paceSecondsPerKm / 60).toInt()
    val seconds = (paceSecondsPerKm % 60).toInt()
    return String.format("%d:%02d", minutes, seconds)
}

private fun getActivityTypeIcon(type: ActivityType?) = when (type) {
    ActivityType.RUNNING -> Icons.Default.Star
    ActivityType.WALKING -> Icons.Default.Favorite
    ActivityType.CYCLING -> Icons.Default.Star
    ActivityType.HIKING -> Icons.Default.Build
    else -> Icons.Default.PlayArrow
}