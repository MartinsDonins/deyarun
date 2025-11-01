package com.deyarun.mobile.presentation.activity

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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.deyarun.mobile.data.local.LocalDatabase
import com.deyarun.mobile.data.model.Activity
import com.deyarun.mobile.data.model.ActivityType
import com.deyarun.mobile.presentation.theme.DeyaRunColors
import com.deyarun.mobile.presentation.viewmodel.ActivityDetailViewModel
import com.deyarun.mobile.presentation.viewmodel.ActivityDetailViewModelFactory
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeUnit

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActivityDetailScreen(
    activityId: String,
    onBackClick: () -> Unit,
    onActivityDeleted: () -> Unit
) {
    val context = LocalContext.current

    // Create ViewModel
    val database = LocalDatabase.getDatabase(context)
    val activityDao = database.activityDao()
    val viewModelFactory = ActivityDetailViewModelFactory(activityDao)
    val viewModel: ActivityDetailViewModel = viewModel(factory = viewModelFactory)

    val activity by viewModel.activity.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    var showDeleteDialog by remember { mutableStateOf(false) }

    // Load activity when screen starts
    LaunchedEffect(activityId) {
        viewModel.loadActivity(activityId)
    }

    // Handle deletion success
    LaunchedEffect(viewModel.isDeleted.collectAsState().value) {
        if (viewModel.isDeleted.value) {
            onActivityDeleted()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = activity?.name ?: "Activity Details",
                        color = DeyaRunColors.Dark.OnSurface
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = DeyaRunColors.Dark.OnSurface
                        )
                    }
                },
                actions = {
                    if (activity != null) {
                        IconButton(onClick = { showDeleteDialog = true }) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Delete Activity",
                                tint = DeyaRunColors.Error
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DeyaRunColors.Dark.Surface,
                    titleContentColor = DeyaRunColors.Dark.OnSurface,
                    navigationIconContentColor = DeyaRunColors.Dark.OnSurface
                )
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
            when {
                isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = DeyaRunColors.Primary
                    )
                }
                error != null -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.Warning,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = DeyaRunColors.Error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            // FIX-052.5: Safe null handling instead of !! operator
                            text = error ?: "Unknown error",
                            color = DeyaRunColors.Error,
                            textAlign = TextAlign.Center
                        )
                    }
                }
                activity != null -> {
                    // activity is already checked != null in when condition
                    ActivityDetailContent(
                        activity = activity!!,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }
        }
    }

    // Delete confirmation dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Dzēst aktivitāti") },
            text = {
                Text("Vai tiešām vēlaties dzēst šo aktivitāti? Šo darbību nevar atsaukt.")
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteDialog = false
                        viewModel.deleteActivity()
                    }
                ) {
                    Text("Dzēst", color = DeyaRunColors.Error)
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

@Composable
private fun ActivityDetailContent(
    activity: Activity,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Activity Type Header
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
                    .padding(20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(
                            getActivityTypeColor(activity.type).copy(alpha = 0.2f)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = getActivityTypeIcon(activity.type),
                        contentDescription = null,
                        tint = getActivityTypeColor(activity.type),
                        modifier = Modifier.size(28.dp)
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column {
                    Text(
                        text = activity.name,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = DeyaRunColors.Dark.OnSurface
                    )
                    Text(
                        text = formatActivityType(activity.type),
                        fontSize = 14.sp,
                        color = DeyaRunColors.Dark.TextSecondary
                    )
                    Text(
                        text = formatDate(activity.startTime),
                        fontSize = 12.sp,
                        color = DeyaRunColors.Dark.TextMuted
                    )
                }
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
                // Duration - Main display
                Text(
                    text = formatDuration(activity.totalDuration),
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Bold,
                    color = DeyaRunColors.Primary
                )
                Text(
                    text = "Duration",
                    fontSize = 12.sp,
                    color = DeyaRunColors.Dark.TextSecondary
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Distance and Pace Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    StatColumn(
                        value = formatDistance(activity.totalDistance),
                        label = "Distance",
                        modifier = Modifier.weight(1f)
                    )
                    StatColumn(
                        value = formatPace(activity.averagePace),
                        label = "Avg Pace",
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Calories
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    StatColumn(
                        value = "${activity.calories}",
                        label = "Calories",
                        modifier = Modifier.weight(1f)
                    )
                    StatColumn(
                        value = "${activity.gpsPoints.size}",
                        label = "GPS Points",
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }

        // GPS Information
        if (activity.gpsPoints.isNotEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = DeyaRunColors.Success.copy(alpha = 0.1f)
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.LocationOn,
                            contentDescription = null,
                            tint = DeyaRunColors.Success,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "GPS Tracking Data",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = DeyaRunColors.Success
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "${activity.gpsPoints.size} GPS points recorded",
                        fontSize = 14.sp,
                        color = DeyaRunColors.Dark.OnSurface
                    )

                    if (activity.gpsPoints.isNotEmpty()) {
                        val firstPoint = activity.gpsPoints.first()
                        val lastPoint = activity.gpsPoints.last()

                        Text(
                            text = "Start: ${String.format("%.6f", firstPoint.latitude)}, ${String.format("%.6f", firstPoint.longitude)}",
                            fontSize = 12.sp,
                            color = DeyaRunColors.Dark.TextSecondary
                        )
                        Text(
                            text = "End: ${String.format("%.6f", lastPoint.latitude)}, ${String.format("%.6f", lastPoint.longitude)}",
                            fontSize = 12.sp,
                            color = DeyaRunColors.Dark.TextSecondary
                        )
                    }
                }
            }
        }

        // Activity Timeline
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = DeyaRunColors.Dark.Surface
            ),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Activity Timeline",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = DeyaRunColors.Dark.OnSurface
                )

                Spacer(modifier = Modifier.height(12.dp))

                TimelineItem(
                    icon = Icons.Default.PlayArrow,
                    title = "Started",
                    time = formatTime(activity.startTime),
                    color = DeyaRunColors.Success
                )

                if (activity.endTime != null) {
                    TimelineItem(
                        icon = Icons.Default.CheckCircle,
                        title = "Completed",
                        time = formatTime(activity.endTime),
                        color = DeyaRunColors.Primary
                    )
                }

                TimelineItem(
                    icon = Icons.Default.DateRange,
                    title = "Created",
                    time = formatTime(activity.createdAt),
                    color = DeyaRunColors.Dark.TextSecondary
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
            fontSize = 20.sp,
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

@Composable
private fun TimelineItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    time: String,
    color: Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = color,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text(
            text = title,
            fontSize = 14.sp,
            color = DeyaRunColors.Dark.OnSurface,
            modifier = Modifier.weight(1f)
        )
        Text(
            text = time,
            fontSize = 12.sp,
            color = DeyaRunColors.Dark.TextSecondary
        )
    }
}

// Helper functions
private fun getActivityTypeIcon(type: ActivityType) = when (type) {
    ActivityType.RUNNING -> Icons.Default.Star
    ActivityType.WALKING -> Icons.Default.Favorite
    ActivityType.CYCLING -> Icons.Default.Star
    ActivityType.HIKING -> Icons.Default.Build
}

private fun getActivityTypeColor(type: ActivityType) = when (type) {
    ActivityType.RUNNING -> DeyaRunColors.Primary
    ActivityType.WALKING -> DeyaRunColors.Success
    ActivityType.CYCLING -> DeyaRunColors.Info
    ActivityType.HIKING -> DeyaRunColors.Warning
}

private fun formatActivityType(type: ActivityType) = when (type) {
    ActivityType.RUNNING -> "Running"
    ActivityType.WALKING -> "Walking"
    ActivityType.CYCLING -> "Cycling"
    ActivityType.HIKING -> "Hiking"
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
    return String.format("%d:%02d /km", minutes, seconds)
}

private fun formatDate(date: Date): String {
    val formatter = SimpleDateFormat("EEEE, MMM dd, yyyy", Locale.getDefault())
    return formatter.format(date)
}

private fun formatTime(date: Date): String {
    val formatter = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
    return formatter.format(date)
}