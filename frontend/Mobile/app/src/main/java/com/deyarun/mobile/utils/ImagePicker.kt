package com.deyarun.mobile.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import androidx.activity.ComponentActivity
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.core.content.FileProvider
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.IOException
import java.util.Base64

class ImagePicker(private val activity: ComponentActivity) {

    private var imageCallback: ((String?) -> Unit)? = null
    private var cameraUri: Uri? = null

    private val cameraLauncher: ActivityResultLauncher<Uri> =
        activity.registerForActivityResult(
            ActivityResultContracts.TakePicture()
        ) { success ->
            if (success && cameraUri != null) {
                processImageUri(cameraUri!!)
            } else {
                imageCallback?.invoke(null)
            }
        }

    private val galleryLauncher: ActivityResultLauncher<String> =
        activity.registerForActivityResult(
            ActivityResultContracts.GetContent()
        ) { uri ->
            if (uri != null) {
                processImageUri(uri)
            } else {
                imageCallback?.invoke(null)
            }
        }

    @Composable
    fun ImagePickerDialog(
        showDialog: Boolean,
        onDismiss: () -> Unit,
        onImageSelected: (String?) -> Unit
    ) {
        if (showDialog) {
            AlertDialog(
                onDismissRequest = onDismiss,
                title = { Text("Select Profile Picture") },
                text = { Text("Choose how you want to select your profile picture") },
                confirmButton = {
                    TextButton(
                        onClick = {
                            onDismiss()
                            openCamera(onImageSelected)
                        }
                    ) {
                        Text("Camera")
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = {
                            onDismiss()
                            openGallery(onImageSelected)
                        }
                    ) {
                        Text("Gallery")
                    }
                }
            )
        }
    }

    private fun openCamera(callback: (String?) -> Unit) {
        imageCallback = callback

        try {
            val photoFile = createImageFile()
            cameraUri = FileProvider.getUriForFile(
                activity,
                "${activity.packageName}.provider",
                photoFile
            )
            cameraLauncher.launch(cameraUri)
        } catch (e: IOException) {
            callback(null)
        }
    }

    private fun openGallery(callback: (String?) -> Unit) {
        imageCallback = callback
        galleryLauncher.launch("image/*")
    }

    private fun createImageFile(): File {
        val timeStamp = System.currentTimeMillis().toString()
        val imageFileName = "JPEG_${timeStamp}_"
        val storageDir = activity.getExternalFilesDir("Pictures")
        return File.createTempFile(
            imageFileName,
            ".jpg",
            storageDir
        )
    }

    private fun processImageUri(uri: Uri) {
        try {
            val inputStream = activity.contentResolver.openInputStream(uri)
            val bitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()

            val compressedBitmap = compressBitmap(bitmap)
            val base64String = bitmapToBase64(compressedBitmap)

            imageCallback?.invoke(base64String)
        } catch (e: Exception) {
            imageCallback?.invoke(null)
        }
    }

    private fun compressBitmap(bitmap: Bitmap): Bitmap {
        val maxWidth = 500
        val maxHeight = 500

        val width = bitmap.width
        val height = bitmap.height

        val scaleWidth = maxWidth.toFloat() / width
        val scaleHeight = maxHeight.toFloat() / height
        val scale = minOf(scaleWidth, scaleHeight)

        if (scale >= 1.0f) {
            return bitmap
        }

        val newWidth = (width * scale).toInt()
        val newHeight = (height * scale).toInt()

        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }

    private fun bitmapToBase64(bitmap: Bitmap): String {
        val byteArrayOutputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 80, byteArrayOutputStream)
        val byteArray = byteArrayOutputStream.toByteArray()
        return Base64.getEncoder().encodeToString(byteArray)
    }
}