package com.deyarun.mobile.presentation.workout

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.deyarun.mobile.data.repository.ActivityRepository
import com.deyarun.mobile.data.repository.AuthRepository
import com.deyarun.mobile.presentation.theme.DeyaRunColors
import com.deyarun.mobile.presentation.theme.DeyaRunGradients
import com.deyarun.mobile.presentation.viewmodel.AuthViewModel
import com.deyarun.mobile.presentation.viewmodel.AuthViewModelFactory
import com.deyarun.mobile.presentation.viewmodel.WorkoutViewModel
import com.deyarun.mobile.presentation.viewmodel.WorkoutViewModelFactory
import com.deyarun.mobile.presentation.components.ActivitySyncIndicator
import java.text.SimpleDateFormat
import java.util.*

data class Workout(
    val id: String,
    val name: String,
    val type: WorkoutType,
    val duration: String,
    val distance: String,
    val calories: Int,
    val date: Date,
    val avgPace: String,
    val difficulty: WorkoutDifficulty
)

enum class WorkoutType {
    RUNNING, CYCLING, WALKING, SWIMMING, STRENGTH, YOGA
}

enum class WorkoutDifficulty {
    EASY, MODERATE, HARD, EXTREME
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkoutScreen(
    authViewModel: AuthViewModel,
    userId: String,
    onNavigateToProfile: () -> Unit = {},
    onNavigateToStats: () -> Unit = {},
    onStartWorkout: () -> Unit = {},
    onNavigateToStartActivity: () -> Unit = {},
    onNavigateToActivityDetail: (String) -> Unit = {}
) {
    val context = LocalContext.current
    val authState by authViewModel.authState.collectAsState()

    // Workout ViewModel for real data
    val activityRepository = ActivityRepository(context)
    val authRepository = AuthRepository(context)
    val workoutViewModelFactory = WorkoutViewModelFactory(activityRepository, authRepository)
    val workoutViewModel: WorkoutViewModel = viewModel(factory = workoutViewModelFactory)
    val workoutState by workoutViewModel.uiState.collectAsState()

    // Debug UI state
    LaunchedEffect(workoutState.activities) {
        println("DEBUG WorkoutScreen: UI received ${workoutState.activities.size} activities")
        workoutState.activities.take(3).forEach { activity ->
            println("DEBUG WorkoutScreen: UI activity ${activity.id} - ${activity.name}")
        }
    }

    // Animation
    val infiniteTransition = rememberInfiniteTransition(label = "")
    val animatedAlpha by infiniteTransition.animateFloat(
        initialValue = 0.6f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ), label = ""
    )

    // Convert Activity objects to Workout objects for existing UI
    val workouts = remember(workoutState.activities, workoutState.unsyncedActivities, workoutState.showUnsyncedOnly) {
        val activitiesToShow = if (workoutState.showUnsyncedOnly) {
            workoutState.unsyncedActivities
        } else {
            workoutState.activities
        }

        println("DEBUG WorkoutScreen: Converting ${activitiesToShow.size} activities to workouts (showUnsyncedOnly: ${workoutState.showUnsyncedOnly})")
        activitiesToShow.forEach { activity ->
            println("DEBUG WorkoutScreen: Converting activity ${activity.id} - ${activity.name} - synced:${activity.syncedToBackend}")
        }

        activitiesToShow.map { activity ->
            Workout(
                id = activity.id,
                name = activity.name,
                type = when (activity.type) {
                    com.deyarun.mobile.data.model.ActivityType.RUNNING -> WorkoutType.RUNNING
                    com.deyarun.mobile.data.model.ActivityType.WALKING -> WorkoutType.WALKING
                    com.deyarun.mobile.data.model.ActivityType.CYCLING -> WorkoutType.CYCLING
                    com.deyarun.mobile.data.model.ActivityType.HIKING -> WorkoutType.WALKING
                },
                duration = formatDuration(activity.totalDuration),
                distance = String.format("%.1f km", activity.totalDistance / 1000.0),
                calories = activity.calories,
                date = activity.endTime ?: activity.startTime,
                avgPace = formatPace(activity.averagePace),
                difficulty = calculateDifficulty(activity.averagePace, activity.type)
            )
        }
    }

    // Use real weekly stats from repository
    val weeklyStats = workoutState.weeklyStats

    // Refresh data when screen is loaded
    LaunchedEffect(Unit) {
        workoutViewModel.refresh()
    }

    // Error handling
    workoutState.error?.let { error ->
        LaunchedEffect(error) {
            workoutViewModel.clearError()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        DeyaRunColors.Primary.copy(alpha = 0.05f),
                        DeyaRunColors.Dark.Background
                    )
                )
            )
    ) {
        if (workoutState.isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.align(Alignment.Center),
                color = DeyaRunColors.Primary
            )
        } else {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Welcome back,",
                        fontSize = 16.sp,
                        color = DeyaRunColors.Dark.TextSecondary
                    )
                    Text(
                        text = "Runner",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = DeyaRunColors.Dark.OnBackground
                    )
                }

                IconButton(
                    onClick = onNavigateToProfile,
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.radialGradient(
                                colors = DeyaRunGradients.Primary
                            )
                        )
                        .alpha(animatedAlpha)
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = "Profile",
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Quick Stats Cards
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
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "This Week",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = DeyaRunColors.Dark.OnSurface
                        )
                        TextButton(onClick = onNavigateToStats) {
                            Text(
                                text = "View All",
                                color = DeyaRunColors.Primary,
                                fontSize = 14.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        weeklyStats.entries.take(2).forEach { (label, value) ->
                            StatItem(
                                label = label,
                                value = value,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        weeklyStats.entries.drop(2).forEach { (label, value) ->
                            StatItem(
                                label = label,
                                value = value,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Recent Workouts Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = if (workoutState.showUnsyncedOnly) "Nesinhronizētās aktivitātes" else "Pēdējās aktivitātes",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = DeyaRunColors.Dark.OnBackground
                    )
                    if (workoutState.unsyncedActivities.isNotEmpty()) {
                        Text(
                            text = "${workoutState.unsyncedActivities.size} nesinhronizētas",
                            fontSize = 12.sp,
                            color = Color(0xFFFFC107)
                        )
                    }
                }

                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Unsynced filter badge
                    if (workoutState.unsyncedActivities.isNotEmpty()) {
                        FilterChip(
                            selected = workoutState.showUnsyncedOnly,
                            onClick = { workoutViewModel.toggleUnsyncedFilter() },
                            label = {
                                Text(
                                    text = "Nesinhronizētas (${workoutState.unsyncedActivities.size})",
                                    fontSize = 12.sp
                                )
                            },
                            leadingIcon = {
                                Icon(
                                    imageVector = if (workoutState.showUnsyncedOnly) Icons.Default.Check else Icons.Default.Warning,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Workouts List
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.weight(1f)
            ) {
                println("DEBUG WorkoutScreen LazyColumn: Rendering with ${workouts.size} workouts, isLoading=${workoutState.isLoading}")

                if (workouts.isEmpty() && !workoutState.isLoading) {
                    println("DEBUG WorkoutScreen LazyColumn: Showing empty workouts card")
                    item {
                        EmptyWorkoutsCard()
                    }
                } else {
                    println("DEBUG WorkoutScreen LazyColumn: Showing ${workouts.size} workout items")
                    items(workouts) { workout ->
                        println("DEBUG WorkoutScreen LazyColumn: Rendering workout ${workout.id} - ${workout.name}")
                        WorkoutCard(
                            workout = workout,
                            showDelete = workoutState.showUnsyncedOnly,
                            onClick = {
                                println("DEBUG WorkoutScreen: Navigating to activity detail for ID: ${workout.id}")
                                onNavigateToActivityDetail(workout.id)
                            },
                            onDelete = {
                                println("DEBUG WorkoutScreen: Delete unsynchronized activity ID: ${workout.id}")
                                workoutViewModel.deleteUnsyncedActivity(workout.id)
                            }
                        )
                    }
                }
            }
        }

        // Floating Action Buttons
        Column(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Start GPS Activity
            FloatingActionButton(
                onClick = onNavigateToStartActivity,
                containerColor = DeyaRunColors.Success,
                contentColor = Color.White,
                modifier = Modifier.size(56.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.LocationOn,
                    contentDescription = "Start GPS Activity",
                    modifier = Modifier.size(24.dp)
                )
            }

            // Quick Start Workout (Legacy)
            FloatingActionButton(
                onClick = onStartWorkout,
                containerColor = DeyaRunColors.Primary,
                contentColor = Color.White,
                modifier = Modifier.size(56.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Start Workout",
                    modifier = Modifier.size(28.dp)
                )
            }
        }
        }
    }
}

@Composable
private fun StatItem(
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = DeyaRunColors.Primary
        )
        Text(
            text = label,
            fontSize = 12.sp,
            color = DeyaRunColors.Dark.TextSecondary,
            textAlign = TextAlign.Center,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun WorkoutCard(
    workout: Workout,
    onClick: () -> Unit,
    showDelete: Boolean = false,
    onDelete: () -> Unit = {}
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = DeyaRunColors.Dark.Surface
        ),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Workout Type Icon
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(
                        getWorkoutTypeColor(workout.type).copy(alpha = 0.2f)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = getWorkoutTypeIcon(workout.type),
                    contentDescription = null,
                    tint = getWorkoutTypeColor(workout.type),
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            // Workout Details
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = workout.name,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = DeyaRunColors.Dark.OnSurface,
                        modifier = Modifier.weight(1f),
                        overflow = TextOverflow.Ellipsis,
                        maxLines = 1
                    )

                    DifficultyBadge(difficulty = workout.difficulty)
                }

                Spacer(modifier = Modifier.height(4.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "${workout.distance} • ${workout.duration}",
                        fontSize = 14.sp,
                        color = DeyaRunColors.Dark.TextSecondary
                    )

                    Text(
                        text = SimpleDateFormat("MMM dd", Locale.getDefault()).format(workout.date),
                        fontSize = 12.sp,
                        color = DeyaRunColors.Dark.TextMuted
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${workout.calories} cal • ${workout.avgPace}",
                        fontSize = 12.sp,
                        color = DeyaRunColors.Dark.TextMuted
                    )

                    // Show delete button only when filtering unsynced activities
                    if (showDelete) {
                        IconButton(
                            onClick = onDelete,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Delete,
                                contentDescription = "Dzēst nesinhronizēto aktivitāti",
                                tint = DeyaRunColors.Error,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DifficultyBadge(difficulty: WorkoutDifficulty) {
    val (color, text) = when (difficulty) {
        WorkoutDifficulty.EASY -> DeyaRunColors.Success to "Easy"
        WorkoutDifficulty.MODERATE -> DeyaRunColors.Warning to "Moderate"
        WorkoutDifficulty.HARD -> DeyaRunColors.Primary to "Hard"
        WorkoutDifficulty.EXTREME -> DeyaRunColors.Error to "Extreme"
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(color.copy(alpha = 0.2f))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = text,
            fontSize = 10.sp,
            fontWeight = FontWeight.Medium,
            color = color
        )
    }
}

private fun getWorkoutTypeIcon(type: WorkoutType): ImageVector {
    return when (type) {
        WorkoutType.RUNNING -> Icons.Default.Star
        WorkoutType.CYCLING -> Icons.Default.Star
        WorkoutType.WALKING -> Icons.Default.Favorite
        WorkoutType.SWIMMING -> Icons.Default.Star
        WorkoutType.STRENGTH -> Icons.Default.Build
        WorkoutType.YOGA -> Icons.Default.Favorite
    }
}

private fun getWorkoutTypeColor(type: WorkoutType): Color {
    return when (type) {
        WorkoutType.RUNNING -> DeyaRunColors.Primary
        WorkoutType.CYCLING -> DeyaRunColors.Secondary
        WorkoutType.WALKING -> DeyaRunColors.Accent
        WorkoutType.SWIMMING -> DeyaRunColors.Info
        WorkoutType.STRENGTH -> DeyaRunColors.Warning
        WorkoutType.YOGA -> DeyaRunColors.Success
    }
}

/**
 * Format duration from milliseconds to readable format
 */
private fun formatDuration(durationMs: Long): String {
    val totalSeconds = durationMs / 1000
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return String.format("%d:%02d", minutes, seconds)
}

/**
 * Format pace from seconds per km to readable format
 */
private fun formatPace(paceInSeconds: Double): String {
    if (paceInSeconds <= 0) return "0:00 /km"

    val minutes = (paceInSeconds / 60).toInt()
    val seconds = (paceInSeconds % 60).toInt()
    return String.format("%d:%02d /km", minutes, seconds)
}

/**
 * Calculate workout difficulty based on pace and activity type
 */
private fun calculateDifficulty(
    paceInSeconds: Double,
    activityType: com.deyarun.mobile.data.model.ActivityType
): WorkoutDifficulty {
    return when (activityType) {
        com.deyarun.mobile.data.model.ActivityType.RUNNING -> {
            when {
                paceInSeconds <= 240 -> WorkoutDifficulty.EXTREME // < 4:00 /km
                paceInSeconds <= 300 -> WorkoutDifficulty.HARD   // 4:00-5:00 /km
                paceInSeconds <= 360 -> WorkoutDifficulty.MODERATE // 5:00-6:00 /km
                else -> WorkoutDifficulty.EASY // > 6:00 /km
            }
        }
        com.deyarun.mobile.data.model.ActivityType.WALKING -> {
            when {
                paceInSeconds <= 480 -> WorkoutDifficulty.HARD   // < 8:00 /km
                paceInSeconds <= 600 -> WorkoutDifficulty.MODERATE // 8:00-10:00 /km
                else -> WorkoutDifficulty.EASY // > 10:00 /km
            }
        }
        else -> WorkoutDifficulty.MODERATE
    }
}

/**
 * Empty workouts card shown when no workouts exist
 */
@Composable
private fun EmptyWorkoutsCard() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = DeyaRunColors.Dark.Surface
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Star,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = DeyaRunColors.Primary.copy(alpha = 0.7f)
            )

            Text(
                text = "Nav ierakstītu treniņu",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = DeyaRunColors.Dark.OnSurface,
                textAlign = TextAlign.Center
            )

            Text(
                text = "Sāciet savu pirmo skrējienu, nospiežot GPS pogu apakšā!",
                fontSize = 14.sp,
                color = DeyaRunColors.Dark.TextSecondary,
                textAlign = TextAlign.Center
            )
        }
    }
}