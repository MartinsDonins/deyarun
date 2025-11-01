package com.deyarun.mobile.presentation.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.deyarun.mobile.presentation.theme.DeyaRunColors

// Bottom Navigation Items
sealed class BottomNavItem(
    val route: String,
    val title: String,
    val icon: ImageVector,
    val isFab: Boolean = false
) {
    object Dashboard : BottomNavItem("dashboard", "Dashboard", Icons.Default.Home)
    object Workouts : BottomNavItem("workout", "Workouts", Icons.Default.PlayArrow)
    object StartActivity : BottomNavItem("start_activity", "Start", Icons.Default.Add, isFab = true)
    object WeeklyProgram : BottomNavItem("weekly_program", "Program", Icons.Default.DateRange)
    object Statistics : BottomNavItem("statistics", "Stats", Icons.Default.Info)
    object Profile : BottomNavItem("profile_edit", "Profile", Icons.Default.Person)
}

/**
 * Bottom Navigation Bar with FAB-style Start Activity button
 * Displays 5 navigation items with the middle one styled as FAB
 */
@Composable
fun BottomNavigationBar(
    navController: NavController,
    modifier: Modifier = Modifier
) {
    val items = listOf(
        BottomNavItem.Dashboard,
        BottomNavItem.Workouts,
        BottomNavItem.StartActivity,
        BottomNavItem.WeeklyProgram,
        BottomNavItem.Profile
    )

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    NavigationBar(
        modifier = modifier,
        containerColor = DeyaRunColors.Dark.Surface,
        contentColor = DeyaRunColors.Primary
    ) {
        items.forEach { item ->
            val isSelected = currentRoute == item.route

            NavigationBarItem(
                icon = {
                    if (item.isFab) {
                        // FAB-style button for Start Activity
                        Surface(
                            shape = MaterialTheme.shapes.medium,
                            color = if (isSelected) DeyaRunColors.Primary else DeyaRunColors.Primary.copy(alpha = 0.9f),
                            modifier = Modifier.size(56.dp)
                        ) {
                            Box(
                                contentAlignment = androidx.compose.ui.Alignment.Center,
                                modifier = Modifier.fillMaxSize()
                            ) {
                                Icon(
                                    imageVector = item.icon,
                                    contentDescription = item.title,
                                    modifier = Modifier.size(32.dp),
                                    tint = Color.White
                                )
                            }
                        }
                    } else {
                        // Regular navigation icon
                        Icon(
                            imageVector = item.icon,
                            contentDescription = item.title,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                },
                label = {
                    Text(
                        text = item.title,
                        fontSize = 12.sp,
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
                    )
                },
                selected = isSelected,
                onClick = {
                    if (currentRoute != item.route) {
                        navController.navigate(item.route) {
                            popUpTo(navController.graph.startDestinationId) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = DeyaRunColors.Primary,
                    selectedTextColor = DeyaRunColors.Primary,
                    unselectedIconColor = DeyaRunColors.Dark.TextMuted,
                    unselectedTextColor = DeyaRunColors.Dark.TextMuted,
                    indicatorColor = Color.Transparent
                )
            )
        }
    }
}