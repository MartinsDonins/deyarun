import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

let storage;

// Initialize Firebase Storage
export const initializeFirebaseStorage = () => {
  try {
    storage = getStorage();
    console.log('✅ Firebase Storage initialized');
    return storage;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Storage:', error);
    throw error;
  }
};

/**
 * Upload file to Firebase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} folder - Storage folder path
 * @param {string} filename - File name
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} Download URL
 */
export const uploadToFirebase = async (fileBuffer, folder, filename, contentType) => {
  try {
    if (!storage) {
      storage = initializeFirebaseStorage();
    }

    // Create unique filename to avoid conflicts
    const uniqueFilename = `${uuidv4()}_${filename}`;
    const filePath = `${folder}/${uniqueFilename}`;
    
    // Create storage reference
    const storageRef = ref(storage, filePath);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType,
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: filename
      }
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log(`✅ File uploaded to Firebase: ${filePath}`);
    return downloadURL;
  } catch (error) {
    console.error('❌ Firebase upload error:', error);
    throw new Error(`Failed to upload file to Firebase: ${error.message}`);
  }
};

/**
 * Delete file from Firebase Storage
 * @param {string} downloadUrl - Firebase download URL
 * @returns {Promise<void>}
 */
export const deleteFromFirebase = async (downloadUrl) => {
  try {
    if (!storage) {
      storage = initializeFirebaseStorage();
    }

    // Extract file path from download URL
    const url = new URL(downloadUrl);
    const pathMatch = url.pathname.match(/\/v0\/b\/[^\/]+\/o\/(.+)/);
    
    if (!pathMatch) {
      throw new Error('Invalid Firebase download URL');
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    const fileRef = ref(storage, filePath);
    
    await deleteObject(fileRef);
    console.log(`✅ File deleted from Firebase: ${filePath}`);
  } catch (error) {
    console.error('❌ Firebase delete error:', error);
    throw new Error(`Failed to delete file from Firebase: ${error.message}`);
  }
};

/**
 * Upload video with optimized settings
 * @param {Buffer} videoBuffer - Video file buffer
 * @param {string} exerciseId - Exercise ID for organizing
 * @param {string} originalName - Original filename
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
export const uploadExerciseVideo = async (videoBuffer, exerciseId, originalName) => {
  try {
    const folder = `exercises/videos/${exerciseId}`;
    const timestamp = Date.now();
    const extension = originalName.split('.').pop().toLowerCase();
    const filename = `video_${timestamp}.${extension}`;
    
    // Determine content type
    const contentTypeMap = {
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'webm': 'video/webm',
      'mkv': 'video/x-matroska'
    };
    
    const contentType = contentTypeMap[extension] || 'video/mp4';
    
    const downloadURL = await uploadToFirebase(videoBuffer, folder, filename, contentType);
    
    return {
      url: downloadURL,
      path: `${folder}/${filename}`,
      contentType,
      size: videoBuffer.length,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Exercise video upload error:', error);
    throw error;
  }
};

/**
 * Upload thumbnail image
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} exerciseId - Exercise ID
 * @param {string} originalName - Original filename
 * @returns {Promise<string>} Download URL
 */
export const uploadThumbnail = async (imageBuffer, exerciseId, originalName) => {
  try {
    const folder = `exercises/thumbnails/${exerciseId}`;
    const timestamp = Date.now();
    const extension = originalName.split('.').pop().toLowerCase();
    const filename = `thumbnail_${timestamp}.${extension}`;
    
    const contentTypeMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    
    const contentType = contentTypeMap[extension] || 'image/jpeg';
    
    return await uploadToFirebase(imageBuffer, folder, filename, contentType);
  } catch (error) {
    console.error('❌ Thumbnail upload error:', error);
    throw error;
  }
};

/**
 * Get file metadata from Firebase Storage
 * @param {string} downloadUrl - Firebase download URL
 * @returns {Promise<Object>} File metadata
 */
export const getFileMetadata = async (downloadUrl) => {
  try {
    if (!storage) {
      storage = initializeFirebaseStorage();
    }

    const url = new URL(downloadUrl);
    const pathMatch = url.pathname.match(/\/v0\/b\/[^\/]+\/o\/(.+)/);
    
    if (!pathMatch) {
      throw new Error('Invalid Firebase download URL');
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    const fileRef = ref(storage, filePath);
    
    const metadata = await getMetadata(fileRef);
    
    return {
      name: metadata.name,
      size: metadata.size,
      contentType: metadata.contentType,
      timeCreated: metadata.timeCreated,
      updated: metadata.updated,
      customMetadata: metadata.customMetadata
    };
  } catch (error) {
    console.error('❌ Get metadata error:', error);
    throw new Error(`Failed to get file metadata: ${error.message}`);
  }
};

/**
 * Batch delete multiple files
 * @param {string[]} downloadUrls - Array of Firebase download URLs
 * @returns {Promise<Object>} Deletion results
 */
export const batchDeleteFromFirebase = async (downloadUrls) => {
  const results = {
    success: [],
    failed: []
  };

  for (const url of downloadUrls) {
    try {
      await deleteFromFirebase(url);
      results.success.push(url);
    } catch (error) {
      results.failed.push({ url, error: error.message });
    }
  }

  return results;
};

export default {
  initializeFirebaseStorage,
  uploadToFirebase,
  deleteFromFirebase,
  uploadExerciseVideo,
  uploadThumbnail,
  getFileMetadata,
  batchDeleteFromFirebase
};