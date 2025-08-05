import { useState, useCallback, useRef } from 'react';
import apiClient from '@/lib/api';

export interface AIRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  leadId?: string;
  context?: Record<string, any>;
  stream?: boolean;
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

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  cost_per_token: number;
  context_length: number;
  capabilities: string[];
}

export interface TokenUsage {
  total_tokens: number;
  total_cost: number;
  usage_by_model: Record<string, {
    tokens: number;
    cost: number;
    requests: number;
  }>;
  usage_by_day: Array<{
    date: string;
    tokens: number;
    cost: number;
  }>;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate AI response (non-streaming)
  const generateResponse = useCallback(async (request: AIRequest): Promise<AIResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.generateAIResponse({
        ...request,
        stream: false
      });
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate AI response';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate streaming AI response
  const generateStreamingResponse = useCallback((
    request: AIRequest,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: (finalResponse?: AIResponse) => void,
    onError: (error: Error) => void
  ) => {
    setLoading(true);
    setError(null);

    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fetchStream = async () => {
      try {
        const response = await fetch('/api/ai/v2/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiClient.getToken()}`,
          },
          body: JSON.stringify({
            ...request,
            stream: true
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body reader available');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last potentially incomplete line in the buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              
              if (data === '[DONE]') {
                setLoading(false);
                onComplete();
                return;
              }

              try {
                const chunk: StreamChunk = JSON.parse(data);
                onChunk(chunk);
              } catch (parseError) {
                console.warn('Failed to parse streaming chunk:', data);
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          console.log('Stream aborted');
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Streaming failed';
        setError(errorMessage);
        onError(new Error(errorMessage));
      } finally {
        setLoading(false);
      }
    };

    fetchStream();

    // Return cleanup function
    return () => {
      abortController.abort();
      setLoading(false);
    };
  }, []);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  // Load available models
  const loadModels = useCallback(async () => {
    try {
      const response = await apiClient.getAIModels();
      setModels(response.models || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load AI models';
      setError(errorMessage);
      console.error('Error loading AI models:', err);
    }
  }, []);

  // Load token usage statistics
  const loadTokenUsage = useCallback(async () => {
    try {
      const usage = await apiClient.getAITokenUsage();
      setTokenUsage(usage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load token usage';
      setError(errorMessage);
      console.error('Error loading token usage:', err);
    }
  }, []);

  // Check AI service health
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const health = await apiClient.checkAIHealth();
      return health.status === 'healthy';
    } catch (err) {
      console.error('AI health check failed:', err);
      return false;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    loading,
    error,
    models,
    tokenUsage,

    // Actions
    generateResponse,
    generateStreamingResponse,
    stopStreaming,
    loadModels,
    loadTokenUsage,
    checkHealth,
    clearError,
  };
}