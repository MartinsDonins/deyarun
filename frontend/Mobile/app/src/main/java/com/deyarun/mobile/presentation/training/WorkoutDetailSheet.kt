package com.deyarun.mobile.presentation.training

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.deyarun.mobile.data.model.Exercise
import com.deyarun.mobile.data.model.PlannedWorkout
import com.deyarun.mobile.presentation.theme.DeyaRunColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkoutDetailSheet(
    workout: PlannedWorkout,
    onDismiss: () -> Unit,
    onExerciseClick: (Exercise) -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = DeyaRunColors.Dark.Background
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = workout.name,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = DeyaRunColors.Dark.OnBackground
                        )
                        Text(
                            text = workout.description,
                            fontSize = 14.sp,
                            color = DeyaRunColors.Dark.OnBackground.copy(alpha = 0.7f)
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Aizvērt",
                            tint = DeyaRunColors.Dark.OnBackground
                        )
                    }
                }
            }

            // Instructions
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = DeyaRunColors.Dark.Surface
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "📋 Instrukcijas",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = DeyaRunColors.Dark.OnSurface
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Iesildīšanās: ${workout.warmupInstructions}",
                            fontSize = 14.sp,
                            color = DeyaRunColors.Dark.OnSurface.copy(alpha = 0.8f)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "Nomierināšanās: ${workout.cooldownInstructions}",
                            fontSize = 14.sp,
                            color = DeyaRunColors.Dark.OnSurface.copy(alpha = 0.8f)
                        )
                    }
                }
            }

            // Coaching Tips
            if (workout.coachingTips.isNotEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = DeyaRunColors.Dark.Surface
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                "💡 Trenera padomi",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = DeyaRunColors.Dark.OnSurface
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            workout.coachingTips.forEach { tip ->
                                Text(
                                    "• $tip",
                                    fontSize = 14.sp,
                                    color = DeyaRunColors.Dark.OnSurface.copy(alpha = 0.8f),
                                    modifier = Modifier.padding(vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            }

            // Warmup Exercises
            if (workout.exercises?.warmup?.isNotEmpty() == true) {
                item {
                    ExerciseSection(
                        title = "🔥 Iesildīšanās vingrojumi",
                        exercises = workout.exercises.warmup,
                        onExerciseClick = onExerciseClick
                    )
                }
            }

            // Strengthening Exercises
            if (workout.exercises?.strengthening?.isNotEmpty() == true) {
                item {
                    ExerciseSection(
                        title = "💪 Spēka vingrojumi",
                        exercises = workout.exercises.strengthening,
                        onExerciseClick = onExerciseClick
                    )
                }
            }

            // Cooldown Exercises
            if (workout.exercises?.cooldown?.isNotEmpty() == true) {
                item {
                    ExerciseSection(
                        title = "🧘 Nomierināšanās vingrojumi",
                        exercises = workout.exercises.cooldown,
                        onExerciseClick = onExerciseClick
                    )
                }
            }

            // Bottom padding
            item {
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}

@Composable
fun ExerciseSection(
    title: String,
    exercises: List<Exercise>,
    onExerciseClick: (Exercise) -> Unit
) {
    Column {
        Text(
            text = title,
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = DeyaRunColors.Dark.OnBackground
        )
        Spacer(modifier = Modifier.height(8.dp))
        exercises.forEach { exercise ->
            ExerciseItem(
                exercise = exercise,
                onClick = { onExerciseClick(exercise) }
            )
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}

@Composable
fun ExerciseItem(
    exercise: Exercise,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        colors = CardDefaults.cardColors(
            containerColor = DeyaRunColors.Dark.Surface
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("▶️", fontSize = 24.sp)
                Column {
                    Text(
                        text = exercise.name,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = DeyaRunColors.Dark.OnSurface
                    )
                    if (exercise.duration != null) {
                        Text(
                            text = "⏱️ ${exercise.duration.min}-${exercise.duration.max}s",
                            fontSize = 11.sp,
                            color = DeyaRunColors.Dark.OnSurface.copy(alpha = 0.6f)
                        )
                    }
                    if (exercise.repetitions != null) {
                        Text(
                            text = "🔄 ${exercise.repetitions.min}-${exercise.repetitions.max} × ${exercise.sets?.min ?: 1}",
                            fontSize = 11.sp,
                            color = DeyaRunColors.Dark.OnSurface.copy(alpha = 0.6f)
                        )
                    }
                }
            }
            Text("▶️", fontSize = 18.sp)
        }
    }
}
