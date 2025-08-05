'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Send, 
  Mic, 
  MicOff, 
  Settings, 
  Sparkles, 
  Bot, 
  User, 
  Loader2,
  Square,
  Zap,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAI, AIRequest, StreamChunk } from '@/hooks/useAI';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
    processing_time?: number;
  };
}

interface AIAssistantProps {
  leadId?: string;
  context?: Record<string, any>;
  className?: string;
}

export function AIAssistant({ leadId, context, className }: AIAssistantProps) {
  const {
    loading,
    error,
    models,
    tokenUsage,
    generateResponse,
    generateStreamingResponse,
    stopStreaming,
    loadModels,
    loadTokenUsage,
    checkHealth,
    clearError
  } = useAI();

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [useStreaming, setUseStreaming] = useState(true);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Load initial data
  useEffect(() => {
    const initializeAI = async () => {
      await loadModels();
      await loadTokenUsage();
      const healthy = await checkHealth();
      setIsHealthy(healthy);
    };

    initializeAI();
  }, [loadModels, loadTokenUsage, checkHealth]);

  // Set default model when models are loaded
  useEffect(() => {
    if (models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  const handleSendMessage = async () => {
    if (!currentInput.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const prompt = currentInput.trim();
    setCurrentInput('');

    const aiRequest: AIRequest = {
      prompt,
      model: selectedModel,
      temperature,
      max_tokens: maxTokens,
      leadId,
      context,
    };

    if (useStreaming && !leadId) {
      // Use streaming for general chat
      let streamedContent = '';
      setStreamingMessage('');

      const cleanup = generateStreamingResponse(
        aiRequest,
        (chunk: StreamChunk) => {
          streamedContent += chunk.content;
          setStreamingMessage(streamedContent);
        },
        (finalResponse) => {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: streamedContent,
            timestamp: new Date(),
            metadata: finalResponse ? {
              model: finalResponse.model_used,
              tokens: finalResponse.token_usage.total_tokens,
              cost: finalResponse.token_usage.cost,
              processing_time: finalResponse.processing_time,
            } : undefined,
          };

          setMessages(prev => [...prev, assistantMessage]);
          setStreamingMessage('');
          loadTokenUsage(); // Refresh usage stats
        },
        (error) => {
          console.error('Streaming error:', error);
          setStreamingMessage('');
          
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Error: ${error.message}`,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      );

      // Store cleanup function for potential cancellation
      (window as any).currentStreamCleanup = cleanup;
    } else {
      // Use regular response for lead-specific queries
      try {
        const response = await generateResponse(aiRequest);
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date(),
          metadata: {
            model: response.model_used,
            tokens: response.token_usage.total_tokens,
            cost: response.token_usage.cost,
            processing_time: response.processing_time,
          },
        };

        setMessages(prev => [...prev, assistantMessage]);
        loadTokenUsage(); // Refresh usage stats
      } catch (err) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Failed to generate response'}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  const handleStopStreaming = () => {
    stopStreaming();
    if ((window as any).currentStreamCleanup) {
      (window as any).currentStreamCleanup();
      (window as any).currentStreamCleanup = null;
    }
    setStreamingMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setStreamingMessage('');
    clearError();
  };

  return (
    <div className={cn('flex flex-col h-full max-w-4xl mx-auto', className)}>
      {/* Header */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">AI Assistant</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Status:</span>
                  {isHealthy === null ? (
                    <Badge variant="secondary">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Checking...
                    </Badge>
                  ) : isHealthy ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Disconnected
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {tokenUsage && (
                <div className="text-right text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <DollarSign className="h-3 w-3" />
                    <span>${tokenUsage.total_cost.toFixed(4)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {tokenUsage.total_tokens.toLocaleString()} tokens
                  </div>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearConversation}
                disabled={messages.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div>
              <Label htmlFor="model-select" className="text-sm font-medium">Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model-select" className="mt-1">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="temperature" className="text-sm font-medium">
                Temperature: {temperature}
              </Label>
              <input
                id="temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full mt-1"
              />
            </div>

            <div>
              <Label htmlFor="max-tokens" className="text-sm font-medium">
                Max Tokens: {maxTokens}
              </Label>
              <input
                id="max-tokens"
                type="range"
                min="100"
                max="4000"
                step="100"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="streaming"
                checked={useStreaming}
                onCheckedChange={setUseStreaming}
                disabled={!!leadId}
              />
              <Label htmlFor="streaming" className="text-sm">
                <Zap className="h-3 w-3 inline mr-1" />
                Streaming
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !streamingMessage && (
              <div className="text-center text-gray-500 py-12">
                <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">AI Assistant Ready</p>
                <p className="text-sm">
                  {leadId 
                    ? 'Ask questions about this lead or request AI suggestions'
                    : 'Start a conversation with our AI assistant'
                  }
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'flex gap-3 max-w-[80%]',
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                      message.role === 'user' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-purple-100 text-purple-600'
                    )}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  <div
                    className={cn(
                      'rounded-lg px-4 py-2',
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {message.metadata && (
                      <div className="mt-2 pt-2 border-t border-gray-200 text-xs opacity-75">
                        <div className="flex items-center gap-4">
                          <span>{message.metadata.model}</span>
                          {message.metadata.tokens && (
                            <span>{message.metadata.tokens} tokens</span>
                          )}
                          {message.metadata.cost && (
                            <span>${message.metadata.cost.toFixed(4)}</span>
                          )}
                          {message.metadata.processing_time && (
                            <span>{message.metadata.processing_time.toFixed(2)}s</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming Message */}
            {streamingMessage && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 text-purple-600">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-gray-100 text-gray-900">
                    <p className="whitespace-pre-wrap">{streamingMessage}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs text-gray-500">Generating...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="ml-auto text-red-600 hover:text-red-700"
                >
                  Dismiss
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={leadId ? "Ask about this lead or request AI suggestions..." : "Type your message..."}
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={loading}
              />
              
              <div className="flex flex-col gap-2">
                {loading && streamingMessage ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleStopStreaming}
                    className="px-3"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!currentInput.trim() || loading || !isHealthy}
                    className="px-3"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}