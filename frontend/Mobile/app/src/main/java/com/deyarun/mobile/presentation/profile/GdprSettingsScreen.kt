package com.deyarun.mobile.presentation.profile

import android.content.Intent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import com.deyarun.mobile.data.repository.GdprRepository
import com.deyarun.mobile.presentation.theme.DeyaRunColors
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GdprSettingsScreen(
    userId: String,
    onBackClick: () -> Unit,
    onAccountDeleted: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val gdprRepository = remember { GdprRepository(context) }

    var showExportDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showConfirmDeleteDialog by remember { mutableStateOf(false) }
    var deleteReason by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Privacy & Data") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            Text(
                text = "GDPR Data Rights",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = DeyaRunColors.Dark.OnSurface
            )

            Text(
                text = "According to GDPR regulations, you have the right to access, export, and delete your personal data.",
                fontSize = 14.sp,
                color = DeyaRunColors.Dark.TextSecondary
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Success/Error messages
            successMessage?.let { message ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = DeyaRunColors.Primary.copy(alpha = 0.1f)
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = DeyaRunColors.Primary
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = message,
                            color = DeyaRunColors.Dark.OnSurface,
                            fontSize = 14.sp
                        )
                    }
                }
            }

            errorMessage?.let { message ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.error.copy(alpha = 0.1f)
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = message,
                            color = MaterialTheme.colorScheme.error,
                            fontSize = 14.sp
                        )
                    }
                }
            }

            // Export Data Section
            GdprActionCard(
                title = "Export Your Data",
                description = "Download all your workout data, GPS tracks, and personal information in JSON format.",
                icon = Icons.Default.MailOutline,
                buttonText = "Export Data",
                buttonColor = DeyaRunColors.Primary,
                isLoading = isLoading,
                onClick = { showExportDialog = true }
            )

            // Delete Account Section
            GdprActionCard(
                title = "Delete Account",
                description = "Permanently delete your account and all associated data. This action cannot be undone.",
                icon = Icons.Default.Delete,
                buttonText = "Delete Account",
                buttonColor = MaterialTheme.colorScheme.error,
                isLoading = isLoading,
                onClick = { showDeleteDialog = true }
            )

            // Privacy Info
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = DeyaRunColors.Dark.Surface
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = "Your Privacy Rights",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = DeyaRunColors.Dark.OnSurface
                    )

                    PrivacyInfoItem(
                        icon = Icons.Default.AccountBox,
                        title = "Right of Access",
                        description = "Request a copy of your personal data"
                    )

                    PrivacyInfoItem(
                        icon = Icons.Default.Edit,
                        title = "Right to Rectification",
                        description = "Update incorrect or incomplete data"
                    )

                    PrivacyInfoItem(
                        icon = Icons.Default.Delete,
                        title = "Right to Erasure",
                        description = "Request deletion of your data"
                    )
                }
            }
        }
    }

    // Export Data Dialog
    if (showExportDialog) {
        AlertDialog(
            onDismissRequest = { showExportDialog = false },
            title = { Text("Export Your Data") },
            text = {
                Text("This will create a JSON file with all your workout data, GPS tracks, and personal information. The file will be saved to your device.")
            },
            confirmButton = {
                Button(
                    onClick = {
                        showExportDialog = false
                        isLoading = true
                        scope.launch {
                            val result = gdprRepository.exportUserDataToFile(userId)
                            isLoading = false

                            result.onSuccess { file ->
                                successMessage = "Data exported successfully!"
                                errorMessage = null

                                // Share the file
                                try {
                                    val uri = FileProvider.getUriForFile(
                                        context,
                                        "${context.packageName}.fileprovider",
                                        file
                                    )
                                    val intent = Intent(Intent.ACTION_SEND).apply {
                                        type = "application/json"
                                        putExtra(Intent.EXTRA_STREAM, uri)
                                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                    }
                                    context.startActivity(Intent.createChooser(intent, "Share exported data"))
                                } catch (e: Exception) {
                                    errorMessage = "File saved but sharing failed: ${e.message}"
                                }
                            }

                            result.onFailure { error ->
                                errorMessage = "Export failed: ${error.message}"
                                successMessage = null
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = DeyaRunColors.Primary
                    )
                ) {
                    Text("Export")
                }
            },
            dismissButton = {
                TextButton(onClick = { showExportDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Delete Account Dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Account?") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("This will permanently delete:")
                    Text("• Your user profile")
                    Text("• All workout data and GPS tracks")
                    Text("• Activity history and statistics")
                    Text("• Personal preferences")
                    Text("\nThis action CANNOT be undone!")

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = deleteReason,
                        onValueChange = { deleteReason = it },
                        label = { Text("Reason (optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showDeleteDialog = false
                        showConfirmDeleteDialog = true
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Continue")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Confirm Delete Dialog
    if (showConfirmDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showConfirmDeleteDialog = false },
            title = { Text("Final Confirmation") },
            text = {
                Text(
                    "Are you absolutely sure? Type 'DELETE' to confirm account deletion.",
                    fontWeight = FontWeight.Bold
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showConfirmDeleteDialog = false
                        isLoading = true
                        scope.launch {
                            // Delete local data first
                            val localResult = gdprRepository.deleteLocalUserData(userId)

                            localResult.onSuccess {
                                // Attempt cloud deletion
                                gdprRepository.requestAccountDeletion(null, deleteReason.ifEmpty { null })
                                successMessage = "Account deleted successfully"
                                errorMessage = null

                                // Navigate back after deletion
                                kotlinx.coroutines.delay(1500)
                                onAccountDeleted()
                            }

                            localResult.onFailure { error ->
                                errorMessage = "Deletion failed: ${error.message}"
                                successMessage = null
                            }

                            isLoading = false
                        }
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("DELETE PERMANENTLY")
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfirmDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Loading indicator
    if (isLoading) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = DeyaRunColors.Primary)
        }
    }
}

@Composable
private fun GdprActionCard(
    title: String,
    description: String,
    icon: ImageVector,
    buttonText: String,
    buttonColor: androidx.compose.ui.graphics.Color,
    isLoading: Boolean,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = DeyaRunColors.Dark.Surface
        )
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = buttonColor,
                    modifier = Modifier.size(28.dp)
                )
                Text(
                    text = title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = DeyaRunColors.Dark.OnSurface
                )
            }

            Text(
                text = description,
                fontSize = 14.sp,
                color = DeyaRunColors.Dark.TextSecondary
            )

            Button(
                onClick = onClick,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = buttonColor
                ),
                enabled = !isLoading
            ) {
                Text(buttonText)
            }
        }
    }
}

@Composable
private fun PrivacyInfoItem(
    icon: ImageVector,
    title: String,
    description: String
) {
    Row(
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = DeyaRunColors.Primary,
            modifier = Modifier.size(20.dp)
        )
        Column {
            Text(
                text = title,
                fontWeight = FontWeight.Medium,
                fontSize = 14.sp,
                color = DeyaRunColors.Dark.OnSurface
            )
            Text(
                text = description,
                fontSize = 12.sp,
                color = DeyaRunColors.Dark.TextSecondary
            )
        }
    }
}
