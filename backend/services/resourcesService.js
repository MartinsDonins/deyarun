import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import prisma from '../prismaClient.js';

class ResourcesService {
  constructor() {
    this.resourcesDir = path.join(process.cwd(), 'uploads', 'resources');
    this.allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'audio/mpeg',
      'audio/wav',
      'video/mp4'
    ];
    this.initializeDirectory();
  }

  async initializeDirectory() {
    try {
      await fs.mkdir(this.resourcesDir, { recursive: true });
      console.log('📁 Resources directory initialized');
    } catch (error) {
      console.error('Failed to initialize resources directory:', error);
    }
  }

  // Configure multer for resource uploads
  getUploadMiddleware() {
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          await fs.mkdir(this.resourcesDir, { recursive: true });
          cb(null, this.resourcesDir);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        // Generate secure filename
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const extension = path.extname(file.originalname);
        const filename = `resource-${uniqueSuffix}${extension}`;
        cb(null, filename);
      }
    });

    return multer({
      storage,
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
      fileFilter: (req, file, cb) => {
        if (this.allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} not allowed`));
        }
      }
    });
  }

  // Process uploaded resource
  async processUploadedResource(file, metadata = {}) {
    try {
      const resourceData = {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedAt: new Date(),
        ...metadata
      };

      // Generate download URL
      resourceData.downloadUrl = `/api/resources/${file.filename}/download`;

      return resourceData;
    } catch (error) {
      console.error('Process uploaded resource error:', error);
      throw error;
    }
  }

  // Get resource file path
  getResourceFilePath(filename) {
    return path.join(this.resourcesDir, filename);
  }

  // Check if resource exists
  async resourceExists(filename) {
    try {
      const filePath = this.getResourceFilePath(filename);
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get resource info
  async getResourceInfo(filename) {
    try {
      const filePath = this.getResourceFilePath(filename);
      const stats = await fs.stat(filePath);
      
      return {
        filename,
        size: stats.size,
        lastModified: stats.mtime,
        isFile: stats.isFile()
      };
    } catch (error) {
      throw new Error(`Resource not found: ${filename}`);
    }
  }

  // Delete resource
  async deleteResource(filename) {
    try {
      const filePath = this.getResourceFilePath(filename);
      await fs.unlink(filePath);
      console.log(`📁 Resource deleted: ${filename}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete resource ${filename}:`, error);
      return false;
    }
  }

  // Get file stream for download
  createReadStream(filename) {
    const filePath = this.getResourceFilePath(filename);
    return require('fs').createReadStream(filePath);
  }

  // Get MIME type from filename
  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.zip': 'application/zip',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Validate resource access
  async validateResourceAccess(filename, userId, lessonId = null) {
    try {
      // Basic file existence check
      if (!(await this.resourceExists(filename))) {
        return { access: false, reason: 'Resource not found' };
      }

      // If lesson-specific resource, check lesson access
      if (lessonId) {
        const lesson = await prisma.courseLesson.findUnique({
          where: { id: lessonId },
          include: { course: true }
        });

        if (!lesson) {
          return { access: false, reason: 'Lesson not found' };
        }

        // Check if lesson is free or user has enrollment
        if (!lesson.isFree && lesson.course.isPaid) {
          const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
              userId_courseId: {
                userId,
                courseId: lesson.courseId
              }
            }
          });

          if (!enrollment) {
            return { access: false, reason: 'Access denied - enrollment required' };
          }
        }
      }

      return { access: true };
    } catch (error) {
      console.error('Validate resource access error:', error);
      return { access: false, reason: 'Validation failed' };
    }
  }

  // Clean up old resources (maintenance task)
  async cleanupOldResources(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const files = await fs.readdir(this.resourcesDir);
      let deletedCount = 0;

      for (const file of files) {
        try {
          const filePath = path.join(this.resourcesDir, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        } catch (error) {
          console.warn(`Failed to process file ${file}:`, error.message);
        }
      }

      console.log(`🧹 Cleaned up ${deletedCount} old resources`);
      return deletedCount;
    } catch (error) {
      console.error('Cleanup old resources error:', error);
      return 0;
    }
  }

  // Get resource usage statistics
  async getResourceStatistics() {
    try {
      const files = await fs.readdir(this.resourcesDir);
      let totalSize = 0;
      let totalFiles = files.length;
      const typeStats = {};

      for (const file of files) {
        try {
          const filePath = path.join(this.resourcesDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;

          const ext = path.extname(file).toLowerCase();
          typeStats[ext] = (typeStats[ext] || 0) + 1;
        } catch (error) {
          console.warn(`Failed to stat file ${file}:`, error.message);
        }
      }

      return {
        totalFiles,
        totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        typeDistribution: typeStats
      };
    } catch (error) {
      console.error('Get resource statistics error:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        totalSizeMB: 0,
        typeDistribution: {}
      };
    }
  }
}

export default new ResourcesService();