package com.deyarun.mobile.presentation.statistics

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.deyarun.mobile.presentation.theme.DeyaRunColors
import com.deyarun.mobile.presentation.theme.DeyaRunGradients
import java.util.*

data class WeeklyGoal(
    val type: String,
    val current: Float,
    val target: Float,
    val unit: String,
    val icon: ImageVector,
    val color: Color
)

data class MonthlyStats(
    val label: String,
    val value: String,
    val change: String,
    val isPositive: Boolean,
    val icon: ImageVector
)

data class Achievement(
    val title: String,
    val description: String,
    val icon: ImageVector,
    val color: Color,
    val isUnlocked: Boolean,
    val progress: Float
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StatisticsScreen(
    onNavigateBack: () -> Unit = {}
) {
    // Animations
    val infiniteTransition = rememberInfiniteTransition(label = "")
    val animatedAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ), label = ""
    )

    // Sample data (in production, fetch from API)
    val weeklyGoals = remember {
        listOf(
            WeeklyGoal(
                type = "Distance",
                current = 18.5f,
                target = 25f,
                unit = "km",
                icon = Icons.Default.Star,
                color = DeyaRunColors.Primary
            ),
            WeeklyGoal(
                type = "Workouts",
                current = 4f,
                target = 6f,
                unit = "sessions",
                icon = Icons.Default.Build,
                color = DeyaRunColors.Secondary
            ),
            WeeklyGoal(
                type = "Calories",
                current = 1420f,
                target = 2000f,
                unit = "kcal",
                icon = Icons.Default.Favorite,
                color = DeyaRunColors.Warning
            )
        )
    }

    val monthlyStats = remember {
        listOf(
            MonthlyStats(
                label = "Total Distance",
                value = "78.5 km",
                change = "+12.3%",
                isPositive = true,
                icon = Icons.Default.Star
            ),
            MonthlyStats(
                label = "Avg Pace",
                value = "6:24 /km",
                change = "-0:15",
                isPositive = true,
                icon = Icons.Default.Star
            ),
            MonthlyStats(
                label = "Active Days",
                value = "16 days",
                change = "+4 days",
                isPositive = true,
                icon = Icons.Default.DateRange
            ),
            MonthlyStats(
                label = "Calories Burned",
                value = "4,850 kcal",
                change = "+8.7%",
                isPositive = true,
                icon = Icons.Default.Favorite
            )
        )
    }

    val achievements = remember {
        listOf(
            Achievement(
                title = "First 5K",
                description = "Complete your first 5km run",
                icon = Icons.Default.Star,
                color = DeyaRunColors.Gold,
                isUnlocked = true,
                progress = 1f
            ),
            Achievement(
                title = "Weekly Warrior",
                description = "Complete 5 workouts in a week",
                icon = Icons.Default.Favorite,
                color = DeyaRunColors.Primary,
                isUnlocked = true,
                progress = 1f
            ),
            Achievement(
                title = "Distance Master",
                description = "Run 100km in a month",
                icon = Icons.Default.Star,
                color = DeyaRunColors.Silver,
                isUnlocked = false,
                progress = 0.785f
            ),
            Achievement(
                title = "Speed Demon",
                description = "Achieve sub-5:00 pace",
                icon = Icons.Default.Star,
                color = DeyaRunColors.Bronze,
                isUnlocked = false,
                progress = 0.45f
            )
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        DeyaRunColors.Accent.copy(alpha = 0.05f),
                        DeyaRunColors.Dark.Background
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onNavigateBack) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = DeyaRunColors.Primary
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                Text(
                    text = "Statistics",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = DeyaRunColors.Dark.OnBackground
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Weekly Goals Section
            Text(
                text = "Weekly Goals",
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
                color = DeyaRunColors.Dark.OnBackground
            )

            Spacer(modifier = Modifier.height(16.dp))

            weeklyGoals.forEach { goal ->
                WeeklyGoalCard(goal = goal)
                Spacer(modifier = Modifier.height(12.dp))
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Monthly Overview
            Text(
                text = "Monthly Overview",
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
                color = DeyaRunColors.Dark.OnBackground
            )

            Spacer(modifier = Modifier.height(16.dp))

            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = DeyaRunColors.Dark.Surface
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    monthlyStats.chunked(2).forEach { rowStats ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            rowStats.forEach { stat ->
                                MonthlyStatItem(
                                    stat = stat,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                        if (monthlyStats.indexOf(rowStats.first()) < monthlyStats.size - 2) {
                            Spacer(modifier = Modifier.height(20.dp))
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Achievements Section
            Text(
                text = "Achievements",
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
                color = DeyaRunColors.Dark.OnBackground
            )

            Spacer(modifier = Modifier.height(16.dp))

            achievements.forEach { achievement ->
                AchievementCard(
                    achievement = achievement,
                    animatedAlpha = animatedAlpha
                )
                Spacer(modifier = Modifier.height(12.dp))
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Personal Records
            Text(
                text = "Personal Records",
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
                color = DeyaRunColors.Dark.OnBackground
            )

            Spacer(modifier = Modifier.height(16.dp))

            PersonalRecordsCard()

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
private fun WeeklyGoalCard(goal: WeeklyGoal) {
    val progress = (goal.current / goal.target).coerceIn(0f, 1f)
    val progressAnimation by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(durationMillis = 1000),
        label = ""
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = DeyaRunColors.Dark.Surface
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(goal.color.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = goal.icon,
                    contentDescription = null,
                    tint = goal.color,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = goal.type,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    color = DeyaRunColors.Dark.OnSurface
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "${goal.current.toInt()} / ${goal.target.toInt()} ${goal.unit}",
                    fontSize = 14.sp,
                    color = DeyaRunColors.Dark.TextSecondary
                )

                Spacer(modifier = Modifier.height(8.dp))

                LinearProgressIndicator(
                    progress = progressAnimation,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp)),
                    color = goal.color,
                    trackColor = DeyaRunColors.Dark.Border
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Text(
                text = "${(progress * 100).toInt()}%",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = goal.color
            )
        }
    }
}

@Composable
private fun MonthlyStatItem(
    stat: MonthlyStats,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = stat.icon,
            contentDescription = null,
            tint = DeyaRunColors.Primary,
            modifier = Modifier.size(24.dp)
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = stat.value,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = DeyaRunColors.Dark.OnSurface,
            textAlign = TextAlign.Center
        )

        Text(
            text = stat.label,
            fontSize = 12.sp,
            color = DeyaRunColors.Dark.TextSecondary,
            textAlign = TextAlign.Center
        )

        Text(
            text = stat.change,
            fontSize = 12.sp,
            color = if (stat.isPositive) DeyaRunColors.Success else DeyaRunColors.Error,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun AchievementCard(
    achievement: Achievement,
    animatedAlpha: Float
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .alpha(if (achievement.isUnlocked) 1f else 0.7f),
        colors = CardDefaults.cardColors(
            containerColor = if (achievement.isUnlocked)
                DeyaRunColors.Dark.Surface
            else
                DeyaRunColors.Dark.Surface.copy(alpha = 0.6f)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(
                        if (achievement.isUnlocked) {
                            Brush.radialGradient(
                                colors = listOf(achievement.color, achievement.color.copy(alpha = 0.7f))
                            )
                        } else {
                            Brush.radialGradient(
                                colors = listOf(
                                    DeyaRunColors.Dark.Border,
                                    DeyaRunColors.Dark.Border.copy(alpha = 0.5f)
                                )
                            )
                        }
                    )
                    .alpha(if (achievement.isUnlocked) animatedAlpha else 1f),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = achievement.icon,
                    contentDescription = null,
                    tint = if (achievement.isUnlocked) Color.White else DeyaRunColors.Dark.TextMuted,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = achievement.title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (achievement.isUnlocked)
                        DeyaRunColors.Dark.OnSurface
                    else
                        DeyaRunColors.Dark.TextSecondary
                )

                Text(
                    text = achievement.description,
                    fontSize = 12.sp,
                    color = DeyaRunColors.Dark.TextSecondary
                )

                if (!achievement.isUnlocked) {
                    Spacer(modifier = Modifier.height(8.dp))

                    LinearProgressIndicator(
                        progress = achievement.progress,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(4.dp)
                            .clip(RoundedCornerShape(2.dp)),
                        color = achievement.color,
                        trackColor = DeyaRunColors.Dark.Border
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "${(achievement.progress * 100).toInt()}% Complete",
                        fontSize = 10.sp,
                        color = DeyaRunColors.Dark.TextMuted
                    )
                }
            }

            if (achievement.isUnlocked) {
                Icon(
                    imageVector = Icons.Default.CheckCircle,
                    contentDescription = "Unlocked",
                    tint = DeyaRunColors.Success,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
private fun PersonalRecordsCard() {
    val records = listOf(
        "Fastest 5K" to "22:45",
        "Longest Run" to "15.2 km",
        "Best Pace" to "5:45 /km",
        "Most Calories" to "680 kcal"
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = DeyaRunColors.Dark.Surface
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "🏆 Your Best",
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = DeyaRunColors.Dark.OnSurface
            )

            Spacer(modifier = Modifier.height(16.dp))

            records.chunked(2).forEach { rowRecords ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    rowRecords.forEach { (label, value) ->
                        Column(
                            modifier = Modifier.weight(1f),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = value,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = DeyaRunColors.Gold
                            )
                            Text(
                                text = label,
                                fontSize = 12.sp,
                                color = DeyaRunColors.Dark.TextSecondary,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
                if (records.indexOf(rowRecords.first()) < records.size - 2) {
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}