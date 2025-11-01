package com.deyarun.mobile.presentation.sync

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.deyarun.mobile.data.model.Activity
import com.deyarun.mobile.data.model.ActivityType
import com.deyarun.mobile.domain.validation.ActivityValidation
import com.deyarun.mobile.domain.validation.ValidationSeverity
import java.text.SimpleDateFormat
import java.util.*

/**
 * Dialog for editing/fixing unsynced activities
 * Allows user to modify activity fields to resolve validation issues
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FixActivityDialog(
    activity: Activity,
    onSave: (Activity) -> Unit,
    onDismiss: () -> Unit
) {
    // Editable state
    var editedName by remember { mutableStateOf(activity.name) }
    var editedType by remember { mutableStateOf(activity.type) }
    var editedDistance by remember { mutableStateOf((activity.totalDistance / 1000).toString()) } // Convert to km
    var editedDuration by remember { mutableStateOf(formatDurationForEdit(activity.totalDuration)) }
    var editedCalories by remember { mutableStateOf(activity.calories.toString()) }

    // Validation state
    var nameError by remember { mutableStateOf<String?>(null) }
    var distanceError by remember { mutableStateOf<String?>(null) }
    var durationError by remember { mutableStateOf<String?>(null) }

    // Show type dropdown
    var showTypeDropdown by remember { mutableStateOf(false) }

    // Real-time validation
    val isFormValid = remember(editedName, editedDistance, editedDuration) {
        editedName.isNotBlank() &&
        editedDistance.toDoubleOrNull() != null &&
        parseDuration(editedDuration) != null
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Default.Edit, contentDescription = null)
                Text("Labot aktivitāti")
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Original validation issues
                val validation = ActivityValidation.validateActivity(activity)
                if (validation.issues.isNotEmpty()) {
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = "Atrastās problēmas:",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                            validation.issues
                                .filter { it.severity == ValidationSeverity.ERROR }
                                .forEach { issue ->
                                    Text(
                                        text = "• ${issue.message}",
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onErrorContainer
                                    )
                                }
                        }
                    }
                }

                // Name field
                OutlinedTextField(
                    value = editedName,
                    onValueChange = {
                        editedName = it
                        nameError = if (it.isBlank()) "Nosaukums nevar būt tukšs" else null
                    },
                    label = { Text("Nosaukums *") },
                    isError = nameError != null,
                    supportingText = nameError?.let { { Text(it) } },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                // Activity type selector
                ExposedDropdownMenuBox(
                    expanded = showTypeDropdown,
                    onExpandedChange = { showTypeDropdown = it }
                ) {
                    OutlinedTextField(
                        value = getActivityTypeDisplayName(editedType),
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Tips *") },
                        trailingIcon = {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = showTypeDropdown)
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor()
                    )

                    ExposedDropdownMenu(
                        expanded = showTypeDropdown,
                        onDismissRequest = { showTypeDropdown = false }
                    ) {
                        ActivityType.values().forEach { type ->
                            DropdownMenuItem(
                                text = { Text(getActivityTypeDisplayName(type)) },
                                onClick = {
                                    editedType = type
                                    showTypeDropdown = false
                                },
                                leadingIcon = {
                                    Icon(
                                        getActivityTypeIcon(type),
                                        contentDescription = null
                                    )
                                }
                            )
                        }
                    }
                }

                // Distance field
                OutlinedTextField(
                    value = editedDistance,
                    onValueChange = {
                        editedDistance = it
                        distanceError = when {
                            it.toDoubleOrNull() == null -> "Ievadiet derīgu skaitli"
                            it.toDouble() <= 0 -> "Distance jābūt lielākai par 0"
                            it.toDouble() > 500 -> "Distance pārāk liela (max 500km)"
                            else -> null
                        }
                    },
                    label = { Text("Distance (km) *") },
                    isError = distanceError != null,
                    supportingText = distanceError?.let { { Text(it) } },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    trailingIcon = {
                        Text("km", fontSize = 12.sp)
                    },
                    modifier = Modifier.fillMaxWidth()
                )

                // Duration field
                OutlinedTextField(
                    value = editedDuration,
                    onValueChange = {
                        editedDuration = it
                        durationError = if (parseDuration(it) == null) {
                            "Formāts: HH:MM:SS vai MM:SS"
                        } else {
                            null
                        }
                    },
                    label = { Text("Ilgums *") },
                    placeholder = { Text("HH:MM:SS vai MM:SS") },
                    isError = durationError != null,
                    supportingText = durationError?.let { { Text(it) } },
                    singleLine = true,
                    trailingIcon = {
                        Icon(Icons.Default.DateRange, contentDescription = null)
                    },
                    modifier = Modifier.fillMaxWidth()
                )

                // Calories field (optional)
                OutlinedTextField(
                    value = editedCalories,
                    onValueChange = {
                        editedCalories = it
                    },
                    label = { Text("Kalorijas") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    trailingIcon = {
                        Text("kcal", fontSize = 12.sp)
                    },
                    modifier = Modifier.fillMaxWidth()
                )

                // GPS points info (read-only)
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "GPS punkti:",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "${activity.gpsPoints.size}",
                            fontSize = 14.sp,
                            color = if (activity.gpsPoints.isEmpty()) {
                                MaterialTheme.colorScheme.error
                            } else {
                                MaterialTheme.colorScheme.primary
                            }
                        )
                    }
                }

                // Activity date info (read-only)
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Text(
                            text = "Aktivitātes datums:",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = SimpleDateFormat("dd.MM.yyyy HH:mm", Locale("lv")).format(activity.startTime),
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Divider()

                // Info message
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        Icons.Default.Info,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = "Pēc izmaiņu saglabāšanas aktivitāte tiks automātiski pārsinhronizēta.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    // Parse and validate all fields
                    val distanceInMeters = (editedDistance.toDoubleOrNull() ?: 0.0) * 1000
                    val durationInMs = parseDuration(editedDuration) ?: 0L
                    val caloriesInt = editedCalories.toIntOrNull() ?: 0

                    // Calculate average pace if valid data
                    val averagePace = if (distanceInMeters > 0 && durationInMs > 0) {
                        (durationInMs / 1000.0) / (distanceInMeters / 1000.0)
                    } else {
                        0.0
                    }

                    // Create updated activity
                    val updatedActivity = activity.copy(
                        name = editedName.trim(),
                        type = editedType,
                        totalDistance = distanceInMeters,
                        totalDuration = durationInMs,
                        averagePace = averagePace,
                        calories = caloriesInt,
                        updatedAt = Date() // Mark as modified
                    )

                    onSave(updatedActivity)
                },
                enabled = isFormValid
            ) {
                Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Saglabāt")
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
 * Get display name for activity type
 */
private fun getActivityTypeDisplayName(type: ActivityType): String {
    return when (type) {
        ActivityType.RUNNING -> "Skriešana"
        ActivityType.WALKING -> "Pastaiga"
        ActivityType.CYCLING -> "Riteņbraukšana"
        ActivityType.HIKING -> "Pārgājiens"
    }
}

/**
 * Get icon for activity type
 */
private fun getActivityTypeIcon(type: ActivityType): androidx.compose.ui.graphics.vector.ImageVector {
    return when (type) {
        ActivityType.RUNNING -> Icons.Default.Star
        ActivityType.WALKING -> Icons.Default.Favorite
        ActivityType.CYCLING -> Icons.Default.Star
        ActivityType.HIKING -> Icons.Default.Build
    }
}

/**
 * Format duration for editing (HH:MM:SS or MM:SS)
 */
private fun formatDurationForEdit(milliseconds: Long): String {
    val seconds = (milliseconds / 1000) % 60
    val minutes = (milliseconds / (1000 * 60)) % 60
    val hours = (milliseconds / (1000 * 60 * 60))

    return if (hours > 0) {
        "%d:%02d:%02d".format(hours, minutes, seconds)
    } else {
        "%d:%02d".format(minutes, seconds)
    }
}

/**
 * Parse duration from string (supports HH:MM:SS and MM:SS)
 * Returns duration in milliseconds or null if invalid
 */
private fun parseDuration(durationStr: String): Long? {
    return try {
        val parts = durationStr.split(":")

        when (parts.size) {
            2 -> { // MM:SS
                val minutes = parts[0].toLong()
                val seconds = parts[1].toLong()
                (minutes * 60 + seconds) * 1000
            }
            3 -> { // HH:MM:SS
                val hours = parts[0].toLong()
                val minutes = parts[1].toLong()
                val seconds = parts[2].toLong()
                (hours * 3600 + minutes * 60 + seconds) * 1000
            }
            else -> null
        }
    } catch (e: Exception) {
        null
    }
}
