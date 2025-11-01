package com.deyarun.mobile.presentation.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.deyarun.mobile.data.sync.ActivitySyncManager

@Composable
fun ActivitySyncIndicator(
    syncManager: ActivitySyncManager,
    onManualSync: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val syncState by syncManager.syncState.collectAsStateWithLifecycle()

    if (syncState.pendingUploads > 0 || syncState.isSyncing) {
        Card(
            modifier = modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (syncState.isSyncing)
                    Color(0xFF2196F3).copy(alpha = 0.1f)
                else
                    Color(0xFFFFC107).copy(alpha = 0.1f)
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = if (syncState.isSyncing) {
                            "Sinhronizē ar serveri..."
                        } else {
                            "${syncState.pendingUploads} aktivitātes gaida sinhronizāciju"
                        },
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    if (syncState.lastSyncTime > 0) {
                        val timeDiff = System.currentTimeMillis() - syncState.lastSyncTime
                        val minutesAgo = (timeDiff / (1000 * 60)).toInt()

                        Text(
                            text = if (minutesAgo == 0) {
                                "Tikko sinhronizēts"
                            } else {
                                "Pēdējā sinhronizācija: pirms $minutesAgo min"
                            },
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }

                    // Show sync errors if any
                    if (syncState.syncErrors.isNotEmpty()) {
                        // Log sync errors to console for debugging
                        LaunchedEffect(syncState.syncErrors) {
                            println("DEBUG ActivitySyncIndicator: ${syncState.syncErrors.size} sync errors detected:")
                            syncState.syncErrors.forEach { error ->
                                println("DEBUG - Error Type: ${error.type}, Message: ${error.message}, Details: ${error.details}")
                            }
                        }

                        Text(
                            text = "Sinhronizācijas kļūda (vecākas aktivitātes)",
                            fontSize = 12.sp,
                            color = Color(0xFFFFC107) // Warning color instead of error
                        )
                    }
                }

                // Sync button
                if (!syncState.isSyncing) {
                    Button(
                        onClick = onManualSync,
                        modifier = Modifier.size(width = 100.dp, height = 36.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF00BF63)
                        )
                    ) {
                        Text(
                            text = "Sinhronizēt",
                            fontSize = 12.sp,
                            color = Color.White
                        )
                    }
                } else {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        strokeWidth = 2.dp,
                        color = Color(0xFF00BF63)
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SyncStatusBadge(
    pendingUploads: Int,
    modifier: Modifier = Modifier
) {
    if (pendingUploads > 0) {
        Badge(
            modifier = modifier,
            containerColor = Color(0xFFFFC107)
        ) {
            Text(
                text = pendingUploads.toString(),
                color = Color.Black,
                fontSize = 10.sp
            )
        }
    }
}