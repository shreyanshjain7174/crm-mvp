/**
 * Cozmox Voice API Service
 * 
 * Handles communication with Cozmox AI voice processing API
 */

import axios, { AxiosInstance } from 'axios'
import { createLogger } from '../utils/logger'

const logger = createLogger('CozmoxAPI')

export interface CozmoxConfig {
  apiKey: string
  voiceModel?: string
  language?: string
  baseUrl?: string
}

export interface VoiceCallRequest {
  phoneNumber: string
  message?: string
  voiceModel?: string
  language?: string
  maxDuration?: number
}

export interface VoiceCallResponse {
  callId: string
  status: 'initiated' | 'in_progress' | 'completed' | 'failed'
  duration?: number
  transcript?: string
  audioUrl?: string
}

export interface CallAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative'
  intent: string
  entities: Record<string, any>
  confidence: number
  summary: string
}

export class CozmoxVoiceAPI {
  private client: AxiosInstance
  private config: CozmoxConfig

  constructor(config: CozmoxConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.cozmox.ai/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Cozmox API error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        })
        throw error
      }
    )
  }

  /**
   * Validate API connection and credentials
   */
  async validateConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/auth/validate')
      return response.status === 200
    } catch (error) {
      logger.error('Failed to validate Cozmox API connection:', error)
      throw new Error('Invalid API key or connection failed')
    }
  }

  /**
   * Initiate an outbound voice call
   */
  async initiateCall(request: VoiceCallRequest): Promise<VoiceCallResponse> {
    try {
      const response = await this.client.post('/voice/call', {
        phone_number: request.phoneNumber,
        message: request.message,
        voice_model: request.voiceModel || this.config.voiceModel,
        language: request.language || this.config.language,
        max_duration: request.maxDuration || 900 // 15 minutes default
      })

      return {
        callId: response.data.call_id,
        status: response.data.status,
        duration: response.data.duration,
        transcript: response.data.transcript,
        audioUrl: response.data.audio_url
      }
    } catch (error) {
      logger.error('Failed to initiate call:', error)
      throw new Error('Call initiation failed')
    }
  }

  /**
   * Get call status and details
   */
  async getCallStatus(callId: string): Promise<VoiceCallResponse> {
    try {
      const response = await this.client.get(`/voice/call/${callId}`)
      
      return {
        callId: response.data.call_id,
        status: response.data.status,
        duration: response.data.duration,
        transcript: response.data.transcript,
        audioUrl: response.data.audio_url
      }
    } catch (error) {
      logger.error('Failed to get call status:', error)
      throw new Error('Failed to retrieve call status')
    }
  }

  /**
   * Analyze call transcript for intent and sentiment
   */
  async analyzeCall(callId: string): Promise<CallAnalysis> {
    try {
      const response = await this.client.post(`/voice/call/${callId}/analyze`)
      
      return {
        sentiment: response.data.sentiment,
        intent: response.data.intent,
        entities: response.data.entities || {},
        confidence: response.data.confidence || 0,
        summary: response.data.summary || ''
      }
    } catch (error) {
      logger.error('Failed to analyze call:', error)
      throw new Error('Call analysis failed')
    }
  }

  /**
   * Process incoming webhook from Cozmox
   */
  async processWebhook(payload: any): Promise<VoiceCallResponse> {
    logger.info('Processing Cozmox webhook:', { callId: payload.call_id })
    
    return {
      callId: payload.call_id,
      status: payload.status,
      duration: payload.duration,
      transcript: payload.transcript,
      audioUrl: payload.audio_url
    }
  }

  /**
   * End an active call
   */
  async endCall(callId: string): Promise<void> {
    try {
      await this.client.post(`/voice/call/${callId}/end`)
      logger.info('Call ended successfully:', { callId })
    } catch (error) {
      logger.error('Failed to end call:', error)
      throw new Error('Failed to end call')
    }
  }

  /**
   * Get available voice models
   */
  async getVoiceModels(): Promise<Array<{ id: string; name: string; language: string }>> {
    try {
      const response = await this.client.get('/voice/models')
      return response.data.models || []
    } catch (error) {
      logger.error('Failed to get voice models:', error)
      return []
    }
  }

  /**
   * Get account usage and limits
   */
  async getUsage(): Promise<{
    minutesUsed: number
    minutesLimit: number
    callsThisMonth: number
    remainingMinutes: number
  }> {
    try {
      const response = await this.client.get('/account/usage')
      return {
        minutesUsed: response.data.minutes_used || 0,
        minutesLimit: response.data.minutes_limit || 0,
        callsThisMonth: response.data.calls_this_month || 0,
        remainingMinutes: response.data.remaining_minutes || 0
      }
    } catch (error) {
      logger.error('Failed to get usage:', error)
      return {
        minutesUsed: 0,
        minutesLimit: 0,
        callsThisMonth: 0,
        remainingMinutes: 0
      }
    }
  }
}