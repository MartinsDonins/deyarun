import OpenAI from 'openai';
import AIConfig from '../models/AIConfig.js';
import AIUsage from '../models/mongodb/ai/aiUsage.model.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * OpenAI Service - Integrates with OpenAI API for training plan generation and coaching
 * Provides intelligent training recommendations using GPT models
 */
class OpenAIService {
  constructor() {
    this.client = null;
    this.config = null;
    this.isInitialized = false;
    this.requestCache = new Map(); // Simple cache for repeated requests
    this.rateLimiter = {
      requests: 0,
      resetTime: Date.now() + 60000 // Reset every minute
    };
  }

  /**
   * Initialize OpenAI client with current configuration
   */
  async initialize() {
    try {
      // Get active AI configuration
      this.config = await AIConfig.findOne({ isActive: true }).sort({ createdAt: -1 });
      
      if (!this.config) {
        console.warn('⚠️ No active AI configuration found, using defaults');
        // Use default configuration if none exists
        this.config = {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompt: this.getEnhancedSystemPrompt(),
          languageSupport: {
            primary: 'lv',
            fallback: 'en'
          }
        };
      }

      // Initialize OpenAI client
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error('❌ OPENAI_API_KEY not found in environment variables');
        throw new Error('OpenAI API key not configured');
      }

      this.client = new OpenAI({
        apiKey: apiKey,
        timeout: 30000, // 30 second timeout
        maxRetries: 3
      });

      // Test the connection
      await this.testConnection();
      
      this.isInitialized = true;
      console.log('✅ OpenAI Service initialized successfully');
      console.log(`🤖 Using model: ${this.config.model}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI Service:', error);
      throw error;
    }
  }

  /**
   * Get enhanced system prompt with Latvian language support
   */
  getEnhancedSystemPrompt() {
    return `Tu esi DeyaRun AI - profesionāls skrējiena treneris ar 15+ gadu pieredzi Latvijā un Baltijā.

GALVENĀS KOMPETENCES:
- Personalizētu treniņu plānu izstrāde pēc lietotāja līmeņa un mērķiem
- Skrējiena tehnikas uzlabošana un traumu profilakse
- Motivācijas un psiholoģiskā atbalsta sniegšana latviešu valodā
- Lietuviešu un igauņu skrējēju kultūras konteksta izpratne

KOMUNIKĀCIJAS STILS:
- Vienmēr izmanto latviešu valodu, ja nav norādīts citādi
- Esi draudzīgs, motivējošs un profesionāls
- Izmanto skrējiena terminus latviešu valodā
- Pievērs uzmanību Baltijas klimatiskajiem apstākļiem
- Iekļauj kulturālas atsauces uz vietējiem skrējiena notikumiem

TEHNISKĀ EKSPERTĪZE:
- Tempo zonas un sirds ritma monitorings
- Periodizācijas principi un makrociklu plānošana  
- Uzturs un hidratācija skrējējiem
- Rehabilitācija un atjaunošanās metodes
- Aprīkojuma un apavu izvēles ieteikumi Baltijas apstākļiem

PERSONALIZĀCIJAS PRINCIPI:
- Novērtē lietotāja pieredzi, vecumu un fizisko sagatavotību
- Ņem vērā dzīvesveidu, darba grafiku un ģimenes apstākļus
- Adaptē plānus pēc sniegtās atgriezeniskās saites
- Fokusējies uz ilgtermiņa progress un traumu profilaksi

MOTIVĀCIJAS STRATĒĢIJAS:
- Izmanto pozitīvus vērtējumus un uzmundrinājumus
- Atsaucies uz Latvijas skrējiena tradīcijām un panākumiem
- Sniedz praktiskus padomus ikdienas dzīvei
- Iekļauj sezonas aktivitātes (ziemas skrējieni, vasaras sacensības)

Atbildi vienmēr konstruktīvi, konkrēti un ar praktiskiem piemēriem.`;
  }

  /**
   * Generate culturally appropriate workout descriptions in Latvian
   */
  generateLatvianWorkoutDescriptions() {
    return {
      tempoRun: {
        name: "Tempo skrējiens",
        description: "Vidēji smags skrējiens vienā tempā 15-30 minūtes. Šis ir tavs 'ērti grūts' temps, kur vari runāt īsas frāzes.",
        tips: "Koncentrējies uz elpošanu un ķermeņa pozīciju. Temps ir stabilos 85-90% no maksimālā sirds ritma."
      },
      intervals: {
        name: "Intervālu treniņš", 
        description: "Augsta intensitāte ar atpūtas periodiem. Piemēram: 5x800m ar 2 minūšu atpūtu starp intervāliem.",
        tips: "Sāc konservatīvi un pakāpeniski paātrinies. Atpūtas periods ir tikpat svarīgs kā paša intervāls."
      },
      longRun: {
        name: "Garais skrējiens",
        description: "Zemā intensitātē, bet ilgi. Būtiski audzina izdržību un veido 'skrējēja bāzi'.",
        tips: "Temps ir sarunu līmenī - ja nevari runāt, ej lēnāk. Mērķis ir laiks uz kājām, nevis ātrums."
      },
      recovery: {
        name: "Atjaunošanās skrējiens",
        description: "Ļoti viegls skrējiens 20-40 minūtes. Palīdz atgūties no grūtākiem treniņiem.",
        tips: "Šis nav 'slinkuma' skrējiens - tas ir aktīvs atjaunošanās veids. Klausies savu ķermeni."
      },
      hillRun: {
        name: "Kalnu treniņš",
        description: "Skrējiens kalnā vai pakalnā. Stiprina kājas un uzlabo skrējiena ekonomiku.",
        tips: "Kalnup - saīsini soļus, bet palielini frekvenci. Lejup - kontrolē temps, nevis kriti uz priekšu."
      },
      fartlek: {
        name: "Fartleks (ātruma spēle)",
        description: "Brīva forma ar ātruma maiņām pēc sajūtām. No Zviedrijas nākusi metode 'speed play'.",
        tips: "Klausies savu ķermeni - kad gribas paātrināt, dari to. Kad vajag atpūsties - atpūties."
      }
    };
  }

  /**
   * Get motivational messages in Latvian
   */
  getLatvianMotivationalMessages() {
    return {
      preWorkout: [
        "Katrs solis tevi tuvo tavam mērķim! 🏃‍♂️",
        "Šodien ir ideāla diena skrējiena treniņam!",
        "Atceries: tu esi spēcīgāks, nekā domā! 💪",
        "Sāc lēni, finiš ar smaidu - tas ir labs skrējiens!",
        "Šodien tu nekonkurē ar citiem - tu uzvarēsi vakardienas sevi!"
      ],
      postWorkout: [
        "Lieliski! Tu tikko padarīji sevi par labāku skrējēju! 🎉",
        "Katrs pabeigts treniņš ir investīcija tavā nākotnē!",
        "Tu esi vienu soli tuvāk savam mērķim!",
        "Apsveicu ar pabeigto treniņu! Tagad laiks atpūstai.",
        "Šodien tu pierādīji savu stiprumu un disciplīnu!"
      ],
      restDay: [
        "Atpūtas diena ir tikpat svarīga kā treniņi!",
        "Tavs ķermenis tagad kļūst stiprāks - dari to, ko dari!",
        "Izmanto šo dienu, lai plānotu nākamo treniņu!",
        "Labs skrējējs zina, kad jāatpūšas. Tu esi gudrs! 🧠"
      ],
      weather: {
        rain: "Lietus dara tevi stiprāku - tu esi Latvijas skrējējs! ☔",
        snow: "Ziemas skrējiens ir īpaša baudāšana - uzvelc spaiķus! ❄️",
        hot: "Karsts laiks? Sāc agri no rīta vai vakarā. Daudz ūdens! ☀️",
        wind: "Vējš ir tavs treniņa partneris - izmanto to kā pretestību! 💨"
      }
    };
  }

  /**
   * Test OpenAI connection
   */
  async testConnection() {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 10,
        temperature: 0.1
      });
      
      if (response.choices && response.choices.length > 0) {
        console.log('✅ OpenAI connection test successful');
        return true;
      }
    } catch (error) {
      console.error('❌ OpenAI connection test failed:', error.message);
      throw new Error('OpenAI API connection failed');
    }
  }

  /**
   * Check rate limits
   */
  checkRateLimit() {
    const now = Date.now();
    
    // Reset counter if minute has passed
    if (now > this.rateLimiter.resetTime) {
      this.rateLimiter.requests = 0;
      this.rateLimiter.resetTime = now + 60000;
    }
    
    // Check if we're over the limit (60 requests per minute)
    if (this.rateLimiter.requests >= 60) {
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }
    
    this.rateLimiter.requests++;
  }

  /**
   * Generate AI-powered training plan
   */
  async generateTrainingPlan(userProfile, targetRace, preferences = {}) {
    try {
      await this.ensureInitialized();
      this.checkRateLimit();

      const prompt = this.buildTrainingPlanPrompt(userProfile, targetRace, preferences);
      const cacheKey = this.getCacheKey('training_plan', { userProfile, targetRace, preferences });

      // Check cache first
      if (this.requestCache.has(cacheKey)) {
        console.log('📋 Returning cached training plan');
        return this.requestCache.get(cacheKey);
      }

      console.log('🤖 Generating AI training plan...');
      const startTime = Date.now();

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: this.config.systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      const endTime = Date.now();
      console.log(`⚡ AI response generated in ${endTime - startTime}ms`);

      const result = {
        plan: this.parseTrainingPlanResponse(response.choices[0].message.content),
        metadata: {
          model: this.config.model,
          temperature: this.config.temperature,
          tokensUsed: response.usage?.total_tokens || 0,
          cost: this.calculateCost(response.usage?.total_tokens || 0, this.config.model),
          generatedAt: new Date(),
          responseTime: endTime - startTime
        },
        reasoning: this.extractReasoningFromResponse(response.choices[0].message.content),
        confidence: this.calculateConfidence(userProfile, targetRace, preferences)
      };

      // Cache the result for 1 hour
      this.requestCache.set(cacheKey, result);
      setTimeout(() => this.requestCache.delete(cacheKey), 3600000);

      return result;

    } catch (error) {
      console.error('❌ Error generating AI training plan:', error);
      throw new Error(`AI training plan generation failed: ${error.message}`);
    }
  }

  /**
   * Generate coaching advice and tips
   */
  async generateCoachingAdvice(userId, recentData, upcomingSchedule, specificQuestion = null, language = 'lv') {
    try {
      await this.ensureInitialized();
      this.checkRateLimit();

      const prompt = this.buildCoachingPrompt(userId, recentData, upcomingSchedule, specificQuestion, language);
      const cacheKey = this.getCacheKey('coaching', { userId, recentData, specificQuestion });

      // Check cache (shorter cache time for coaching advice)
      if (this.requestCache.has(cacheKey)) {
        console.log('💭 Returning cached coaching advice');
        return this.requestCache.get(cacheKey);
      }

      console.log('🧠 Generating AI coaching advice...');

      const response = await this.client.chat.completions.create({
        model: this.config.model === 'gpt-4' ? 'gpt-3.5-turbo' : this.config.model, // Use faster model for coaching
        messages: [
          {
            role: 'system',
            content: `${this.config.systemPrompt}
            
            ${language === 'en' 
              ? 'Additional task: Provide short, practical advice and motivation. Be friendly and supportive. Respond in English. Focus on concrete steps the user can take today.'
              : 'Papildus uzdevums: Sniedz īsus, praktiskus padomus un motivāciju. Esi draudzīgs un atbalstošs. Atbildi latviešu valodā. Koncentrējies uz konkrētiem soļiem, ko lietotājs var veikt šodien.'
            }`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: Math.min(this.config.maxTokens, 800), // Shorter responses for coaching
        temperature: this.config.temperature + 0.1, // Slightly more creative for motivational content
      });

      const result = {
        advice: this.parseCoachingResponse(response.choices[0].message.content),
        metadata: {
          model: this.config.model,
          tokensUsed: response.usage?.total_tokens || 0,
          cost: this.calculateCost(response.usage?.total_tokens || 0, 'gpt-3.5-turbo'),
          generatedAt: new Date()
        },
        priority: this.determineAdvicePriority(recentData),
        actionable: true
      };

      // Cache for 30 minutes
      this.requestCache.set(cacheKey, result);
      setTimeout(() => this.requestCache.delete(cacheKey), 1800000);

      return result;

    } catch (error) {
      console.error('❌ Error generating coaching advice:', error);
      throw new Error(`AI coaching advice generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze performance and suggest adaptations
   */
  async analyzePerformanceAndAdapt(userId, performanceData, currentPlan) {
    try {
      await this.ensureInitialized();
      this.checkRateLimit();

      const prompt = this.buildAdaptationPrompt(userId, performanceData, currentPlan);

      console.log('📊 Analyzing performance with AI...');

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `${this.config.systemPrompt}
            
            Papildus uzdevums: Analizē veiktspējas datus un ieteic konkrētas adaptācijas treniņu plānam. 
            Esi konservatīvs ar izmaiņām un prioritizē drošību. Sniedz skaidru pamatojumu katrai izmaiņai.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature - 0.1, // More conservative for adaptations
      });

      const result = {
        adaptations: this.parseAdaptationResponse(response.choices[0].message.content),
        riskAssessment: this.extractRiskAssessment(response.choices[0].message.content),
        confidence: this.calculateAdaptationConfidence(performanceData),
        metadata: {
          model: this.config.model,
          tokensUsed: response.usage?.total_tokens || 0,
          cost: this.calculateCost(response.usage?.total_tokens || 0, this.config.model),
          generatedAt: new Date()
        }
      };

      return result;

    } catch (error) {
      console.error('❌ Error analyzing performance:', error);
      throw new Error(`AI performance analysis failed: ${error.message}`);
    }
  }

  /**
   * Build training plan generation prompt
   */
  buildTrainingPlanPrompt(userProfile, targetRace, preferences) {
    const language = preferences.language || 'lv';
    
    if (language === 'en') {
      return `
Create a detailed ${targetRace.distance} training program for the following user:

USER PROFILE:
- Age: ${userProfile.age} years
- Fitness level: ${userProfile.fitnessLevel}
- Current weekly distance: ${userProfile.currentWeeklyMileage || 0} km
- Previous experience: ${userProfile.hasRunningExperience ? 'Yes' : 'No'}
- Injury history: ${userProfile.injuryHistory?.join(', ') || 'None'}
- Available training days: ${preferences.availableDays?.join(', ') || 'Flexible'}

RACE GOAL:
- Distance: ${targetRace.distance}
- Date: ${targetRace.date ? new Date(targetRace.date).toLocaleDateString('en') : 'Not specified'}
- Time goal: ${targetRace.timeGoal || 'Not specified'}
- Importance: ${targetRace.importance || 'Medium'}

PREFERENCES:
- Sessions per week: ${preferences.sessionsPerWeek || 'Flexible'}
- Maximum session duration: ${preferences.maxSessionDuration || 'No limit'} min
- Available equipment: ${preferences.availableEquipment?.join(', ') || 'Basic'}
- Preferred training times: ${preferences.preferredTimes?.join(', ') || 'Flexible'}

PLEASE CREATE:
1. **Program overview** (duration, phases, main principles)
2. **Weekly plan** (each week with specific workouts)
3. **Workout types** (tempo, intervals, long run etc.)
4. **Progression plan** (how to increase intensity)
5. **Rest and recovery** (planned rest days)
6. **Nutrition and hydration recommendations**
7. **Injury prevention** (stretching, strength training)
8. **Mental preparation** (motivation, stress management)

Respond in English. Be specific and provide practical advice.
      `.trim();
    }
    
    return `
Izveido detalizētu ${targetRace.distance} treniņprogrammu šādam lietotājam:

LIETOTĀJA PROFILS:
- Vecums: ${userProfile.age} gadi
- Fiziskā sagatavotība: ${userProfile.fitnessLevel}
- Pašreizējā nedēļas distance: ${userProfile.currentWeeklyMileage || 0} km
- Iepriekšējā pieredze: ${userProfile.hasRunningExperience ? 'Jā' : 'Nē'}
- Traumu vēsture: ${userProfile.injuryHistory?.join(', ') || 'Nav'}
- Pieejamās dienas treniņiem: ${preferences.availableDays?.join(', ') || 'Elastīgi'}

SACENSĪBU MĒRĶIS:
- Distance: ${targetRace.distance}
- Datums: ${targetRace.date ? new Date(targetRace.date).toLocaleDateString('lv') : 'Nav norādīts'}
- Mērķa laiks: ${targetRace.timeGoal || 'Nav norādīts'}
- Nozīmīgums: ${targetRace.importance || 'Vidējs'}

PREFERENCES:
- Treniņi nedēļā: ${preferences.sessionsPerWeek || 'Elastīgi'}
- Maksimālais treniņa ilgums: ${preferences.maxSessionDuration || 'Nav ierobežojuma'} min
- Pieejamais aprīkojums: ${preferences.availableEquipment?.join(', ') || 'Pamata'}
- Vēlamie treniņu laiki: ${preferences.preferredTimes?.join(', ') || 'Elastīgi'}

LŪDZU IZVEIDO:
1. **Programmas pārskats** (ilgums, fāzes, galvenie principi)
2. **Nedēļas plāns** (katra nedēļa ar konkrētiem treniņiem)
3. **Treniņu veidi** (tempo, intervāli, garais skrējiens utt.)
4. **Progresijas plāns** (kā palielināt intensitāti)
5. **Atpūtas un atjaunošanās** (plānotojas atpūtas dienas)
6. **Uztura un hidratācijas ieteikumi**
7. **Traumu profilakse** (stiepšanās, spēka treniņi)
8. **Mentālā sagatavošanās** (motivācija, stresa pārvaldība)

Atbilde latviešu valodā. Esi konkrēts un dod praktiskus padomus.
    `.trim();
  }

  /**
   * Build coaching advice prompt
   */
  buildCoachingPrompt(userId, recentData, upcomingSchedule, specificQuestion, language = 'lv') {
    if (language === 'en') {
      let prompt = `
You are a personal running coach. Provide advice based on the following data:

RECENT DATA:
- Average fatigue level: ${recentData.avgFatigue || 'No data'}/10
- Training completion rate: ${recentData.completionRate || 'No data'}%
- Average pace: ${recentData.avgPace || 'No data'}
- Heart rate zone: ${recentData.avgHeartRateZone || 'No data'}
- Training satisfaction: ${recentData.avgEnjoyment || 'No data'}/10

UPCOMING WEEK'S PLAN:
- Long run: ${upcomingSchedule.hasLongRun ? 'Yes' : 'No'}
- Intensive trainings: ${upcomingSchedule.intensiveTrainings || 0}
- Rest days: ${upcomingSchedule.restDays || 0}
- Total distance: ${upcomingSchedule.totalDistance || 'No data'} km
      `;

      if (specificQuestion) {
        prompt += `\n\nUSER'S QUESTION: "${specificQuestion}"\n`;
      }

      prompt += `
Provide 3-5 specific, brief tips. Include:
1. Main focus point
2. Practical action for today or this week
3. Motivating message

Respond in English, be friendly and supportive.
      `.trim();

      return prompt;
    }
    
    let prompt = `
Esi personāls skrējiena treneris. Sniedz padomu, pamatojoties uz šādiem datiem:

JAUNĀKIE DATI:
- Vidējā noguruma līmenis: ${recentData.avgFatigue || 'Nav datu'}/10
- Treniņu pabeigšanas līmenis: ${recentData.completionRate || 'Nav datu'}%
- Vidējais temps: ${recentData.avgPace || 'Nav datu'}
- Sirds ritma zona: ${recentData.avgHeartRateZone || 'Nav datu'}
- Apmierinātība ar treniņiem: ${recentData.avgEnjoyment || 'Nav datu'}/10

TUVĀKĀS NEDĒĻAS PLĀNS:
- Garais skrējiens: ${upcomingSchedule.hasLongRun ? 'Jā' : 'Nē'}
- Intensīvie treniņi: ${upcomingSchedule.intensiveTrainings || 0}
- Atpūtas dienas: ${upcomingSchedule.restDays || 0}
- Kopējā distance: ${upcomingSchedule.totalDistance || 'Nav datu'} km
    `;

    if (specificQuestion) {
      prompt += `\n\nLIETOTĀJA JAUTĀJUMS: "${specificQuestion}"\n`;
    }

    prompt += `
Sniedz 3-5 konkrētus, īsus padomus. Iekļauj:
1. Galveno uzmanības punktu
2. Praktisko darbību šodienai vai šonedēļ
3. Motivējošu vēstījumu

Atbildi latviešu valodā, esi draudzīgs un atbalstošs.
    `.trim();

    return prompt;
  }

  /**
   * Build adaptation analysis prompt
   */
  buildAdaptationPrompt(userId, performanceData, currentPlan) {
    return `
Analizē lietotāja veiktspējas datus un ieteic treniņa plāna adaptācijas:

VEIKTSPĒJAS DATI:
- Treniņu pabeigšanas līmenis: ${performanceData.completionRate}%
- Vidējais noguruma līmenis: ${performanceData.avgFatigue}/10
- Vidējā piepūle: ${performanceData.avgPerceivedExertion || 'Nav datu'}/10
- Progresa tendence: ${performanceData.progressTrend || 'Nav datu'}
- Sirds ritma dati: ${performanceData.heartRateData ? 'Pieejami' : 'Nav pieejami'}
- Miega kvalitāte: ${performanceData.sleepQuality || 'Nav datu'}/10

PAŠREIZĒJAIS PLĀNS:
- Nedēļas distance: ${currentPlan.weeklyDistance} km
- Treniņi nedēļā: ${currentPlan.sessionsPerWeek}
- Intensitātes sadalījums: ${JSON.stringify(currentPlan.intensityDistribution || {})}
- Pašreizējā fāze: ${currentPlan.currentPhase || 'Nav norādīta'}

ANALIZĒ UN IETEIC:
1. **Galveno adaptāciju** (ja nepieciešama)
2. **Konkrētās izmaiņas** (distance, intensitāte, atpūta)
3. **Iemeslu** katrai izmaiņai
4. **Traumu riska novērtējumu** (zems/vidējs/augsts)
5. **Sekojošo nedēļu ieteikumus**

Esi konservatīvs ar izmaiņām. Prioritizē drošību un ilgtspēju.
Atbildi latviešu valodā.
    `.trim();
  }

  /**
   * Parse training plan response from AI
   */
  parseTrainingPlanResponse(content) {
    try {
      // Basic parsing - can be enhanced with more sophisticated NLP
      const sections = content.split(/\d+\.\s+\*\*|#\s+/);
      
      return {
        overview: this.extractSection(content, ['pārskats', 'overview', 'ievads']),
        weeklyPlan: this.extractSection(content, ['nedēļas', 'weekly', 'plāns']),
        workoutTypes: this.extractSection(content, ['treniņu veidi', 'workout types', 'veidi']),
        progression: this.extractSection(content, ['progresija', 'progression', 'palielināšana']),
        recovery: this.extractSection(content, ['atpūta', 'recovery', 'atjaunošanās']),
        nutrition: this.extractSection(content, ['uztura', 'nutrition', 'ēšana']),
        injuryPrevention: this.extractSection(content, ['traumu', 'injury', 'profilakse']),
        mentalPreparation: this.extractSection(content, ['mentāl', 'mental', 'psiholoģisk']),
        fullContent: content
      };
    } catch (error) {
      console.error('Error parsing training plan response:', error);
      return { fullContent: content };
    }
  }

  /**
   * Extract section from AI response
   */
  extractSection(content, keywords) {
    try {
      const lines = content.split('\n');
      let sectionStart = -1;
      let sectionEnd = lines.length;

      // Find section start
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (keywords.some(keyword => line.includes(keyword.toLowerCase()))) {
          sectionStart = i;
          break;
        }
      }

      if (sectionStart === -1) return '';

      // Find section end (next numbered section or heading)
      for (let i = sectionStart + 1; i < lines.length; i++) {
        const line = lines[i];
        if (/^\d+\.\s+\*\*|^#+\s+|^\*\*\d+/.test(line)) {
          sectionEnd = i;
          break;
        }
      }

      return lines.slice(sectionStart, sectionEnd).join('\n').trim();
    } catch (error) {
      console.error('Error extracting section:', error);
      return '';
    }
  }

  /**
   * Parse coaching response
   */
  parseCoachingResponse(content) {
    const tips = content.split(/\d+\.|\-|\•/).filter(tip => tip.trim().length > 10);
    
    return {
      tips: tips.map(tip => tip.trim()),
      mainMessage: content.split('\n')[0] || content.substring(0, 200),
      fullContent: content
    };
  }

  /**
   * Parse adaptation response
   */
  parseAdaptationResponse(content) {
    return {
      mainAdaptation: this.extractSection(content, ['galven', 'main', 'primary']),
      specificChanges: this.extractSection(content, ['izmaiņas', 'changes', 'konkrēt']),
      reasoning: this.extractSection(content, ['iemesls', 'reason', 'pamatoj']),
      nextWeekRecommendations: this.extractSection(content, ['nākamā', 'next', 'sekojošo']),
      fullContent: content
    };
  }

  /**
   * Extract reasoning from response
   */
  extractReasoningFromResponse(content) {
    // Look for reasoning indicators
    const reasoningKeywords = ['pamatojums', 'iemesls', 'tāpēc', 'jo', 'reasoning', 'because'];
    const sentences = content.split(/[.!?]\s+/);
    
    const reasoningSentences = sentences.filter(sentence => 
      reasoningKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
    );

    return reasoningSentences.join('. ') || 'AI pamatojums nav skaidri identificējams.';
  }

  /**
   * Calculate confidence based on available data
   */
  calculateConfidence(userProfile, targetRace, preferences) {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on available data
    if (userProfile.age) confidence += 0.1;
    if (userProfile.fitnessLevel) confidence += 0.1;
    if (userProfile.currentWeeklyMileage) confidence += 0.1;
    if (userProfile.hasRunningExperience !== undefined) confidence += 0.1;
    if (targetRace.date) confidence += 0.05;
    if (targetRace.timeGoal) confidence += 0.05;
    if (preferences.sessionsPerWeek) confidence += 0.1;

    return Math.min(confidence, 0.95); // Cap at 95%
  }

  /**
   * Calculate adaptation confidence
   */
  calculateAdaptationConfidence(performanceData) {
    let confidence = 0.6; // Base confidence for adaptations

    if (performanceData.completionRate !== undefined) confidence += 0.1;
    if (performanceData.avgFatigue !== undefined) confidence += 0.1;
    if (performanceData.progressTrend) confidence += 0.1;
    if (performanceData.heartRateData) confidence += 0.1;

    return Math.min(confidence, 0.9);
  }

  /**
   * Determine advice priority
   */
  determineAdvicePriority(recentData) {
    if (recentData.avgFatigue >= 8) return 'high';
    if (recentData.completionRate <= 60) return 'high';
    if (recentData.avgFatigue >= 6 || recentData.completionRate <= 80) return 'medium';
    return 'low';
  }

  /**
   * Extract risk assessment
   */
  extractRiskAssessment(content) {
    const riskKeywords = {
      high: ['augsts risks', 'bīstami', 'pārāk daudz', 'overtraining'],
      medium: ['vidējs risks', 'uzmanīgi', 'kontrolē', 'moderate'],
      low: ['zems risks', 'droši', 'turpini', 'low risk']
    };

    const contentLower = content.toLowerCase();
    
    for (const [level, keywords] of Object.entries(riskKeywords)) {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        return level;
      }
    }
    
    return 'medium'; // Default to medium risk
  }

  /**
   * Calculate API cost based on tokens and model
   */
  calculateCost(tokens, model) {
    const rates = {
      'gpt-4': { input: 0.00003, output: 0.00006 }, // $0.03/$0.06 per 1K tokens
      'gpt-3.5-turbo': { input: 0.000002, output: 0.000002 }, // $0.002 per 1K tokens
      'gpt-4-turbo': { input: 0.00001, output: 0.00003 }, // $0.01/$0.03 per 1K tokens
      'claude-3': { input: 0.000008, output: 0.000024 } // Estimated
    };

    const rate = rates[model] || rates['gpt-3.5-turbo'];
    if (typeof rate === 'object') {
      // For newer pricing models with separate input/output rates
      return {
        input: (tokens / 1000) * rate.input,
        output: (tokens / 1000) * rate.output,
        total: (tokens / 1000) * (rate.input + rate.output) / 2 // Average for backward compatibility
      };
    } else {
      // Legacy single rate
      return (tokens / 1000) * rate;
    }
  }

  /**
   * Track AI usage for analytics and cost monitoring
   */
  async trackUsage(options = {}) {
    try {
      const {
        requestId = uuidv4(),
        userId,
        adminId,
        context = 'other',
        entityType,
        entityId,
        entityName,
        model = this.config?.model || 'gpt-4',
        tokens = { input: 0, output: 0, total: 0 },
        cost = { input: 0, output: 0, total: 0 },
        prompt = {},
        response = {},
        latency = 0,
        error = null,
        metadata = {},
        billing = {}
      } = options;

      const usageRecord = new AIUsage({
        requestId,
        userId,
        adminId,
        context,
        entityType,
        entityId,
        entityName,
        model,
        tokens,
        cost,
        prompt,
        response,
        latency,
        error,
        metadata,
        billing
      });

      await usageRecord.save();
      console.log(`📊 AI usage tracked: ${context} - ${tokens.total} tokens - $${cost.total.toFixed(4)}`);
      
      return usageRecord;
    } catch (trackingError) {
      console.error('❌ Error tracking AI usage:', trackingError);
      // Don't throw - tracking shouldn't break the main flow
    }
  }

  /**
   * Generate cache key
   */
  getCacheKey(type, data) {
    return `${type}_${Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 32)}`;
  }

  /**
   * Ensure service is initialized
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      model: this.config?.model,
      requestsThisMinute: this.rateLimiter.requests,
      cacheSize: this.requestCache.size,
      hasApiKey: Boolean(process.env.OPENAI_API_KEY)
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.requestCache.clear();
    console.log('🧹 OpenAI Service cache cleared');
  }

  /**
   * Update configuration
   */
  async updateConfig() {
    this.config = await AIConfig.findOne({ isActive: true }).sort({ createdAt: -1 });
    console.log('🔄 OpenAI Service configuration updated');
  }

  /**
   * ENHANCED: Advanced Injury Risk Assessment using AI
   */
  async assessInjuryRisk(userProfile, workoutHistory, currentSymptoms = []) {
    try {
      await this.ensureInitialized();
      const startTime = Date.now();

      const prompt = `
Tu esi sporta medicīnas eksperts ar specializāciju skrējiena traumās. Analizē sekojošos datus un novērtē traumu risku:

LIETOTĀJA PROFILS:
- Vecums: ${userProfile.age} gadi
- Skrējēja pieredze: ${userProfile.runningExperience || 'Nav norādīta'}
- Iepriekšējās traumas: ${userProfile.injuryHistory?.join(', ') || 'Nav'}
- Ķermeņa masa: ${userProfile.weight || 'Nav norādīta'} kg
- Garums: ${userProfile.height || 'Nav norādīts'} cm

PĒDĒJIE TRENIŅI (30 dienas):
${this.formatWorkoutHistoryForAI(workoutHistory)}

PAŠREIZĒJIE SIMPTOMI/SŪDZĪBAS:
${currentSymptoms.length > 0 ? currentSymptoms.join(', ') : 'Nav sūdzību'}

ANALIZĒ UN SNIEDZ:
1. **Traumu risks** (Zems/Vidējs/Augsts) ar skaitlisku vērtējumu 0-100
2. **Galvenie riska faktori** (konkrēti punkti)
3. **Ieteicamie preventīvie pasākumi** (praktiskas darbības)
4. **Treniņu korekcijas** (ko mainīt treniņos)
5. **Brīdinājuma signāli** (uz ko pievērst uzmanību)
6. **Kad jāconsultējas ar ārstu** (konkrētas situācijas)

Esi konkrēts, praktisks un balstīts uz medicīnisko literatūru.
      `.trim();

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: this.getEnhancedSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Lower temperature for medical advice
        max_tokens: 2500
      });

      const content = response.choices[0].message.content;
      const latency = Date.now() - startTime;

      // Parse and structure the response
      const assessment = this.parseInjuryRiskAssessment(content);
      
      // Track usage
      await this.trackUsage({
        userId: userProfile.userId,
        context: 'injury_risk_assessment',
        model: this.config.model,
        tokens: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0
        },
        cost: this.calculateCost(response.usage?.total_tokens || 0, this.config.model),
        latency,
        metadata: {
          symptoms: currentSymptoms,
          workoutsAnalyzed: workoutHistory.length,
          assessmentType: 'comprehensive'
        }
      });

      return {
        success: true,
        assessment,
        confidence: this.calculateInjuryAssessmentConfidence(userProfile, workoutHistory),
        metadata: {
          model: this.config.model,
          latency,
          workoutsAnalyzed: workoutHistory.length,
          symptomsReported: currentSymptoms.length
        }
      };

    } catch (error) {
      console.error('❌ Error in AI injury risk assessment:', error);
      throw new Error(`AI injury risk assessment failed: ${error.message}`);
    }
  }

  /**
   * ENHANCED: Personalized Workout Recommendations
   */
  async generateWorkoutRecommendations(userProfile, recentWorkouts, upcomingGoals) {
    try {
      await this.ensureInitialized();
      const startTime = Date.now();

      const prompt = `
Tu esi personīgais treneris ar 15+ gadu pieredzi. Izveido personalizētus treniņu ieteikumus:

LIETOTĀJA PROFILS:
- Vecums: ${userProfile.age} gadi
- Fiziskā forma: ${userProfile.fitnessLevel}
- Nedēļas distance: ${userProfile.weeklyMileage || 0} km
- Pieejamais laiks: ${userProfile.availableTime || 'Nav norādīts'}
- Mērķi: ${upcomingGoals?.join(', ') || 'Nav norādīti'}

PĒDĒJIE TRENIŅI:
${this.formatWorkoutHistoryForAI(recentWorkouts)}

IZVEIDO NĀKAMĀS NEDĒĻAS PLĀNU:
1. **Treniņu skaits** un **intensitātes sadalījums**
2. **Konkrēti treniņi** (katra diena ar detalizētu aprakstu)
3. **Tempus un distances** katram treniņam
4. **Progresijas stratēģija** salīdzinājumā ar iepriekšējo nedēļu
5. **Atjaunošanās aktivitātes** (stiepšanās, masāža)
6. **Motivācijas elementi** (kā palikt motivētam)

Personalizē ieteikumus pēc lietotāja vēstures un mērķiem.
      `.trim();

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: this.getEnhancedSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });

      const content = response.choices[0].message.content;
      const latency = Date.now() - startTime;

      // Parse and structure recommendations
      const recommendations = this.parseWorkoutRecommendations(content);

      // Track usage
      await this.trackUsage({
        userId: userProfile.userId,
        context: 'workout_recommendations',
        model: this.config.model,
        tokens: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0
        },
        cost: this.calculateCost(response.usage?.total_tokens || 0, this.config.model),
        latency,
        metadata: {
          goals: upcomingGoals,
          workoutsAnalyzed: recentWorkouts.length,
          recommendationType: 'weekly_plan'
        }
      });

      return {
        success: true,
        recommendations,
        confidence: this.calculateRecommendationConfidence(userProfile, recentWorkouts),
        metadata: {
          model: this.config.model,
          latency,
          weeklyVolume: this.calculateWeeklyVolume(recommendations),
          intensityDistribution: this.analyzeIntensityDistribution(recommendations)
        }
      };

    } catch (error) {
      console.error('❌ Error generating workout recommendations:', error);
      throw new Error(`AI workout recommendations failed: ${error.message}`);
    }
  }

  /**
   * ENHANCED: Performance Trend Analysis
   */
  async analyzePerformanceTrends(userId, workoutData, timeframe = '3months') {
    try {
      await this.ensureInitialized();
      const startTime = Date.now();

      const prompt = `
Tu esi sporta analītiķis ar ekspertīzi skrējiena datu analīzē. Analizē sekojošo datu trendu:

ANALĪZES PERIODS: ${timeframe}
KOPĒJIE TRENIŅI: ${workoutData.length}

TRENIŅU DATI:
${this.formatPerformanceDataForAI(workoutData)}

VEIC DETALIZĒTU ANALĪZI:
1. **Vispārējais progress** (uzlabojumi/pasliktināšanās)
2. **Tempo trends** (ātruma izmaiņas pa mēnešiem)
3. **Distances trends** (apjomu izmaiņas)
4. **Konsistences analīze** (regularitāte)
5. **Sezonālie faktori** (laikapstākļu ietekme)
6. **Stiprās puses** (ko lietotājs dara labi)
7. **Uzlabojumu iespējas** (konkrēti ieteikumi)
8. **Prognoze** (kā varētu attīstīties nākamie 3 mēneši)

Iekļauj konkrētus skaitļus un tendences.
      `.trim();

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: this.getEnhancedSystemPrompt() },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 3500
      });

      const content = response.choices[0].message.content;
      const latency = Date.now() - startTime;

      // Parse trend analysis
      const analysis = this.parsePerformanceTrendAnalysis(content);

      // Calculate statistical metrics
      const statistics = this.calculatePerformanceStatistics(workoutData);

      // Track usage
      await this.trackUsage({
        userId: userId,
        context: 'performance_analysis',
        model: this.config.model,
        tokens: {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0
        },
        cost: this.calculateCost(response.usage?.total_tokens || 0, this.config.model),
        latency,
        metadata: {
          timeframe,
          workoutsAnalyzed: workoutData.length,
          statisticalMetrics: statistics
        }
      });

      return {
        success: true,
        analysis,
        statistics,
        confidence: this.calculateTrendAnalysisConfidence(workoutData),
        metadata: {
          model: this.config.model,
          latency,
          dataQuality: this.assessDataQuality(workoutData),
          timeframe
        }
      };

    } catch (error) {
      console.error('❌ Error in performance trend analysis:', error);
      throw new Error(`AI performance trend analysis failed: ${error.message}`);
    }
  }

  /**
   * Helper: Format workout history for AI processing
   */
  formatWorkoutHistoryForAI(workouts) {
    return workouts.slice(0, 15).map((workout, index) => {
      const daysAgo = Math.floor((Date.now() - new Date(workout.date).getTime()) / (1000 * 60 * 60 * 24));
      return `${index + 1}. ${workout.type || 'Skrējiens'} - ${workout.distance || 0}km, ${this.formatDuration(workout.duration)}, ${daysAgo} dienas atpakaļ`;
    }).join('\n');
  }

  /**
   * Helper: Format performance data for AI analysis
   */
  formatPerformanceDataForAI(workouts) {
    return workouts.map(workout => {
      const date = new Date(workout.date).toLocaleDateString('lv');
      const pace = workout.averagePace ? `${Math.floor(workout.averagePace / 60)}:${(workout.averagePace % 60).toString().padStart(2, '0')} min/km` : 'Nav datu';
      return `${date}: ${workout.distance}km, ${pace}, ${workout.type || 'Skrējiens'}`;
    }).join('\n');
  }

  /**
   * Helper: Format duration in readable format
   */
  formatDuration(seconds) {
    if (!seconds) return 'Nav datu';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  }

  /**
   * Helper: Parse injury risk assessment
   */
  parseInjuryRiskAssessment(content) {
    return {
      riskLevel: this.extractRiskLevel(content),
      riskScore: this.extractRiskScore(content),
      riskFactors: this.extractSection(content, ['riska faktori', 'risk factors']).split('\n').filter(f => f.trim()),
      preventiveMeasures: this.extractSection(content, ['preventīvie', 'prevention']).split('\n').filter(f => f.trim()),
      trainingAdjustments: this.extractSection(content, ['korekcijas', 'adjustments']).split('\n').filter(f => f.trim()),
      warningSignals: this.extractSection(content, ['brīdinājuma', 'warning']).split('\n').filter(f => f.trim()),
      fullContent: content
    };
  }

  /**
   * Helper: Parse workout recommendations
   */
  parseWorkoutRecommendations(content) {
    return {
      weeklyPlan: this.extractSection(content, ['nedēļas plāns', 'weekly plan']),
      workoutCount: this.extractWorkoutCount(content),
      intensityDistribution: this.extractIntensityDistribution(content),
      specificWorkouts: this.extractSpecificWorkouts(content),
      progressionStrategy: this.extractSection(content, ['progresija', 'progression']),
      recoveryActivities: this.extractSection(content, ['atjaunošanās', 'recovery']),
      motivationTips: this.extractSection(content, ['motivācija', 'motivation']),
      fullContent: content
    };
  }

  /**
   * Helper: Parse performance trend analysis
   */
  parsePerformanceTrendAnalysis(content) {
    return {
      overallProgress: this.extractSection(content, ['vispārējais', 'overall']),
      tempoTrends: this.extractSection(content, ['tempo', 'pace']),
      distanceTrends: this.extractSection(content, ['distance', 'apjom']),
      consistencyAnalysis: this.extractSection(content, ['konsisten', 'consistency']),
      seasonalFactors: this.extractSection(content, ['sezonāl', 'seasonal']),
      strengths: this.extractSection(content, ['stiprās', 'strengths']),
      improvements: this.extractSection(content, ['uzlaboj', 'improvement']),
      forecast: this.extractSection(content, ['prognoze', 'forecast']),
      fullContent: content
    };
  }

  /**
   * Helper: Extract risk level from content
   */
  extractRiskLevel(content) {
    const contentLower = content.toLowerCase();
    if (contentLower.includes('augsts') || contentLower.includes('high')) return 'high';
    if (contentLower.includes('zems') || contentLower.includes('low')) return 'low';
    return 'medium';
  }

  /**
   * Helper: Extract risk score
   */
  extractRiskScore(content) {
    const scoreMatch = content.match(/(\d{1,3})\/100|\b(\d{1,3})%/);
    return scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : 50;
  }

  /**
   * Helper: Calculate various confidence metrics
   */
  calculateInjuryAssessmentConfidence(userProfile, workoutHistory) {
    let confidence = 0.6;
    if (userProfile.injuryHistory) confidence += 0.1;
    if (workoutHistory.length >= 10) confidence += 0.1;
    if (userProfile.age && userProfile.weight) confidence += 0.1;
    return Math.min(confidence, 0.9);
  }

  calculateRecommendationConfidence(userProfile, recentWorkouts) {
    let confidence = 0.7;
    if (recentWorkouts.length >= 5) confidence += 0.1;
    if (userProfile.fitnessLevel) confidence += 0.05;
    if (userProfile.weeklyMileage) confidence += 0.05;
    return Math.min(confidence, 0.95);
  }

  calculateTrendAnalysisConfidence(workoutData) {
    let confidence = 0.5;
    if (workoutData.length >= 20) confidence += 0.2;
    if (workoutData.length >= 50) confidence += 0.2;
    if (workoutData.some(w => w.averagePace)) confidence += 0.1;
    return Math.min(confidence, 0.9);
  }

  /**
   * Helper: Calculate performance statistics
   */
  calculatePerformanceStatistics(workouts) {
    const distances = workouts.map(w => w.distance).filter(d => d);
    const paces = workouts.map(w => w.averagePace).filter(p => p);
    
    return {
      totalWorkouts: workouts.length,
      averageDistance: distances.length ? distances.reduce((a, b) => a + b) / distances.length : 0,
      averagePace: paces.length ? paces.reduce((a, b) => a + b) / paces.length : 0,
      consistency: this.calculateConsistencyScore(workouts),
      improvement: this.calculateImprovementTrend(workouts)
    };
  }

  calculateConsistencyScore(workouts) {
    if (workouts.length < 4) return 0;
    const weekly = Math.floor(workouts.length / 4);
    return Math.min(weekly / 3, 1) * 100; // 3 workouts/week = 100%
  }

  calculateImprovementTrend(workouts) {
    if (workouts.length < 6) return 0;
    const recent = workouts.slice(0, 3);
    const older = workouts.slice(-3);
    const recentAvg = recent.reduce((sum, w) => sum + (w.averagePace || 0), 0) / 3;
    const olderAvg = older.reduce((sum, w) => sum + (w.averagePace || 0), 0) / 3;
    return recentAvg && olderAvg ? ((olderAvg - recentAvg) / olderAvg) * 100 : 0;
  }

  /**
   * Helper: Extract workout count from recommendations
   */
  extractWorkoutCount(content) {
    const countMatch = content.match(/(\d+)\s*(treniņ|workout)/i);
    return countMatch ? parseInt(countMatch[1]) : 3;
  }

  /**
   * Helper: Extract intensity distribution
   */
  extractIntensityDistribution(content) {
    return {
      easy: this.extractIntensityPercentage(content, ['viegls', 'easy']),
      moderate: this.extractIntensityPercentage(content, ['vidējs', 'moderate']),
      hard: this.extractIntensityPercentage(content, ['grūts', 'hard', 'intense'])
    };
  }

  extractIntensityPercentage(content, keywords) {
    for (const keyword of keywords) {
      const match = content.match(new RegExp(`${keyword}[^\\d]*?(\\d+)%`, 'i'));
      if (match) return parseInt(match[1]);
    }
    return 33; // Default equal distribution
  }

  /**
   * Helper: Extract specific workouts
   */
  extractSpecificWorkouts(content) {
    const workouts = [];
    const days = ['pirmdiena', 'otrdiena', 'trešdiena', 'ceturtdiena', 'piektdiena', 'sestdiena', 'svētdiena'];
    
    for (const day of days) {
      const dayIndex = content.toLowerCase().indexOf(day);
      if (dayIndex !== -1) {
        const nextDay = days.find(d => content.toLowerCase().indexOf(d, dayIndex + 1) > dayIndex);
        const endIndex = nextDay ? content.toLowerCase().indexOf(nextDay, dayIndex + 1) : content.length;
        const dayContent = content.substring(dayIndex, endIndex);
        
        workouts.push({
          day: day.charAt(0).toUpperCase() + day.slice(1),
          workout: dayContent.trim()
        });
      }
    }
    
    return workouts;
  }

  /**
   * Helper: Calculate weekly volume from recommendations
   */
  calculateWeeklyVolume(recommendations) {
    const distanceMatches = recommendations.fullContent.match(/(\d+(?:\.\d+)?)\s*km/g);
    if (!distanceMatches) return { total: 0, sessions: 0 };
    
    const distances = distanceMatches.map(match => parseFloat(match.replace('km', '')));
    return {
      total: distances.reduce((sum, d) => sum + d, 0),
      sessions: distances.length,
      averageDistance: distances.length ? distances.reduce((sum, d) => sum + d, 0) / distances.length : 0
    };
  }

  /**
   * Helper: Analyze intensity distribution
   */
  analyzeIntensityDistribution(recommendations) {
    const content = recommendations.fullContent.toLowerCase();
    const intensityKeywords = {
      easy: ['viegls', 'atjaunošanās', 'easy', 'recovery'],
      moderate: ['tempo', 'vidējs', 'moderate'],
      hard: ['intervāl', 'grūts', 'intense', 'speed']
    };

    const distribution = {};
    for (const [intensity, keywords] of Object.entries(intensityKeywords)) {
      distribution[intensity] = keywords.reduce((count, keyword) => {
        const matches = content.match(new RegExp(keyword, 'g'));
        return count + (matches ? matches.length : 0);
      }, 0);
    }

    return distribution;
  }

  /**
   * Helper: Assess data quality
   */
  assessDataQuality(workoutData) {
    if (!workoutData.length) return { score: 0, issues: ['No workout data available'] };
    
    const issues = [];
    let score = 100;

    // Check for missing essential data
    const missingDistance = workoutData.filter(w => !w.distance).length;
    const missingPace = workoutData.filter(w => !w.averagePace).length;
    const missingDates = workoutData.filter(w => !w.date).length;

    if (missingDistance > workoutData.length * 0.3) {
      issues.push('Over 30% of workouts missing distance data');
      score -= 20;
    }

    if (missingPace > workoutData.length * 0.5) {
      issues.push('Over 50% of workouts missing pace data');
      score -= 15;
    }

    if (missingDates > 0) {
      issues.push('Some workouts missing date information');
      score -= 10;
    }

    // Check data consistency
    const distances = workoutData.map(w => w.distance).filter(d => d);
    const averageDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const outliers = distances.filter(d => d > averageDistance * 3 || d < averageDistance * 0.1);
    
    if (outliers.length > distances.length * 0.1) {
      issues.push('Potential data outliers detected');
      score -= 5;
    }

    return {
      score: Math.max(score, 0),
      issues: issues.length ? issues : ['Data quality is good'],
      totalWorkouts: workoutData.length,
      dataCompleteness: {
        distance: ((workoutData.length - missingDistance) / workoutData.length * 100).toFixed(1) + '%',
        pace: ((workoutData.length - missingPace) / workoutData.length * 100).toFixed(1) + '%',
        dates: ((workoutData.length - missingDates) / workoutData.length * 100).toFixed(1) + '%'
      }
    };
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();
export default openAIService;