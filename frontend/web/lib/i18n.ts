// Internationalization system for DeyaRun - English primary
export type SupportedLanguage = 'en' | 'lv';

export interface Translation {
  [key: string]: string | Translation;
}

export interface Translations {
  lv: Translation;
  en: Translation;
}

// Main translations object - English primary for consistency with mobile
export const translations: Translations = {
  en: {
    // Basic UI
    language: 'Language',
    english: 'English',
    latvian: 'Latvian',
    settings: 'Settings',
    profile: 'Profile',
    dashboard: 'Dashboard',
    workouts: 'Workouts',
    calendar: 'Calendar',
    analytics: 'Analytics',
    goals: 'Goals',
    achievements: 'Achievements',
    
    // Actions
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    refresh_data: 'Refresh data',
    loading: 'Loading...',
    error_loading_settings: 'Error loading settings',
    error_saving: 'Error saving settings',
    
    // Strava integration
    connect_strava: 'Connect to Strava',
    disconnect_strava: 'Disconnect Strava',
    error_connecting_strava: 'Error connecting to Strava',
    error_disconnecting_strava: 'Error disconnecting Strava account',
    
    // Common messages
    success: 'Success',
    error: 'Error',
    try_again: 'Try again'
  },
  lv: {
    // Navigation & UI
    dashboard: 'Pārskats',
    profile: 'Profils',
    settings: 'Iestatījumi',
    calendar: 'Kalendārs',
    workouts: 'Treniņi',
    trainings: 'Treniņi',
    leaderboard: 'Līderu tabula',
    courses: 'Kursi',
    analytics: 'Analītika',
    logout: 'Iziet',
    login: 'Ieiet',
    register: 'Reģistrēties',
    
    // Calendar
    calendar_title: 'Treniņu kalendārs',
    calendar_subtitle: 'Pārskatiet savu treniņu plānu un aktivitātes',
    today: 'Šodien',
    month: 'Mēnesis',
    week: 'Nedēļa',
    previous_month: 'Iepriekšējais mēnesis',
    next_month: 'Nākamais mēnesis',
    refresh_data: 'Refresh datus',
    
    // Filters
    filter: 'Filtrs',
    all_activities: 'Visas aktivitātes',
    workouts_filter: 'Treniņi',
    cardio: 'Kardio',
    rest: 'Atpūta',
    competitions: 'Sacensības',
    show_completed: 'Rādīt pabeigtās aktivitātes',
    clear_filters: 'Notīrīt filtrus',
    active_filters: 'Aktīvie filtri',
    hide_completed: 'Slēpt pabeigtās',
    
    // Training Plan
    active_training_plan: 'Aktīvais treniņu plāns',
    view_details: 'Skatīt detaļas',
    period: 'Periods',
    
    // Settings
    settings_title: 'Iestatījumi',
    settings_subtitle: 'Pārvaldiet sava konta iestatījumus un integrācijas',
    general: 'Vispārīgie',
    privacy: 'Privātums',
    integrations: 'Integrācijas',
    notifications: 'Paziņojumi',
    
    // General Settings
    general_settings: 'Vispārīgie iestatījumi',
    units: 'Mērvienības',
    metric_system: 'Metriskā sistēma (km, kg)',
    imperial_system: 'Imperiālā sistēma (miles, lbs)',
    language: 'Valoda',
    latvian: 'Latvian',
    english: 'English',
    timezone: 'Laika josla',
    default_activity_type: 'Noklusējuma aktivitātes veids',
    running: 'Skriešana',
    walking: 'Staigāšana',
    cycling: 'Riteņbraukšana',
    design_theme: 'Dizaina tema',
    dark_mode: 'Tumšais režīms',
    light_mode: 'Gaišais režīms',
    
    // Privacy Settings
    privacy_settings: 'Privātuma iestatījumi',
    profile_visibility: 'Profila redzamība',
    public: 'Publisks - visi var redzēt',
    friends_only: 'Draugi - tikai draugi var redzēt',
    private: 'Privāts - tikai es varu redzēt',
    activity_visibility: 'Aktivitāšu redzamība',
    public_activities: 'Publiskas - visi var redzēt',
    friends_activities: 'Draugi - tikai draugi var redzēt',
    private_activities: 'Privātas - tikai es varu redzēt',
    leaderboard_participation: 'Līderu tabulas dalība',
    leaderboard_description: 'Vai jūsu rezultāti tiek rādīti līderu tabulā',
    
    // Integrations
    integrations_title: 'Integrācijas',
    strava_integration: 'Sinhronizējiet savas aktivitātes ar Strava',
    garmin_integration: 'Sinhronizējiet ar Garmin ierīcēm',
    google_fit_integration: 'Sinhronizējiet savu fitnesa datus no Google Fit',
    connected: 'Savienots',
    disconnect: 'Atvienot',
    connect_strava: 'Savienot ar Strava',
    connect_google_fit: 'Savienot ar Google Fit',
    coming_soon: 'Drīzumā',
    garmin_coming_soon: 'Garmin integrācija būs pieejama drīzumā',
    google_fit_connecting: 'Pievieno...',
    google_fit_disconnecting: 'Atvienoju...',
    google_fit_connected_desc: 'Automātiska datu sinhronizācija ar Google Fit',
    google_fit_disconnect_desc: 'Vai tiešām vēlaties atvienot Google Fit? Tas noņems piekļuvi jūsu fitnesa datiem.',
    
    // Notifications
    notifications_settings: 'Paziņojumu iestatījumi',
    email_notifications: 'E-pasta paziņojumi',
    email_description: 'Saņemiet paziņojumus uz e-pastu',
    push_notifications: 'Push paziņojumi',
    push_description: 'Saņemiet paziņojumus aplikācijā',
    workout_reminders: 'Treniņu atgādinājumi',
    workout_reminders_description: 'Atgādinājumi par plānotajiem treniņiem',
    achievement_alerts: 'Sasniegumu paziņojumi',
    achievement_description: 'Paziņojumi par jauniem sasniegumiem',
    
    // Messages
    loading: 'Ielādē...',
    loading_settings: 'Ielādē iestatījumus...',
    loading_calendar: 'Neizdevās ielādēt kalendāra datus. Lūdzu, mēģiniet vēlreiz.',
    error_loading_settings: 'Error ielādējot iestatījumus',
    try_again: 'Mēģināt vēlreiz',
    save_changes: 'Saglabāt izmaiņas',
    saving: 'Saglabā...',
    settings_saved: 'Iestatījumi saglabāti veiksmīgi!',
    error_saving: 'Error saglabājot iestatījumus',
    confirm_disconnect_strava: 'Vai tiešām vēlaties atvienot Strava kontu?',
    strava_disconnected: 'Strava konts atvienots veiksmīgi!',
    error_connecting_strava: 'Error savienojot ar Strava',
    error_disconnecting_strava: 'Error atvienojot Strava kontu',
    error_updating_activity: 'Neizdevās atjaunināt aktivitāti',
    error_deleting_activity: 'Neizdevās dzēst aktivitāti',
    
    // TopBar & Navigation
    search: 'Meklēt...',
    weekly_goal_achieved: 'Jūsu nedēļas mērķis ir sasniegts!',
    new_challenge_available: 'Jauns kopienas izaicinājums pieejams',
    workout_reminder: 'Treniņa atgādinājums šodien 18:00',
    
    // Training Plans & Programs
    training_plan: 'Treniņu plāns',
    training_plans: 'Treniņu plāni',
    training_program: 'Treniņu programma',
    training_programs: 'Treniņu programmas',
    generate_plan: 'Ģenerēt plānu',
    weekly_plan: 'Nedēļas plāns',
    workout_type: 'Treniņa veids',
    easy_run: 'Viegls skrējiens',
    tempo_run: 'Tempo skrējiens',
    long_run: 'Garš skrējiens',
    intervals: 'Intervālu treniņš',
    warmup: 'Iesildīšanās',
    cooldown: 'Atdzesēšanās',
    main_set: 'Galvenā daļa',
    distance: 'Distance',
    duration: 'Ilgums',
    pace: 'Temps',
    heart_rate_zone: 'Sirds ritma zona',
    coaching_tips: 'Trenera padomi',
    workout_description: 'Treniņa apraksts',
    target_metrics: 'Mērķa rādītāji',
    completion_status: 'Izpildes statuss',
    scheduled: 'Plānots',
    completed: 'Pabeigts',
    skipped: 'Izlaists',
    adaptation_notes: 'Adaptācijas piezīmes',
    fitness_level: 'Fiziskās sagatavotības līmenis',
    beginner: 'Iesācējs',
    intermediate: 'Vidējais',
    advanced: 'Augstais',
    weekly_distance_goal: 'Nedēļas distances mērķis',
    training_days: 'Treniņu dienas',
    available_time: 'Pieejamais laiks',
    injury_history: 'Traumu vēsture',
    preferred_workout_types: 'Vēlamie treniņu veidi',
    rest_day: 'Atpūtas diena',
    active_recovery: 'Aktīvā atjaunošanās'
  },
};

// Language context and hooks - Default to English for consistency
let currentLanguage: SupportedLanguage = 'en';

export const setLanguage = (lang: SupportedLanguage) => {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem('runacademy_language', lang);
  }
};

export const getLanguage = (): SupportedLanguage => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('runacademy_language') as SupportedLanguage;
    if (stored && (stored === 'lv' || stored === 'en')) {
      currentLanguage = stored;
    }
  }
  return currentLanguage;
};

export const t = (key: string, lang?: SupportedLanguage): string => {
  const language = lang || getLanguage();
  const keys = key.split('.');
  let value: any = translations[language];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  // Fallback to Latvian if translation not found in current language
  if (typeof value !== 'string' && language !== 'lv') {
    value = translations.lv;
    for (const k of keys) {
      value = value?.[k];
    }
  }
  
  return typeof value === 'string' ? value : key;
};

// Translation helper function with parameters
export const tp = (key: string, params: Record<string, string | number>, lang?: SupportedLanguage): string => {
  let text = t(key, lang);
  
  Object.entries(params).forEach(([param, value]) => {
    text = text.replace(`{${param}}`, String(value));
  });
  
  return text;
};