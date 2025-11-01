package com.deyarun.mobile

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.launch
import com.deyarun.mobile.data.storage.LanguagePreferenceManager
import com.deyarun.mobile.utils.LanguageHelper
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.NavType
import androidx.navigation.navArgument
import com.deyarun.mobile.data.repository.AuthRepository
import com.deyarun.mobile.presentation.auth.LoginScreenNew
import com.deyarun.mobile.presentation.auth.SignupScreen
import com.deyarun.mobile.presentation.auth.ForgotPasswordScreen
import com.deyarun.mobile.presentation.dashboard.DashboardScreen
import com.deyarun.mobile.presentation.profile.ProfileEditScreen
import com.deyarun.mobile.presentation.profile.GdprSettingsScreen
import com.deyarun.mobile.presentation.profile.AboutScreen
import com.deyarun.mobile.presentation.splash.SplashScreen
import com.deyarun.mobile.presentation.workout.WorkoutScreen
import com.deyarun.mobile.presentation.statistics.StatisticsScreen
import com.deyarun.mobile.presentation.navigation.BottomNavigationBar
import com.deyarun.mobile.presentation.theme.DeyaRunTheme
import com.deyarun.mobile.presentation.activity.StartActivityScreen
import com.deyarun.mobile.presentation.activity.ActiveActivityScreen
import com.deyarun.mobile.presentation.activity.ActivityDetailScreen
import com.deyarun.mobile.presentation.permissions.PermissionsScreen
import com.deyarun.mobile.presentation.strava.StravaIntegrationScreen
import com.deyarun.mobile.presentation.viewmodel.AuthViewModel
import com.deyarun.mobile.presentation.viewmodel.AuthViewModelFactory
import com.deyarun.mobile.presentation.viewmodel.SyncViewModel
import com.deyarun.mobile.presentation.viewmodel.ActivityViewModel
import com.deyarun.mobile.presentation.viewmodel.ActivityViewModelFactory
import com.deyarun.mobile.presentation.viewmodel.DashboardViewModel
import com.deyarun.mobile.presentation.viewmodel.DashboardViewModelFactory
import com.deyarun.mobile.presentation.viewmodel.StravaViewModel
import com.deyarun.mobile.presentation.viewmodel.StravaViewModelFactory
import com.deyarun.mobile.data.repository.ActivityRepository
import com.deyarun.mobile.data.di.NetworkModule
import com.deyarun.mobile.utils.PermissionManager
import com.deyarun.mobile.data.sync.SyncManager
import com.deyarun.mobile.data.sync.ActivitySyncManager
import com.deyarun.mobile.data.local.LocalDatabase
import com.deyarun.mobile.data.api.CloudApi
import com.deyarun.mobile.data.storage.TokenManager
import com.deyarun.mobile.data.model.ActivityType
import com.deyarun.mobile.utils.LocationManager
import androidx.room.Room
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
// FIX-052.2: Removed runBlocking import to prevent main thread blocking
// import kotlinx.coroutines.runBlocking

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize language on app start
        val languagePreferenceManager = LanguagePreferenceManager(this)
        val savedLanguage = languagePreferenceManager.getCurrentLanguage()
        LanguageHelper.updateActivityLocale(this, savedLanguage)

        setContent {
            DeyaRunTheme {
                DeyaRunApp()
            }
        }
    }

    override fun attachBaseContext(newBase: Context) {
        // Apply saved language preference to base context
        val languagePreferenceManager = LanguagePreferenceManager(newBase)
        val savedLanguage = languagePreferenceManager.getCurrentLanguage()
        val context = LanguageHelper.applyLanguage(newBase, savedLanguage)
        super.attachBaseContext(context)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeyaRunApp() {
    val context = LocalContext.current
    val navController = rememberNavController()

    // Create AuthViewModel with context
    val authRepository = AuthRepository(context)
    val authViewModelFactory = AuthViewModelFactory(authRepository)
    val authViewModel: AuthViewModel = viewModel(factory = authViewModelFactory)
    val authState by authViewModel.authState.collectAsState()

    // FIX-052.2: Replaced runBlocking with proper coroutine approach
    // Create TokenManager for async userId retrieval
    val tokenManager = remember { com.deyarun.mobile.data.storage.TokenManager(context) }

    // State to hold current userId (loaded asynchronously)
    var currentUserId by remember { mutableStateOf<String?>(null) }

    // Load userId asynchronously when auth state changes
    LaunchedEffect(authState.user) {
        currentUserId = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            tokenManager.getUserIdFromToken() ?: authState.user?.id
        }
        println("DEBUG MainActivity: Loaded userId asynchronously: '$currentUserId'")
    }

    // Create DashboardViewModel
    val activityRepository = remember { ActivityRepository(context) }
    val dashboardViewModelFactory = DashboardViewModelFactory(activityRepository, authRepository)
    val dashboardViewModel: DashboardViewModel = viewModel(factory = dashboardViewModelFactory)

    // Create PermissionManager
    val permissionManager = remember { PermissionManager(context) }

    // Create SyncManager and SyncViewModel
    val syncViewModel: SyncViewModel? = remember {
        try {
            // Create database - fallback to destructive migration
            val database = Room.databaseBuilder(
                context,
                LocalDatabase::class.java,
                "deyarun_database"
            ).fallbackToDestructiveMigration().build()

            // Create API client
            val retrofit = Retrofit.Builder()
                .baseUrl("https://api.deyarun.com/")
                .addConverterFactory(GsonConverterFactory.create())
                .build()
            val cloudApi = retrofit.create(CloudApi::class.java)

            // Create token manager
            val tokenManager = TokenManager(context)

            // Create sync manager
            val syncManager = SyncManager(context, database, cloudApi, tokenManager)
            syncManager.initialize()

            SyncViewModel(syncManager)
        } catch (e: Exception) {
            null // Return null if sync setup fails
        }
    }

    // Create ActivitySyncManager for log tracking
    val activitySyncManager: ActivitySyncManager? = remember {
        try {
            // Create database - fallback to destructive migration
            val database = Room.databaseBuilder(
                context,
                LocalDatabase::class.java,
                "deyarun_database"
            ).fallbackToDestructiveMigration().build()

            // Get activity DAO from database
            val activityDao = database.activityDao()

            // FIX-052.2: Use currentUserId state instead of blocking function
            val userId = currentUserId

            if (userId == null) {
                println("WARNING: No userId available yet - sync manager disabled temporarily")
                return@remember null
            }

            println("DEBUG MainActivity: Creating ActivitySyncManager with userId: $userId")

            // Create activity sync manager
            ActivitySyncManager(context, activityDao, userId)
        } catch (e: Exception) {
            null // Return null if sync setup fails
        }
    }

    // Check for existing auth token on app start
    LaunchedEffect(Unit) {
        authViewModel.checkAuthStatus()
    }

    // Determine if we should show bottom navigation
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val showBottomNav = authState.isAuthenticated && currentRoute in listOf(
        "dashboard", "workout", "start_activity", "weekly_program", "statistics", "profile_edit"
    )

    Scaffold(
        bottomBar = {
            if (showBottomNav) {
                BottomNavigationBar(navController = navController)
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = "splash",
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
        composable("splash") {
            SplashScreen(
                authViewModel = authViewModel,
                onNavigateToLogin = {
                    navController.navigate("login") {
                        popUpTo("splash") { inclusive = true }
                    }
                },
                onNavigateToDashboard = {
                    navController.navigate("dashboard") {
                        popUpTo("splash") { inclusive = true }
                    }
                }
            )
        }
        composable("login") {
            val coroutineScope = rememberCoroutineScope()
            var isLoading by remember { mutableStateOf(false) }

            LoginScreenNew(
                onLoginSuccess = {
                    // FIX-052.3: CRITICAL - Wait for migration to complete BEFORE navigation
                    coroutineScope.launch {
                        try {
                            isLoading = true
                            println("DEBUG MainActivity: Login successful - starting migration process")

                            // Get userId on background thread
                            val userId = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                                tokenManager.getUserIdFromToken() ?: authState.user?.id
                            }

                            if (userId != null) {
                                println("DEBUG MainActivity: Starting migration for userId: '$userId'")
                                // AWAIT migration completion
                                val migratedCount = activityRepository.migrateActivitiesToUser(userId)
                                println("DEBUG MainActivity: Migration complete - $migratedCount activities migrated")

                                // Update currentUserId state
                                currentUserId = userId
                            } else {
                                println("WARNING MainActivity: No userId available - skipping migration")
                            }

                            // Navigate AFTER migration completes
                            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                                isLoading = false
                                navController.navigate("dashboard") {
                                    popUpTo("login") { inclusive = true }
                                }
                            }
                        } catch (e: Exception) {
                            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                                isLoading = false
                                println("ERROR MainActivity: Migration failed: ${e.message}")
                                e.printStackTrace()
                                // Still navigate to dashboard even if migration fails
                                navController.navigate("dashboard") {
                                    popUpTo("login") { inclusive = true }
                                }
                            }
                        }
                    }
                },
                onNavigateToSignup = {
                    navController.navigate("signup")
                },
                onNavigateToForgotPassword = {
                    navController.navigate("forgot_password")
                }
            )
        }

        composable("workout") {
            WorkoutScreen(
                authViewModel = authViewModel,
                userId = currentUserId ?: "",
                onNavigateToProfile = {
                    navController.navigate("profile_edit")
                },
                onNavigateToStats = {
                    navController.navigate("statistics")
                },
                onStartWorkout = {
                    // TODO: Navigate to workout start screen
                },
                onNavigateToStartActivity = {
                    navController.navigate("start_activity")
                },
                onNavigateToActivityDetail = { activityId ->
                    navController.navigate("activity_detail/$activityId")
                }
            )
        }

        composable("statistics") {
            StatisticsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }

        composable("dashboard") {
            DashboardScreen(
                authViewModel = authViewModel,
                dashboardViewModel = dashboardViewModel,
                syncViewModel = syncViewModel,
                onLogout = {
                    navController.navigate("login") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                },
                onEditProfile = {
                    navController.navigate("profile_edit")
                },
                onNavigateToWorkout = {
                    navController.navigate("workout")
                },
                onNavigateToStats = {
                    navController.navigate("statistics")
                },
                onQuickStartRun = {
                    // Navigate directly to start_activity for quick run start
                    navController.navigate("start_activity")
                },
                onViewUnsyncedActivities = {
                    navController.navigate("unsynced_activities")
                }
            )
        }

        composable("profile_edit") {
            ProfileEditScreen(
                authViewModel = authViewModel,
                onBackClick = {
                    navController.popBackStack()
                },
                onNavigateToPermissions = {
                    navController.navigate("permissions")
                },
                onNavigateToStrava = {
                    navController.navigate("strava_integration")
                },
                onNavigateToGoogleFit = {
                    navController.navigate("googlefit_integration")
                },
                onNavigateToGdpr = {
                    navController.navigate("gdpr_settings")
                },
                onNavigateToAbout = {
                    navController.navigate("about")
                }
            )
        }

        composable("signup") {
            SignupScreen(
                onSignupSuccess = {
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                },
                onBackToLogin = {
                    navController.popBackStack()
                }
            )
        }

        composable("forgot_password") {
            ForgotPasswordScreen(
                onPasswordResetSent = {
                    navController.popBackStack()
                },
                onBackToLogin = {
                    navController.popBackStack()
                }
            )
        }

        composable("start_activity") {
            StartActivityScreen(
                activityDao = remember {
                    try {
                        val database = Room.databaseBuilder(
                            context,
                            LocalDatabase::class.java,
                            "deyarun_database"
                        ).fallbackToDestructiveMigration().build()
                        database.activityDao()
                    } catch (e: Exception) {
                        null
                    }
                } ?: return@composable,
                userId = currentUserId ?: "",
                onActivityStarted = {
                    navController.navigate("active_activity") {
                        popUpTo("start_activity") { inclusive = true }
                    }
                },
                onBackClick = {
                    navController.popBackStack()
                }
            )
        }

        composable("active_activity") {
            ActiveActivityScreen(
                activityDao = remember {
                    try {
                        val database = Room.databaseBuilder(
                            context,
                            LocalDatabase::class.java,
                            "deyarun_database"
                        ).fallbackToDestructiveMigration().build()
                        database.activityDao()
                    } catch (e: Exception) {
                        null
                    }
                } ?: return@composable,
                userId = currentUserId ?: "",
                onActivityComplete = {
                    // Navigate to dashboard to show updated stats and recent activity
                    navController.navigate("dashboard") {
                        popUpTo("active_activity") { inclusive = true }
                    }
                },
                onBackClick = {
                    navController.popBackStack()
                }
            )
        }

        composable("strava_integration") {
            val context = LocalContext.current
            val stravaRepository = remember { NetworkModule.provideStravaRepository(context) }
            val stravaViewModelFactory = StravaViewModelFactory(stravaRepository)
            val stravaViewModel: StravaViewModel = viewModel(factory = stravaViewModelFactory)

            StravaIntegrationScreen(
                onNavigateBack = { navController.popBackStack() },
                viewModel = stravaViewModel
            )
        }

        composable("googlefit_integration") {
            val context = LocalContext.current
            val googleFitViewModelFactory = com.deyarun.mobile.presentation.viewmodel.GoogleFitViewModelFactory(context)
            val googleFitViewModel: com.deyarun.mobile.presentation.viewmodel.GoogleFitViewModel = viewModel(factory = googleFitViewModelFactory)

            com.deyarun.mobile.presentation.googlefit.GoogleFitIntegrationScreen(
                onNavigateBack = { navController.popBackStack() },
                viewModel = googleFitViewModel
            )
        }

        composable("gdpr_settings") {
            GdprSettingsScreen(
                userId = currentUserId ?: "",
                onBackClick = {
                    navController.popBackStack()
                },
                onAccountDeleted = {
                    // Logout and navigate to login
                    authViewModel.logout()
                    navController.navigate("login") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }

        composable("about") {
            AboutScreen(
                onBackClick = {
                    navController.popBackStack()
                },
                activitySyncManager = activitySyncManager
            )
        }

        composable("permissions") {
            PermissionsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                permissionManager = permissionManager
            )
        }

        composable("weekly_program") {
            val context = LocalContext.current
            val weeklyProgramRepository = remember {
                val retrofit = Retrofit.Builder()
                    .baseUrl("https://api.deyarun.com/")
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()
                val cloudApi = retrofit.create(CloudApi::class.java)
                com.deyarun.mobile.data.repository.WeeklyProgramRepository(context, cloudApi)
            }
            val weeklyProgramViewModelFactory = com.deyarun.mobile.presentation.viewmodel.WeeklyProgramViewModelFactory(weeklyProgramRepository)
            val weeklyProgramViewModel: com.deyarun.mobile.presentation.viewmodel.WeeklyProgramViewModel = viewModel(factory = weeklyProgramViewModelFactory)

            com.deyarun.mobile.presentation.training.WeeklyProgramScreen(
                viewModel = weeklyProgramViewModel
            )
        }

        composable("unsynced_activities") {
            val context = LocalContext.current
            val scope = rememberCoroutineScope()

            val activityDao = remember {
                com.deyarun.mobile.data.local.LocalDatabase.getDatabase(context).activityDao()
            }

            val activitySyncManager = remember {
                com.deyarun.mobile.data.sync.ActivitySyncManager(
                    context = context,
                    activityDao = activityDao,
                    userId = currentUserId ?: ""
                )
            }

            var unsyncedActivities by remember { mutableStateOf<List<com.deyarun.mobile.data.model.Activity>>(emptyList()) }
            var stravaActivities by remember { mutableStateOf<List<com.deyarun.mobile.data.model.StravaActivity>>(emptyList()) }

            // Load unsynced activities and recent Strava activities for duplicate detection
            LaunchedEffect(Unit) {
                unsyncedActivities = activitySyncManager.getUnsyncedActivities()

                // Try to fetch recent Strava activities for duplicate detection
                try {
                    val stravaRepository = NetworkModule.provideStravaRepository(context)

                    val result = stravaRepository.getActivities(limit = 30)
                    if (result.isSuccess) {
                        stravaActivities = result.getOrNull() ?: emptyList()
                    }
                } catch (e: Exception) {
                    // Silently fail - duplicate detection will be skipped
                }
            }

            com.deyarun.mobile.presentation.sync.UnsyncedActivitiesScreen(
                unsyncedActivities = unsyncedActivities,
                stravaActivities = stravaActivities,
                onDeleteActivity = { activity ->
                    scope.launch {
                        activitySyncManager.deleteUnsyncedActivity(activity.id)
                        unsyncedActivities = activitySyncManager.getUnsyncedActivities()
                    }
                },
                onRetrySyncActivity = { activity ->
                    scope.launch {
                        activitySyncManager.retrySyncActivity(activity.id)
                        unsyncedActivities = activitySyncManager.getUnsyncedActivities()
                    }
                },
                onUpdateActivity = { updatedActivity ->
                    scope.launch {
                        // Update activity in database
                        activityDao.updateActivity(updatedActivity)
                        // Refresh list
                        unsyncedActivities = activitySyncManager.getUnsyncedActivities()
                    }
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable(
            route = "activity_detail/{activityId}",
            arguments = listOf(navArgument("activityId") { type = NavType.StringType })
        ) { backStackEntry ->
            val activityId = backStackEntry.arguments?.getString("activityId") ?: return@composable

            ActivityDetailScreen(
                activityId = activityId,
                onBackClick = {
                    navController.popBackStack()
                },
                onActivityDeleted = {
                    // Navigate back to workout screen after deletion
                    navController.navigate("workout") {
                        popUpTo("activity_detail/$activityId") { inclusive = true }
                    }
                }
            )
        }
    }

        // Listen to auth state changes for automatic navigation
        LaunchedEffect(authState.isAuthenticated) {
            when {
                authState.isAuthenticated && navController.currentDestination?.route == "login" -> {
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                }
                !authState.isAuthenticated && (navController.currentDestination?.route == "dashboard" || navController.currentDestination?.route == "workout" || navController.currentDestination?.route == "statistics") -> {
                    navController.navigate("login") {
                        popUpTo(0) { inclusive = true }
                    }
                }
            }
        }
    }
}