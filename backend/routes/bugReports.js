import express from 'express';
import BugReport from '../models/mongodb/bugReport.model.js';
import { authMiddleware, optionalAuthMiddleware, verifyToken, requireAdmin } from '../middleware/authMiddleware.js';
import emailService from '../services/emailService.js';
import { body, validationResult, query } from 'express-validator';

const router = express.Router();

// ==================================================================
// VALIDATION RULES
// ==================================================================

const createBugReportValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Nosaukums ir obligāts un jābūt 5-200 rakstzīmju garam'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Apraksts ir obligāts un jābūt 10-2000 rakstzīmju garam'),
  
  body('category')
    .isIn(['crash', 'performance', 'ui_bug', 'login_issue', 'gps_tracking', 'sync_issue', 'feature_request', 'other'])
    .withMessage('Nederīga kategorija'),
  
  body('userEmail')
    .optional()
    .isEmail()
    .withMessage('Nederīgs e-pasta formāts'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Nederīga prioritāte')
];

const updateBugReportValidation = [
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed', 'duplicate'])
    .withMessage('Nederīgs statuss'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Nederīga prioritāte'),
  
  body('adminNote')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Admin komentārs nedrīkst būt garāks par 1000 rakstzīmēm')
];

// ==================================================================
// PUBLIC ROUTES - Kļūdu ziņošana
// ==================================================================

/**
 * @route   POST /api/bug-reports
 * @desc    Izveidot jaunu kļūdas ziņojumu
 * @access  Public/Authenticated
 */
router.post('/', 
  optionalAuthMiddleware, // Lietotājs var būt pieslēgts vai ne
  createBugReportValidation,
  async (req, res) => {
    try {
      // Pārbaudām validācijas kļūdas
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validācijas kļūdas',
          errors: errors.array()
        });
      }

      const {
        title,
        description,
        category,
        priority,
        userEmail,
        userName,
        deviceInfo,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        errorLogs,
        url
      } = req.body;

      // Izveidojam jaunu kļūdas ziņojumu
      const bugReportData = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority: priority || 'medium',
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        errorLogs,
        url,
        deviceInfo,
        
        // Lietotāja informācija
        userId: req.user ? req.user.userId : null,
        userEmail: userEmail || (req.user ? req.user.email : null),
        userName: userName || (req.user ? req.user.name : null),
        
        // Meta informācija
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      const bugReport = new BugReport(bugReportData);
      await bugReport.save();

      console.log(`🐛 Jauns kļūdas ziņojums saglabāts:`, {
        id: bugReport._id,
        title: title,
        category: bugReportData.category,
        userId: bugReportData.userId,
        userEmail: bugReportData.userEmail,
        userName: bugReportData.userName
      });

      // Nosūtām e-pasta paziņojumu admin
      try {
        await emailService.sendBugReportNotification(bugReport);
        bugReport.notificationSent = true;
        await bugReport.save();
        console.log('📧 Admin paziņojums nosūtīts');
      } catch (emailError) {
        console.error('❌ Neizdevās nosūtīt admin paziņojumu:', emailError);
        // Neapturams process, ja e-pasts neizdevās
      }

      res.status(201).json({
        success: true,
        message: 'Kļūdas ziņojums veiksmīgi nosūtīts',
        data: {
          id: bugReport._id,
          status: bugReport.status,
          createdAt: bugReport.createdAt
        }
      });

    } catch (error) {
      console.error('❌ Kļūda izveidojot bug report:', error);
      res.status(500).json({
        success: false,
        message: 'Servera kļūda. Lūdzu, mēģiniet vēlāk.'
      });
    }
  }
);

/**
 * @route   GET /api/bug-reports/categories
 * @desc    Iegūt pieejamās kategorijas
 * @access  Public
 */
router.get('/categories', (req, res) => {
  const categories = [
    { value: 'crash', label: 'Aplikācijas kļūda', description: 'App crashes or stops working' },
    { value: 'performance', label: 'Veiktspējas problēma', description: 'Slow loading or lag' },
    { value: 'ui_bug', label: 'Dizaina kļūda', description: 'UI elements not working correctly' },
    { value: 'login_issue', label: 'Pieslēgšanās problēma', description: 'Cannot login or authenticate' },
    { value: 'gps_tracking', label: 'GPS problēma', description: 'GPS tracking not working' },
    { value: 'sync_issue', label: 'Sinhronizācijas problēma', description: 'Data sync problems' },
    { value: 'feature_request', label: 'Funkcionalitātes pieprasījums', description: 'Request for new features' },
    { value: 'other', label: 'Cits', description: 'Other issues not listed above' }
  ];

  res.json({
    success: true,
    data: categories
  });
});

// ==================================================================
// AUTHENTICATED ROUTES - Lietotāja ziņojumi
// ==================================================================

/**
 * @route   GET /api/bug-reports/my
 * @desc    Iegūt lietotāja kļūdu ziņojumus
 * @access  Private
 */
router.get('/my', 
  verifyToken,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const bugReports = await BugReport.find({ 
        $or: [
          { userId: req.user.userId },
          { userEmail: req.user.email }
        ]
      })
      .select('-errorLogs -ipAddress -userAgent -adminNotes')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

      const total = await BugReport.countDocuments({ 
        $or: [
          { userId: req.user.userId },
          { userEmail: req.user.email }
        ]
      });

      res.json({
        success: true,
        data: {
          bugReports,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('❌ Kļūda iegūstot user bug reports:', error);
      res.status(500).json({
        success: false,
        message: 'Servera kļūda'
      });
    }
  }
);

// ==================================================================
// ADMIN ROUTES - Kļūdu pārvaldība
// ==================================================================

/**
 * @route   GET /api/bug-reports/admin
 * @desc    Iegūt visus kļūdu ziņojumus (admin)
 * @access  Admin
 */
router.get('/admin', 
  verifyToken,
  requireAdmin,
  [
    query('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed', 'duplicate']),
    query('category').optional().isIn(['crash', 'performance', 'ui_bug', 'login_issue', 'gps_tracking', 'sync_issue', 'feature_request', 'other']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
  ],
  async (req, res) => {
    try {
      console.log('🔍 Admin bug reports request:', {
        user: req.user?.role,
        userId: req.user?.userId,
        query: req.query
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Nederīgi filtri',
          errors: errors.array()
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      
      // Filtri
      const filters = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.category) filters.category = req.query.category;
      if (req.query.priority) filters.priority = req.query.priority;
      if (req.query.search) {
        filters.$or = [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
          { userEmail: { $regex: req.query.search, $options: 'i' } }
        ];
      }

      const sortOrder = req.query.sort === 'oldest' ? 1 : -1;

      const bugReports = await BugReport.find(filters)
        .populate('userId', 'name email')
        .populate('resolution.resolvedBy', 'name')
        .sort({ createdAt: sortOrder })
        .limit(limit)
        .skip(skip);

      const total = await BugReport.countDocuments(filters);

      console.log('📊 Bug reports query result:', {
        filtersUsed: filters,
        foundReports: bugReports.length,
        totalCount: total,
        page,
        limit
      });

      // Statistika
      const stats = await BugReport.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const priorityStats = await BugReport.aggregate([
        { $match: { status: { $ne: 'closed' } } },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          bugReports,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          },
          statistics: {
            byStatus: stats,
            byPriority: priorityStats
          }
        }
      });

    } catch (error) {
      console.error('❌ Kļūda iegūstot admin bug reports:', error);
      res.status(500).json({
        success: false,
        message: 'Servera kļūda'
      });
    }
  }
);

/**
 * @route   GET /api/bug-reports/admin/statistics
 * @desc    Iegūt kļūdu ziņojumu statistiku
 * @access  Admin
 */
router.get('/admin/statistics', 
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalReports,
        openReports,
        reportsThisWeek,
        reportsThisMonth,
        categoryStats,
        priorityStats,
        resolutionStats
      ] = await Promise.all([
        BugReport.countDocuments(),
        BugReport.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
        BugReport.countDocuments({ createdAt: { $gte: lastWeek } }),
        BugReport.countDocuments({ createdAt: { $gte: lastMonth } }),
        BugReport.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        BugReport.aggregate([
          { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]),
        BugReport.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ])
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            total: totalReports,
            open: openReports,
            thisWeek: reportsThisWeek,
            thisMonth: reportsThisMonth
          },
          breakdown: {
            byCategory: categoryStats,
            byPriority: priorityStats,
            byStatus: resolutionStats
          }
        }
      });

    } catch (error) {
      console.error('❌ Kļūda iegūstot statistiku:', error);
      res.status(500).json({
        success: false,
        message: 'Servera kļūda'
      });
    }
  }
);

/**
 * @route   GET /api/bug-reports/admin/:id
 * @desc    Iegūt konkrētu kļūdas ziņojumu (admin)
 * @access  Admin
 */
router.get('/admin/:id', 
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const bugReport = await BugReport.findById(req.params.id)
        .populate('userId', 'name email profileImage')
        .populate('resolution.resolvedBy', 'name email')
        .populate('adminNotes.adminId', 'name email');

      if (!bugReport) {
        return res.status(404).json({
          success: false,
          message: 'Kļūdas ziņojums nav atrasts'
        });
      }

      res.json({
        success: true,
        data: bugReport
      });

    } catch (error) {
      console.error('❌ Kļūda iegūstot bug report:', error);
      res.status(500).json({
        success: false,
        message: 'Servera kļūda'
      });
    }
  }
);

/**
 * @route   PUT /api/bug-reports/admin/:id
 * @desc    Atjaunināt kļūdas ziņojumu (admin)
 * @access  Admin
 */
router.put('/admin/:id', 
  verifyToken,
  requireAdmin,
  updateBugReportValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validācijas kļūdas',
          errors: errors.array()
        });
      }

      const bugReport = await BugReport.findById(req.params.id);
      if (!bugReport) {
        return res.status(404).json({
          success: false,
          message: 'Kļūdas ziņojums nav atrasts'
        });
      }

      const { status, priority, adminNote, resolution } = req.body;

      // Atjauninām pamata laukus
      if (status) bugReport.status = status;
      if (priority) bugReport.priority = priority;

      // Pievienojam admin komentāru
      if (adminNote) {
        bugReport.adminNotes.push({
          note: adminNote,
          adminId: req.user.userId,
          adminName: req.user.name
        });
      }

      // Ja ziņojums tiek atrisināts
      if (status === 'resolved' && resolution) {
        bugReport.resolution = {
          description: resolution,
          resolvedBy: req.user.userId,
          resolvedAt: new Date(),
          version: req.body.resolvedVersion
        };
      }

      await bugReport.save();

      // Ielādējam atjaunināto ziņojumu ar populētiem laukiem
      const updatedBugReport = await BugReport.findById(bugReport._id)
        .populate('userId', 'name email')
        .populate('resolution.resolvedBy', 'name email')
        .populate('adminNotes.adminId', 'name email');

      console.log(`🔧 Bug report ${bugReport._id} atjaunināts: ${status || 'status nav mainīts'}`);

      res.json({
        success: true,
        message: 'Kļūdas ziņojums veiksmīgi atjaunināts',
        data: updatedBugReport
      });

    } catch (error) {
      console.error('❌ Kļūda atjauninot bug report:', error);
      res.status(500).json({
        success: false,
        message: 'Servera kļūda'
      });
    }
  }
);

/**
 * @route   DELETE /api/bug-reports/admin/:id
 * @desc    Dzēst kļūdas ziņojumu (admin)
 * @access  Admin
 */
router.delete('/admin/:id', 
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const bugReport = await BugReport.findById(req.params.id);
      if (!bugReport) {
        return res.status(404).json({
          success: false,
          message: 'Kļūdas ziņojums nav atrasts'
        });
      }

      await BugReport.findByIdAndDelete(req.params.id);

      console.log(`🗑️ Bug report ${req.params.id} dzēsts`);

      res.json({
        success: true,
        message: 'Kļūdas ziņojums veiksmīgi dzēsts'
      });

    } catch (error) {
      console.error('❌ Kļūda dzēšot bug report:', error);
      res.status(500).json({
        success: false,
        message: 'Servera kļūda'
      });
    }
  }
);

export default router;