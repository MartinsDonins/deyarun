import mongoose from 'mongoose';

const bugReportSchema = new mongoose.Schema({
  // Ziņojuma pamata informācija
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Kļūdas kategorija
  category: {
    type: String,
    required: true,
    enum: [
      'crash', // Aplikācijas kļūda
      'performance', // Veiktspējas problēma
      'ui_bug', // UI/UX kļūda
      'login_issue', // Pieslēgšanās problēma
      'gps_tracking', // GPS problēma
      'sync_issue', // Sinhronizācijas problēma
      'feature_request', // Funkcionalitātes pieprasījums
      'other' // Cits
    ],
    default: 'other'
  },
  
  // Prioritāte
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Statuss
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'duplicate'],
    default: 'open'
  },
  
  // Lietotāja informācija
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Atļaujam anonīmus ziņojumus
  },
  
  userEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  userName: {
    type: String,
    trim: true
  },
  
  // Ierīces informācija
  deviceInfo: {
    platform: String, // 'ios', 'android', 'web'
    osVersion: String,
    appVersion: String,
    deviceModel: String,
    screenSize: String
  },
  
  // Papildus informācija
  stepsToReproduce: {
    type: String,
    maxlength: 1000
  },
  
  expectedBehavior: {
    type: String,
    maxlength: 500
  },
  
  actualBehavior: {
    type: String,
    maxlength: 500
  },
  
  // Pielikumi (URL uz bildēm/failiem)
  attachments: [{
    filename: String,
    url: String,
    type: String, // 'image', 'video', 'log'
    size: Number
  }],
  
  // Kļūdas logiem
  errorLogs: {
    type: String,
    maxlength: 5000
  },
  
  // Admin komentāri
  adminNotes: [{
    note: String,
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    adminName: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Atrisināšanas informācija
  resolution: {
    description: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    version: String // Versijā, kurā atrisināts
  },
  
  // Meta informācija
  ipAddress: String,
  userAgent: String,
  url: String, // Kurā lapā notika kļūda
  
  // Marķēšana un meklēšana
  tags: [String],
  
  // Vai ir nosūtīts paziņojums
  notificationSent: {
    type: Boolean,
    default: false
  },
  
  // Atkārtoti ziņojumi
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BugReport'
  },
  
  relatedReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BugReport'
  }]
}, {
  timestamps: true, // Pievieno createdAt un updatedAt
  collection: 'bug_reports'
});

// Indeksi meklēšanai un kārtošanai
bugReportSchema.index({ status: 1, priority: 1 });
bugReportSchema.index({ category: 1 });
bugReportSchema.index({ userId: 1 });
bugReportSchema.index({ createdAt: -1 });
bugReportSchema.index({ userEmail: 1 });

// Virtual lauks pilnam nosaukumam
bugReportSchema.virtual('fullTitle').get(function() {
  return `[${this.category.toUpperCase()}] ${this.title}`;
});

// Metode prioritātes noteikšanai
bugReportSchema.methods.calculatePriority = function() {
  if (this.category === 'crash') return 'critical';
  if (this.category === 'login_issue') return 'high';
  if (this.category === 'performance') return 'medium';
  return this.priority;
};

// Statiskā metode statistikai
bugReportSchema.statics.getStatistics = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Middleware pirms saglabāšanas
bugReportSchema.pre('save', function(next) {
  // Automātiski aprēķina prioritāti, ja nav iestatīta
  if (this.isNew && this.priority === 'medium') {
    this.priority = this.calculatePriority();
  }
  
  // Izveidojam vienkāršus tagus no kategorijas un prioritātes
  if (this.isNew) {
    this.tags = [this.category, this.priority];
    if (this.deviceInfo && this.deviceInfo.platform) {
      this.tags.push(this.deviceInfo.platform);
    }
  }
  
  next();
});

const BugReport = mongoose.model('BugReport', bugReportSchema);

export default BugReport;