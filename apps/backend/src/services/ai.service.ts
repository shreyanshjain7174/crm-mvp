import { PrismaClient } from '@prisma/client';

export class AIService {
  constructor(private prisma: PrismaClient) {}

  async generateSuggestion(leadId: string, type: string, context?: string) {
    // Get lead with messages for context
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      }
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    let content = '';
    let confidence = 0.8;

    // Simple AI logic based on type
    switch (type) {
      case 'MESSAGE':
        content = await this.generateMessageResponse(lead, context);
        confidence = 0.85;
        break;
      case 'FOLLOW_UP':
        content = await this.generateFollowUpSuggestion(lead);
        confidence = 0.75;
        break;
      case 'STATUS_CHANGE':
        content = await this.generateStatusChangeSuggestion(lead);
        confidence = 0.7;
        break;
      case 'PRIORITY_UPDATE':
        content = await this.generatePriorityUpdateSuggestion(lead);
        confidence = 0.65;
        break;
      default:
        throw new Error('Invalid suggestion type');
    }

    // Create suggestion record
    const suggestion = await this.prisma.aISuggestion.create({
      data: {
        leadId,
        type,
        content,
        context: context || 'Auto-generated based on lead data',
        confidence,
        approved: false,
        executed: false
      },
      include: {
        lead: {
          select: {
            name: true,
            phone: true,
            status: true,
            priority: true
          }
        }
      }
    });

    return suggestion;
  }

  async executeSuggestion(suggestion: any) {
    try {
      switch (suggestion.type) {
        case 'MESSAGE':
          // In a real implementation, this would send the message via WhatsApp
          console.log(`Executing message suggestion: ${suggestion.content}`);
          break;
        case 'FOLLOW_UP':
          // Schedule a follow-up task
          await this.prisma.interaction.create({
            data: {
              leadId: suggestion.leadId,
              type: 'NOTE',
              description: `Follow-up scheduled: ${suggestion.content}`,
              completedAt: new Date()
            }
          });
          break;
        case 'STATUS_CHANGE':
          // Update lead status
          const statusMatch = suggestion.content.match(/to (\w+)/);
          if (statusMatch) {
            const newStatus = statusMatch[1].toUpperCase();
            await this.prisma.lead.update({
              where: { id: suggestion.leadId },
              data: { status: newStatus }
            });
          }
          break;
        case 'PRIORITY_UPDATE':
          // Update lead priority
          const priorityMatch = suggestion.content.match(/to (\w+)/);
          if (priorityMatch) {
            const newPriority = priorityMatch[1].toUpperCase();
            await this.prisma.lead.update({
              where: { id: suggestion.leadId },
              data: { priority: newPriority }
            });
          }
          break;
      }

      // Mark as executed
      await this.prisma.aISuggestion.update({
        where: { id: suggestion.id },
        data: { 
          executed: true,
          executedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error executing suggestion:', error);
      throw error;
    }
  }

  private async generateMessageResponse(lead: any, context?: string): Promise<string> {
    const lastMessage = lead.messages[0];
    const businessProfile = lead.businessProfile || '';
    
    if (!lastMessage) {
      return `Hello ${lead.name}! Thank you for your interest in our CRM solution. How can I help you today?`;
    }

    const messageText = lastMessage.content.toLowerCase();
    
    // Simple keyword-based responses
    if (messageText.includes('price') || messageText.includes('cost') || messageText.includes('pricing')) {
      return `Hi ${lead.name}! Our CRM pricing starts at ₹2999/month. It includes WhatsApp integration, AI automation, and lead management. Would you like a detailed quote for your ${businessProfile}?`;
    }
    
    if (messageText.includes('demo') || messageText.includes('trial')) {
      return `Absolutely! I'd be happy to show you a demo of our CRM system. When would be a good time for a 15-minute call? You can also try our free 14-day trial.`;
    }
    
    if (messageText.includes('feature') || messageText.includes('functionality')) {
      return `Our CRM includes: WhatsApp automation, AI-powered lead scoring, automated follow-ups, analytics dashboard, and integration with your existing tools. What specific features are you most interested in?`;
    }
    
    if (messageText.includes('help') || messageText.includes('support')) {
      return `I'm here to help! Our CRM is designed specifically for Indian SMEs. It automates your sales process and helps you convert more leads. What's your biggest sales challenge right now?`;
    }
    
    // Default response
    return `Thank you for your message, ${lead.name}! I understand you're interested in our CRM solution. Based on your business profile "${businessProfile}", I think our platform could really help streamline your sales process. Would you like to schedule a quick demo?`;
  }

  private async generateFollowUpSuggestion(lead: any): Promise<string> {
    const daysSinceLastContact = lead.messages.length > 0 
      ? Math.floor((Date.now() - new Date(lead.messages[0].timestamp).getTime()) / (1000 * 60 * 60 * 24))
      : Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastContact === 0) {
      return `Follow up with ${lead.name} tomorrow to answer any questions about the CRM demo.`;
    } else if (daysSinceLastContact <= 3) {
      return `Send a helpful resource or case study to ${lead.name} about CRM success stories in their industry.`;
    } else if (daysSinceLastContact <= 7) {
      return `Check in with ${lead.name} - they might need more time to evaluate. Offer additional support.`;
    } else {
      return `Re-engage ${lead.name} with a special offer or updated product features.`;
    }
  }

  private async generateStatusChangeSuggestion(lead: any): Promise<string> {
    const messageCount = lead.messages.length;
    const currentStatus = lead.status;

    if (currentStatus === 'COLD' && messageCount > 0) {
      return `Suggest changing ${lead.name}'s status to WARM - they've initiated contact.`;
    } else if (currentStatus === 'WARM' && messageCount >= 3) {
      return `Suggest changing ${lead.name}'s status to HOT - active engagement detected.`;
    } else if (currentStatus === 'HOT') {
      return `Monitor ${lead.name} for conversion signals - consider moving to CONVERTED if they show buying intent.`;
    }

    return `Keep monitoring ${lead.name}'s engagement to determine appropriate status change.`;
  }

  private async generatePriorityUpdateSuggestion(lead: any): Promise<string> {
    const businessProfile = lead.businessProfile || '';
    const messageCount = lead.messages.length;

    if (businessProfile.includes('startup') || businessProfile.includes('urgent')) {
      return `Suggest increasing ${lead.name}'s priority to HIGH - startup/urgent requirements detected.`;
    } else if (messageCount >= 3) {
      return `Suggest increasing ${lead.name}'s priority to HIGH - high engagement level.`;
    } else if (businessProfile.includes('enterprise') || businessProfile.includes('large')) {
      return `Suggest setting ${lead.name}'s priority to URGENT - enterprise opportunity.`;
    }

    return `Current priority for ${lead.name} seems appropriate based on engagement level.`;
  }
}