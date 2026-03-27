package com.deyarun.mobile.data.auth

import android.content.Context
import android.content.Intent
import androidx.activity.result.ActivityResult
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.deyarun.mobile.R
import kotlinx.coroutines.tasks.await

sealed class GoogleSignInResult {
    data class Success(val firebaseIdToken: String, val email: String) : GoogleSignInResult()
    data class Error(val message: String) : GoogleSignInResult()
    object Cancelled : GoogleSignInResult()
}

class GoogleAuthManager(private val context: Context) {

    private val firebaseAuth: FirebaseAuth = FirebaseAuth.getInstance()

    private val googleSignInClient: GoogleSignInClient by lazy {
        val webClientId = context.getString(R.string.default_web_client_id)
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(webClientId)
            .requestEmail()
            .requestProfile()
            .build()
        GoogleSignIn.getClient(context, gso)
    }

    /**
     * Returns the Intent to launch with rememberLauncherForActivityResult.
     * Pass this to the activity result launcher.
     */
    fun getSignInIntent(): Intent = googleSignInClient.signInIntent

    /**
     * Process the ActivityResult from Google Sign-In.
     * Signs into Firebase with the Google credential, then returns the Firebase ID token.
     */
    suspend fun handleSignInResult(result: ActivityResult): GoogleSignInResult {
        return try {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            val account: GoogleSignInAccount = task.getResult(ApiException::class.java)
                ?: return GoogleSignInResult.Error("Google Sign-In returned no account")

            val googleIdToken = account.idToken
                ?: return GoogleSignInResult.Error("Google account has no ID token. Check Web Client ID configuration.")

            // Sign into Firebase with the Google credential
            val credential = GoogleAuthProvider.getCredential(googleIdToken, null)
            val authResult = firebaseAuth.signInWithCredential(credential).await()

            val firebaseUser = authResult.user
                ?: return GoogleSignInResult.Error("Firebase sign-in returned no user")

            // Get the Firebase ID token to send to our backend
            val firebaseIdToken = firebaseUser.getIdToken(false).await().token
                ?: return GoogleSignInResult.Error("Could not get Firebase ID token")

            GoogleSignInResult.Success(
                firebaseIdToken = firebaseIdToken,
                email = firebaseUser.email ?: account.email ?: ""
            )

        } catch (e: ApiException) {
            when (e.statusCode) {
                12501 -> GoogleSignInResult.Cancelled  // User cancelled
                7 -> GoogleSignInResult.Error("Network error. Check your internet connection.")
                10 -> GoogleSignInResult.Error("Developer error: SHA-1 fingerprint not registered in Firebase Console.")
                else -> GoogleSignInResult.Error("Google Sign-In failed (code ${e.statusCode}): ${e.message}")
            }
        } catch (e: Exception) {
            GoogleSignInResult.Error(e.message ?: "Google Sign-In failed")
        }
    }

    /**
     * Sign out from both Google and Firebase.
     */
    suspend fun signOut() {
        try {
            firebaseAuth.signOut()
            googleSignInClient.signOut().await()
        } catch (e: Exception) {
            // Ignore sign-out errors
        }
    }
}
