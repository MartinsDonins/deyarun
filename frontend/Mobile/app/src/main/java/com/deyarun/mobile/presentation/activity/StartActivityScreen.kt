package com.deyarun.mobile.presentation.activity

import androidx.compose.animation.core.*
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.deyarun.mobile.data.model.ActivityType
import com.deyarun.mobile.presentation.theme.DeyaRunColors
import com.deyarun.mobile.presentation.viewmodel.ActivityViewModel
import com.deyarun.mobile.presentation.viewmodel.ActivityViewModelFactory
import com.deyarun.mobile.utils.LocationManager
import com.deyarun.mobile.utils.PermissionManager
import com.deyarun.mobile.data.local.dao.ActivityDao
import com.deyarun.mobile.data.sync.ActivitySyncManager
import com.deyarun.mobile.presentation.components.ActivitySyncIndicator
import androidx.activity.ComponentActivity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StartActivityScreen(
    activityDao: ActivityDao,
    userId: String,
    onActivityStarted: () -> Unit,
    onBackClick: () -> Unit
) {
    val context = LocalContext.current
    val activity = context as? ComponentActivity
    val locationManager = remember { LocationManager(context) }
    val permissionManager = remember { PermissionManager(context) }
    val syncManager = remember { ActivitySyncManager(context, activityDao, userId) }
    val activityViewModelFactory = remember {
        ActivityViewModelFactory(activityDao, locationManager, syncManager, userId)
    }
    val activityViewModel: ActivityViewModel = viewModel(factory = activityViewModelFactory)
    val activityState by activityViewModel.activityState.collectAsState()

    var selectedActivityType by remember { mutableStateOf<ActivityType?>(ActivityType.RUNNING) }
    var showPermissionDialog by remember { mutableStateOf(false) }

    // Animation
    val infiniteTransition = rememberInfiniteTransition(label = "")
    val animatedScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ), label = ""
    )

    // Reset tracking state when entering StartActivityScreen if no active activity
    LaunchedEffect(activityState.currentActivity, activityState.isTracking) {
        val currentActivity = activityState.currentActivity
        println("DEBUG StartActivity LaunchedEffect: currentActivity=${currentActivity?.id}, status=${currentActivity?.status}, isTracking=${activityState.isTracking}")

        // If there's no current activity or it's not active, but isTracking is true, reset it
        if (activityState.isTracking &&
            (currentActivity == null || currentActivity.status != com.deyarun.mobile.data.model.ActivityStatus.ACTIVE)) {
            println("DEBUG StartActivity: No active activity found, resetting tracking state")
            activityViewModel.resetTrackingState()
        }
    }

    // Navigation effect - navigate when activity is successfully started
    LaunchedEffect(activityState.currentActivity) {
        val currentActivity = activityState.currentActivity
        if (currentActivity != null &&
            currentActivity.status == com.deyarun.mobile.data.model.ActivityStatus.ACTIVE &&
            activityState.isTracking) {
            println("DEBUG StartActivity: Activity started successfully, navigating to active_activity")
            onActivityStarted()
        }
    }

    LaunchedEffect(activityState.error) {
        // FIX-052.5: Safe null handling instead of !! operator
        if (activityState.error?.contains("permission") == true) {
            showPermissionDialog = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Start Activity",
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
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Header - Compact
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = DeyaRunColors.Dark.Surface
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.PlayArrow,
                            contentDescription = null,
                            modifier = Modifier
                                .size(32.dp)
                                .scale(animatedScale),
                            tint = DeyaRunColors.Primary
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = "Choose Your Activity",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = DeyaRunColors.Dark.OnSurface,
                            textAlign = TextAlign.Center
                        )

                        Text(
                            text = "Select activity type to start GPS tracking",
                            fontSize = 12.sp,
                            color = DeyaRunColors.Dark.TextSecondary,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Activity Type Selection
                Text(
                    text = "Activity Type",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = DeyaRunColors.Dark.OnBackground,
                    modifier = Modifier.padding(horizontal = 4.dp)
                )

                // Activity Options Grid
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp) // Reduced spacing between rows
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ActivityTypeCard(
                            type = ActivityType.RUNNING,
                            icon = Icons.Default.Star,
                            title = "Running",
                            description = "Track your runs",
                            isSelected = selectedActivityType == ActivityType.RUNNING,
                            onClick = { selectedActivityType = ActivityType.RUNNING },
                            modifier = Modifier.weight(1f)
                        )

                        ActivityTypeCard(
                            type = ActivityType.WALKING,
                            icon = Icons.Default.Favorite,
                            title = "Walking",
                            description = "Track your walks",
                            isSelected = selectedActivityType == ActivityType.WALKING,
                            onClick = { selectedActivityType = ActivityType.WALKING },
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ActivityTypeCard(
                            type = ActivityType.CYCLING,
                            icon = Icons.Default.Star,
                            title = "Cycling",
                            description = "Track your rides",
                            isSelected = selectedActivityType == ActivityType.CYCLING,
                            onClick = { selectedActivityType = ActivityType.CYCLING },
                            modifier = Modifier.weight(1f)
                        )

                        ActivityTypeCard(
                            type = ActivityType.HIKING,
                            icon = Icons.Default.Build,
                            title = "Hiking",
                            description = "Track your hikes",
                            isSelected = selectedActivityType == ActivityType.HIKING,
                            onClick = { selectedActivityType = ActivityType.HIKING },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Sync Status Indicator
                ActivitySyncIndicator(
                    syncManager = syncManager,
                    onManualSync = { activityViewModel.manualSync() }
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Error Message
                if (activityState.error != null) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = DeyaRunColors.Error.copy(alpha = 0.1f)
                        )
                    ) {
                        Text(
                            // FIX-052.5: Safe null handling instead of !! operator
                            text = activityState.error ?: "Unknown error",
                            color = DeyaRunColors.Error,
                            fontSize = 14.sp,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }

                // Start Button
                val buttonEnabled = selectedActivityType != null && !activityState.isTracking
                println("DEBUG StartActivity: selectedActivityType=$selectedActivityType, isTracking=${activityState.isTracking}, buttonEnabled=$buttonEnabled")

                Button(
                    onClick = {
                        selectedActivityType?.let { type ->
                            if (activityState.hasLocationPermission) {
                                println("DEBUG StartActivity: Starting activity of type $type")
                                activityViewModel.startActivity(type)
                            } else {
                                showPermissionDialog = true
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    enabled = buttonEnabled,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = DeyaRunColors.Primary,
                        contentColor = Color.White
                    ),
                    shape = RoundedCornerShape(28.dp)
                ) {
                    if (activityState.isTracking) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            strokeWidth = 2.dp,
                            color = Color.White
                        )
                    } else {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.PlayArrow,
                                contentDescription = null,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Start Activity",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }

            // Permission Dialog
            if (showPermissionDialog) {
                AlertDialog(
                    onDismissRequest = { showPermissionDialog = false },
                    title = { Text("Location Permission Required") },
                    text = {
                        Text("GPS tracking requires location permission to record your activity. Please grant location permission to continue.")
                    },
                    confirmButton = {
                        TextButton(
                            onClick = {
                                showPermissionDialog = false
                                activity?.let { act ->
                                    permissionManager.requestLocationPermissions(act) { granted ->
                                        if (granted) {
                                            // Refresh permission status
                                            activityViewModel.checkLocationPermission()
                                        }
                                    }
                                }
                            }
                        ) {
                            Text("Grant Permission")
                        }
                    },
                    dismissButton = {
                        TextButton(
                            onClick = { showPermissionDialog = false }
                        ) {
                            Text("Cancel")
                        }
                    }
                )
            }
        }
    }
}

@Composable
private fun ActivityTypeCard(
    type: ActivityType,
    icon: ImageVector,
    title: String,
    description: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val animatedBorder by animateColorAsState(
        targetValue = if (isSelected) DeyaRunColors.Primary else Color.Transparent,
        animationSpec = tween(300), label = ""
    )

    Card(
        modifier = modifier
            .aspectRatio(1.2f) // Wider aspect ratio
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected)
                DeyaRunColors.Primary.copy(alpha = 0.1f)
            else
                DeyaRunColors.Dark.Surface
        ),
        border = androidx.compose.foundation.BorderStroke(
            width = 2.dp,
            color = animatedBorder
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(10.dp), // Reduced padding
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(24.dp), // Smaller icon
                tint = if (isSelected) DeyaRunColors.Primary else DeyaRunColors.Dark.TextSecondary
            )

            Spacer(modifier = Modifier.height(4.dp)) // Reduced spacing

            Text(
                text = title,
                fontSize = 13.sp, // Smaller text
                fontWeight = FontWeight.SemiBold,
                color = if (isSelected) DeyaRunColors.Primary else DeyaRunColors.Dark.OnSurface,
                textAlign = TextAlign.Center
            )

            Text(
                text = description,
                fontSize = 10.sp, // Smaller description
                color = DeyaRunColors.Dark.TextSecondary,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 1.dp)
            )
        }
    }
}