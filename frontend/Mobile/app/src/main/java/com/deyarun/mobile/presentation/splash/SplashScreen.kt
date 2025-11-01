package com.deyarun.mobile.presentation.splash

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.res.painterResource
import com.deyarun.mobile.R
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.deyarun.mobile.presentation.theme.DeyaRunColors
import com.deyarun.mobile.presentation.viewmodel.AuthViewModel
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    authViewModel: AuthViewModel,
    onNavigateToLogin: () -> Unit,
    onNavigateToDashboard: () -> Unit
) {
    val context = LocalContext.current
    val authState by authViewModel.authState.collectAsState()

    // Animations
    val infiniteTransition = rememberInfiniteTransition(label = "")

    // Logo scale animation
    val logoScale by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ), label = ""
    )

    // Logo rotation animation
    val logoRotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(8000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ), label = ""
    )

    // Text fade animation
    val textAlpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ), label = ""
    )

    // Progress bar animation
    var progress by remember { mutableStateOf(0f) }
    val animatedProgress by animateFloatAsState(
        targetValue = progress,
        animationSpec = tween(durationMillis = 2000),
        label = ""
    )

    // Auto-navigation logic
    LaunchedEffect(Unit) {
        // Start progress animation
        delay(500)
        progress = 1f

        // Check auth status if not already done
        if (!authState.isLoading && authState.user == null && authState.error == null) {
            authViewModel.checkAuthStatus()
        }
    }

    // Navigate based on auth state changes
    LaunchedEffect(authState.isAuthenticated, authState.isLoading) {
        if (!authState.isLoading) {
            // Wait minimum time for splash screen
            delay(2500)

            if (authState.isAuthenticated && authState.user != null) {
                onNavigateToDashboard()
            } else {
                onNavigateToLogin()
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(
                        DeyaRunColors.Primary.copy(alpha = 0.3f),
                        DeyaRunColors.Dark.Background,
                        DeyaRunColors.Dark.Background
                    ),
                    radius = 800f
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Main Logo with animations - transparent background
            Box(
                modifier = Modifier
                    .size(150.dp)
                    .scale(logoScale),
                contentAlignment = Alignment.Center
            ) {
                androidx.compose.foundation.Image(
                    painter = painterResource(id = R.drawable.deyarun_logo),
                    contentDescription = "DeyaRun Logo",
                    modifier = Modifier.size(100.dp),
                    contentScale = androidx.compose.ui.layout.ContentScale.Fit
                )
            }

            Spacer(modifier = Modifier.height(48.dp))

            // App Name
            Text(
                text = "DeyaRun",
                fontSize = 42.sp,
                fontWeight = FontWeight.Bold,
                color = DeyaRunColors.Primary,
                modifier = Modifier.alpha(textAlpha),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Tagline
            Text(
                text = "Track. Train. Transform.",
                fontSize = 18.sp,
                fontWeight = FontWeight.Medium,
                color = DeyaRunColors.Dark.TextSecondary,
                modifier = Modifier.alpha(textAlpha),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(64.dp))

            // Loading Progress
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Progress Bar
                LinearProgressIndicator(
                    progress = animatedProgress,
                    modifier = Modifier
                        .width(200.dp)
                        .height(4.dp)
                        .clip(CircleShape),
                    color = DeyaRunColors.Primary,
                    trackColor = DeyaRunColors.Dark.Border
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Loading Text
                Text(
                    text = when {
                        animatedProgress < 0.3f -> "Loading..."
                        animatedProgress < 0.7f -> "Preparing your journey..."
                        authState.isLoading -> "Checking credentials..."
                        else -> "Ready to run!"
                    },
                    fontSize = 14.sp,
                    color = DeyaRunColors.Dark.TextMuted,
                    modifier = Modifier.alpha(textAlpha)
                )
            }
        }

        // Version info at bottom
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 48.dp)
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Version ${getAppVersion(context)}",
                    fontSize = 12.sp,
                    color = DeyaRunColors.Dark.TextMuted,
                    modifier = Modifier.alpha(0.6f)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Mobile • Kotlin Compose",
                    fontSize = 10.sp,
                    color = DeyaRunColors.Dark.TextMuted,
                    modifier = Modifier.alpha(0.4f)
                )
            }
        }

        // Subtle background animation circles
        repeat(3) { index ->
            val delay = index * 1000L
            val animatedAlpha by infiniteTransition.animateFloat(
                initialValue = 0f,
                targetValue = 0.1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(3000 + delay.toInt(), easing = EaseInOut),
                    repeatMode = RepeatMode.Reverse
                ), label = ""
            )

            Box(
                modifier = Modifier
                    .size((200 + index * 100).dp)
                    .offset(
                        x = (index * 50 - 100).dp,
                        y = (index * 30 - 50).dp
                    )
                    .alpha(animatedAlpha)
                    .clip(CircleShape)
                    .background(
                        DeyaRunColors.Primary.copy(alpha = 0.05f)
                    )
            )
        }
    }
}

/**
 * Get app version from PackageManager
 */
private fun getAppVersion(context: android.content.Context): String {
    return try {
        val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
        packageInfo.versionName ?: "Unknown"
    } catch (e: Exception) {
        "Unknown"
    }
}
