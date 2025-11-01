import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../prismaClient.js';

class CertificateService {
  constructor() {
    this.certificatesDir = path.join(process.cwd(), 'uploads', 'certificates');
    this.templatesDir = path.join(process.cwd(), 'assets', 'certificate-templates');
    this.initializeDirectories();
  }

  async initializeDirectories() {
    try {
      await fs.mkdir(this.certificatesDir, { recursive: true });
      await fs.mkdir(this.templatesDir, { recursive: true });
      console.log('📜 Certificate directories initialized');
    } catch (error) {
      console.error('Failed to initialize certificate directories:', error);
    }
  }

  // Generate completion certificate
  async generateCompletionCertificate(userId, courseId) {
    try {
      // Get user and course information
      const [user, course, enrollment] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }),
        prisma.course.findUnique({
          where: { id: courseId },
          select: {
            name: true,
            category: true,
            level: true,
            duration: true,
            instructorName: true
          }
        }),
        prisma.courseEnrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId
            }
          },
          select: {
            completedAt: true,
            finalScore: true
          }
        })
      ]);

      if (!user || !course || !enrollment || !enrollment.completedAt) {
        throw new Error('Invalid certificate request');
      }

      // Generate certificate filename
      const certificateId = `cert_${userId}_${courseId}_${Date.now()}`;
      const fileName = `${certificateId}.pdf`;
      const filePath = path.join(this.certificatesDir, fileName);

      // Create PDF certificate
      await this.createPDFCertificate({
        filePath,
        user,
        course,
        enrollment,
        certificateId
      });

      // Save certificate record to database
      const certificate = await prisma.courseCertificate.create({
        data: {
          id: certificateId,
          userId,
          courseId,
          fileName,
          issuedAt: new Date(),
          isValid: true
        }
      });

      return {
        certificateId,
        fileName,
        filePath,
        downloadUrl: `/api/certificates/${certificateId}/download`
      };
    } catch (error) {
      console.error('Certificate generation error:', error);
      throw error;
    }
  }

  // Create PDF certificate document
  async createPDFCertificate({ filePath, user, course, enrollment, certificateId }) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const stream = require('fs').createWriteStream(filePath);
        doc.pipe(stream);

        // Certificate design
        this.drawCertificateDesign(doc, {
          user,
          course,
          enrollment,
          certificateId
        });

        doc.end();

        stream.on('finish', () => {
          console.log('✅ Certificate PDF generated:', filePath);
          resolve();
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Draw certificate design
  drawCertificateDesign(doc, { user, course, enrollment, certificateId }) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const centerX = pageWidth / 2;

    // Background and border
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
       .strokeColor('#FF6B6B')
       .lineWidth(3)
       .stroke();

    doc.rect(40, 40, pageWidth - 80, pageHeight - 80)
       .strokeColor('#FF6B6B')
       .lineWidth(1)
       .stroke();

    // Header - Certificate Title
    doc.fontSize(36)
       .fillColor('#FF6B6B')
       .font('Helvetica-Bold')
       .text('CERTIFICATE OF COMPLETION', 0, 80, {
         align: 'center',
         width: pageWidth
       });

    // DeyaRun Logo/Text
    doc.fontSize(18)
       .fillColor('#4A5568')
       .font('Helvetica')
       .text('DeyaRun', 0, 130, {
         align: 'center',
         width: pageWidth
       });

    // Decorative line
    const lineY = 160;
    doc.moveTo(centerX - 100, lineY)
       .lineTo(centerX + 100, lineY)
       .strokeColor('#FF6B6B')
       .lineWidth(2)
       .stroke();

    // Main content
    doc.fontSize(16)
       .fillColor('#2D3748')
       .font('Helvetica')
       .text('This is to certify that', 0, 200, {
         align: 'center',
         width: pageWidth
       });

    // Student name
    const studentName = `${user.firstName} ${user.lastName}`;
    doc.fontSize(28)
       .fillColor('#1A202C')
       .font('Helvetica-Bold')
       .text(studentName, 0, 240, {
         align: 'center',
         width: pageWidth
       });

    // Course completion text
    doc.fontSize(16)
       .fillColor('#2D3748')
       .font('Helvetica')
       .text('has successfully completed the course', 0, 290, {
         align: 'center',
         width: pageWidth
       });

    // Course name
    doc.fontSize(22)
       .fillColor('#FF6B6B')
       .font('Helvetica-Bold')
       .text(course.name, 0, 330, {
         align: 'center',
         width: pageWidth
       });

    // Course details
    doc.fontSize(14)
       .fillColor('#4A5568')
       .font('Helvetica')
       .text(`Level: ${course.level} | Duration: ${course.duration} | Category: ${course.category}`, 0, 370, {
         align: 'center',
         width: pageWidth
       });

    // Completion date
    const completionDate = new Date(enrollment.completedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.fontSize(14)
       .fillColor('#2D3748')
       .text(`Completed on ${completionDate}`, 0, 420, {
         align: 'center',
         width: pageWidth
       });

    // Score (if available)
    if (enrollment.finalScore) {
      doc.fontSize(12)
         .fillColor('#4A5568')
         .text(`Final Score: ${enrollment.finalScore}%`, 0, 450, {
           align: 'center',
           width: pageWidth
         });
    }

    // Instructor signature area (left side)
    const leftSignX = 150;
    const signY = 520;

    doc.moveTo(leftSignX - 50, signY)
       .lineTo(leftSignX + 50, signY)
       .strokeColor('#4A5568')
       .lineWidth(1)
       .stroke();

    doc.fontSize(12)
       .fillColor('#4A5568')
       .font('Helvetica')
       .text(course.instructorName || 'Course Instructor', leftSignX - 60, signY + 10, {
         align: 'center',
         width: 120
       });

    doc.fontSize(10)
       .text('Instructor', leftSignX - 60, signY + 30, {
         align: 'center',
         width: 120
       });

    // DeyaRun signature area (right side)
    const rightSignX = pageWidth - 150;

    doc.moveTo(rightSignX - 50, signY)
       .lineTo(rightSignX + 50, signY)
       .strokeColor('#4A5568')
       .lineWidth(1)
       .stroke();

    doc.fontSize(12)
       .text('DeyaRun', rightSignX - 60, signY + 10, {
         align: 'center',
         width: 120
       });

    doc.fontSize(10)
       .text('Learning Platform', rightSignX - 60, signY + 30, {
         align: 'center',
         width: 120
       });

    // Certificate ID and verification
    doc.fontSize(8)
       .fillColor('#A0AEC0')
       .font('Helvetica')
       .text(`Certificate ID: ${certificateId}`, 50, pageHeight - 80);

    doc.text('Verify at: runacademy-full-fronend.vercel.app/verify', pageWidth - 200, pageHeight - 80, {
      align: 'right',
      width: 150
    });

    // Date issued
    const issuedDate = new Date().toLocaleDateString('en-US');
    doc.text(`Issued: ${issuedDate}`, 50, pageHeight - 65);
  }

  // Verify certificate
  async verifyCertificate(certificateId) {
    try {
      const certificate = await prisma.courseCertificate.findUnique({
        where: { id: certificateId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          course: {
            select: {
              name: true,
              category: true,
              level: true
            }
          }
        }
      });

      if (!certificate || !certificate.isValid) {
        return {
          valid: false,
          message: 'Certificate not found or invalid'
        };
      }

      return {
        valid: true,
        certificate: {
          id: certificate.id,
          studentName: `${certificate.user.firstName} ${certificate.user.lastName}`,
          courseName: certificate.course.name,
          courseLevel: certificate.course.level,
          courseCategory: certificate.course.category,
          issuedAt: certificate.issuedAt,
          isValid: certificate.isValid
        }
      };
    } catch (error) {
      console.error('Certificate verification error:', error);
      return {
        valid: false,
        message: 'Verification failed'
      };
    }
  }

  // Get certificate file path
  getCertificateFilePath(fileName) {
    return path.join(this.certificatesDir, fileName);
  }

  // Revoke certificate
  async revokeCertificate(certificateId, reason = 'Not specified') {
    try {
      await prisma.courseCertificate.update({
        where: { id: certificateId },
        data: {
          isValid: false,
          revokedAt: new Date(),
          revocationReason: reason
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Certificate revocation error:', error);
      throw error;
    }
  }

  // List user certificates
  async getUserCertificates(userId) {
    try {
      const certificates = await prisma.courseCertificate.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              name: true,
              category: true,
              level: true
            }
          }
        },
        orderBy: { issuedAt: 'desc' }
      });

      return certificates.map(cert => ({
        id: cert.id,
        courseName: cert.course.name,
        courseCategory: cert.course.category,
        courseLevel: cert.course.level,
        issuedAt: cert.issuedAt,
        isValid: cert.isValid,
        downloadUrl: `/api/certificates/${cert.id}/download`
      }));
    } catch (error) {
      console.error('Get user certificates error:', error);
      throw error;
    }
  }
}

// Add certificate model to schema (if not exists)
async function ensureCertificateModel() {
  try {
    // This would require a Prisma migration
    console.log('📜 Certificate model should be added to Prisma schema');
    console.log(`
model CourseCertificate {
  id            String   @id
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseId      String
  course        Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  fileName      String
  issuedAt      DateTime @default(now())
  isValid       Boolean  @default(true)
  revokedAt     DateTime?
  revocationReason String?
  
  @@unique([userId, courseId])
  @@map("course_certificates")
}
    `);
  } catch (error) {
    console.error('Certificate model setup error:', error);
  }
}

export default new CertificateService();
export { ensureCertificateModel };