/**
 * External Service Integration
 * 
 * Provides utilities for integrating with external APIs and services,
 * including authentication, rate limiting, and error handling.
 */

import { ExternalServiceConfig, ExternalServiceError } from './types'

export interface HttpResponse<T = any> {
  data: T
  status: number
  headers: Record<string, string>
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  timeout?: number
  retries?: number
}

/**
 * HTTP client with built-in authentication and error handling
 */
export class HttpClient {
  private config: ExternalServiceConfig
  private baseHeaders: Record<string, string> = {}

  constructor(config: ExternalServiceConfig) {
    this.config = config
    this.setupAuthentication()
  }

  /**
   * Setup authentication headers
   */
  private setupAuthentication(): void {
    if (this.config.authentication) {
      const { type, credentials } = this.config.authentication

      switch (type) {
        case 'bearer':
          this.baseHeaders['Authorization'] = `Bearer ${credentials.token}`
          break
        case 'basic': {
          const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')
          this.baseHeaders['Authorization'] = `Basic ${encoded}`
          break
        }
        case 'apikey':
          if (credentials.header) {
            this.baseHeaders[credentials.header] = credentials.key
          } else {
            this.baseHeaders['X-API-Key'] = credentials.key
          }
          break
      }
    } else if (this.config.apiKey) {
      this.baseHeaders['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    // Add custom headers
    if (this.config.headers) {
      Object.assign(this.baseHeaders, this.config.headers)
    }
  }

  /**
   * Make HTTP request
   */
  async request<T = any>(
    endpoint: string, 
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const url = this.buildUrl(endpoint)
    const requestOptions = this.buildRequestOptions(options)

    try {
      const response = await this.executeRequest(url, requestOptions)
      return this.handleResponse<T>(response)
    } catch (error) {
      throw this.handleError(error, endpoint)
    }
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options: Omit<HttpRequestOptions, 'method'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body })
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options: Omit<HttpRequestOptions, 'method'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  /**
   * Build full URL
   */
  private buildUrl(endpoint: string): string {
    const baseUrl = this.config.baseUrl || ''
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    return `${baseUrl}${cleanEndpoint}`
  }

  /**
   * Build request options
   */
  private buildRequestOptions(options: HttpRequestOptions): RequestInit {
    const headers = {
      'Content-Type': 'application/json',
      ...this.baseHeaders,
      ...options.headers
    }

    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined
    }

    if (options.body && options.method !== 'GET') {
      requestOptions.body = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body)
    }

    return requestOptions
  }

  /**
   * Execute HTTP request with retries
   */
  private async executeRequest(url: string, options: RequestInit): Promise<Response> {
    const maxRetries = 3
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options)
        
        if (response.ok || attempt === maxRetries) {
          return response
        }

        // Retry on server errors (5xx)
        if (response.status >= 500) {
          await this.delay(attempt * 1000)
          continue
        }

        return response
      } catch (error) {
        lastError = error as Error
        
        if (attempt < maxRetries) {
          await this.delay(attempt * 1000)
          continue
        }
        
        throw error
      }
    }

    throw lastError!
  }

  /**
   * Handle response
   */
  private async handleResponse<T>(response: Response): Promise<HttpResponse<T>> {
    let data: T

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = await response.json() as T
    } else {
      data = (await response.text()) as T
    }

    if (!response.ok) {
      throw new ExternalServiceError(
        `HTTP ${response.status}: ${response.statusText}`,
        this.config.name,
        { status: response.status, data }
      )
    }

    return {
      data,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    }
  }

  /**
   * Handle request errors
   */
  private handleError(error: any, endpoint: string): never {
    if (error instanceof ExternalServiceError) {
      throw error
    }

    if (error.name === 'AbortError') {
      throw new ExternalServiceError(
        'Request timeout',
        this.config.name,
        { endpoint, timeout: true }
      )
    }

    throw new ExternalServiceError(
      `Request failed: ${error.message}`,
      this.config.name,
      { endpoint, originalError: error }
    )
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private requests: number[] = []
  private maxRequests: number
  private timeWindow: number

  constructor(maxRequests: number, timeWindowMs: number) {
    this.maxRequests = maxRequests
    this.timeWindow = timeWindowMs
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(): Promise<void> {
    const now = Date.now()
    
    // Remove old requests outside time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.timeWindow - (now - oldestRequest)
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return this.checkLimit() // Recheck after waiting
      }
    }
    
    this.requests.push(now)
  }

  /**
   * Get current usage stats
   */
  getStats(): { current: number, max: number, resetIn: number } {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.timeWindow)
    
    const resetIn = this.requests.length > 0 
      ? this.timeWindow - (now - Math.min(...this.requests))
      : 0

    return {
      current: this.requests.length,
      max: this.maxRequests,
      resetIn
    }
  }
}

/**
 * External service connector with built-in features
 */
export class ExternalServiceConnector {
  private httpClient: HttpClient
  private rateLimiter?: RateLimiter
  private webhookHandlers = new Map<string, Function>()

  constructor(
    config: ExternalServiceConfig,
    rateLimitConfig?: { maxRequests: number, timeWindowMs: number }
  ) {
    this.httpClient = new HttpClient(config)
    
    if (rateLimitConfig) {
      this.rateLimiter = new RateLimiter(
        rateLimitConfig.maxRequests,
        rateLimitConfig.timeWindowMs
      )
    }
  }

  /**
   * Make API call with rate limiting
   */
  async call<T = any>(
    endpoint: string,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    if (this.rateLimiter) {
      await this.rateLimiter.checkLimit()
    }
    
    return this.httpClient.request<T>(endpoint, options)
  }

  /**
   * Register webhook handler
   */
  onWebhook(event: string, handler: (payload: any) => void): void {
    this.webhookHandlers.set(event, handler)
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(event: string, payload: any): Promise<void> {
    const handler = this.webhookHandlers.get(event)
    if (handler) {
      try {
        await handler(payload)
      } catch (error) {
        throw new ExternalServiceError(
          `Webhook handler failed for event ${event}`,
          'webhook',
          { event, error }
        )
      }
    }
  }

  /**
   * Verify webhook signature (if supported)
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // Implementation would depend on the service's signature method
    // This is a placeholder for webhook verification
    return true
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus() {
    return this.rateLimiter?.getStats() || null
  }

  /**
   * Health check for external service
   */
  async healthCheck(): Promise<{ healthy: boolean, responseTime: number, error?: string }> {
    const startTime = Date.now()
    
    try {
      await this.httpClient.get('/health')
      return {
        healthy: true,
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Webhook server for receiving external service callbacks
 */
export class WebhookServer {
  private handlers = new Map<string, Array<(payload: any, headers: Record<string, string>) => Promise<void>>>()
  private signingSecrets = new Map<string, string>()

  /**
   * Register webhook handler for a service
   */
  register(
    serviceName: string,
    handler: (payload: any, headers: Record<string, string>) => Promise<void>,
    signingSecret?: string
  ): void {
    if (!this.handlers.has(serviceName)) {
      this.handlers.set(serviceName, [])
    }
    
    this.handlers.get(serviceName)!.push(handler)
    
    if (signingSecret) {
      this.signingSecrets.set(serviceName, signingSecret)
    }
  }

  /**
   * Process incoming webhook request
   */
  async processWebhook(
    serviceName: string,
    payload: any,
    headers: Record<string, string>
  ): Promise<{ success: boolean, error?: string }> {
    const handlers = this.handlers.get(serviceName)
    if (!handlers || handlers.length === 0) {
      return { success: false, error: `No handlers for service: ${serviceName}` }
    }

    // Verify signature if available
    const signingSecret = this.signingSecrets.get(serviceName)
    if (signingSecret) {
      const isValid = this.verifySignature(payload, headers, signingSecret)
      if (!isValid) {
        return { success: false, error: 'Invalid webhook signature' }
      }
    }

    try {
      // Execute all handlers for this service
      await Promise.all(handlers.map(handler => handler(payload, headers)))
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Handler execution failed'
      }
    }
  }

  /**
   * Verify webhook signature
   */
  private verifySignature(
    payload: any,
    headers: Record<string, string>,
    secret: string
  ): boolean {
    // Implementation would depend on the specific service's signature method
    // Common methods include HMAC-SHA256, etc.
    // This is a placeholder - actual implementation would vary by service
    return true
  }

  /**
   * Get registered services
   */
  getRegisteredServices(): string[] {
    return Array.from(this.handlers.keys())
  }
}