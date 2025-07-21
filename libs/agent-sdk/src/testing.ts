/**
 * Agent Testing Utilities
 * 
 * Provides testing tools and utilities for developing and testing AI agents.
 * Includes mock data generators, test runners, and assertion helpers.
 */

import { 
  BuiltAgent,
  MessageData,
  ContactData,
  LeadData,
  ConversationData,
  CallData,
  CRMData,
  AgentData,
  AgentContext,
  BusinessInfo,
  UserInfo
} from './types'

/**
 * Agent Tester - Main testing utility
 */
export class AgentTester {
  private agent: BuiltAgent
  private mockContext: AgentContext

  constructor(agent: BuiltAgent) {
    this.agent = agent
    this.mockContext = this.createMockContext()
  }

  /**
   * Send a test message to the agent
   */
  async sendMessage(messageData: Partial<MessageData['data']>): Promise<AgentData | null> {
    const fullMessage: MessageData = {
      type: 'message',
      data: {
        id: generateId(),
        content: '',
        phone: '+911234567890',
        direction: 'inbound',
        timestamp: new Date(),
        messageType: 'text',
        ...messageData
      },
      businessId: this.mockContext.business.id,
      metadata: {}
    }

    return this.agent.adapter.sendToAgent(fullMessage)
  }

  /**
   * Send test contact data to the agent
   */
  async sendContact(contactData: Partial<ContactData['data']>): Promise<AgentData | null> {
    const fullContact: ContactData = {
      type: 'contact',
      data: {
        id: generateId(),
        phone: '+911234567890',
        tags: [],
        customFields: {},
        ...contactData
      },
      businessId: this.mockContext.business.id,
      metadata: {}
    }

    return this.agent.adapter.sendToAgent(fullContact)
  }

  /**
   * Send test lead data to the agent
   */
  async sendLead(leadData: Partial<LeadData['data']>): Promise<AgentData | null> {
    const fullLead: LeadData = {
      type: 'lead',
      data: {
        id: generateId(),
        contactId: generateId(),
        stage: 'new',
        source: 'website',
        ...leadData
      },
      businessId: this.mockContext.business.id,
      metadata: {}
    }

    return this.agent.adapter.sendToAgent(fullLead)
  }

  /**
   * Send test call data to the agent
   */
  async sendCall(callData: Partial<CallData['data']>): Promise<AgentData | null> {
    const fullCall: CallData = {
      type: 'call',
      data: {
        id: generateId(),
        phoneNumber: '+911234567890',
        direction: 'inbound',
        status: 'ringing',
        startTime: new Date(),
        businessInfo: this.mockContext.business,
        ...callData
      },
      businessId: this.mockContext.business.id,
      metadata: {}
    }

    return this.agent.adapter.sendToAgent(fullCall)
  }

  /**
   * Test agent with custom CRM data
   */
  async sendCustomData(data: CRMData): Promise<AgentData | null> {
    return this.agent.adapter.sendToAgent(data)
  }

  /**
   * Set custom context for testing
   */
  setContext(context: Partial<AgentContext>): void {
    this.mockContext = {
      ...this.mockContext,
      ...context
    }
  }

  /**
   * Get the current mock context
   */
  getContext(): AgentContext {
    return this.mockContext
  }

  /**
   * Create a mock context for testing
   */
  private createMockContext(): AgentContext {
    return {
      config: {
        businessId: 'test-business',
        agentId: this.agent.manifest.id,
        userId: 'test-user'
      },
      business: {
        id: 'test-business',
        name: 'Test Business',
        industry: 'Technology',
        settings: {},
        timezone: 'Asia/Kolkata'
      },
      user: {
        id: 'test-user',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin'
      },
      metadata: {
        testMode: true,
        timestamp: new Date().toISOString()
      }
    }
  }
}

/**
 * Mock Data Generators
 */
export class MockDataGenerator {
  /**
   * Generate mock message data
   */
  static message(overrides: Partial<MessageData> = {}): MessageData {
    return {
      type: 'message',
      data: {
        id: generateId(),
        content: 'Hello, I need help with your services',
        phone: '+911234567890',
        direction: 'inbound',
        timestamp: new Date(),
        messageType: 'text'
      },
      businessId: 'test-business',
      metadata: {},
      ...overrides
    }
  }

  /**
   * Generate mock contact data
   */
  static contact(overrides: Partial<ContactData> = {}): ContactData {
    return {
      type: 'contact',
      data: {
        id: generateId(),
        name: 'John Doe',
        phone: '+911234567890',
        email: 'john@example.com',
        tags: ['lead', 'interested'],
        customFields: {
          source: 'website',
          notes: 'Interested in premium package'
        },
        lastContact: new Date(),
        source: 'website'
      },
      businessId: 'test-business',
      metadata: {},
      ...overrides
    }
  }

  /**
   * Generate mock lead data
   */
  static lead(overrides: Partial<LeadData> = {}): LeadData {
    return {
      type: 'lead',
      data: {
        id: generateId(),
        contactId: generateId(),
        stage: 'qualified',
        value: 50000,
        source: 'website',
        assignedTo: 'sales-rep-1',
        probability: 75,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        notes: 'Hot lead - interested in premium package'
      },
      businessId: 'test-business',
      metadata: {},
      ...overrides
    }
  }

  /**
   * Generate mock business info
   */
  static business(overrides: Partial<BusinessInfo> = {}): BusinessInfo {
    return {
      id: 'test-business',
      name: 'Acme Corp',
      industry: 'Technology',
      settings: {
        currency: 'INR',
        language: 'en',
        timezone: 'Asia/Kolkata'
      },
      timezone: 'Asia/Kolkata',
      ...overrides
    }
  }

  /**
   * Generate mock user info
   */
  static user(overrides: Partial<UserInfo> = {}): UserInfo {
    return {
      id: 'test-user',
      name: 'Test User',
      email: 'test@acme.com',
      role: 'admin',
      ...overrides
    }
  }
}

/**
 * Test Assertions
 */
export class AgentAssertions {
  /**
   * Assert that response is of expected type
   */
  static assertResponseType(response: AgentData | null, expectedType: string): void {
    if (!response) {
      throw new Error('Expected response but got null')
    }
    if (response.type !== expectedType) {
      throw new Error(`Expected response type '${expectedType}' but got '${response.type}'`)
    }
  }

  /**
   * Assert that response contains expected content
   */
  static assertResponseContains(response: AgentData | null, expectedContent: string): void {
    if (!response) {
      throw new Error('Expected response but got null')
    }
    if (typeof response.data === 'object' && 'content' in response.data) {
      if (!response.data.content.includes(expectedContent)) {
        throw new Error(`Expected response to contain '${expectedContent}' but got '${response.data.content}'`)
      }
    } else {
      throw new Error('Response does not have content field to check')
    }
  }

  /**
   * Assert that response has minimum confidence
   */
  static assertMinimumConfidence(response: AgentData | null, minConfidence: number): void {
    if (!response) {
      throw new Error('Expected response but got null')
    }
    if (response.confidence === undefined) {
      throw new Error('Response does not have confidence value')
    }
    if (response.confidence < minConfidence) {
      throw new Error(`Expected confidence >= ${minConfidence} but got ${response.confidence}`)
    }
  }

  /**
   * Assert that response requires approval
   */
  static assertRequiresApproval(response: AgentData | null, shouldRequire: boolean = true): void {
    if (!response) {
      throw new Error('Expected response but got null')
    }
    const requiresApproval = response.requiresApproval ?? false
    if (requiresApproval !== shouldRequire) {
      throw new Error(`Expected requiresApproval to be ${shouldRequire} but got ${requiresApproval}`)
    }
  }

  /**
   * Assert that response has expected metadata
   */
  static assertMetadata(response: AgentData | null, expectedMetadata: Record<string, any>): void {
    if (!response) {
      throw new Error('Expected response but got null')
    }
    if (!response.metadata) {
      throw new Error('Response does not have metadata')
    }
    
    for (const [key, expectedValue] of Object.entries(expectedMetadata)) {
      if (!(key in response.metadata)) {
        throw new Error(`Expected metadata key '${key}' but it was not found`)
      }
      if (response.metadata[key] !== expectedValue) {
        throw new Error(`Expected metadata[${key}] to be '${expectedValue}' but got '${response.metadata[key]}'`)
      }
    }
  }
}

/**
 * Performance Testing
 */
export class PerformanceTester {
  private results: Array<{ operation: string, duration: number, success: boolean }> = []

  /**
   * Measure operation performance
   */
  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now()
    let success = true
    let result: T

    try {
      result = await fn()
    } catch (error) {
      success = false
      throw error
    } finally {
      const duration = Date.now() - startTime
      this.results.push({ operation, duration, success })
    }

    return result!
  }

  /**
   * Get performance results
   */
  getResults() {
    return this.results
  }

  /**
   * Get average response time for successful operations
   */
  getAverageResponseTime(): number {
    const successful = this.results.filter(r => r.success)
    if (successful.length === 0) return 0
    return successful.reduce((sum, r) => sum + r.duration, 0) / successful.length
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.results.length === 0) return 0
    const successful = this.results.filter(r => r.success).length
    return (successful / this.results.length) * 100
  }

  /**
   * Clear results
   */
  clear(): void {
    this.results = []
  }
}

/**
 * Generate a random ID for testing
 */
function generateId(): string {
  return 'test-' + Math.random().toString(36).substr(2, 9)
}