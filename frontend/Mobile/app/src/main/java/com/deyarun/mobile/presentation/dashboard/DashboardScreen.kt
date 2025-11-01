package com.deyarun.mobile.presentation.dashboard

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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.deyarun.mobile.presentation.viewmodel.AuthViewModel
import com.deyarun.mobile.presentation.viewmodel.SyncViewModel
import com.deyarun.mobile.presentation.viewmodel.DashboardViewModel
import com.deyarun.mobile.presentation.theme.DeyaRunColors
import com.deyarun.mobile.presentation.components.SyncStatusIndicator
import com.deyarun.mobile.presentation.components.SyncStatusDialog
import com.deyarun.mobile.data.model.Activity
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    authViewModel: AuthViewModel,
    dashboardViewModel: DashboardViewModel,
    syncViewModel: SyncViewModel? = null,
    onLogout: () -> Unit,
    onEditProfile: () -> Unit = {},
    onNavigateToWorkout: () -> Unit = {},
    onNavigateToStats: () -> Unit = {},
    onViewUnsyncedActivities: () -> Unit = {},
    onQuickStartRun: () -> Unit = {}
) {
    val authState by authViewModel.authState.collectAsState()
    val dashboardState by dashboardViewModel.uiState.collectAsState()
    val syncState by (syncViewModel?.syncState?.collectAsState() ?: remember { mutableStateOf(null) })

    var showSyncDialog by remember { mutableStateOf(false) }

    // Scrollable Content with gradient background
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        DeyaRunColors.Primary.copy(alpha = 0.1f),
                        DeyaRunColors.Dark.Background
                    )
                )
            )
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
            // Welcome Section
            WelcomeSection(authState.user?.firstName ?: "Runner")

            Spacer(modifier = Modifier.height(16.dp))

            // Sync Status Indicator with debug logging
            syncState?.let { state ->
                println("DEBUG Dashboard: Sync state - pending: ${state.syncStatistics.pendingUploads}, loading: ${state.isLoading}")
                println("DEBUG Dashboard: Online: ${state.syncStatistics.isOnline}, conflicts: ${state.syncStatistics.pendingConflicts}")
                if (syncViewModel != null) {
                    SyncStatusIndicator(
                        syncStatistics = state.syncStatistics,
                        onSyncClick = { showSyncDialog = true },
                        onViewUnsyncedClick = onViewUnsyncedActivities,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(16.dp))
                } else {
                    println("DEBUG Dashboard: ⚠️ SyncViewModel is NULL - sync indicator not shown")
                }
            } ?: run {
                println("DEBUG Dashboard: ⚠️ SyncState is NULL - no sync info available")
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Weekly Stats with real data
            WeeklyStatsCard(
                distance = dashboardState.weeklyDistance,
                time = dashboardState.weeklyTime,
                pace = dashboardState.averagePace
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Quick Actions
            QuickActionsSection(
                onStartRun = onQuickStartRun,
                onViewStats = onNavigateToStats,
                onViewWorkouts = onNavigateToWorkout
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Recent Activities with real data
            RecentActivitiesCard(
                activities = dashboardState.recentActivities,
                onSeeAll = onNavigateToWorkout
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Goals Section with real data
            GoalsSection(
                distanceGoal = dashboardState.weeklyDistanceGoal,
                runsGoal = dashboardState.weeklyRunsGoal
            )

        Spacer(modifier = Modifier.height(80.dp)) // Bottom padding
    }

    // Sync Dialog
    if (showSyncDialog && syncViewModel != null) {
        syncState?.let { state ->
            SyncStatusDialog(
                syncStatistics = state.syncStatistics,
                onDismiss = { showSyncDialog = false },
                onForceSync = {
                    syncViewModel.triggerManualSync()
                    showSyncDialog = false
                },
                onClearData = {
                    syncViewModel.clearAllSyncData()
                    showSyncDialog = false
                }
            )
        }
    }
}

// Welcome Section
@Composable
private fun WelcomeSection(username: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = DeyaRunColors.Primary.copy(alpha = 0.1f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(60.dp)
                    .clip(CircleShape)
                    .background(DeyaRunColors.Primary),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.PlayArrow,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(30.dp)
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column {
                Text(
                    text = "Welcome back!",
                    fontSize = 14.sp,
                    color = DeyaRunColors.Dark.TextSecondary
                )
                Text(
                    text = username,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = DeyaRunColors.Dark.OnSurface
                )
                Text(
                    text = "Ready for your next run?",
                    fontSize = 12.sp,
                    color = DeyaRunColors.Dark.TextMuted
                )
            }
        }
    }
}

// Weekly Stats Card with real data
@Composable
private fun WeeklyStatsCard(
    distance: String,
    time: String,
    pace: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = DeyaRunColors.Dark.Surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Text(
                text = "This Week",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = DeyaRunColors.Dark.OnSurface,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem(
                    icon = Icons.Default.Place,
                    value = distance,
                    unit = "km",
                    label = "Distance"
                )
                StatItem(
                    icon = Icons.Default.Home,
                    value = time,
                    unit = "",
                    label = "Time"
                )
                StatItem(
                    icon = Icons.Default.Star,
                    value = pace,
                    unit = "/km",
                    label = "Avg Pace"
                )
            }
        }
    }
}

// Stat Item Component
@Composable
private fun StatItem(
    icon: ImageVector,
    value: String,
    unit: String,
    label: String
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(DeyaRunColors.Primary.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = DeyaRunColors.Primary,
                modifier = Modifier.size(24.dp)
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        Row(verticalAlignment = Alignment.Bottom) {
            Text(
                text = value,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = DeyaRunColors.Dark.OnSurface
            )
            if (unit.isNotEmpty()) {
                Text(
                    text = unit,
                    fontSize = 12.sp,
                    color = DeyaRunColors.Dark.TextSecondary,
                    modifier = Modifier.padding(start = 2.dp)
                )
            }
        }

        Text(
            text = label,
            fontSize = 12.sp,
            color = DeyaRunColors.Dark.TextMuted
        )
    }
}

// Quick Actions Section
@Composable
private fun QuickActionsSection(
    onStartRun: () -> Unit,
    onViewStats: () -> Unit,
    onViewWorkouts: () -> Unit
) {
    Column {
        Text(
            text = "Quick Actions",
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = DeyaRunColors.Dark.OnSurface,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Start Run Button
            Button(
                onClick = onStartRun,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = DeyaRunColors.Primary
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Start Run",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White,
                        textAlign = TextAlign.Center
                    )
                }
            }

            // View Stats Button
            Button(
                onClick = onViewStats,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = DeyaRunColors.Secondary
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Statistics",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White,
                        textAlign = TextAlign.Center
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Workouts Button (full width)
        Button(
            onClick = onViewWorkouts,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = DeyaRunColors.Accent
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Default.DateRange,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = "Training Plans",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
            }
        }
    }
}

// Recent Activities Card with real data
@Composable
private fun RecentActivitiesCard(
    activities: List<Activity>,
    onSeeAll: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = DeyaRunColors.Dark.Surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Recent Activities",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = DeyaRunColors.Dark.OnSurface
                )
                TextButton(onClick = onSeeAll) {
                    Text(
                        text = "See All",
                        color = DeyaRunColors.Primary,
                        fontSize = 14.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Show real activities or empty state
            if (activities.isEmpty()) {
                Text(
                    text = "No activities yet. Start your first run!",
                    fontSize = 14.sp,
                    color = DeyaRunColors.Dark.TextSecondary,
                    modifier = Modifier.padding(vertical = 16.dp)
                )
            } else {
                activities.forEach { activity ->
                    ActivityItem(
                        activity = activity
                    )
                }
            }
        }
    }
}

// Activity Item Component with real activity data
@Composable
private fun ActivityItem(
    activity: Activity
) {
    val distanceKm = String.format("%.1f km", activity.totalDistance / 1000.0)
    val durationMinutes = activity.totalDuration / (1000 * 60)
    val timeFormatted = formatActivityDuration(durationMinutes)
    val dateFormatted = formatActivityDate(activity.endTime)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(DeyaRunColors.Primary.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.PlayArrow,
                contentDescription = null,
                tint = DeyaRunColors.Primary,
                modifier = Modifier.size(20.dp)
            )
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = activity.name,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = DeyaRunColors.Dark.OnSurface
            )
            Text(
                text = "$distanceKm • $timeFormatted",
                fontSize = 12.sp,
                color = DeyaRunColors.Dark.TextSecondary
            )
        }

        Text(
            text = dateFormatted,
            fontSize = 12.sp,
            color = DeyaRunColors.Dark.TextMuted
        )
    }
}

/**
 * Format activity duration to readable format
 */
private fun formatActivityDuration(minutes: Long): String {
    val hours = minutes / 60
    val mins = minutes % 60
    return if (hours > 0) {
        "${hours}h ${mins}m"
    } else {
        "${mins}m"
    }
}

/**
 * Format activity date to relative format (Today, Yesterday, or date)
 */
private fun formatActivityDate(date: Date?): String {
    if (date == null) return "Unknown"

    val now = Calendar.getInstance()
    val activityDate = Calendar.getInstance().apply { time = date }

    val daysDiff = ((now.timeInMillis - activityDate.timeInMillis) / (24 * 60 * 60 * 1000)).toInt()

    return when (daysDiff) {
        0 -> "Today"
        1 -> "Yesterday"
        in 2..6 -> "$daysDiff days ago"
        else -> SimpleDateFormat("MMM d", Locale.getDefault()).format(date)
    }
}

// Goals Section with real data
@Composable
private fun GoalsSection(
    distanceGoal: com.deyarun.mobile.presentation.viewmodel.GoalProgress,
    runsGoal: com.deyarun.mobile.presentation.viewmodel.GoalProgress
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = DeyaRunColors.Dark.Surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Text(
                text = "Weekly Goals",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = DeyaRunColors.Dark.OnSurface,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // Distance Goal with real data
            GoalItem(
                title = "Weekly Distance",
                progress = distanceGoal.progress,
                current = distanceGoal.current,
                target = distanceGoal.target
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Runs Goal with real data
            GoalItem(
                title = "Weekly Runs",
                progress = runsGoal.progress,
                current = runsGoal.current,
                target = runsGoal.target
            )
        }
    }
}

// Goal Item Component
@Composable
private fun GoalItem(
    title: String,
    progress: Float,
    current: String,
    target: String
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = DeyaRunColors.Dark.OnSurface
            )
            Text(
                text = "$current / $target",
                fontSize = 14.sp,
                color = DeyaRunColors.Dark.TextSecondary
            )
        }

        Spacer(modifier = Modifier.height(8.dp))

        LinearProgressIndicator(
            progress = progress,
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp)),
            color = DeyaRunColors.Primary,
            trackColor = DeyaRunColors.Dark.Border
        )
    }
}