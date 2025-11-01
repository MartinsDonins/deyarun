package com.deyarun.mobile.presentation.theme

import androidx.compose.ui.graphics.Color

/**
 * DeyaRun Official Brand Colors
 * Based on mobile/constants/theme.ts
 * Version: 1.17.16 - Mobile (Kotlin) Integration
 */

// DeyaRun Primary Brand Colors
object DeyaRunColors {
    // Core Brand Colors
    val Primary = Color(0xFFFF6B6B)          // DeyaRun primary red
    val PrimaryDark = Color(0xFFE85A5A)      // Darker red
    val PrimaryLight = Color(0xFFFF7B7B)     // Lighter red

    // Dark Theme Colors (Default)
    object Dark {
        // Backgrounds
        val Background = Color(0xFF0A0A0B)        // Deep dark
        val Surface = Color(0xFF1A1A1B)          // Card surface
        val SurfaceElevated = Color(0xFF252526)   // Elevated surface
        val InputBackground = Color(0xFF2A2A2A)   // Input backgrounds

        // Text Colors
        val OnBackground = Color(0xFFFFFFFF)      // Primary text
        val OnSurface = Color(0xFFFFFFFF)         // Surface text
        val TextSecondary = Color(0xFFCCCCCC)     // Secondary text
        val TextMuted = Color(0xFF999999)         // Muted text
        val TextDisabled = Color(0xFF666666)      // Disabled text

        // Interactive Elements
        val Border = Color(0xFF333333)            // Border color
        val BorderLight = Color(0xFF444444)       // Light border

        // Glassmorphism
        val Glass = Color(0x1AFFFFFF)             // rgba(255, 255, 255, 0.1)
        val GlassStrong = Color(0x26FFFFFF)       // rgba(255, 255, 255, 0.15)
    }

    // Light Theme Colors
    object Light {
        // Backgrounds
        val Background = Color(0xFFFFFFFF)        // White background
        val Surface = Color(0xFFF5F5F5)          // Light grey surface
        val SurfaceElevated = Color(0xFFFFFFFF)   // White elevated surface
        val InputBackground = Color(0xFFF0F0F0)   // Light input backgrounds

        // Text Colors
        val OnBackground = Color(0xFF000000)      // Black text
        val OnSurface = Color(0xFF000000)         // Surface text
        val TextSecondary = Color(0xFF333333)     // Dark grey text
        val TextMuted = Color(0xFF666666)         // Muted dark text
        val TextDisabled = Color(0xFF999999)      // Disabled light text

        // Interactive Elements
        val Border = Color(0xFFE0E0E0)            // Light border color
        val BorderLight = Color(0xFFF0F0F0)       // Very light border

        // Glassmorphism
        val Glass = Color(0x0D000000)             // rgba(0, 0, 0, 0.05)
        val GlassStrong = Color(0x1A000000)       // rgba(0, 0, 0, 0.1)
    }

    // Semantic Colors (same for both themes)
    val Secondary = Color(0xFF4ECDC4)         // Teal
    val Accent = Color(0xFF45B7D1)            // Light blue
    val Success = Color(0xFF4CAF50)           // Green
    val Warning = Color(0xFFFF9800)           // Orange
    val Error = Color(0xFFF44336)             // Red
    val Info = Color(0xFF2196F3)              // Blue

    // Brand Colors (third-party)
    val Strava = Color(0xFFFC4C02)            // Strava orange

    // Achievement Colors
    val Bronze = Color(0xFFCD7F32)            // Bronze
    val Silver = Color(0xFFC0C0C0)            // Silver
    val Gold = Color(0xFFFFD700)              // Gold

    // Red Palette Variants
    object RedPalette {
        val Red50 = Color(0xFFFFF5F5)
        val Red100 = Color(0xFFFFE3E3)
        val Red200 = Color(0xFFFFC9C9)
        val Red300 = Color(0xFFFFA8A8)
        val Red400 = Color(0xFFFF8787)
        val Red500 = Color(0xFFFF6B6B)        // Primary
        val Red600 = Color(0xFFE85A5A)
        val Red700 = Color(0xFFC92A2A)
        val Red800 = Color(0xFFA61E1E)
        val Red900 = Color(0xFF7C2D12)
    }

    // Overlay Colors
    val Overlay = Color(0x80000000)           // rgba(0, 0, 0, 0.5)
    val OverlayStrong = Color(0xB3000000)     // rgba(0, 0, 0, 0.7)
}

// Gradient Colors for Compose
object DeyaRunGradients {
    val Primary = listOf(DeyaRunColors.Primary, DeyaRunColors.PrimaryDark)
    val Red = listOf(DeyaRunColors.Primary, DeyaRunColors.PrimaryLight)
    val RedVertical = listOf(DeyaRunColors.Primary, DeyaRunColors.RedPalette.Red700)
    val Coral = listOf(DeyaRunColors.Primary, DeyaRunColors.PrimaryDark)
    val Surface = listOf(DeyaRunColors.Dark.Surface, DeyaRunColors.Dark.SurfaceElevated)
    val Glass = listOf(
        DeyaRunColors.Primary.copy(alpha = 0.2f),
        DeyaRunColors.Primary.copy(alpha = 0.05f)
    )
    val MultiColor = listOf(DeyaRunColors.Primary, DeyaRunColors.Secondary, DeyaRunColors.Accent)
}
