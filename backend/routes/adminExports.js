// Admin Export Management API Routes
// Handles data exports in various formats (CSV, Excel, PDF)

import express from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Apply admin authentication to all export routes
router.use(requireAdmin);

// In-memory storage for export jobs (in production, use database)
const exportJobs = new Map();

/**
 * POST /api/admin/exports
 * Create a new export job
 */
router.post('/exports', async (req, res) => {
  try {
    const { type, format, timeRange, includeFields, filters } = req.body;
    
    if (!type || !format) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, format'
      });
    }
    
    const jobId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const exportJob = {
      id: jobId,
      type, // 'users', 'workouts', 'analytics', 'revenue', 'subscriptions'
      format, // 'csv', 'excel', 'pdf'
      timeRange: timeRange || 'all',
      includeFields: includeFields || [],
      filters: filters || {},
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      fileName: null,
      fileSize: null,
      downloadUrl: null,
      error: null
    };
    
    exportJobs.set(jobId, exportJob);
    
    console.log(`📊 Export job created: ${jobId} (${type} as ${format})`);
    
    // Start export processing asynchronously
    processExportJob(jobId);
    
    res.json({
      success: true,
      job: exportJob,
      message: 'Export job created successfully'
    });

  } catch (error) {
    console.error('❌ Failed to create export job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create export job',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/exports
 * Get all export jobs for the admin
 */
router.get('/exports', async (req, res) => {
  try {
    const adminJobs = Array.from(exportJobs.values())
      .filter(job => job.createdBy === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50); // Limit to recent 50 jobs
    
    res.json({
      success: true,
      jobs: adminJobs,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to fetch export jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve export jobs',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/exports/:jobId
 * Get specific export job status
 */
router.get('/exports/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = exportJobs.get(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Export job not found'
      });
    }
    
    // Check if user has access to this job
    if (job.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this export job'
      });
    }
    
    res.json({
      success: true,
      job,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Failed to fetch export job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve export job',
      message: error.message
    });
  }
});

/**
 * DELETE /api/admin/exports/:jobId
 * Cancel or delete an export job
 */
router.delete('/exports/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = exportJobs.get(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Export job not found'
      });
    }
    
    // Check if user has access to this job
    if (job.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this export job'
      });
    }
    
    // If job is in progress, mark as cancelled
    if (job.status === 'processing') {
      job.status = 'cancelled';
      job.error = 'Job cancelled by user';
    } else {
      // Remove completed/failed jobs
      exportJobs.delete(jobId);
    }
    
    console.log(`🗑️ Export job ${jobId} deleted/cancelled`);
    
    res.json({
      success: true,
      message: 'Export job deleted successfully'
    });

  } catch (error) {
    console.error('❌ Failed to delete export job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete export job',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/exports/:jobId/download
 * Download the exported file
 */
router.get('/exports/:jobId/download', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = exportJobs.get(jobId);
    
    if (!job || job.status !== 'completed' || !job.fileName) {
      return res.status(404).json({
        success: false,
        error: 'Export file not found or not ready'
      });
    }
    
    // Check if user has access to this job
    if (job.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this export file'
      });
    }
    
    const filePath = path.join(process.cwd(), 'temp', 'exports', job.fileName);
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Export file no longer available'
      });
    }
    
    // Set appropriate headers for download
    const contentType = getContentType(job.format);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${job.fileName}"`);
    
    // Stream the file
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
    
    console.log(`⬇️ Export file downloaded: ${job.fileName}`);

  } catch (error) {
    console.error('❌ Failed to download export file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download export file',
      message: error.message
    });
  }
});

// Helper Functions

/**
 * Process export job asynchronously
 */
async function processExportJob(jobId) {
  const job = exportJobs.get(jobId);
  if (!job) return;
  
  try {
    job.status = 'processing';
    job.progress = 10;
    
    console.log(`🔄 Processing export job: ${jobId}`);
    
    // Simulate data fetching
    await delay(1000);
    job.progress = 30;
    
    const data = await fetchExportData(job.type, job.timeRange, job.filters);
    job.progress = 60;
    
    // Generate file based on format
    const fileName = await generateExportFile(data, job);
    job.progress = 90;
    
    // Complete the job
    job.status = 'completed';
    job.progress = 100;
    job.fileName = fileName;
    job.fileSize = await getFileSize(fileName);
    job.downloadUrl = `/api/admin/exports/${jobId}/download`;
    job.completedAt = new Date().toISOString();
    
    console.log(`✅ Export job completed: ${jobId} -> ${fileName}`);
    
  } catch (error) {
    console.error(`❌ Export job failed: ${jobId}`, error);
    job.status = 'failed';
    job.error = error.message;
    job.completedAt = new Date().toISOString();
  }
}

/**
 * Fetch data for export based on type and filters
 */
async function fetchExportData(type, timeRange, filters) {
  // Mock data generation for different export types
  const baseDate = new Date();
  const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365;
  
  switch (type) {
    case 'users':
      return Array.from({ length: 150 }, (_, i) => ({
        id: `user_${i + 1}`,
        firstName: `User${i + 1}`,
        lastName: `Surname${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: ['user', 'coach', 'admin'][i % 3],
        isActive: Math.random() > 0.1,
        registrationDate: new Date(baseDate - Math.random() * daysBack * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date(baseDate - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        totalWorkouts: Math.floor(Math.random() * 50),
        subscriptionStatus: ['active', 'inactive', 'trial'][Math.floor(Math.random() * 3)]
      }));
      
    case 'workouts':
      return Array.from({ length: 300 }, (_, i) => ({
        id: `workout_${i + 1}`,
        userId: `user_${Math.floor(Math.random() * 150) + 1}`,
        type: ['cardio', 'strength', 'flexibility', 'sports'][Math.floor(Math.random() * 4)],
        duration: Math.floor(Math.random() * 90) + 15,
        caloriesBurned: Math.floor(Math.random() * 500) + 100,
        date: new Date(baseDate - Math.random() * daysBack * 24 * 60 * 60 * 1000).toISOString(),
        completed: Math.random() > 0.1
      }));
      
    case 'analytics':
      return Array.from({ length: daysBack }, (_, i) => ({
        date: new Date(baseDate - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activeUsers: Math.floor(Math.random() * 100) + 50,
        newRegistrations: Math.floor(Math.random() * 10) + 1,
        totalWorkouts: Math.floor(Math.random() * 200) + 100,
        avgSessionTime: Math.floor(Math.random() * 30) + 15,
        bounceRate: Math.round((Math.random() * 20 + 30) * 100) / 100
      }));
      
    case 'revenue':
      return Array.from({ length: Math.floor(daysBack / 7) }, (_, i) => ({
        week: `Week ${i + 1}`,
        weekStart: new Date(baseDate - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subscriptionRevenue: Math.round((Math.random() * 1000 + 500) * 100) / 100,
        oneTimePayments: Math.round((Math.random() * 200 + 50) * 100) / 100,
        totalRevenue: 0, // Will be calculated
        newSubscribers: Math.floor(Math.random() * 20) + 5,
        churnedSubscribers: Math.floor(Math.random() * 5) + 1
      })).map(item => ({
        ...item,
        totalRevenue: item.subscriptionRevenue + item.oneTimePayments
      }));
      
    default:
      throw new Error(`Unsupported export type: ${type}`);
  }
}

/**
 * Generate export file in the specified format
 */
async function generateExportFile(data, job) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${job.type}_export_${timestamp}.${job.format}`;
  const filePath = path.join(process.cwd(), 'temp', 'exports', fileName);
  
  // Ensure exports directory exists
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  
  switch (job.format) {
    case 'csv':
      await generateCSV(data, filePath, job.includeFields);
      break;
    case 'excel':
      await generateExcel(data, filePath, job);
      break;
    case 'pdf':
      await generatePDF(data, filePath, job);
      break;
    default:
      throw new Error(`Unsupported export format: ${job.format}`);
  }
  
  return fileName;
}

/**
 * Generate CSV file
 */
async function generateCSV(data, filePath, includeFields) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }
  
  const headers = includeFields.length > 0 ? includeFields : Object.keys(data[0]);
  
  // Create CSV content manually
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma or quote
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  await fs.writeFile(filePath, csvContent);
}

/**
 * Generate Excel file (simplified XML format)
 */
async function generateExcel(data, filePath, job) {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }
  
  const headers = job.includeFields.length > 0 ? job.includeFields : Object.keys(data[0]);
  
  // Create a simple XML-based Excel file
  let xmlContent = '<?xml version="1.0"?>\n';
  xmlContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xmlContent += '  xmlns:o="urn:schemas-microsoft-com:office:office"\n';
  xmlContent += '  xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
  xmlContent += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xmlContent += '  <Worksheet ss:Name="Data">\n';
  xmlContent += '    <Table>\n';
  
  // Add header row
  xmlContent += '      <Row>\n';
  headers.forEach(header => {
    xmlContent += `        <Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>\n`;
  });
  xmlContent += '      </Row>\n';
  
  // Add data rows
  data.forEach(row => {
    xmlContent += '      <Row>\n';
    headers.forEach(header => {
      const value = row[header] || '';
      const isNumber = !isNaN(value) && !isNaN(parseFloat(value)) && value !== '';
      const dataType = isNumber ? 'Number' : 'String';
      xmlContent += `        <Cell><Data ss:Type="${dataType}">${escapeXml(String(value))}</Data></Cell>\n`;
    });
    xmlContent += '      </Row>\n';
  });
  
  xmlContent += '    </Table>\n';
  xmlContent += '  </Worksheet>\n';
  xmlContent += '</Workbook>\n';
  
  await fs.writeFile(filePath, xmlContent);
  
  function escapeXml(text) {
    return text.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
  }
}

/**
 * Generate PDF file
 */
async function generatePDF(data, filePath, job) {
  const doc = new PDFDocument();
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  
  // Title
  doc.fontSize(18).text(`${job.type.charAt(0).toUpperCase() + job.type.slice(1)} Export`, 50, 50);
  doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, 50, 80);
  
  // Summary
  doc.fontSize(12).text(`Total Records: ${data.length}`, 50, 110);
  
  // Data (limited for PDF)
  if (data.length > 0) {
    const headers = job.includeFields.length > 0 ? job.includeFields.slice(0, 4) : Object.keys(data[0]).slice(0, 4);
    let yPosition = 140;
    
    // Headers
    doc.fontSize(10).text(headers.join('  |  '), 50, yPosition);
    yPosition += 20;
    
    // Data rows (limit to first 50 for PDF)
    data.slice(0, 50).forEach((row, index) => {
      const values = headers.map(header => String(row[header] || '').slice(0, 15));
      doc.text(values.join('  |  '), 50, yPosition);
      yPosition += 15;
      
      // Add new page if needed
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    });
    
    if (data.length > 50) {
      doc.text(`... and ${data.length - 50} more records`, 50, yPosition + 20);
    }
  }
  
  doc.end();
  
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

/**
 * Get file size
 */
async function getFileSize(fileName) {
  try {
    const filePath = path.join(process.cwd(), 'temp', 'exports', fileName);
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Get content type based on format
 */
function getContentType(format) {
  switch (format) {
    case 'csv': return 'text/csv';
    case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'pdf': return 'application/pdf';
    default: return 'application/octet-stream';
  }
}

/**
 * Delay utility
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default router;