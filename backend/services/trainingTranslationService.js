import { t } from '../utils/i18nBackend.js';

/**
 * Training Translation Service
 * Handles translation of training programs and workouts
 */
class TrainingTranslationService {
  
  /**
   * Translate workout type
   */
  translateWorkoutType(type, language = 'lv') {
    const translations = {
      'easy': {
        lv: 'Viegls skrējiens',
        en: 'Easy Run'
      },
      'tempo': {
        lv: 'Tempo skrējiens', 
        en: 'Tempo Run'
      },
      'long': {
        lv: 'Garš skrējiens',
        en: 'Long Run'
      },
      'intervals': {
        lv: 'Intervālu treniņš',
        en: 'Intervals'
      },
      'rest': {
        lv: 'Atpūtas diena',
        en: 'Rest Day'
      },
      'active_recovery': {
        lv: 'Aktīvā atjaunošanās',
        en: 'Active Recovery'
      }
    };

    return translations[type]?.[language] || type;
  }

  /**
   * Translate workout instructions
   */
  translateInstructions(instructions, language = 'lv') {
    if (!instructions || typeof instructions !== 'string') return instructions;

    const instructionTranslations = {
      lv: {
        'warmup': 'Iesildīšanās',
        'cooldown': 'Atdzesēšanās',
        'main set': 'Galvenā daļa',
        'easy pace': 'viegls temps',
        'moderate pace': 'mērens temps',
        'hard pace': 'grūts temps',
        'jog': 'lēns skrējiens',
        'run': 'skrējiens',
        'walk': 'staigāšana',
        'minutes': 'minūtes',
        'seconds': 'sekundes',
        'rest': 'atpūta',
        'recovery': 'atjaunošanās'
      },
      en: {
        'iesildīšanās': 'warmup',
        'atdzesēšanās': 'cooldown',
        'galvenā daļa': 'main set',
        'viegls temps': 'easy pace',
        'mērens temps': 'moderate pace',
        'grūts temps': 'hard pace',
        'lēns skrējiens': 'jog',
        'skrējiens': 'run',
        'staigāšana': 'walk',
        'minūtes': 'minutes',
        'sekundes': 'seconds',
        'atpūta': 'rest',
        'atjaunošanās': 'recovery'
      }
    };

    let translated = instructions.toLowerCase();
    const translations = instructionTranslations[language] || {};

    Object.entries(translations).forEach(([key, value]) => {
      translated = translated.replace(new RegExp(key, 'gi'), value);
    });

    return translated;
  }

  /**
   * Translate coaching tips
   */
  translateCoachingTips(tips, language = 'lv') {
    if (!Array.isArray(tips)) return tips;

    const tipTranslations = {
      lv: {
        'maintain conversational pace': 'uzturiet sarunu tempu',
        'focus on form': 'koncentrējieties uz formu',
        'stay hydrated': 'uzturiet hidratāciju',
        'listen to your body': 'klausieties savu ķermeni',
        'breathe steadily': 'elpojiet vienmērīgi',
        'warm up properly': 'pareizi iesildieties',
        'cool down gradually': 'pakāpeniski atdzesējieties',
        'maintain steady effort': 'uzturiet stabilu piepūli'
      },
      en: {
        'uzturiet sarunu tempu': 'maintain conversational pace',
        'koncentrējieties uz formu': 'focus on form',
        'uzturiet hidratāciju': 'stay hydrated',
        'klausieties savu ķermeni': 'listen to your body',
        'elpojiet vienmērīgi': 'breathe steadily',
        'pareizi iesildieties': 'warm up properly',
        'pakāpeniski atdzesējieties': 'cool down gradually',
        'uzturiet stabilu piepūli': 'maintain steady effort'
      }
    };

    return tips.map(tip => {
      if (typeof tip !== 'string') return tip;
      
      let translated = tip.toLowerCase();
      const translations = tipTranslations[language] || {};

      Object.entries(translations).forEach(([key, value]) => {
        translated = translated.replace(new RegExp(key, 'gi'), value);
      });

      return translated.charAt(0).toUpperCase() + translated.slice(1);
    });
  }

  /**
   * Translate complete workout object
   */
  translateWorkout(workout, language = 'lv') {
    if (!workout || typeof workout !== 'object') return workout;

    const translatedWorkout = { ...workout };

    // Translate workout type and name
    if (translatedWorkout.type) {
      translatedWorkout.name = this.translateWorkoutType(translatedWorkout.type, language);
    }

    // Translate description
    if (translatedWorkout.description) {
      translatedWorkout.description = this.translateInstructions(translatedWorkout.description, language);
    }

    // Translate warmup instructions
    if (translatedWorkout.warmupInstructions) {
      translatedWorkout.warmupInstructions = this.translateInstructions(translatedWorkout.warmupInstructions, language);
    }

    // Translate cooldown instructions
    if (translatedWorkout.cooldownInstructions) {
      translatedWorkout.cooldownInstructions = this.translateInstructions(translatedWorkout.cooldownInstructions, language);
    }

    // Translate coaching tips
    if (translatedWorkout.coachingTips) {
      translatedWorkout.coachingTips = this.translateCoachingTips(translatedWorkout.coachingTips, language);
    }

    return translatedWorkout;
  }

  /**
   * Translate training plan
   */
  translateTrainingPlan(plan, language = 'lv') {
    if (!plan || typeof plan !== 'object') return plan;

    const translatedPlan = { ...plan };

    // Translate plan name and description
    if (translatedPlan.name && language !== 'lv') {
      // Only translate if not already in target language
      translatedPlan.name = translatedPlan.name.replace(/Nedēļas treniņplāns/g, 'Weekly Training Plan');
    } else if (translatedPlan.name && language === 'lv') {
      translatedPlan.name = translatedPlan.name.replace(/Weekly Training Plan/g, 'Nedēļas treniņplāns');
    }

    if (translatedPlan.description && language !== 'lv') {
      translatedPlan.description = translatedPlan.description.replace(/AI ģenerēts nedēļas treniņplāns/g, 'AI generated weekly training plan');
    } else if (translatedPlan.description && language === 'lv') {
      translatedPlan.description = translatedPlan.description.replace(/AI generated weekly training plan/g, 'AI ģenerēts nedēļas treniņplāns');
    }

    return translatedPlan;
  }

  /**
   * Get user's preferred language
   */
  getUserLanguage(userSettings) {
    return userSettings?.language || 'lv';
  }

  /**
   * Translate fitness level
   */
  translateFitnessLevel(level, language = 'lv') {
    const levels = {
      'beginner': {
        lv: 'Iesācējs',
        en: 'Beginner'
      },
      'intermediate': {
        lv: 'Vidējais',
        en: 'Intermediate'
      },
      'advanced': {
        lv: 'Augstais',
        en: 'Advanced'
      }
    };

    return levels[level]?.[language] || level;
  }

  /**
   * Translate day names
   */
  translateDayName(day, language = 'lv') {
    const days = {
      'monday': {
        lv: 'Pirmdiena',
        en: 'Monday'
      },
      'tuesday': {
        lv: 'Otrdiena',
        en: 'Tuesday'
      },
      'wednesday': {
        lv: 'Trešdiena',
        en: 'Wednesday'
      },
      'thursday': {
        lv: 'Ceturtdiena',
        en: 'Thursday'
      },
      'friday': {
        lv: 'Piektdiena',
        en: 'Friday'
      },
      'saturday': {
        lv: 'Sestdiena',
        en: 'Saturday'
      },
      'sunday': {
        lv: 'Svētdiena',
        en: 'Sunday'
      }
    };

    return days[day]?.[language] || day;
  }
}

export default new TrainingTranslationService();