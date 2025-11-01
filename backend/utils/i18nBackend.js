/**
 * Backend internationalization utilities
 */

const translations = {
  lv: {
    // Training related
    'training_plan': 'Treniņu plāns',
    'training_program': 'Treniņu programma',
    'workout': 'Treniņš',
    'easy_run': 'Viegls skrējiens',
    'tempo_run': 'Tempo skrējiens',
    'long_run': 'Garš skrējiens',
    'intervals': 'Intervālu treniņš',
    'rest_day': 'Atpūtas diena',
    'active_recovery': 'Aktīvā atjaunošanās',
    'warmup': 'Iesildīšanās',
    'cooldown': 'Atdzesēšanās',
    'main_set': 'Galvenā daļa',
    'distance': 'Distance',
    'duration': 'Ilgums',
    'pace': 'Temps',
    'heart_rate_zone': 'Sirds ritma zona',
    'coaching_tips': 'Trenera padomi',
    'beginner': 'Iesācējs',
    'intermediate': 'Vidējais',
    'advanced': 'Augstais',
    'scheduled': 'Plānots',
    'completed': 'Pabeigts',
    'skipped': 'Izlaists',
    'weekly_plan_generated': 'Nedēļas treniņplāns ģenerēts',
    'plan_generation_success': 'Treniņplāns veiksmīgi ģenerēts',
    'plan_generation_error': 'Kļūda ģenerējot treniņplānu'
  },
  en: {
    // Training related
    'training_plan': 'Training Plan',
    'training_program': 'Training Program',
    'workout': 'Workout',
    'easy_run': 'Easy Run',
    'tempo_run': 'Tempo Run',
    'long_run': 'Long Run',
    'intervals': 'Intervals',
    'rest_day': 'Rest Day',
    'active_recovery': 'Active Recovery',
    'warmup': 'Warmup',
    'cooldown': 'Cooldown',
    'main_set': 'Main Set',
    'distance': 'Distance',
    'duration': 'Duration',
    'pace': 'Pace',
    'heart_rate_zone': 'Heart Rate Zone',
    'coaching_tips': 'Coaching Tips',
    'beginner': 'Beginner',
    'intermediate': 'Intermediate',
    'advanced': 'Advanced',
    'scheduled': 'Scheduled',
    'completed': 'Completed',
    'skipped': 'Skipped',
    'weekly_plan_generated': 'Weekly training plan generated',
    'plan_generation_success': 'Training plan generated successfully',
    'plan_generation_error': 'Error generating training plan'
  }
};

export const t = (key, language = 'lv') => {
  return translations[language]?.[key] || translations.lv[key] || key;
};

export const tp = (key, params = {}, language = 'lv') => {
  let text = t(key, language);
  
  Object.entries(params).forEach(([param, value]) => {
    text = text.replace(`{${param}}`, String(value));
  });
  
  return text;
};

export default { t, tp };