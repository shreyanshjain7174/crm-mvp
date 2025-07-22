/**
 * Example Implementation: WhatsApp Auto-Responder Agent
 * 
 * A simple agent that automatically responds to WhatsApp messages
 * based on configurable rules and templates.
 */

import { Observable, Subject } from 'rxjs';
import {
  UniversalAgentAdapter,
  AgentManifest,
  ConfigSchema,
  CRMData,
  AgentData,
  ActionButton,
  DataRenderer,
  ResourceUsage,
  ResourceLimits,
  AgentError
} from '../src/index';

export class WhatsAppResponderAgent implements UniversalAgentAdapter {
  private dataSubject = new Subject<AgentData>();
  private connected = false;
  private config: any = {};
  
  getManifest(): AgentManifest {
    return {
      id: 'whatsapp-auto-responder',
      name: 'WhatsApp Auto-Responder',
      version: '1.2.0',
      provider: {
        name: 'CRM Platform',
        website: 'https://crm-platform.com',
        support: 'support@crm-platform.com'
      },
      description: 'Automatically responds to WhatsApp messages with smart templates',
      longDescription: `
        The WhatsApp Auto-Responder intelligently handles incoming messages when you're unavailable.
        It can detect customer intent, use appropriate templates, and escalate complex queries to human agents.
        
        Features:
        • Smart template matching based on keywords
        • Business hours detection
        • Automatic escalation for complex queries
        • Multi-language support
        • Analytics and insights
      `,
      icon: 'https://cdn.example.com/agents/whatsapp-responder/icon.png',
      screenshots: [
        'https://cdn.example.com/agents/whatsapp-responder/screen1.png',
        'https://cdn.example.com/agents/whatsapp-responder/screen2.png'
      ],
      capabilities: ['whatsapp', 'auto-reply', 'templates', 'analytics'],
      category: 'communication',
      tags: ['whatsapp', 'automation', 'customer-service'],
      permissions: [
        'messages:read',
        'messages:write',
        'contacts:read',
        'analytics:read'
      ],
      pricing: {
        model: 'freemium',
        freeLimit: 100,
        paidRate: 0.05
      },
      runtime: 'nodejs',
      endpoints: {
        webhook: '/agents/whatsapp-responder/webhook'
      }
    };
  }

  getConfigSchema(): ConfigSchema {
    return {
      fields: [
        {
          key: 'enabled',
          type: 'boolean',
          label: 'Enable Auto-Responder',
          description: 'Turn on/off automatic responses',
          required: true,
          default: true
        },
        {
          key: 'businessHours',
          type: 'json',
          label: 'Business Hours',
          description: 'Define when auto-responder should be active',
          required: true,
          default: {
            monday: { start: '09:00', end: '18:00' },
            tuesday: { start: '09:00', end: '18:00' },
            wednesday: { start: '09:00', end: '18:00' },
            thursday: { start: '09:00', end: '18:00' },
            friday: { start: '09:00', end: '18:00' },
            saturday: { start: '10:00', end: '16:00' },
            sunday: { start: null, end: null }
          }
        },
        {
          key: 'defaultTemplate',
          type: 'string',
          label: 'Default Response Template',
          description: 'Default message when no specific template matches',
          required: true,
          default: 'Hi! Thanks for your message. We\'ll get back to you within 2 hours.'
        },
        {
          key: 'escalationKeywords',
          type: 'multiselect',
          label: 'Escalation Keywords',
          description: 'Keywords that trigger human agent escalation',
          options: [
            { value: 'urgent', label: 'Urgent' },
            { value: 'complaint', label: 'Complaint' },
            { value: 'refund', label: 'Refund' },
            { value: 'cancel', label: 'Cancel' },
            { value: 'support', label: 'Support' }
          ],
          default: ['urgent', 'complaint']
        },
        {
          key: 'responseDelay',
          type: 'number',
          label: 'Response Delay (seconds)',
          description: 'Delay before sending auto-response to appear more human',
          default: 3,
          validation: { min: 0, max: 300 }
        }
      ],
      layout: 'grouped',
      groups: [
        {
          id: 'general',
          label: 'General Settings',
          fields: ['enabled', 'businessHours']
        },
        {
          id: 'templates',
          label: 'Response Templates',
          fields: ['defaultTemplate']
        },
        {
          id: 'advanced',
          label: 'Advanced Settings',
          fields: ['escalationKeywords', 'responseDelay']
        }
      ]
    };
  }

  async install(businessId: string, config?: Record<string, any>): Promise<void> {
    console.log(`Installing WhatsApp Responder for business ${businessId}`);
    
    if (config) {
      const validation = await this.validateConfig(config);
      if (!validation.valid) {
        throw new AgentError('Invalid configuration', 'INVALID_CONFIG', validation.errors);
      }
    }
    
    // Simulate installation process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('WhatsApp Responder installed successfully');
  }

  async connect(instanceId: string): Promise<void> {
    console.log(`Connecting WhatsApp Responder instance ${instanceId}`);
    
    // Load instance configuration
    this.config = await this.loadConfig(instanceId);
    
    // Initialize connections
    this.connected = true;
    
    console.log('WhatsApp Responder connected');
  }

  async disconnect(instanceId: string): Promise<void> {
    console.log(`Disconnecting WhatsApp Responder instance ${instanceId}`);
    
    this.connected = false;
    this.dataSubject.complete();
    
    console.log('WhatsApp Responder disconnected');
  }

  async uninstall(instanceId: string): Promise<void> {
    console.log(`Uninstalling WhatsApp Responder instance ${instanceId}`);
    
    await this.disconnect(instanceId);
    
    // Clean up any stored data
    // Remove webhooks
    // Cancel subscriptions
    
    console.log('WhatsApp Responder uninstalled');
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details?: any }> {
    try {
      // Check various health indicators
      const checks = {
        connection: this.connected,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 < 100, // < 100MB
        responseTime: await this.checkResponseTime() < 1000, // < 1s
      };
      
      const healthyChecks = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.keys(checks).length;
      
      if (healthyChecks === totalChecks) {
        return { status: 'healthy', details: checks };
      } else if (healthyChecks >= totalChecks * 0.7) {
        return { status: 'degraded', details: checks };
      } else {
        return { status: 'unhealthy', details: checks };
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  async getStatus(): Promise<{ connected: boolean; activeConnections: number; uptime: number }> {
    return {
      connected: this.connected,
      activeConnections: this.connected ? 1 : 0,
      uptime: process.uptime()
    };
  }

  async validateConfig(config: Record<string, any>): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];
    
    // Validate required fields
    if (typeof config.enabled !== 'boolean') {
      errors.push('enabled must be a boolean');
    }
    
    if (!config.defaultTemplate || typeof config.defaultTemplate !== 'string') {
      errors.push('defaultTemplate is required and must be a string');
    }
    
    if (config.responseDelay && (typeof config.responseDelay !== 'number' || config.responseDelay < 0)) {
      errors.push('responseDelay must be a positive number');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  async updateConfig(instanceId: string, config: Record<string, any>): Promise<void> {
    const validation = await this.validateConfig(config);
    if (!validation.valid) {
      throw new AgentError('Invalid configuration', 'INVALID_CONFIG', validation.errors);
    }
    
    this.config = { ...this.config, ...config };
    
    console.log(`Configuration updated for instance ${instanceId}`);
  }

  async sendToAgent(instanceId: string, data: CRMData): Promise<void> {
    if (!this.connected) {
      throw new AgentError('Agent not connected', 'NOT_CONNECTED');
    }
    
    // Handle incoming CRM data
    if (data.type === 'message' && data.action === 'create') {
      await this.handleIncomingMessage(data);
    }
  }

  receiveFromAgent(instanceId: string): Observable<AgentData> {
    return this.dataSubject.asObservable();
  }

  async handleWebhook(payload: any, headers: Record<string, string>): Promise<void> {
    // Handle webhooks from external services
    console.log('Received webhook:', payload);
  }

  getActionButtons(context: any): ActionButton[] {
    return [
      {
        id: 'create-template',
        label: 'Create Template',
        icon: 'plus',
        action: async () => {
          // Open template creation modal
          console.log('Creating new template...');
        }
      },
      {
        id: 'view-analytics',
        label: 'View Analytics',
        icon: 'chart',
        action: async () => {
          // Open analytics dashboard
          console.log('Opening analytics...');
        }
      }
    ];
  }

  getDashboardWidget(): React.ComponentType<any> {
    // Return a React component for the dashboard widget
    return ({ data }: any) => {
      return (
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Auto-Responder Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {data?.messagesHandled || 0}
              </div>
              <div className="text-sm text-gray-500">Messages Handled</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {data?.responseRate || '0%'}
              </div>
              <div className="text-sm text-gray-500">Response Rate</div>
            </div>
          </div>
        </div>
      );
    };
  }

  // Private methods
  private async loadConfig(instanceId: string): Promise<any> {
    // Load configuration from database
    return {
      enabled: true,
      defaultTemplate: "Hi! Thanks for your message. We'll get back to you within 2 hours.",
      responseDelay: 3
    };
  }

  private async handleIncomingMessage(data: CRMData): Promise<void> {
    if (!this.config.enabled) {
      return;
    }
    
    const message = data.data;
    const businessId = data.metadata.businessId;
    
    // Check business hours
    if (!this.isWithinBusinessHours()) {
      await this.sendAutoResponse(businessId, message.contactId, this.config.defaultTemplate);
      return;
    }
    
    // Check for escalation keywords
    if (this.shouldEscalate(message.content)) {
      this.dataSubject.next({
        type: 'action',
        data: {
          action: 'escalate',
          contactId: message.contactId,
          reason: 'Escalation keywords detected'
        },
        metadata: {
          agentId: 'whatsapp-auto-responder',
          timestamp: new Date()
        }
      });
      return;
    }
    
    // Send auto-response
    setTimeout(async () => {
      await this.sendAutoResponse(businessId, message.contactId, this.config.defaultTemplate);
    }, this.config.responseDelay * 1000);
  }

  private async sendAutoResponse(businessId: string, contactId: string, template: string): Promise<void> {
    this.dataSubject.next({
      type: 'response',
      data: {
        type: 'message',
        contactId,
        content: template,
        automated: true
      },
      metadata: {
        agentId: 'whatsapp-auto-responder',
        timestamp: new Date()
      }
    });
  }

  private isWithinBusinessHours(): boolean {
    // Implement business hours logic
    return true;
  }

  private shouldEscalate(content: string): boolean {
    const escalationKeywords = this.config.escalationKeywords || [];
    return escalationKeywords.some((keyword: string) => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private async checkResponseTime(): Promise<number> {
    const start = Date.now();
    await new Promise(resolve => setTimeout(resolve, 10));
    return Date.now() - start;
  }
}