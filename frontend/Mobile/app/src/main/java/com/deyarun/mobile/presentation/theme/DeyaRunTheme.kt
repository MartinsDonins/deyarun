package com.deyarun.mobile.presentation.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

/**
 * DeyaRun Official Dark Theme
 * Based on brand colors from mobile/constants/theme.ts
 */
private val DeyaRunDarkColorScheme = darkColorScheme(
    // Primary Brand Colors
    primary = DeyaRunColors.Primary,                      // #FF6B6B - DeyaRun red
    onPrimary = Color.White,
    primaryContainer = DeyaRunColors.PrimaryDark,          // #E85A5A
    onPrimaryContainer = Color.White,

    // Secondary Colors
    secondary = DeyaRunColors.Secondary,                   // #4ECDC4 - Teal
    onSecondary = Color.White,
    secondaryContainer = DeyaRunColors.Secondary.copy(alpha = 0.3f),
    onSecondaryContainer = DeyaRunColors.Dark.OnSurface,

    // Tertiary Colors
    tertiary = DeyaRunColors.Accent,                      // #45B7D1 - Light blue
    onTertiary = Color.White,
    tertiaryContainer = DeyaRunColors.Accent.copy(alpha = 0.3f),
    onTertiaryContainer = DeyaRunColors.Dark.OnSurface,

    // Background Colors
    background = DeyaRunColors.Dark.Background,            // #0A0A0B - Deep dark
    onBackground = DeyaRunColors.Dark.OnBackground,        // #FFFFFF

    // Surface Colors
    surface = DeyaRunColors.Dark.Surface,                 // #1A1A1B - Card surface
    onSurface = DeyaRunColors.Dark.OnSurface,             // #FFFFFF
    surfaceVariant = DeyaRunColors.Dark.SurfaceElevated,  // #252526
    onSurfaceVariant = DeyaRunColors.Dark.TextSecondary,  // #CCCCCC

    // Error Colors
    error = DeyaRunColors.Error,                          // #F44336
    onError = Color.White,
    errorContainer = DeyaRunColors.Error.copy(alpha = 0.2f),
    onErrorContainer = DeyaRunColors.Error,

    // Outline Colors
    outline = DeyaRunColors.Dark.Border,                  // #333333
    outlineVariant = DeyaRunColors.Dark.BorderLight       // #444444
)

/**
 * DeyaRun Official Light Theme
 * Based on brand colors from mobile/constants/theme.ts
 */
private val DeyaRunLightColorScheme = lightColorScheme(
    // Primary Brand Colors
    primary = DeyaRunColors.Primary,                      // #FF6B6B - DeyaRun red
    onPrimary = Color.White,
    primaryContainer = DeyaRunColors.RedPalette.Red100,   // Light red container
    onPrimaryContainer = DeyaRunColors.RedPalette.Red800,

    // Secondary Colors
    secondary = DeyaRunColors.Secondary,                   // #4ECDC4 - Teal
    onSecondary = Color.White,
    secondaryContainer = DeyaRunColors.Secondary.copy(alpha = 0.2f),
    onSecondaryContainer = DeyaRunColors.RedPalette.Red800,

    // Tertiary Colors
    tertiary = DeyaRunColors.Accent,                      // #45B7D1 - Light blue
    onTertiary = Color.White,
    tertiaryContainer = DeyaRunColors.Accent.copy(alpha = 0.2f),
    onTertiaryContainer = DeyaRunColors.Light.OnSurface,

    // Background Colors
    background = DeyaRunColors.Light.Background,           // #FFFFFF - White
    onBackground = DeyaRunColors.Light.OnBackground,       // #000000

    // Surface Colors
    surface = DeyaRunColors.Light.Surface,                // #F5F5F5 - Light grey
    onSurface = DeyaRunColors.Light.OnSurface,            // #000000
    surfaceVariant = DeyaRunColors.Light.SurfaceElevated, // #FFFFFF
    onSurfaceVariant = DeyaRunColors.Light.TextSecondary, // #333333

    // Error Colors
    error = DeyaRunColors.Error,                          // #F44336
    onError = Color.White,
    errorContainer = DeyaRunColors.RedPalette.Red100,
    onErrorContainer = DeyaRunColors.Error,

    // Outline Colors
    outline = DeyaRunColors.Light.Border,                 // #E0E0E0
    outlineVariant = DeyaRunColors.Light.BorderLight      // #F0F0F0
)

@Composable
fun DeyaRunTheme(
    darkTheme: Boolean = true, // Force dark theme always
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        darkTheme -> DeyaRunDarkColorScheme
        else -> DeyaRunLightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(),
        content = content
    )
}