import mongoose from 'mongoose';

const googleFitDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  dataType: {
    type: String,
    required: true,
    enum: ['steps', 'distance', 'calories', 'heart_rate', 'activity', 'sleep', 'weight'],
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  source: {
    type: String,
    default: 'google_fit'
  },
  externalId: {
    type: String,
    sparse: true,
    index: true
  },
  metadata: {
    startTime: Date,
    endTime: Date,
    device: String,
    application: {
      packageName: String,
      version: String
    },
    dataStreamId: String,
    originDataSourceId: String
  },
  processed: {
    type: Boolean,
    default: false,
    index: true
  },
  syncedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'googlefit_data'
});

// Compound indexes for efficient queries
googleFitDataSchema.index({ userId: 1, dataType: 1, date: 1 });
googleFitDataSchema.index({ userId: 1, date: -1 });
googleFitDataSchema.index({ externalId: 1, dataType: 1 }, { sparse: true });
googleFitDataSchema.index({ processed: 1, syncedAt: 1 });

// Static methods for data aggregation
googleFitDataSchema.statics.getStepsData = function(userId, startDate, endDate) {
  return this.find({
    userId,
    dataType: 'steps',
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

googleFitDataSchema.statics.getDistanceData = function(userId, startDate, endDate) {
  return this.find({
    userId,
    dataType: 'distance',
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

googleFitDataSchema.statics.getCaloriesData = function(userId, startDate, endDate) {
  return this.find({
    userId,
    dataType: 'calories',
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

googleFitDataSchema.statics.getHeartRateData = function(userId, startDate, endDate) {
  return this.find({
    userId,
    dataType: 'heart_rate',
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

googleFitDataSchema.statics.getActivityData = function(userId, startDate, endDate) {
  return this.find({
    userId,
    dataType: 'activity',
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: -1 });
};

// Aggregate daily summaries
googleFitDataSchema.statics.getDailySummary = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        dataType: { $in: ['steps', 'distance', 'calories'] }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          dataType: '$dataType'
        },
        totalValue: { $sum: '$value' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        data: {
          $push: {
            type: '$_id.dataType',
            value: '$totalValue',
            count: '$count'
          }
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Weekly summary
googleFitDataSchema.statics.getWeeklySummary = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        dataType: { $in: ['steps', 'distance', 'calories'] }
      }
    },
    {
      $group: {
        _id: {
          week: { $week: '$date' },
          year: { $year: '$date' },
          dataType: '$dataType'
        },
        totalValue: { $sum: '$value' },
        avgValue: { $avg: '$value' },
        minValue: { $min: '$value' },
        maxValue: { $max: '$value' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: {
          week: '$_id.week',
          year: '$_id.year'
        },
        data: {
          $push: {
            type: '$_id.dataType',
            total: '$totalValue',
            average: '$avgValue',
            min: '$minValue',
            max: '$maxValue',
            count: '$count'
          }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.week': 1 }
    }
  ]);
};

// Monthly summary
googleFitDataSchema.statics.getMonthlySummary = function(userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        dataType: { $in: ['steps', 'distance', 'calories'] }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          year: { $year: '$date' },
          dataType: '$dataType'
        },
        totalValue: { $sum: '$value' },
        avgValue: { $avg: '$value' },
        minValue: { $min: '$value' },
        maxValue: { $max: '$value' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: {
          month: '$_id.month',
          year: '$_id.year'
        },
        data: {
          $push: {
            type: '$_id.dataType',
            total: '$totalValue',
            average: '$avgValue',
            min: '$minValue',
            max: '$maxValue',
            count: '$count'
          }
        }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

// Instance methods
googleFitDataSchema.methods.markAsProcessed = function() {
  this.processed = true;
  return this.save();
};

googleFitDataSchema.methods.toDeyaRunFormat = function() {
  const data = {
    id: this._id,
    type: this.dataType,
    date: this.date,
    value: this.value,
    unit: this.unit,
    source: this.source,
    syncedAt: this.syncedAt
  };

  if (this.metadata) {
    data.metadata = this.metadata;
  }

  return data;
};

// Pre-save middleware
googleFitDataSchema.pre('save', function(next) {
  // Ensure date is properly formatted
  if (this.isNew && typeof this.date === 'string') {
    this.date = new Date(this.date);
  }
  
  // Set default units based on data type
  if (!this.unit) {
    switch (this.dataType) {
      case 'steps':
        this.unit = 'count';
        break;
      case 'distance':
        this.unit = 'meters';
        break;
      case 'calories':
        this.unit = 'kcal';
        break;
      case 'heart_rate':
        this.unit = 'bpm';
        break;
      case 'weight':
        this.unit = 'kg';
        break;
      default:
        this.unit = 'unknown';
    }
  }
  
  next();
});

const GoogleFitData = mongoose.model('GoogleFitData', googleFitDataSchema);

export default GoogleFitData;