/**
 * Call Processor Service
 * 
 * Handles incoming call processing, conversation flow, and outcome determination
 */

import { CozmoxVoiceAPI, CallAnalysis } from './cozmox-api'
import { createLogger } from '../utils/logger'

const logger = createLogger('CallProcessor')

export interface CallData {
  id: string
  phoneNumber: string
  direction: 'inbound' | 'outbound'
  timestamp: Date
  contactId?: string
}

export interface CallOutcome {
  outcome: 'appointment_requested' | 'lead_qualified' | 'support_request' | 'information_provided' | 'call_ended'
  duration: number
  transcript: string
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  recommendedActions: string[]
  contactId?: string
  appointmentDetails?: {
    preferredDate?: string
    preferredTime?: string
    duration?: number
    notes?: string
  }
  qualificationData?: {
    budget?: string
    timeline?: string
    intent?: string
    score?: number
  }
  supportDetails?: {
    issue: string
    priority: 'low' | 'medium' | 'high'
    category?: string
  }
}

export class CallProcessor {
  private config: any
  private conversationTemplates: Map<string, string>

  constructor(config: any) {
    this.config = config
    this.conversationTemplates = new Map([
      ['greeting', this.config.greetingMessage || 'Hello! Thank you for calling {businessName}. How can I help you today?'],
      ['appointment_inquiry', 'I can help you schedule an appointment. What would work best for you?'],
      ['lead_qualification', 'I\'d like to understand your needs better. May I ask a few quick questions?'],
      ['support_request', 'I\'m here to help with any questions or concerns you have.'],
      ['business_hours', 'Our business hours are {businessHours}. Would you like to schedule a callback during business hours?']
    ])
  }

  /**
   * Process an incoming or outgoing call
   */
  async processCall(callData: CallData, voiceAPI: CozmoxVoiceAPI): Promise<CallOutcome> {
    logger.info('Processing call:', { 
      callId: callData.id, 
      direction: callData.direction,
      phone: callData.phoneNumber 
    })

    try {
      let callResponse

      if (callData.direction === 'outbound') {
        // Initiate outbound call
        callResponse = await voiceAPI.initiateCall({
          phoneNumber: callData.phoneNumber,
          message: this.getGreetingMessage(),
          maxDuration: this.config.advancedSettings?.maxCallDuration || 15
        })
      } else {
        // For inbound calls, we assume they're already connected
        callResponse = await voiceAPI.getCallStatus(callData.id)
      }

      // Wait for call completion (in real implementation, this would be webhook-driven)
      const finalCallStatus = await this.waitForCallCompletion(callResponse.callId, voiceAPI)
      
      // Analyze the call
      const analysis = await voiceAPI.analyzeCall(finalCallStatus.callId)
      
      // Determine outcome based on analysis
      const outcome = this.determineCallOutcome(analysis, finalCallStatus)

      return outcome
    } catch (error) {
      logger.error('Call processing failed:', error)
      
      return {
        outcome: 'call_ended',
        duration: 0,
        transcript: '',
        summary: 'Call processing failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        sentiment: 'neutral',
        recommendedActions: ['Manual follow-up required'],
        contactId: callData.contactId
      }
    }
  }

  /**
   * Wait for call completion (polling-based for demo)
   */
  private async waitForCallCompletion(callId: string, voiceAPI: CozmoxVoiceAPI, maxWaitTime = 300000): Promise<any> {
    const startTime = Date.now()
    const pollInterval = 5000 // 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      const status = await voiceAPI.getCallStatus(callId)
      
      if (status.status === 'completed' || status.status === 'failed') {
        return status
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error('Call completion timeout')
  }

  /**
   * Determine call outcome based on AI analysis
   */
  private determineCallOutcome(analysis: CallAnalysis, callStatus: any): CallOutcome {
    const outcome: CallOutcome = {
      outcome: 'information_provided',
      duration: callStatus.duration || 0,
      transcript: callStatus.transcript || '',
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      recommendedActions: [],
      contactId: callStatus.contactId
    }

    // Analyze intent to determine outcome
    const intent = analysis.intent.toLowerCase()
    
    if (intent.includes('appointment') || intent.includes('schedule') || intent.includes('meeting')) {
      outcome.outcome = 'appointment_requested'
      outcome.appointmentDetails = this.extractAppointmentDetails(analysis)
      outcome.recommendedActions = ['Schedule appointment', 'Send confirmation']
    } 
    else if (intent.includes('interested') || intent.includes('buy') || intent.includes('purchase')) {
      outcome.outcome = 'lead_qualified'
      outcome.qualificationData = this.extractQualificationData(analysis)
      outcome.recommendedActions = ['Follow up within 24 hours', 'Send proposal']
    }
    else if (intent.includes('problem') || intent.includes('issue') || intent.includes('help')) {
      outcome.outcome = 'support_request'
      outcome.supportDetails = this.extractSupportDetails(analysis)
      outcome.recommendedActions = ['Create support ticket', 'Assign to support team']
    }
    else {
      outcome.recommendedActions = ['Log call details', 'Consider follow-up']
    }

    // Add sentiment-based recommendations
    if (analysis.sentiment === 'negative') {
      outcome.recommendedActions.unshift('Priority follow-up - customer concern')
    } else if (analysis.sentiment === 'positive') {
      outcome.recommendedActions.push('Opportunity for upsell/referral')
    }

    return outcome
  }

  /**
   * Extract appointment details from call analysis
   */
  private extractAppointmentDetails(analysis: CallAnalysis): CallOutcome['appointmentDetails'] {
    const entities = analysis.entities || {}
    
    return {
      preferredDate: entities.date || entities.preferred_date,
      preferredTime: entities.time || entities.preferred_time,
      duration: this.config.appointmentSettings?.duration || 30,
      notes: analysis.summary
    }
  }

  /**
   * Extract lead qualification data from call analysis
   */
  private extractQualificationData(analysis: CallAnalysis): CallOutcome['qualificationData'] {
    const entities = analysis.entities || {}
    
    // Simple scoring based on confidence and positive sentiment
    let score = analysis.confidence * 100
    if (analysis.sentiment === 'positive') score += 20
    if (analysis.sentiment === 'negative') score -= 30
    
    return {
      budget: entities.budget,
      timeline: entities.timeline,
      intent: analysis.intent,
      score: Math.max(0, Math.min(100, score))
    }
  }

  /**
   * Extract support details from call analysis
   */
  private extractSupportDetails(analysis: CallAnalysis): CallOutcome['supportDetails'] {
    const entities = analysis.entities || {}
    
    // Determine priority based on sentiment and keywords
    let priority: 'low' | 'medium' | 'high' = 'medium'
    
    if (analysis.sentiment === 'negative') priority = 'high'
    if (analysis.intent.includes('urgent') || analysis.intent.includes('critical')) priority = 'high'
    if (analysis.intent.includes('question') || analysis.intent.includes('info')) priority = 'low'
    
    return {
      issue: analysis.summary,
      priority,
      category: entities.category || 'general'
    }
  }

  /**
   * Get personalized greeting message
   */
  private getGreetingMessage(): string {
    const template = this.conversationTemplates.get('greeting') || 'Hello! How can I help you today?'
    return template.replace('{businessName}', this.config.businessInfo?.name || 'our business')
  }

  /**
   * Check if within business hours
   */
  private isWithinBusinessHours(): boolean {
    if (!this.config.businessHours?.enabled) return true
    
    const now = new Date()
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const currentDay = dayNames[now.getDay()]
    const currentTime = now.toTimeString().slice(0, 5) // HH:MM
    
    const todaySchedule = this.config.businessHours?.schedule?.[currentDay]
    if (!todaySchedule) return false
    
    return currentTime >= todaySchedule.open && currentTime <= todaySchedule.close
  }

  /**
   * Handle after-hours calls
   */
  private handleAfterHours(): string {
    const businessHours = this.formatBusinessHours()
    return this.conversationTemplates.get('business_hours')?.replace('{businessHours}', businessHours) || 
           'We are currently closed. Please call back during business hours.'
  }

  /**
   * Format business hours for display
   */
  private formatBusinessHours(): string {
    if (!this.config.businessHours?.schedule) return 'Please check our website'
    
    const schedule = this.config.businessHours.schedule
    const days = Object.keys(schedule)
    
    return days.map(day => 
      `${day.charAt(0).toUpperCase() + day.slice(1)}: ${schedule[day].open}-${schedule[day].close}`
    ).join(', ')
  }
}