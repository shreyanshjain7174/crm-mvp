import { Pool } from 'pg';
import { AgentType, AgentConfig, AgentResult } from './types';

export class AIAgentFactory {
  private db: Pool;
  
  constructor(db: Pool) {
    this.db = db;
  }

  async createAgent(type: AgentType, config?: Partial<AgentConfig>): Promise<BaseAgent> {
    const defaultConfig: AgentConfig = {
      name: type,
      description: `AI Agent for ${type}`,
      capabilities: {
        canProcessText: true,
        canGenerateContent: true,
        canAnalyze: true,
        canDecide: true
      },
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000
    };

    const finalConfig = { ...defaultConfig, ...config };

    switch (type) {
      case AgentType.INTENT_RECOGNITION:
        return new IntentRecognitionAgent(this.db, finalConfig);
      case AgentType.LEAD_QUALIFICATION:
        return new LeadQualificationAgent(this.db, finalConfig);
      case AgentType.RESPONSE_GENERATION:
        return new ResponseGenerationAgent(this.db, finalConfig);
      case AgentType.FOLLOW_UP_SCHEDULER:
        return new FollowUpSchedulerAgent(this.db, finalConfig);
      case AgentType.CONTEXT_MEMORY:
        return new ContextMemoryAgent(this.db, finalConfig);
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
}

export abstract class BaseAgent {
  protected db: Pool;
  protected config: AgentConfig;

  constructor(db: Pool, config: AgentConfig) {
    this.db = db;
    this.config = config;
  }

  abstract execute(input: any): Promise<AgentResult>;
  
  protected async logExecution(input: any, output: any, success: boolean, error?: string) {
    try {
      await this.db.query(
        `INSERT INTO agent_executions (agent_type, input, output, success, error, executed_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [this.config.name, JSON.stringify(input), JSON.stringify(output), success, error]
      );
    } catch (logError) {
      console.error('Failed to log agent execution:', logError);
    }
  }
}

class IntentRecognitionAgent extends BaseAgent {
  async execute(input: any): Promise<AgentResult> {
    try {
      const { message } = input;
      
      // Simple intent recognition logic
      const intent = this.recognizeIntent(message);
      
      const result = {
        success: true,
        data: { intent, confidence: 0.8 },
        reasoning: `Recognized intent based on message patterns`
      };
      
      await this.logExecution(input, result, true);
      return result;
    } catch (error) {
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      await this.logExecution(input, result, false, result.error);
      return result;
    }
  }

  private recognizeIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return 'pricing_inquiry';
    } else if (lowerMessage.includes('demo') || lowerMessage.includes('trial')) {
      return 'demo_request';
    } else if (lowerMessage.includes('support') || lowerMessage.includes('help')) {
      return 'support_request';
    } else if (lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
      return 'purchase_intent';
    } else {
      return 'general_inquiry';
    }
  }
}

class LeadQualificationAgent extends BaseAgent {
  async execute(input: any): Promise<AgentResult> {
    try {
      const { lead } = input;
      
      // Simple lead qualification logic
      const score = this.calculateLeadScore(lead);
      const qualification = this.getQualificationLevel(score);
      
      const result = {
        success: true,
        data: { score, qualification, recommendations: [] },
        reasoning: `Lead scored ${score}/100 based on engagement and profile`
      };
      
      await this.logExecution(input, result, true);
      return result;
    } catch (error) {
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      await this.logExecution(input, result, false, result.error);
      return result;
    }
  }

  private calculateLeadScore(lead: any): number {
    let score = 0;
    
    // Score based on engagement
    if (lead.messages && lead.messages.length > 0) {
      score += Math.min(lead.messages.length * 10, 40);
    }
    
    // Score based on profile completeness
    if (lead.email) score += 20;
    if (lead.company) score += 15;
    if (lead.source === 'referral') score += 25;
    
    return Math.min(score, 100);
  }

  private getQualificationLevel(score: number): string {
    if (score >= 80) return 'hot';
    if (score >= 60) return 'warm';
    if (score >= 40) return 'cold';
    return 'unqualified';
  }
}

class ResponseGenerationAgent extends BaseAgent {
  async execute(input: any): Promise<AgentResult> {
    try {
      const { message, lead, context } = input;
      
      // Simple response generation logic
      const response = this.generateResponse(message, lead, context);
      
      const result = {
        success: true,
        data: { response, requiresApproval: true },
        reasoning: `Generated contextual response based on lead profile and message`
      };
      
      await this.logExecution(input, result, true);
      return result;
    } catch (error) {
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      await this.logExecution(input, result, false, result.error);
      return result;
    }
  }

  private generateResponse(message: string, lead: any, _context: any): string {
    const name = lead.name || 'there';
    
    if (message.toLowerCase().includes('price')) {
      return `Hi ${name}! I'd be happy to discuss pricing with you. Could you tell me more about your specific requirements so I can provide the most accurate quote?`;
    } else if (message.toLowerCase().includes('demo')) {
      return `Hi ${name}! I'd love to show you a demo of our product. When would be a good time for a quick 15-minute call?`;
    } else {
      return `Hi ${name}! Thank you for your message. I'd be happy to help you with that. Could you provide a bit more detail about what you're looking for?`;
    }
  }
}

class FollowUpSchedulerAgent extends BaseAgent {
  async execute(input: any): Promise<AgentResult> {
    try {
      const { lead } = input;
      
      // Simple follow-up scheduling logic
      const schedule = this.calculateFollowUpSchedule(lead);
      
      const result = {
        success: true,
        data: schedule,
        reasoning: `Calculated optimal follow-up timing based on lead behavior`
      };
      
      await this.logExecution(input, result, true);
      return result;
    } catch (error) {
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      await this.logExecution(input, result, false, result.error);
      return result;
    }
  }

  private calculateFollowUpSchedule(lead: any): any {
    const now = new Date();
    const followUpTimes = [];
    
    // Schedule based on lead warmth
    if (lead.status === 'hot') {
      followUpTimes.push(new Date(now.getTime() + 2 * 60 * 60 * 1000)); // 2 hours
      followUpTimes.push(new Date(now.getTime() + 24 * 60 * 60 * 1000)); // 1 day
    } else if (lead.status === 'warm') {
      followUpTimes.push(new Date(now.getTime() + 24 * 60 * 60 * 1000)); // 1 day
      followUpTimes.push(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)); // 3 days
    } else {
      followUpTimes.push(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)); // 1 week
    }
    
    return {
      nextFollowUp: followUpTimes[0],
      schedule: followUpTimes,
      method: 'whatsapp'
    };
  }
}

class ContextMemoryAgent extends BaseAgent {
  async execute(input: any): Promise<AgentResult> {
    try {
      const { leadId, action, data } = input;
      
      if (action === 'store') {
        await this.storeContext(leadId, data);
      } else if (action === 'retrieve') {
        const context = await this.retrieveContext(leadId);
        return {
          success: true,
          data: context,
          reasoning: `Retrieved conversation context for lead ${leadId}`
        };
      }
      
      const result = {
        success: true,
        data: {},
        reasoning: `Context ${action} operation completed`
      };
      
      await this.logExecution(input, result, true);
      return result;
    } catch (error) {
      const result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      await this.logExecution(input, result, false, result.error);
      return result;
    }
  }

  private async storeContext(leadId: string, data: any): Promise<void> {
    await this.db.query(
      `INSERT INTO context_memory (lead_id, context_data, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (lead_id) DO UPDATE SET context_data = $2, updated_at = NOW()`,
      [leadId, JSON.stringify(data)]
    );
  }

  private async retrieveContext(leadId: string): Promise<any> {
    const result = await this.db.query(
      'SELECT context_data FROM context_memory WHERE lead_id = $1',
      [leadId]
    );
    
    return result.rows[0]?.context_data || {};
  }
}