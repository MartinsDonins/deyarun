import { AIConversation } from '../models/mongodb/index.js';

/**
 * AI Conversation Service
 * Service for managing AI conversations from backend AI systems
 */
class AIConversationService {
  
  /**
   * Start a new AI conversation
   */
  async startConversation(options = {}) {
    try {
      const {
        userId = null,
        userEmail = null,
        conversationType = 'general',
        source = 'api',
        language = 'lv',
        metadata = {},
        sessionId = null
      } = options;

      const finalSessionId = sessionId || this.generateSessionId();

      const conversation = new AIConversation({
        sessionId: finalSessionId,
        userId,
        userEmail,
        conversationType,
        source,
        language,
        metadata: {
          ...metadata,
          startedFromBackend: true,
          backendVersion: process.env.npm_package_version || 'unknown'
        }
      });

      await conversation.save();

      console.log(`📝 AI Conversation started: ${finalSessionId} (${conversationType})`);

      return {
        success: true,
        sessionId: finalSessionId,
        conversationId: conversation._id
      };

    } catch (error) {
      console.error('❌ Error starting AI conversation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add a message to an existing conversation
   */
  async addMessage(sessionId, role, content, metadata = {}) {
    try {
      if (!sessionId || !role || !content) {
        throw new Error('SessionId, role, and content are required');
      }

      let conversation = await AIConversation.findOne({ sessionId });

      if (!conversation) {
        // Auto-create conversation if it doesn't exist
        const createResult = await this.startConversation({ sessionId });
        if (!createResult.success) {
          throw new Error('Failed to create conversation');
        }
        conversation = await AIConversation.findOne({ sessionId });
      }

      conversation.addMessage(role, content, {
        ...metadata,
        backendTimestamp: new Date().toISOString(),
        source: 'backend'
      });

      await conversation.save();

      return {
        success: true,
        messageCount: conversation.messageCount
      };

    } catch (error) {
      console.error('❌ Error adding AI conversation message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add a user message
   */
  async addUserMessage(sessionId, content, metadata = {}) {
    return await this.addMessage(sessionId, 'user', content, metadata);
  }

  /**
   * Add an AI assistant response
   */
  async addAssistantMessage(sessionId, content, metadata = {}) {
    return await this.addMessage(sessionId, 'assistant', content, {
      ...metadata,
      aiModel: metadata.aiModel || 'unknown',
      processingTime: metadata.processingTime || 0
    });
  }

  /**
   * Add a system message
   */
  async addSystemMessage(sessionId, content, metadata = {}) {
    return await this.addMessage(sessionId, 'system', content, metadata);
  }

  /**
   * End a conversation
   */
  async endConversation(sessionId, options = {}) {
    try {
      const conversation = await AIConversation.findOne({ sessionId });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.endConversation();

      if (options.feedback) conversation.feedback = options.feedback;
      if (options.rating) conversation.rating = options.rating;
      if (options.resolved !== undefined) conversation.resolved = options.resolved;
      if (options.sentiment) conversation.sentiment = options.sentiment;
      if (options.tags) conversation.addTags(options.tags);

      await conversation.save();

      console.log(`✅ AI Conversation ended: ${sessionId} (${conversation.duration}s, ${conversation.messageCount} messages)`);

      return {
        success: true,
        duration: conversation.duration,
        messageCount: conversation.messageCount
      };

    } catch (error) {
      console.error('❌ Error ending AI conversation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track a complete quick exchange (question + answer)
   */
  async trackQuickExchange(userQuestion, aiResponse, options = {}) {
    try {
      const {
        userId = null,
        userEmail = null,
        conversationType = 'general',
        source = 'api',
        language = 'lv',
        autoEnd = true,
        feedback = {},
        metadata = {}
      } = options;

      // Start conversation
      const startResult = await this.startConversation({
        userId,
        userEmail,
        conversationType,
        source,
        language,
        metadata
      });

      if (!startResult.success) {
        throw new Error('Failed to start conversation');
      }

      const sessionId = startResult.sessionId;

      // Add user message
      await this.addUserMessage(sessionId, userQuestion, {
        ...metadata.userMessage,
        exchangeType: 'quick'
      });

      // Add AI response
      await this.addAssistantMessage(sessionId, aiResponse, {
        ...metadata.aiMessage,
        exchangeType: 'quick'
      });

      // End conversation if requested
      if (autoEnd) {
        await this.endConversation(sessionId, feedback);
      }

      return {
        success: true,
        sessionId,
        conversationId: startResult.conversationId
      };

    } catch (error) {
      console.error('❌ Error tracking AI quick exchange:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get conversation by session ID
   */
  async getConversation(sessionId, includeMessages = true) {
    try {
      const query = AIConversation.findOne({ sessionId });
      
      if (!includeMessages) {
        query.select('-messages');
      }

      const conversation = await query
        .populate('userId', 'firstName lastName email')
        .lean();

      if (!conversation) {
        return {
          success: false,
          error: 'Conversation not found'
        };
      }

      return {
        success: true,
        conversation
      };

    } catch (error) {
      console.error('❌ Error getting AI conversation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `ai_backend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Analyze conversation sentiment (basic implementation)
   */
  analyzeSentiment(messages) {
    let positiveCount = 0;
    let negativeCount = 0;
    let totalMessages = 0;

    const positiveWords = ['спасибо', 'отлично', 'хорошо', 'прекрасно', 'помогло', 'понятно', 'paldies', 'labi', 'lieliski', 'sapratu', 'thanks', 'great', 'good', 'excellent', 'helpful'];
    const negativeWords = ['плохо', 'не работает', 'ошибка', 'проблема', 'не помогло', 'slikti', 'nestrādā', 'kļūda', 'problēma', 'bad', 'error', 'problem', 'broken', 'issue'];

    messages.forEach(message => {
      if (message.role === 'user') {
        totalMessages++;
        const content = message.content.toLowerCase();
        
        const hasPositive = positiveWords.some(word => content.includes(word));
        const hasNegative = negativeWords.some(word => content.includes(word));
        
        if (hasPositive) positiveCount++;
        if (hasNegative) negativeCount++;
      }
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Auto-categorize conversation based on content
   */
  categorizeConversation(messages) {
    const categories = {
      support: ['помощь', 'проблема', 'ошибка', 'не работает', 'palīdzība', 'problēma', 'kļūda', 'nestrādā', 'help', 'problem', 'error', 'issue'],
      training: ['тренировка', 'бег', 'программа', 'план', 'treniņš', 'skrējiens', 'programma', 'plāns', 'training', 'running', 'workout', 'plan'],
      onboarding: ['начать', 'регистрация', 'как', 'инструкция', 'sākt', 'reģistrācija', 'kā', 'instrukcija', 'start', 'registration', 'how', 'instruction'],
      feedback: ['отзыв', 'мнение', 'предложение', 'atsauksme', 'viedoklis', 'ierosinājums', 'feedback', 'opinion', 'suggestion']
    };

    const content = messages
      .filter(m => m.role === 'user')
      .map(m => m.content.toLowerCase())
      .join(' ');

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Update conversation metadata based on content analysis
   */
  async analyzeAndUpdateConversation(sessionId) {
    try {
      const result = await this.getConversation(sessionId, true);
      
      if (!result.success) {
        return result;
      }

      const conversation = await AIConversation.findOne({ sessionId });
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Analyze sentiment
      const sentiment = this.analyzeSentiment(conversation.messages);
      conversation.sentiment = sentiment;

      // Auto-categorize if not already set
      if (conversation.conversationType === 'general') {
        const category = this.categorizeConversation(conversation.messages);
        conversation.conversationType = category;
      }

      // Generate tags based on content
      const userMessages = conversation.messages
        .filter(m => m.role === 'user')
        .map(m => m.content.toLowerCase());
      
      const autoTags = [];
      if (userMessages.some(content => content.includes('treniņ') || content.includes('training'))) {
        autoTags.push('training');
      }
      if (userMessages.some(content => content.includes('problēm') || content.includes('problem'))) {
        autoTags.push('problem');
      }
      if (userMessages.some(content => content.includes('kļūd') || content.includes('error'))) {
        autoTags.push('error');
      }

      conversation.addTags(autoTags);

      await conversation.save();

      return {
        success: true,
        sentiment,
        category: conversation.conversationType,
        tags: conversation.tags
      };

    } catch (error) {
      console.error('❌ Error analyzing AI conversation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get conversation statistics
   */
  async getStats(dateRange = {}) {
    try {
      const analytics = await AIConversation.getAnalytics(dateRange);
      
      return {
        success: true,
        analytics: analytics[0] || {
          totalConversations: 0,
          averageMessages: 0,
          averageDuration: 0,
          resolvedCount: 0,
          resolutionRate: 0,
          sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
          typeBreakdown: { support: 0, training: 0, general: 0 }
        }
      };

    } catch (error) {
      console.error('❌ Error getting AI conversation stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new AIConversationService();