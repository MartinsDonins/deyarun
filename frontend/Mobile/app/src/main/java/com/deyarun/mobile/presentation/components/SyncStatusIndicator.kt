package com.deyarun.mobile.presentation.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.graphicsLayer
import com.deyarun.mobile.data.sync.SyncManager
import com.deyarun.mobile.presentation.theme.DeyaRunColors

/**
 * Cloud sync status indicator for DeyaRun
 * Shows current sync state and pending operations
 */
@Composable
fun SyncStatusIndicator(
    syncStatistics: SyncManager.SyncStatistics,
    onSyncClick: () -> Unit,
    onViewUnsyncedClick: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val syncState = getSyncDisplayState(syncStatistics)

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onSyncClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = syncState.backgroundColor
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Status icon and text
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                SyncIcon(
                    icon = syncState.icon,
                    color = syncState.iconColor,
                    isAnimated = syncState.isAnimated
                )

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Text(
                        text = syncState.title,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = syncState.textColor
                    )
                    Text(
                        text = syncState.subtitle,
                        fontSize = 12.sp,
                        color = syncState.textColor.copy(alpha = 0.7f)
                    )
                }
            }

            // Pending indicators with manage button
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Show pending indicators only if there are items
                if (syncStatistics.pendingUploads > 0 || syncStatistics.pendingConflicts > 0) {
                    PendingIndicators(
                        pendingUploads = syncStatistics.pendingUploads,
                        pendingConflicts = syncStatistics.pendingConflicts
                    )
                }

                // Always show "View Unsynced" button
                IconButton(
                    onClick = onViewUnsyncedClick,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.List,
                        contentDescription = "Pārvaldīt nesinhronizētās",
                        tint = syncState.iconColor
                    )
                }
            }
        }
    }
}

@Composable
private fun SyncIcon(
    icon: ImageVector,
    color: Color,
    isAnimated: Boolean,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "sync_rotation")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = if (isAnimated) 360f else 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )

    Box(
        modifier = modifier
            .size(40.dp)
            .clip(CircleShape)
            .background(color.copy(alpha = 0.1f)),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = color,
            modifier = Modifier
                .size(20.dp)
                .then(
                    if (isAnimated) {
                        Modifier.graphicsLayer(rotationZ = rotation)
                    } else {
                        Modifier
                    }
                )
        )
    }
}

@Composable
private fun PendingIndicators(
    pendingUploads: Int,
    pendingConflicts: Int
) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (pendingUploads > 0) {
            PendingBadge(
                count = pendingUploads,
                icon = Icons.Default.DateRange,
                color = DeyaRunColors.Secondary
            )
        }

        if (pendingConflicts > 0) {
            PendingBadge(
                count = pendingConflicts,
                icon = Icons.Default.Warning,
                color = DeyaRunColors.Error
            )
        }
    }
}

@Composable
private fun PendingBadge(
    count: Int,
    icon: ImageVector,
    color: Color
) {
    Row(
        modifier = Modifier
            .background(
                color = color.copy(alpha = 0.1f),
                shape = RoundedCornerShape(12.dp)
            )
            .padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = color,
            modifier = Modifier.size(12.dp)
        )
        Text(
            text = count.toString(),
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = color
        )
    }
}

private data class SyncDisplayState(
    val icon: ImageVector,
    val iconColor: Color,
    val backgroundColor: Color,
    val textColor: Color,
    val title: String,
    val subtitle: String,
    val isAnimated: Boolean = false
)

@Composable
private fun getSyncDisplayState(statistics: SyncManager.SyncStatistics): SyncDisplayState {
    return when {
        // Syncing state
        statistics.pendingUploads > 0 && statistics.isOnline -> SyncDisplayState(
            icon = Icons.Default.Refresh,
            iconColor = DeyaRunColors.Primary,
            backgroundColor = DeyaRunColors.Primary.copy(alpha = 0.05f),
            textColor = DeyaRunColors.Dark.OnSurface,
            title = "Syncing...",
            subtitle = "Uploading ${statistics.pendingUploads} items",
            isAnimated = true
        )

        // Conflicts need attention
        statistics.pendingConflicts > 0 -> SyncDisplayState(
            icon = Icons.Default.Warning,
            iconColor = DeyaRunColors.Error,
            backgroundColor = DeyaRunColors.Error.copy(alpha = 0.05f),
            textColor = DeyaRunColors.Dark.OnSurface,
            title = "Sync Conflicts",
            subtitle = "${statistics.pendingConflicts} conflicts need attention",
            isAnimated = false
        )

        // Offline with pending data
        !statistics.isOnline && statistics.pendingUploads > 0 -> SyncDisplayState(
            icon = Icons.Default.Warning,
            iconColor = DeyaRunColors.Dark.TextMuted,
            backgroundColor = DeyaRunColors.Dark.Surface,
            textColor = DeyaRunColors.Dark.OnSurface,
            title = "Offline",
            subtitle = "${statistics.pendingUploads} items waiting to sync",
            isAnimated = false
        )

        // All synced and online
        statistics.isOnline && statistics.pendingUploads == 0 && statistics.pendingConflicts == 0 -> {
            val lastSyncText = if (statistics.lastFullSync > 0) {
                val timeAgo = getTimeAgoText(statistics.lastFullSync)
                "Synced $timeAgo"
            } else {
                "Ready to sync"
            }

            SyncDisplayState(
                icon = Icons.Default.CheckCircle,
                iconColor = DeyaRunColors.Success,
                backgroundColor = DeyaRunColors.Success.copy(alpha = 0.05f),
                textColor = DeyaRunColors.Dark.OnSurface,
                title = "All synced",
                subtitle = lastSyncText,
                isAnimated = false
            )
        }

        // Auto sync disabled
        !statistics.autoSyncEnabled -> SyncDisplayState(
            icon = Icons.Default.Star,
            iconColor = DeyaRunColors.Dark.TextMuted,
            backgroundColor = DeyaRunColors.Dark.Surface,
            textColor = DeyaRunColors.Dark.OnSurface,
            title = "Auto sync disabled",
            subtitle = "Tap to sync manually",
            isAnimated = false
        )

        // Default offline state
        else -> SyncDisplayState(
            icon = Icons.Default.Warning,
            iconColor = DeyaRunColors.Dark.TextMuted,
            backgroundColor = DeyaRunColors.Dark.Surface,
            textColor = DeyaRunColors.Dark.OnSurface,
            title = "Offline",
            subtitle = "Will sync when connected",
            isAnimated = false
        )
    }
}

private fun getTimeAgoText(timestamp: Long): String {
    val now = System.currentTimeMillis()
    val diff = now - timestamp

    return when {
        diff < 60_000 -> "just now"
        diff < 3600_000 -> "${diff / 60_000}m ago"
        diff < 86400_000 -> "${diff / 3600_000}h ago"
        else -> "${diff / 86400_000}d ago"
    }
}

/**
 * Detailed sync status dialog
 */
@Composable
fun SyncStatusDialog(
    syncStatistics: SyncManager.SyncStatistics,
    onDismiss: () -> Unit,
    onForceSync: () -> Unit,
    onClearData: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Sync Status",
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                SyncDetailItem(
                    label = "Connection",
                    value = if (syncStatistics.isOnline) "Online" else "Offline",
                    color = if (syncStatistics.isOnline) DeyaRunColors.Success else DeyaRunColors.Error
                )

                SyncDetailItem(
                    label = "Auto Sync",
                    value = if (syncStatistics.autoSyncEnabled) "Enabled" else "Disabled",
                    color = DeyaRunColors.Dark.OnSurface
                )

                SyncDetailItem(
                    label = "Pending Uploads",
                    value = syncStatistics.pendingUploads.toString(),
                    color = if (syncStatistics.pendingUploads > 0) DeyaRunColors.Secondary else DeyaRunColors.Success
                )

                SyncDetailItem(
                    label = "Conflicts",
                    value = syncStatistics.pendingConflicts.toString(),
                    color = if (syncStatistics.pendingConflicts > 0) DeyaRunColors.Error else DeyaRunColors.Success
                )

                if (syncStatistics.lastFullSync > 0) {
                    SyncDetailItem(
                        label = "Last Sync",
                        value = getTimeAgoText(syncStatistics.lastFullSync),
                        color = DeyaRunColors.Dark.OnSurface
                    )
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onForceSync) {
                Text("Force Sync")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

@Composable
private fun SyncDetailItem(
    label: String,
    value: String,
    color: Color
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            color = DeyaRunColors.Dark.TextSecondary
        )
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = color
        )
    }
}