package com.deyarun.mobile.presentation.training

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.deyarun.mobile.presentation.theme.DeyaRunColors
import com.deyarun.mobile.presentation.viewmodel.WeeklyProgramViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WeeklyProgramScreen(
    viewModel: WeeklyProgramViewModel
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadCurrentWeekProgram()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            "Nedēļas Programma",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = DeyaRunColors.Dark.OnBackground
                        )
                        Text(
                            "Personalizēti treniņi ar video",
                            fontSize = 12.sp,
                            color = DeyaRunColors.Dark.OnBackground.copy(alpha = 0.7f)
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadAICoachingSuggestions() }) {
                        Icon(
                            Icons.Default.Star,
                            contentDescription = "AI Coaching Ieteikumi",
                            tint = Color(0xFFFFC107)
                        )
                    }
                    IconButton(onClick = { viewModel.generateNewProgram() }) {
                        Icon(
                            Icons.Default.Refresh,
                            contentDescription = "Ģenerēt jaunu programmu",
                            tint = DeyaRunColors.Dark.OnBackground
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DeyaRunColors.Dark.Background
                )
            )
        },
        containerColor = DeyaRunColors.Dark.Background
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                uiState.isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = Color(0xFF4CAF50)
                    )
                }

                uiState.error != null -> {
                    ErrorMessage(
                        // FIX-052.5: Safe null handling instead of !! operator
                        error = uiState.error ?: "Unknown error",
                        onRetry = { viewModel.loadCurrentWeekProgram() },
                        modifier = Modifier.align(Alignment.Center)
                    )
                }

                uiState.workouts.isEmpty() -> {
                    EmptyState(
                        onGenerate = { viewModel.generateNewProgram() },
                        modifier = Modifier.align(Alignment.Center)
                    )
                }

                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Week Summary
                        item {
                            WeekSummaryCard(
                                totalWorkouts = uiState.workouts.size,
                                totalDistance = uiState.workouts.sumOf { it.targetMetrics.totalDistance } / 1000.0,
                                totalDuration = uiState.workouts.sumOf { it.targetMetrics.totalDuration },
                                totalCalories = uiState.workouts.sumOf { it.targetMetrics.calories }
                            )
                        }

                        // AI Coaching Suggestions
                        if (uiState.aiSuggestions.isNotEmpty()) {
                            item {
                                AICoachingCard(
                                    suggestions = uiState.aiSuggestions,
                                    motivation = uiState.aiMotivation
                                )
                            }
                        }

                        // Workout List
                        items(uiState.workouts) { workout ->
                            WorkoutCard(
                                workout = workout,
                                onWorkoutClick = { viewModel.selectWorkout(workout) },
                                onMarkComplete = { viewModel.markWorkoutComplete(workout.id) }
                            )
                        }
                    }
                }
            }

            // Workout Detail Bottom Sheet
            // FIX-052.5: Safe null handling instead of !! operator
            uiState.selectedWorkout?.let { workout ->
                WorkoutDetailSheet(
                    workout = workout,
                    onDismiss = { viewModel.clearSelectedWorkout() },
                    onExerciseClick = { exercise -> viewModel.selectExercise(exercise) }
                )
            }

            // Exercise Video Player
            // FIX-052.5: Safe null handling instead of !! operator
            uiState.selectedExercise?.let { exercise ->
                ExerciseVideoDialog(
                    exercise = exercise,
                    onDismiss = { viewModel.clearSelectedExercise() }
                )
            }
        }
    }
}

@Composable
fun WeekSummaryCard(
    totalWorkouts: Int,
    totalDistance: Double,
    totalDuration: Int,
    totalCalories: Int
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = DeyaRunColors.Dark.Surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                "Nedēļas kopsavilkums",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = DeyaRunColors.Dark.OnSurface
            )
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                SummaryItem(
                    icon = "🏃",
                    value = totalWorkouts.toString(),
                    label = "Treniņi",
                    color = Color(0xFF2196F3)
                )
                SummaryItem(
                    icon = "📏",
                    value = "%.1f km".format(totalDistance),
                    label = "Distance",
                    color = Color(0xFF4CAF50)
                )
                SummaryItem(
                    icon = "⏱️",
                    value = "${totalDuration / 60} min",
                    label = "Laiks",
                    color = Color(0xFF9C27B0)
                )
                SummaryItem(
                    icon = "🔥",
                    value = "$totalCalories",
                    label = "kcal",
                    color = Color(0xFFFF9800)
                )
            }
        }
    }
}

@Composable
fun SummaryItem(
    icon: String,
    value: String,
    label: String,
    color: Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(icon, fontSize = 24.sp)
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            value,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = color
        )
        Text(
            label,
            fontSize = 12.sp,
            color = DeyaRunColors.Dark.OnSurface.copy(alpha = 0.7f)
        )
    }
}

@Composable
fun EmptyState(
    onGenerate: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("📅", fontSize = 64.sp)
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            "Nav aktīvas programmas",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = DeyaRunColors.Dark.OnBackground
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            "Izveidojiet jaunu nedēļas treniņprogrammu",
            fontSize = 14.sp,
            color = DeyaRunColors.Dark.OnBackground.copy(alpha = 0.7f)
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onGenerate,
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF4CAF50)
            )
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Ģenerēt Programmu")
        }
    }
}

@Composable
fun ErrorMessage(
    error: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("❌", fontSize = 64.sp)
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            "Kļūda",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = Color.Red
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            error,
            fontSize = 14.sp,
            color = DeyaRunColors.Dark.OnBackground.copy(alpha = 0.7f)
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = onRetry) {
            Icon(Icons.Default.Refresh, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Mēģināt vēlreiz")
        }
    }
}

fun formatDate(dateString: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
        val outputFormat = SimpleDateFormat("EEEE, d. MMMM", Locale("lv", "LV"))
        val date = inputFormat.parse(dateString)
        outputFormat.format(date ?: Date())
    } catch (e: Exception) {
        dateString
    }
}

fun formatDuration(seconds: Int): String {
    val hours = seconds / 3600
    val minutes = (seconds % 3600) / 60
    return if (hours > 0) "${hours}h ${minutes}min" else "${minutes} min"
}

fun formatPace(paceInSeconds: Int): String {
    val minutes = paceInSeconds / 60
    val seconds = paceInSeconds % 60
    return "$minutes:${seconds.toString().padStart(2, '0')} min/km"
}

@Composable
fun AICoachingCard(
    suggestions: List<String>,
    motivation: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF2196F3).copy(alpha = 0.1f)
        ),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF2196F3).copy(alpha = 0.3f))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    Icons.Default.Star,
                    contentDescription = "AI Coach",
                    tint = Color(0xFFFFC107),
                    modifier = Modifier.size(28.dp)
                )
                Text(
                    "AI Trenera Ieteikumi",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = DeyaRunColors.Dark.OnBackground
                )
            }

            // Motivation Message
            if (motivation.isNotEmpty()) {
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = Color(0xFF4CAF50).copy(alpha = 0.2f)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            "💪",
                            fontSize = 20.sp
                        )
                        Text(
                            motivation,
                            fontSize = 14.sp,
                            color = DeyaRunColors.Dark.OnBackground,
                            lineHeight = 20.sp
                        )
                    }
                }
            }

            // Suggestions List
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                suggestions.take(5).forEach { suggestion ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Icon(
                            Icons.Default.Check,
                            contentDescription = null,
                            tint = Color(0xFF4CAF50),
                            modifier = Modifier.size(20.dp)
                        )
                        Text(
                            suggestion,
                            fontSize = 13.sp,
                            color = DeyaRunColors.Dark.OnBackground.copy(alpha = 0.9f),
                            lineHeight = 18.sp,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }

            // AI Attribution
            Text(
                "🤖 Powered by ChatGPT AI",
                fontSize = 11.sp,
                color = DeyaRunColors.Dark.OnBackground.copy(alpha = 0.5f),
                modifier = Modifier.align(Alignment.End)
            )
        }
    }
}
