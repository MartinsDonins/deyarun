import { logger } from '../lib/productionLogger'
// AI Conversation Tracker - Universal service for tracking AI conversations
// Can be used across web, mobile, and API interactions

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: any
}

interface ConversationOptions {
  conversationType?: 'support' | 'training' | 'general' | 'onboarding' | 'feedback'
  userEmail?: string
  source?: 'web' | 'mobile' | 'api'
  language?: 'lv' | 'en' | 'ru'
  metadata?: any
}

class AIConversationTracker {
  private apiBaseUrl: string
  private sessionId: string | null = null
  private isEnabled: boolean = true
  private pendingMessages: ConversationMessage[] = []

  constructor(apiBaseUrl?: string) {
    this.apiBaseUrl = apiBaseUrl || process.env.NEXT_PUBLIC_API_URL || 'https://api.deyarun.com'
    
    // Check if tracking is enabled (can be disabled via env var)
    this.isEnabled = process.env.NEXT_PUBLIC_AI_TRACKING_ENABLED !== 'false'
    
    // Generate session ID if not provided
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `ai_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async saveToAPI(data: any): Promise<boolean> {
    if (!this.isEnabled) return false

    try {
      const response = await fetch(`${this.apiBaseUrl }/api/ai-conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if available
          ...(typeof window !== 'undefined' && localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        logger.warn('WARNING', 'Failed to save AI conversation:', { statusText: response.statusText })
        return false
      }

      const result = await response.json()
      if (result.sessionId && !this.sessionId) {
        this.sessionId = result.sessionId
      }

      return true
    } catch (error) {
      logger.warn('WARNING', 'Error saving AI conversation:', { error })
      return false
    }
  }

  // Start a new conversation
  async startConversation(options: ConversationOptions = {}): Promise<string> {
    this.sessionId = this.generateSessionId()
    this.pendingMessages = []

    // Send initial conversation metadata
    if (this.isEnabled) {
      await this.saveToAPI({
        sessionId: this.sessionId,
        role: 'system',
        content: 'Conversation started',
        conversationType: options.conversationType || 'general',
        userEmail: options.userEmail,
        source: options.source || (typeof window !== 'undefined' ? 'web' : 'api'),
        language: options.language || 'lv',
        metadata: {
          ...options.metadata,
          startTime: new Date().toISOString(),
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined
        }
      })
    }

    return this.sessionId
  }

  // Add a user message to the conversation
  async addUserMessage(content: string, metadata: any = {}): Promise<void> {
    if (!this.isEnabled || !content.trim()) return

    const message: ConversationMessage = {
      role: 'user',
      content: content.trim(),
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    }

    this.pendingMessages.push(message)

    // Save to API
    await this.saveToAPI({
      sessionId: this.sessionId,
      role: message.role,
      content: message.content,
      metadata: message.metadata
    })
  }

  // Add an AI assistant response to the conversation
  async addAssistantMessage(content: string, metadata: any = {}): Promise<void> {
    if (!this.isEnabled || !content.trim()) return

    const message: ConversationMessage = {
      role: 'assistant',
      content: content.trim(),
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    }

    this.pendingMessages.push(message)

    // Save to API
    await this.saveToAPI({
      sessionId: this.sessionId,
      role: message.role,
      content: message.content,
      metadata: message.metadata
    })
  }

  // Add a system message (for technical/status updates)
  async addSystemMessage(content: string, metadata: any = {}): Promise<void> {
    if (!this.isEnabled || !content.trim()) return

    const message: ConversationMessage = {
      role: 'system',
      content: content.trim(),
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    }

    this.pendingMessages.push(message)

    // Save to API
    await this.saveToAPI({
      sessionId: this.sessionId,
      role: message.role,
      content: message.content,
      metadata: message.metadata
    })
  }

  // End the conversation with optional feedback
  async endConversation(feedback?: {
    rating?: number
    feedback?: string
    resolved?: boolean
    tags?: string[]
  }): Promise<void> {
    if (!this.isEnabled || !this.sessionId) return

    try {
      const response = await fetch(`${this.apiBaseUrl }/api/ai-conversations/${this.sessionId }/end`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          })
        },
        body: JSON.stringify({
          feedback: feedback?.feedback,
          rating: feedback?.rating,
          resolved: feedback?.resolved || false
        })
      })

      // Add tags if provided
      if (feedback?.tags && feedback.tags.length > 0) {
        await fetch(`${this.apiBaseUrl }/api/ai-conversations/${this.sessionId }/tags`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(typeof window !== 'undefined' && localStorage.getItem('token') && {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            })
          },
          body: JSON.stringify({ tags: feedback.tags })
        })
      }

      if (!response.ok) {
        logger.warn('WARNING', 'Failed to end AI conversation:', { statusText: response.statusText })
      }
    } catch (error) {
      logger.warn('WARNING', 'Error ending AI conversation:', { error })
    }

    // Reset session
    this.sessionId = null
    this.pendingMessages = []
  }

  // Get current session ID
  getSessionId(): string | null {
    return this.sessionId
  }

  // Get pending messages (not yet saved)
  getPendingMessages(): ConversationMessage[] {
    return [...this.pendingMessages]
  }

  // Enable or disable tracking
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  // Check if tracking is enabled
  isTrackingEnabled(): boolean {
    return this.isEnabled
  }

  // Quick method for simple Q&A tracking
  async trackQuickExchange(
    userQuestion: string, 
    aiResponse: string, 
    options: ConversationOptions & { 
      autoEnd?: boolean
      feedback?: { rating?: number; feedback?: string; resolved?: boolean; tags?: string[] }
    } = {}
  ): Promise<string> {
    const sessionId = await this.startConversation(options)
    
    await this.addUserMessage(userQuestion, {
      source: options.source || 'quick-exchange'
    })
    
    await this.addAssistantMessage(aiResponse, {
      source: options.source || 'quick-exchange'
    })

    if (options.autoEnd !== false) {
      await this.endConversation(options.feedback)
    }

    return sessionId
  }
}

// Create a singleton instance for global use
let globalTracker: AIConversationTracker | null = null

export function getAIConversationTracker(apiBaseUrl?: string): AIConversationTracker {
  if (!globalTracker) {
    globalTracker = new AIConversationTracker(apiBaseUrl)
  }
  return globalTracker
}

// Export the class for custom instances
export { AIConversationTracker }

// Helper hook for React components
export function useAIConversationTracker(options: ConversationOptions = {}) {
  const tracker = getAIConversationTracker()
  
  const startConversation = async () => {
    return await tracker.startConversation(options)
  }

  const addUserMessage = async (content: string, metadata?: any) => {
    return await tracker.addUserMessage(content, metadata)
  }

  const addAssistantMessage = async (content: string, metadata?: any) => {
    return await tracker.addAssistantMessage(content, metadata)
  }

  const endConversation = async (feedback?: {
    rating?: number
    feedback?: string
    resolved?: boolean
    tags?: string[]
  }) => {
    return await tracker.endConversation(feedback)
  }

  const trackQuickExchange = async (
    userQuestion: string,
    aiResponse: string,
    exchangeOptions?: ConversationOptions & {
      autoEnd?: boolean
      feedback?: { rating?: number; feedback?: string; resolved?: boolean; tags?: string[] }
    }
  ) => {
    return await tracker.trackQuickExchange(userQuestion, aiResponse, {
      ...options,
      ...exchangeOptions
    })
  }

  return {
    tracker,
    startConversation,
    addUserMessage,
    addAssistantMessage,
    endConversation,
    trackQuickExchange,
    sessionId: tracker.getSessionId(),
    isEnabled: tracker.isTrackingEnabled()
  }
}

// Example usage:
/*
// In a React component:
const { trackQuickExchange } = useAIConversationTracker({
  conversationType: 'training',
  source: 'web'
})

// Track a simple exchange
await trackQuickExchange(
  "Kā es varu uzlabot savu skrējiena tehniku?",
  "Lai uzlabotu skrējiena tehniku, ieteicu koncentrēties uz...",
  {
    autoEnd: true,
    feedback: {
      resolved: true,
      tags: ['running-technique', 'training-advice']
    }
  }
)

// Or for longer conversations:
const tracker = getAIConversationTracker()
await tracker.startConversation({ conversationType: 'support' })
await tracker.addUserMessage("Man ir problēma ar aplikāciju")
await tracker.addAssistantMessage("Es palīdzēšu atrisināt jūsu problēmu...")
// ... more messages
await tracker.endConversation({ resolved: true, rating: 5 })
*/