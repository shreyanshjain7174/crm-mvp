import { Pool } from 'pg';
import { SuggestionType } from '../types/enums';
import Anthropic from '@anthropic-ai/sdk';

export class AIService {
  private anthropic: Anthropic | null = null;
  
  constructor(private db: Pool) {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    }
  }

  async generateSuggestion(leadId: string, type: SuggestionType, context?: string): Promise<any> {
    // Get lead context
    const leadResult = await this.db.query(`
      SELECT l.*, 
        (SELECT json_agg(m ORDER BY m.timestamp DESC) FROM (SELECT * FROM messages WHERE lead_id = l.id ORDER BY timestamp DESC LIMIT 10) m) as messages,
        (SELECT json_agg(i ORDER BY i.created_at DESC) FROM (SELECT * FROM interactions WHERE lead_id = l.id ORDER BY created_at DESC LIMIT 5) i) as interactions
      FROM leads l 
      WHERE l.id = $1
    `, [leadId]);
    const lead = leadResult.rows[0];

    if (!lead) {
      throw new Error('Lead not found');
    }

    let content = '';
    let confidence = 0.7; // Default confidence

    if (this.anthropic) {
      // Use Claude API for suggestion generation
      content = await this.generateWithClaude(lead, type, context);
      confidence = 0.85; // Higher confidence with Claude
    } else {
      // Fallback to rule-based suggestions
      content = this.generateFallbackSuggestion(lead, type, context);
      confidence = 0.6; // Lower confidence for rule-based
    }

    // Create and save suggestion
    const result = await this.db.query(`
      INSERT INTO ai_suggestions (lead_id, type, content, context, confidence)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [leadId, type, content, context || '', confidence]);
    const suggestion = result.rows[0];

    return suggestion;
  }

  private async generateWithClaude(lead: any, type: SuggestionType, context?: string): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Claude API not configured');
    }

    const systemPrompt = this.buildSystemPrompt(lead, type);
    const userPrompt = this.buildUserPrompt(lead, type, context);

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n${userPrompt}`
          }
        ]
      });

      const content = response.content[0];
      return content.type === 'text' ? content.text : '';
    } catch (error) {
      console.error('Error calling Claude API:', error);
      // Fallback to rule-based if Claude fails
      return this.generateFallbackSuggestion(lead, type, context);
    }
  }

  private buildSystemPrompt(lead: any, type: SuggestionType): string {
    return `You are an AI CRM assistant for Indian SMEs. Your task is to help sales teams manage WhatsApp leads effectively.

Lead Context:
- Name: ${lead.name}
- Phone: ${lead.phone}
- Status: ${lead.status}
- Priority: ${lead.priority}
- Source: ${lead.source || 'Unknown'}

Recent Messages:
${lead.messages.map((m: any) => 
  `${m.direction === 'INBOUND' ? 'Customer' : 'Agent'}: ${m.content}`
).join('\n')}

Rules:
- Keep messages professional but friendly
- Use simple, clear language suitable for WhatsApp
- Consider Indian business culture and communication style
- Messages should be actionable and drive conversation forward
- Avoid overly sales-y language`;
  }

  private buildUserPrompt(lead: any, type: SuggestionType, context?: string): string {
    switch (type) {
      case 'MESSAGE':
        return `Generate a WhatsApp message response for this lead. The message should be relevant to their recent conversation and help move the lead forward in the sales process. Keep it under 160 characters if possible.`;
      
      case 'FOLLOW_UP':
        return `Suggest a follow-up action and timing for this lead. Consider their interaction history and current status. Provide a specific action and recommended timing.`;
      
      case 'STATUS_CHANGE':
        return `Analyze this lead's recent activity and suggest if their status should be updated. Current status: ${lead.status}. Provide reasoning for any recommended change.`;
      
      case 'PRIORITY_UPDATE':
        return `Evaluate this lead's priority level based on their engagement and behavior. Current priority: ${lead.priority}. Suggest if priority should be adjusted and why.`;
      
      default:
        return `Provide a suggestion for this lead based on their context and recent activity. Type: ${type}`;
    }
  }

  private generateFallbackSuggestion(lead: any, type: SuggestionType, context?: string): string {
    switch (type) {
      case 'MESSAGE':
        const lastMessage = lead.messages[0];
        if (!lastMessage || lastMessage.direction === 'OUTBOUND') {
          return `Hi ${lead.name}! Hope you're doing well. Do you have any questions about our products/services?`;
        }
        return `Thank you for your message, ${lead.name}! Let me help you with that. Could you share more details about your requirements?`;
      
      case 'FOLLOW_UP':
        const daysSinceLastContact = lead.messages.length > 0 
          ? Math.floor((Date.now() - new Date(lead.messages[0].timestamp).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        if (daysSinceLastContact > 7) {
          return 'Follow up with a check-in message - it\'s been over a week since last contact';
        } else if (daysSinceLastContact > 3) {
          return 'Send a helpful resource or case study to maintain engagement';
        }
        return 'Wait 2-3 days before next follow-up to avoid being pushy';
      
      case 'STATUS_CHANGE':
        const messageCount = lead.messages.length;
        const hasRecentActivity = messageCount > 0 && 
          (Date.now() - new Date(lead.messages[0].timestamp).getTime()) < (1000 * 60 * 60 * 24 * 3);
        
        if (hasRecentActivity && lead.status === 'COLD') {
          return 'Consider updating to WARM - lead has shown recent engagement';
        } else if (!hasRecentActivity && lead.status === 'HOT') {
          return 'Consider updating to WARM - no recent activity from hot lead';
        }
        return 'Current status seems appropriate based on recent activity';
      
      case 'PRIORITY_UPDATE':
        const recentMessages = lead.messages.filter((m: any) => 
          (Date.now() - new Date(m.timestamp).getTime()) < (1000 * 60 * 60 * 24 * 7)
        );
        
        if (recentMessages.length > 3 && lead.priority !== 'HIGH') {
          return 'Consider increasing priority - lead is highly engaged';
        } else if (recentMessages.length === 0 && lead.priority === 'HIGH') {
          return 'Consider reducing priority - no recent engagement';
        }
        return 'Current priority level seems appropriate';
      
      default:
        return 'Review this lead\'s activity and consider appropriate next steps';
    }
  }

  async executeSuggestion(suggestion: any): Promise<void> {
    try {
      switch (suggestion.type) {
        case 'MESSAGE':
          // This would integrate with WhatsApp API to send the message
          // For now, just mark as executed
          break;
        
        case 'STATUS_CHANGE':
          // Parse the suggestion to extract new status and update lead
          // This is a simplified implementation
          break;
        
        case 'PRIORITY_UPDATE':
          // Parse the suggestion to extract new priority and update lead
          break;
        
        case 'FOLLOW_UP':
          // Create a scheduled follow-up interaction
          await this.db.query(`
            INSERT INTO interactions (lead_id, type, description, scheduled_at)
            VALUES ($1, $2, $3, $4)
          `, [suggestion.lead_id, 'NOTE', `AI Suggested Follow-up: ${suggestion.content}`, new Date(Date.now() + 24 * 60 * 60 * 1000)]);
          break;
      }

      // Mark suggestion as executed
      await this.db.query(`
        UPDATE ai_suggestions SET executed = true, executed_at = NOW()
        WHERE id = $1
      `, [suggestion.id]);
    } catch (error) {
      console.error('Error executing suggestion:', error);
      throw error;
    }
  }
}