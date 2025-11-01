package com.deyarun.mobile.presentation.sync

import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.deyarun.mobile.data.model.Activity
import com.deyarun.mobile.data.model.StravaActivity
import com.deyarun.mobile.domain.validation.ActivityValidation
import com.deyarun.mobile.domain.validation.DuplicateCheckResult
import com.deyarun.mobile.domain.validation.DuplicateDetection
import com.deyarun.mobile.domain.validation.ValidationSeverity
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

/**
 * Enhanced unsynced activities screen with validation, fix dialog, and duplicate detection
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UnsyncedActivitiesScreen(
    unsyncedActivities: List<Activity>,
    stravaActivities: List<StravaActivity> = emptyList(),
    onDeleteActivity: (Activity) -> Unit,
    onRetrySyncActivity: (Activity) -> Unit,
    onUpdateActivity: (Activity) -> Unit,
    onBack: () -> Unit
) {
    var showDeleteDialog by remember { mutableStateOf<Activity?>(null) }
    var showFixDialog by remember { mutableStateOf<Activity?>(null) }
    var showDuplicateDialog by remember { mutableStateOf<Pair<Activity, DuplicateCheckResult>?>(null) }
    var syncingActivityId by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()

    // Validation results cache
    val validationResults = remember(unsyncedActivities) {
        unsyncedActivities.associateWith { ActivityValidation.validateActivity(it) }
    }

    // Duplicate detection results cache
    var duplicateResults by remember { mutableStateOf<Map<String, DuplicateCheckResult>>(emptyMap()) }

    // Check for duplicates when Strava activities are available
    LaunchedEffect(unsyncedActivities, stravaActivities) {
        if (stravaActivities.isNotEmpty()) {
            val results = mutableMapOf<String, DuplicateCheckResult>()
            unsyncedActivities.forEach { activity ->
                val duplicateCheck = DuplicateDetection.checkForDuplicates(activity, stravaActivities)
                if (duplicateCheck.hasDuplicates) {
                    results[activity.id] = duplicateCheck
                }
            }
            duplicateResults = results
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Nesinhronizētās Aktivitātes")
                        Text(
                            text = "${unsyncedActivities.size} aktivitātes",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, "Atpakaļ")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        if (unsyncedActivities.isEmpty()) {
            EmptyState(modifier = Modifier.padding(padding))
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Spacer(modifier = Modifier.height(8.dp))
                    InfoCard(
                        validCount = validationResults.count { it.value.isValid },
                        totalCount = unsyncedActivities.size,
                        duplicateCount = duplicateResults.size
                    )
                }

                items(
                    items = unsyncedActivities,
                    key = { it.id }
                ) { activity ->
                    val validation = validationResults[activity]
                    val duplicateCheck = duplicateResults[activity.id]
                    val isSyncing = syncingActivityId == activity.id

                    EnhancedActivityCard(
                        activity = activity,
                        validation = validation,
                        duplicateCheck = duplicateCheck,
                        isSyncing = isSyncing,
                        onFix = { showFixDialog = activity },
                        onSync = {
                            syncingActivityId = activity.id
                            scope.launch {
                                onRetrySyncActivity(activity)
                                syncingActivityId = null
                            }
                        },
                        onDelete = { showDeleteDialog = activity },
                        onViewDuplicate = { duplicate ->
                            if (duplicate != null) {
                                showDuplicateDialog = Pair(activity, duplicate)
                            }
                        }
                    )
                }

                item {
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }

    // Fix activity dialog
    showFixDialog?.let { activity ->
        FixActivityDialog(
            activity = activity,
            onSave = { updatedActivity ->
                onUpdateActivity(updatedActivity)
                showFixDialog = null
            },
            onDismiss = { showFixDialog = null }
        )
    }

    // Delete confirmation dialog
    showDeleteDialog?.let { activity ->
        DeleteActivityDialog(
            activity = activity,
            onConfirm = {
                onDeleteActivity(activity)
                showDeleteDialog = null
            },
            onDismiss = { showDeleteDialog = null }
        )
    }

    // Duplicate comparison dialog
    showDuplicateDialog?.let { (activity, duplicateCheck) ->
        DuplicateComparisonDialog(
            localActivity = activity,
            duplicateCheck = duplicateCheck,
            onDismiss = { showDuplicateDialog = null },
            onDeleteLocal = {
                onDeleteActivity(activity)
                showDuplicateDialog = null
            }
        )
    }
}

/**
 * Enhanced activity card with validation, progress, and duplicate detection
 */
@Composable
private fun EnhancedActivityCard(
    activity: Activity,
    validation: com.deyarun.mobile.domain.validation.ValidationResult?,
    duplicateCheck: DuplicateCheckResult?,
    isSyncing: Boolean,
    onFix: () -> Unit,
    onSync: () -> Unit,
    onDelete: () -> Unit,
    onViewDuplicate: (DuplicateCheckResult?) -> Unit
) {
    val dateFormat = remember { SimpleDateFormat("dd.MM.yyyy HH:mm", Locale("lv")) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = when {
                duplicateCheck != null -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
                validation?.hasErrors == true -> MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.5f)
                validation?.hasWarnings == true -> MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.5f)
                else -> MaterialTheme.colorScheme.surfaceVariant
            }
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Header: Name + Type + Validation Icon
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = activity.name,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )

                        // Validation icon
                        validation?.let { result ->
                            Text(
                                text = ActivityValidation.getValidationIcon(result),
                                fontSize = 18.sp
                            )
                        }
                    }

                    Text(
                        text = dateFormat.format(activity.startTime),
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }

                // Type badge
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        text = activity.type.name,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Stats row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                StatItem(
                    icon = Icons.Default.LocationOn,
                    label = "Distance",
                    value = "%.2f km".format(activity.totalDistance / 1000)
                )
                StatItem(
                    icon = Icons.Default.DateRange,
                    label = "Ilgums",
                    value = formatDuration(activity.totalDuration)
                )
                StatItem(
                    icon = Icons.Default.Star,
                    label = "Temps",
                    value = formatPace(activity.averagePace)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Additional stats row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                StatItem(
                    icon = Icons.Default.Favorite,
                    label = "Kalorijas",
                    value = "${activity.calories}"
                )
                StatItem(
                    icon = Icons.Default.LocationOn,
                    label = "GPS punkti",
                    value = "${activity.gpsPoints.size}",
                    valueColor = if (activity.gpsPoints.isEmpty()) {
                        MaterialTheme.colorScheme.error
                    } else {
                        MaterialTheme.colorScheme.onSurface
                    }
                )
            }

            // Validation issues
            validation?.let { result ->
                if (result.issues.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(12.dp))

                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = when {
                                result.hasErrors -> MaterialTheme.colorScheme.errorContainer
                                result.hasWarnings -> MaterialTheme.colorScheme.tertiaryContainer
                                else -> MaterialTheme.colorScheme.surfaceVariant
                            }
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = if (result.hasErrors) {
                                    "❌ ${result.errorCount} kļūdas"
                                } else {
                                    "⚠️ ${result.warningCount} brīdinājumi"
                                },
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )

                            result.issues.take(3).forEach { issue ->
                                Text(
                                    text = "• ${issue.message}",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                                )
                            }

                            if (result.issues.size > 3) {
                                Text(
                                    text = "+ ${result.issues.size - 3} vēl...",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                                )
                            }
                        }
                    }
                }
            }

            // Duplicate warning
            duplicateCheck?.let { duplicate ->
                Spacer(modifier = Modifier.height(12.dp))

                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFFFF9800).copy(alpha = 0.2f)
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "⚠️ Iespējams dublikāts",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFE65100)
                            )
                            duplicate.bestMatch?.let { match ->
                                Text(
                                    text = "${match.stravaActivity.name} (${DuplicateDetection.formatSimilarityScore(match.similarityScore)} līdzība)",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                )
                            }
                        }

                        TextButton(onClick = { onViewDuplicate(duplicate) }) {
                            Text("Salīdzināt", fontSize = 12.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Action buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // FIX button (only if has errors)
                if (validation?.hasErrors == true) {
                    FilledTonalButton(
                        onClick = onFix,
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = MaterialTheme.colorScheme.tertiaryContainer
                        )
                    ) {
                        Icon(
                            Icons.Default.Edit,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("LABOT")
                    }

                    Spacer(modifier = Modifier.width(8.dp))
                }

                // SYNC button
                Button(
                    onClick = onSync,
                    enabled = !isSyncing && validation?.isValid == true
                ) {
                    if (isSyncing) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Sinhronizē...")
                    } else {
                        Icon(
                            Icons.Default.CheckCircle,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("SINHRONIZĒT")
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                // DELETE button
                IconButton(onClick = onDelete) {
                    Icon(
                        Icons.Default.Delete,
                        contentDescription = "Dzēst",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

/**
 * Info card with summary statistics
 */
@Composable
private fun InfoCard(validCount: Int, totalCount: Int, duplicateCount: Int) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Nesinhronizēto aktivitāšu pārskats",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Divider()

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                SummaryItem(
                    icon = "✅",
                    label = "Gatavas",
                    value = "$validCount"
                )
                SummaryItem(
                    icon = "❌",
                    label = "Ar kļūdām",
                    value = "${totalCount - validCount}"
                )
                SummaryItem(
                    icon = "⚠️",
                    label = "Dublikāti",
                    value = "$duplicateCount"
                )
            }

            if (validCount < totalCount) {
                Text(
                    text = "Izmantojiet LABOT pogu, lai labotu aktivitātes ar kļūdām.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                )
            }
        }
    }
}

@Composable
private fun SummaryItem(icon: String, label: String, value: String) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Text(
            text = icon,
            fontSize = 24.sp
        )
        Text(
            text = value,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            text = label,
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
        )
    }
}

/**
 * Stat item with icon, label, and value
 */
@Composable
private fun StatItem(
    icon: ImageVector,
    label: String,
    value: String,
    valueColor: Color = MaterialTheme.colorScheme.onSurface
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.size(14.dp),
                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
            Text(
                text = label,
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = valueColor
        )
    }
}

/**
 * Delete activity confirmation dialog
 */
@Composable
private fun DeleteActivityDialog(
    activity: Activity,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                Icons.Default.Delete,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error
            )
        },
        title = { Text("Dzēst aktivitāti?") },
        text = {
            Text("Vai tiešām vēlaties dzēst aktivitāti \"${activity.name}\"? Šo darbību nevar atcelt.")
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                )
            ) {
                Text("Dzēst")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Atcelt")
            }
        }
    )
}

/**
 * Duplicate comparison dialog
 */
@Composable
private fun DuplicateComparisonDialog(
    localActivity: Activity,
    duplicateCheck: DuplicateCheckResult,
    onDismiss: () -> Unit,
    onDeleteLocal: () -> Unit
) {
    val bestMatch = duplicateCheck.bestMatch ?: return

    AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            Icon(
                Icons.Default.Warning,
                contentDescription = null,
                tint = Color(0xFFFF9800)
            )
        },
        title = { Text("Iespējams dublikāts") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Atrasta līdzīga Strava aktivitāte:",
                    fontWeight = FontWeight.Bold
                )

                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "Lokālā aktivitāte:",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = localActivity.name,
                            fontSize = 14.sp
                        )
                        Text(
                            text = "%.2f km • %s".format(
                                localActivity.totalDistance / 1000,
                                formatDuration(localActivity.totalDuration)
                            ),
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }
                }

                Icon(
                    Icons.Default.Build,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp),
                    tint = MaterialTheme.colorScheme.primary
                )

                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "Strava aktivitāte:",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = bestMatch.stravaActivity.name,
                            fontSize = 14.sp
                        )
                        Text(
                            text = "%.2f km • %s".format(
                                bestMatch.stravaActivity.distance / 1000,
                                formatDuration(bestMatch.stravaActivity.movingTime * 1000L)
                            ),
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }
                }

                Divider()

                Text(
                    text = "Līdzības pakāpe: ${DuplicateDetection.formatSimilarityScore(bestMatch.similarityScore)}",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )

                Text(
                    text = "Sakritības:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
                bestMatch.matchReasons.forEach { reason ->
                    Text(
                        text = "• $reason",
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onDeleteLocal,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                )
            ) {
                Text("Dzēst lokālo")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Aizvērt")
            }
        }
    )
}

/**
 * Empty state when no unsynced activities
 */
@Composable
private fun EmptyState(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.Check,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.5f)
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Visas aktivitātes ir sinhronizētas!",
            fontSize = 18.sp,
            fontWeight = FontWeight.Medium
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Nav nesinhronizētu aktivitāšu",
            fontSize = 14.sp,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )
    }
}

private fun formatDuration(milliseconds: Long): String {
    val seconds = (milliseconds / 1000) % 60
    val minutes = (milliseconds / (1000 * 60)) % 60
    val hours = (milliseconds / (1000 * 60 * 60))

    return when {
        hours > 0 -> "%d:%02d:%02d".format(hours, minutes, seconds)
        else -> "%d:%02d".format(minutes, seconds)
    }
}

private fun formatPace(averagePace: Double): String {
    if (averagePace <= 0) return "0:00"
    val paceSeconds = averagePace.toInt()
    val minutes = paceSeconds / 60
    val seconds = paceSeconds % 60
    return "%d:%02d/km".format(minutes, seconds)
}
