package com.deyarun.mobile.presentation.training

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.deyarun.mobile.data.model.PlannedWorkout
import com.deyarun.mobile.presentation.theme.DeyaRunColors

@Composable
fun WorkoutCard(
    workout: PlannedWorkout,
    onWorkoutClick: () -> Unit,
    onMarkComplete: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onWorkoutClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = DeyaRunColors.Dark.Surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            // Header Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = getStatusIcon(workout.status),
                        fontSize = 24.sp
                    )
                    Column {
                        Text(
                            text = workout.name,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = DeyaRunColors.Dark.OnSurface
                        )
                        Text(
                            text = formatDate(workout.scheduledDate),
                            fontSize = 12.sp,
                            color = DeyaRunColors.Dark.OnSurface.copy(alpha = 0.7f)
                        )
                    }
                }

                WorkoutTypeBadge(workout.type)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Description
            Text(
                text = workout.description,
                fontSize = 14.sp,
                color = DeyaRunColors.Dark.OnSurface.copy(alpha = 0.8f)
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Metrics Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                MetricItem(
                    icon = "📏",
                    value = "%.1f km".format(workout.targetMetrics.totalDistance / 1000.0),
                    label = "Distance"
                )
                MetricItem(
                    icon = "⏱️",
                    value = formatDuration(workout.targetMetrics.totalDuration),
                    label = "Laiks"
                )
                MetricItem(
                    icon = "🏃",
                    value = formatPace(workout.targetMetrics.averagePace),
                    label = "Temps"
                )
            }

            // Exercises indicator
            if (workout.exercises != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ExerciseBadge("🔥 ${workout.exercises.warmup.size}", Color(0xFFFF9800))
                    ExerciseBadge("💪 ${workout.exercises.strengthening.size}", Color(0xFF4CAF50))
                    ExerciseBadge("🧘 ${workout.exercises.cooldown.size}", Color(0xFF2196F3))
                }
            }

            // Complete button
            if (workout.status == "scheduled") {
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onMarkComplete,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF4CAF50)
                    )
                ) {
                    Text("✅ Atzīmēt kā pabeigtu")
                }
            }
        }
    }
}

@Composable
fun WorkoutTypeBadge(type: String) {
    val (bgColor, textColor) = when (type) {
        "easy" -> Pair(Color(0xFF4CAF50).copy(alpha = 0.2f), Color(0xFF4CAF50))
        "tempo" -> Pair(Color(0xFFFFC107).copy(alpha = 0.2f), Color(0xFFFFC107))
        "intervals" -> Pair(Color(0xFFF44336).copy(alpha = 0.2f), Color(0xFFF44336))
        "long" -> Pair(Color(0xFF2196F3).copy(alpha = 0.2f), Color(0xFF2196F3))
        "recovery" -> Pair(Color(0xFF9C27B0).copy(alpha = 0.2f), Color(0xFF9C27B0))
        else -> Pair(Color.Gray.copy(alpha = 0.2f), Color.Gray)
    }

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(8.dp)
    ) {
        Text(
            text = type.uppercase(),
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = textColor
        )
    }
}

@Composable
fun MetricItem(icon: String, value: String, label: String) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(icon, fontSize = 16.sp)
        Text(
            value,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            color = DeyaRunColors.Dark.OnSurface
        )
        Text(
            label,
            fontSize = 10.sp,
            color = DeyaRunColors.Dark.OnSurface.copy(alpha = 0.6f)
        )
    }
}

@Composable
fun ExerciseBadge(text: String, color: Color) {
    Surface(
        color = color.copy(alpha = 0.2f),
        shape = RoundedCornerShape(12.dp)
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            fontSize = 11.sp,
            color = color
        )
    }
}

fun getStatusIcon(status: String): String {
    return when (status) {
        "scheduled" -> "📅"
        "completed" -> "✅"
        "skipped" -> "⏭️"
        "partial" -> "⚠️"
        else -> "📅"
    }
}
