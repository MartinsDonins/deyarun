package com.deyarun.mobile.presentation.training

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.deyarun.mobile.data.model.Exercise
import com.deyarun.mobile.presentation.theme.DeyaRunColors
import android.webkit.WebView
import android.webkit.WebChromeClient

@Composable
fun ExerciseVideoDialog(
    exercise: Exercise,
    onDismiss: () -> Unit
) {
    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(
            dismissOnBackPress = true,
            dismissOnClickOutside = true,
            usePlatformDefaultWidth = false
        )
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp),
            color = DeyaRunColors.Dark.Surface
        ) {
            Column(
                modifier = Modifier.fillMaxWidth()
            ) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = exercise.name,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = DeyaRunColors.Dark.OnSurface
                        )
                        Text(
                            text = exercise.description,
                            fontSize = 12.sp,
                            color = DeyaRunColors.Dark.OnSurface.copy(alpha = 0.7f)
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Aizvērt",
                            tint = DeyaRunColors.Dark.OnSurface
                        )
                    }
                }

                // Video Player (WebView for Vimeo/YouTube)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(16f / 9f)
                        .background(Color.Black)
                ) {
                    VideoPlayer(videoUrl = exercise.videoUrl)
                }

                // Exercise Details
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Duration
                    if (exercise.duration != null) {
                        DetailRow(
                            icon = "⏱️",
                            label = "Ilgums",
                            value = "${exercise.duration.min}-${exercise.duration.max} sekundes"
                        )
                    }

                    // Repetitions
                    if (exercise.repetitions != null) {
                        DetailRow(
                            icon = "🔄",
                            label = "Atkārtojumi",
                            value = "${exercise.repetitions.min}-${exercise.repetitions.max} reizes" +
                                    if (exercise.sets != null) " × ${exercise.sets.min} sērijas" else ""
                        )
                    }

                    // Target Muscles
                    if (!exercise.targetMuscles.isNullOrEmpty()) {
                        Column {
                            Text(
                                "💪 Mērķa muskuļi",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                color = DeyaRunColors.Dark.OnSurface
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                exercise.targetMuscles.take(3).forEach { muscle ->
                                    Surface(
                                        color = Color(0xFF2196F3).copy(alpha = 0.2f),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text(
                                            text = muscle,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                            fontSize = 11.sp,
                                            color = Color(0xFF2196F3)
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Close Button
                    Button(
                        onClick = onDismiss,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF4CAF50)
                        )
                    ) {
                        Text("Aizvērt")
                    }
                }
            }
        }
    }
}

@Composable
fun DetailRow(icon: String, label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(icon, fontSize = 20.sp)
        Column {
            Text(
                text = label,
                fontSize = 12.sp,
                color = DeyaRunColors.Dark.OnSurface.copy(alpha = 0.6f)
            )
            Text(
                text = value,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                color = DeyaRunColors.Dark.OnSurface
            )
        }
    }
}

@Composable
fun VideoPlayer(videoUrl: String) {
    val context = LocalContext.current

    // Determine video embed URL
    val embedUrl = when {
        videoUrl.contains("vimeo.com") -> {
            val videoId = videoUrl.split("/").lastOrNull() ?: ""
            "https://player.vimeo.com/video/$videoId?autoplay=1"
        }
        videoUrl.contains("youtube.com") || videoUrl.contains("youtu.be") -> {
            val videoId = if (videoUrl.contains("youtu.be")) {
                videoUrl.split("/").lastOrNull() ?: ""
            } else {
                videoUrl.substringAfter("v=").substringBefore("&")
            }
            "https://www.youtube.com/embed/$videoId?autoplay=1"
        }
        else -> videoUrl // Firebase or direct URL
    }

    AndroidView(
        factory = {
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.mediaPlaybackRequiresUserGesture = false
                webChromeClient = WebChromeClient()

                val html = if (embedUrl.contains("youtube") || embedUrl.contains("vimeo")) {
                    """
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body { margin: 0; padding: 0; background: #000; }
                            iframe { width: 100%; height: 100vh; border: none; }
                        </style>
                    </head>
                    <body>
                        <iframe src="$embedUrl" allowfullscreen allow="autoplay"></iframe>
                    </body>
                    </html>
                    """.trimIndent()
                } else {
                    """
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body { margin: 0; padding: 0; background: #000; }
                            video { width: 100%; height: 100vh; }
                        </style>
                    </head>
                    <body>
                        <video controls autoplay>
                            <source src="$embedUrl" type="video/mp4">
                        </video>
                    </body>
                    </html>
                    """.trimIndent()
                }

                loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
            }
        },
        modifier = Modifier.fillMaxSize()
    )

    DisposableEffect(Unit) {
        onDispose {
            // Cleanup if needed
        }
    }
}
