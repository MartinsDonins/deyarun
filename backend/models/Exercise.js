import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    required: true
  },
  
  // Categorization
  category: {
    type: String,
    required: true,
    enum: [
      'warm-up',           // Iesildīšana
      'strength',          // Spēka vingrinājumi
      'flexibility',       // Elastība
      'balance',          // Līdzsvars
      'coordination',     // Koordinācija
      'plyometric',       // Pliometrija
      'core',             // Vēdera muskulatūra
      'recovery',         // Atjaunošanās
      'cool-down',        // Nomierināšana
      'technique',        // Skriešanas tehnika
      'cardio'           // Kardio
    ],
    index: true
  },
  
  // Difficulty and Target
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced'],
    index: true
  },
  
  targetMuscleGroups: [{
    type: String,
    enum: [
      'legs',           // Kājas
      'glutes',         // Sēžas muskuļi
      'core',           // Vēders
      'arms',           // Rokas
      'shoulders',      // Pleci
      'back',           // Mugura
      'chest',          // Krūtis
      'calves',         // Ikri
      'hamstrings',     // Aizmugures augšstilbs
      'quadriceps',     // Priekšējais augšstilbs
      'hip-flexors',    // Gūžas locītava
      'ankles'          // Potītes
    ]
  }],
  
  // Training Context
  trainingPhase: [{
    type: String,
    enum: [
      'base-building',     // Pamata veidošana
      'speed-work',        // Ātruma darbs
      'endurance',         // Izturība
      'recovery',          // Atjaunošanās
      'competition-prep',  // Sacensību sagatavošana
      'off-season',        // Sezonas pārtraukums
      'injury-prevention', // Traumu novēršana
      'rehabilitation'     // Rehabilitācija
    ]
  }],
  
  workoutTypes: [{
    type: String,
    enum: [
      'easy-run',         // Viegls skrējiens
      'tempo-run',        // Tempo skrējiens
      'intervals',        // Intervāli
      'long-run',         // Garš skrējiens
      'recovery-run',     // Atjaunošanās skrējiens
      'fartlek',          // Fartlek
      'hill-training',    // Kalnu treniņš
      'track-workout',    // Trases treniņš
      'cross-training'    // Krusttreniņš
    ]
  }],
  
  // Exercise Parameters
  duration: {
    min: { type: Number }, // Minimālais laiks sekundēs
    max: { type: Number }  // Maksimālais laiks sekundēs
  },
  
  repetitions: {
    min: { type: Number }, // Minimālais atkārtojumu skaits
    max: { type: Number }  // Maksimālais atkārtojumu skaits
  },
  
  sets: {
    min: { type: Number, default: 1 },
    max: { type: Number, default: 1 }
  },
  
  restBetweenSets: {
    type: Number, // Atpūta starp sētiem sekundēs
    default: 30
  },
  
  // Equipment
  equipment: [{
    type: String,
    enum: [
      'none',            // Nav nepieciešams
      'mat',             // Paklājiņš
      'resistance-band', // Pretestības lenta
      'dumbbells',       // Hanteles
      'kettlebell',      // Gira
      'foam-roller',     // Porolona rulis
      'medicine-ball',   // Medicīnas bumba
      'step',            // Pakāpiens
      'pull-up-bar',     // Pievilkšanās stieņa
      'stability-ball',  // Stabilitātes bumba
      'cones',           // Konusi
      'agility-ladder'   // Veiklības kāpnes
    ]
  }],
  
  // Video Configuration with Provider Support
  video: {
    provider: {
      type: String,
      enum: ['firebase', 'vimeo', 'youtube', 'local'],
      default: 'firebase'
    },
    
    // Firebase Storage
    firebaseUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return this.video.provider !== 'firebase' || (v && v.length > 0);
        },
        message: 'Firebase URL is required when provider is firebase'
      }
    },
    
    // Vimeo Integration
    vimeoId: {
      type: String,
      validate: {
        validator: function(v) {
          return this.video.provider !== 'vimeo' || (v && v.length > 0);
        },
        message: 'Vimeo ID is required when provider is vimeo'
      }
    },
    
    // YouTube Integration (if needed)
    youtubeId: {
      type: String,
      validate: {
        validator: function(v) {
          return this.video.provider !== 'youtube' || (v && v.length > 0);
        },
        message: 'YouTube ID is required when provider is youtube'
      }
    },
    
    // Local file path (for development)
    localPath: {
      type: String,
      validate: {
        validator: function(v) {
          return this.video.provider !== 'local' || (v && v.length > 0);
        },
        message: 'Local path is required when provider is local'
      }
    },
    
    // Video metadata
    duration: Number, // Video ilgums sekundēs
    thumbnail: String, // Thumbnail URL
    aspectRatio: {
      type: String,
      enum: ['16:9', '4:3', '1:1', '9:16'],
      default: '16:9'
    },
    quality: {
      type: String,
      enum: ['480p', '720p', '1080p', '4k'],
      default: '720p'
    }
  },
  
  // AI Integration Data
  aiTags: [{
    type: String,
    // Tagi, ko AI var izmantot vingrinājumu atlasei
    // Piemēram: 'pre-run', 'post-run', 'injury-prevention', 'performance'
  }],
  
  // Contraindications and Safety
  contraindications: [{
    type: String,
    // Situācijas, kad vingrinājums nav ieteicams
    // Piemēram: 'knee-injury', 'back-pain', 'pregnancy'
  }],
  
  benefits: [{
    type: String,
    // Vingrinājuma priekšrocības
    // Piemēram: 'improves-running-form', 'increases-power', 'prevents-injury'
  }],
  
  // Usage Statistics
  usageStats: {
    timesUsed: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
  },
  
  // Status and Visibility
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Admin metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Versioning for updates
  version: {
    type: Number,
    default: 1
  },
  
  // Localization support
  translations: {
    lv: {
      name: String,
      description: String,
      instructions: String
    },
    en: {
      name: String,
      description: String,
      instructions: String
    },
    ru: {
      name: String,
      description: String,
      instructions: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
exerciseSchema.index({ category: 1, difficulty: 1 });
exerciseSchema.index({ targetMuscleGroups: 1 });
exerciseSchema.index({ aiTags: 1 });
exerciseSchema.index({ isActive: 1, isPublic: 1 });
exerciseSchema.index({ 'usageStats.avgRating': -1 });

// Separate indexes for array fields (MongoDB doesn't support compound indexes on multiple arrays)
// These are created individually to avoid "cannot index parallel arrays" error
exerciseSchema.index({ trainingPhase: 1 }, { background: true });
exerciseSchema.index({ workoutTypes: 1 }, { background: true });

// Virtual for video URL based on provider
exerciseSchema.virtual('videoUrl').get(function() {
  switch (this.video.provider) {
    case 'firebase':
      return this.video.firebaseUrl;
    case 'vimeo':
      return `https://player.vimeo.com/video/${this.video.vimeoId}`;
    case 'youtube':
      return `https://www.youtube.com/embed/${this.video.youtubeId}`;
    case 'local':
      return this.video.localPath;
    default:
      return null;
  }
});

// Instance method to get localized content
exerciseSchema.methods.getLocalized = function(language = 'lv') {
  const translation = this.translations[language];
  if (translation) {
    return {
      name: translation.name || this.name,
      description: translation.description || this.description,
      instructions: translation.instructions || this.instructions
    };
  }
  return {
    name: this.name,
    description: this.description,
    instructions: this.instructions
  };
};

// Static method for AI to find suitable exercises
exerciseSchema.statics.findForTrainingPlan = function(criteria) {
  const {
    category,
    difficulty,
    trainingPhase,
    workoutType,
    targetMuscles,
    duration,
    equipment = ['none']
  } = criteria;
  
  const query = {
    isActive: true,
    isPublic: true
  };
  
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;
  if (trainingPhase) query.trainingPhase = { $in: [trainingPhase] };
  if (workoutType) query.workoutTypes = { $in: [workoutType] };
  if (targetMuscles) query.targetMuscleGroups = { $in: targetMuscles };
  if (equipment) query.equipment = { $in: equipment };
  
  if (duration) {
    query.$or = [
      { 'duration.min': { $lte: duration }, 'duration.max': { $gte: duration } },
      { duration: { $exists: false } }
    ];
  }
  
  return this.find(query).sort({ 'usageStats.avgRating': -1, 'usageStats.timesUsed': -1 });
};

// Pre-save middleware to update version
exerciseSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  next();
});

// Static method to safely create exercise with workaround for parallel array indexing
exerciseSchema.statics.createSafely = async function(exerciseData) {
  try {
    // Try normal creation first
    const exercise = new this(exerciseData);
    await exercise.save();
    return exercise;
  } catch (error) {
    // If it's a parallel array indexing error, use workaround
    if (error.message.includes('cannot index parallel arrays') || 
        (error.message.includes('workoutTypes') && error.message.includes('trainingPhase'))) {
      
      console.log('⚠️ Parallel array indexing issue detected, using workaround...');
      
      // Store the array values
      const originalTrainingPhase = exerciseData.trainingPhase || [];
      const originalWorkoutTypes = exerciseData.workoutTypes || [];
      
      // Create with empty arrays to avoid index conflict
      const workaroundData = {
        ...exerciseData,
        trainingPhase: [],
        workoutTypes: []
      };
      
      const exercise = new this(workaroundData);
      await exercise.save();
      
      // Update with the original arrays after saving
      if (originalTrainingPhase.length > 0 || originalWorkoutTypes.length > 0) {
        await this.findByIdAndUpdate(exercise._id, {
          trainingPhase: originalTrainingPhase,
          workoutTypes: originalWorkoutTypes
        });
        
        // Update local object
        exercise.trainingPhase = originalTrainingPhase;
        exercise.workoutTypes = originalWorkoutTypes;
      }
      
      console.log('✅ Exercise created successfully using workaround');
      return exercise;
    }
    // Re-throw if it's a different error
    throw error;
  }
};

// Static method to migrate video provider
exerciseSchema.statics.migrateVideoProvider = async function(from, to, updateData = {}) {
  const exercises = await this.find({ 'video.provider': from });
  
  const bulkOps = exercises.map(exercise => ({
    updateOne: {
      filter: { _id: exercise._id },
      update: {
        $set: {
          'video.provider': to,
          ...updateData,
          version: exercise.version + 1,
          updatedAt: new Date()
        }
      }
    }
  }));
  
  if (bulkOps.length > 0) {
    return await this.bulkWrite(bulkOps);
  }
  
  return { modifiedCount: 0 };
};

export default mongoose.model('Exercise', exerciseSchema);