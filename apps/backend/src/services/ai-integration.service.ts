import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface AIRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  user_id?: string;
  rule_set_id?: string;
  context?: Record<string, any>;
}

export interface AIResponse {
  response: string;
  model_used: string;
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost: number;
  };
  confidence: number;
  processing_time: number;
  timestamp: string;
}

export interface StreamChunk {
  content: string;
  model_used?: string;
  is_complete: boolean;
  token_count?: number;
  timestamp: string;
}

export class AIIntegrationService {
  private aiClient: AxiosInstance;
  private readonly AI_SERVICE_URL: string;

  constructor() {
    this.AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    this.aiClient = axios.create({
      baseURL: this.AI_SERVICE_URL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request/response interceptors for logging
    this.aiClient.interceptors.request.use(
      (config) => {
        logger.info(`AI Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('AI Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.aiClient.interceptors.response.use(
      (response) => {
        logger.info(`AI Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('AI Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await this.aiClient.post('/generate', request);
      return response.data;
    } catch (error) {
      logger.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  async generateStreamingResponse(request: AIRequest): Promise<EventEmitter> {
    const eventEmitter = new EventEmitter();
    
    try {
      const response = await this.aiClient.post('/generate/stream', request, {
        responseType: 'stream',
        timeout: 60000
      });

      let buffer = '';
      
      response.data.on('data', (chunk: Buffer) => {
        try {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          
          // Keep the last potentially incomplete line in the buffer
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                eventEmitter.emit('complete');
                return;
              }
              
              try {
                const parsedData: StreamChunk = JSON.parse(data);
                eventEmitter.emit('chunk', parsedData);
              } catch (parseError) {
                logger.warn('Failed to parse streaming chunk:', data);
              }
            }
          }
        } catch (error) {
          logger.error('Error processing streaming chunk:', error);
          eventEmitter.emit('error', error);
        }
      });

      response.data.on('end', () => {
        eventEmitter.emit('complete');
      });

      response.data.on('error', (error: Error) => {
        logger.error('Streaming response error:', error);
        eventEmitter.emit('error', error);
      });

    } catch (error) {
      logger.error('Error initiating streaming response:', error);
      // Emit error asynchronously to allow caller to attach listeners
      process.nextTick(() => eventEmitter.emit('error', error));
    }
    
    return eventEmitter;
  }

  async getAvailableModels(): Promise<any[]> {
    try {
      const response = await this.aiClient.get('/models');
      return response.data;
    } catch (error) {
      logger.error('Error fetching available models:', error);
      throw new Error('Failed to fetch available models');
    }
  }

  async getModelStats(modelId: string): Promise<any> {
    try {
      const response = await this.aiClient.get(`/models/${modelId}/stats`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching stats for model ${modelId}:`, error);
      throw new Error(`Failed to fetch stats for model ${modelId}`);
    }
  }

  async getTokenUsage(userId?: string): Promise<any> {
    try {
      const params = userId ? { user_id: userId } : {};
      const response = await this.aiClient.get('/usage', { params });
      return response.data;
    } catch (error) {
      logger.error('Error fetching token usage:', error);
      throw new Error('Failed to fetch token usage');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.aiClient.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      logger.error('AI service health check failed:', error);
      return false;
    }
  }
}

export const aiIntegrationService = new AIIntegrationService();