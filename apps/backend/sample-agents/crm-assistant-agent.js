/**
 * Sample CRM Assistant Agent
 * 
 * This agent demonstrates the capabilities of the agent runtime system.
 * It can analyze leads, send follow-up messages, and provide insights.
 */

// Sample Agent Manifest (would be provided during installation)
const AGENT_MANIFEST = {
  id: "crm_assistant_v1",
  name: "CRM Assistant",
  version: "1.0.0",
  description: "Intelligent CRM assistant that analyzes leads and automates follow-ups",
  author: "CRM Platform Team",
  permissions: [
    { resource: "leads:read", scope: "user" },
    { resource: "leads:write", scope: "user" },
    { resource: "messages:read", scope: "user" },
    { resource: "messages:write", scope: "user" }
  ],
  resourceLimits: {
    timeout: 60000, // 1 minute
    memory: 128, // 128MB
    maxAPICalls: 50 // 50 API calls per execution
  },
  triggers: [
    {
      type: "manual",
      condition: "user_request",
      description: "Run on user request"
    },
    {
      type: "schedule",
      condition: "0 9 * * *", // Every day at 9 AM
      description: "Daily lead analysis"
    }
  ]
};

// Agent Code (this would be the actual agent logic)
const AGENT_CODE = `
  // Agent execution starts here
  api.utils.log("🤖 CRM Assistant Agent starting execution", { input });
  
  try {
    const results = {
      analysis: null,
      actions: [],
      recommendations: []
    };
    
    // Analyze input and determine action
    const action = input.action || 'analyze_leads';
    
    switch (action) {
      case 'analyze_leads':
        results.analysis = await analyzeLeads();
        break;
        
      case 'send_follow_ups':
        results.actions = await sendFollowUps(input.leadIds || []);
        break;
        
      case 'generate_insights':
        results.analysis = await generateInsights(input.timeframe || '7d');
        break;
        
      default:
        throw new Error(\`Unknown action: \${action}\`);
    }
    
    api.utils.log("✅ Agent execution completed successfully", results);
    return results;
    
  } catch (error) {
    api.utils.log("❌ Agent execution failed", { error: error.message });
    throw error;
  }
  
  // Helper functions
  async function analyzeLeads() {
    api.utils.log("🔍 Analyzing leads...");
    
    // Get recent leads
    const leads = await api.crm.getLeads({ 
      limit: 20, 
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    
    const analysis = {
      totalLeads: leads.length,
      hotLeads: 0,
      coldLeads: 0,
      needsAttention: [],
      recommendations: []
    };
    
    // Analyze each lead
    for (const lead of leads) {
      if (lead.status === 'HOT') {
        analysis.hotLeads++;
        
        // Check if hot lead needs immediate attention
        const lastMessage = await getLastMessage(lead.id);
        if (!lastMessage || isOlderThan(lastMessage.timestamp, 24 * 60 * 60 * 1000)) {
          analysis.needsAttention.push({
            leadId: lead.id,
            name: lead.name,
            reason: 'Hot lead without recent contact',
            urgency: 'high'
          });
        }
      } else if (lead.status === 'COLD') {
        analysis.coldLeads++;
      }
    }
    
    // Generate recommendations
    if (analysis.hotLeads > 0) {
      analysis.recommendations.push({
        type: 'priority',
        message: \`Focus on \${analysis.hotLeads} hot leads for immediate conversion\`,
        action: 'send_follow_ups'
      });
    }
    
    if (analysis.needsAttention.length > 0) {
      analysis.recommendations.push({
        type: 'urgent',
        message: \`\${analysis.needsAttention.length} leads need immediate attention\`,
        action: 'contact_urgently'
      });
    }
    
    return analysis;
  }
  
  async function sendFollowUps(leadIds) {
    api.utils.log("📧 Sending follow-up messages...", { leadIds });
    
    const actions = [];
    
    for (const leadId of leadIds) {
      try {
        // Get lead details
        const messages = await api.crm.getMessages(leadId);
        const lastMessage = messages[messages.length - 1];
        
        // Generate contextual follow-up message
        let followUpMessage;
        if (!lastMessage) {
          followUpMessage = "Hi! I wanted to follow up on your inquiry. How can we help you today?";
        } else {
          followUpMessage = generateContextualFollowUp(lastMessage.content);
        }
        
        // Send the message
        const result = await api.crm.sendMessage(leadId, followUpMessage);
        
        actions.push({
          leadId,
          action: 'follow_up_sent',
          messageId: result.id,
          status: 'success'
        });
        
        api.utils.log(\`📤 Follow-up sent to lead \${leadId}\`);
        
        // Small delay to avoid overwhelming the system
        await api.utils.wait(1000);
        
      } catch (error) {
        actions.push({
          leadId,
          action: 'follow_up_failed',
          error: error.message,
          status: 'failed'
        });
        
        api.utils.log(\`❌ Failed to send follow-up to lead \${leadId}: \${error.message}\`);
      }
    }
    
    return actions;
  }
  
  async function generateInsights(timeframe) {
    api.utils.log("📊 Generating insights...", { timeframe });
    
    // This would typically fetch data and perform analysis
    // For demo purposes, we'll create mock insights
    
    return {
      timeframe,
      insights: [
        {
          type: 'conversion_rate',
          value: '15.3%',
          trend: 'up',
          change: '+2.1%',
          description: 'Conversion rate improved compared to last period'
        },
        {
          type: 'response_time',
          value: '2.4 hours',
          trend: 'down',
          change: '-0.6 hours',
          description: 'Average response time to leads decreased'
        },
        {
          type: 'lead_quality',
          value: '7.8/10',
          trend: 'stable',
          change: '+0.2',
          description: 'Lead quality score remains high'
        }
      ],
      recommendations: [
        'Continue current lead nurturing strategy',
        'Focus on hot leads identified in morning hours',
        'Consider automated responses for common questions'
      ]
    };
  }
  
  // Utility functions
  function getLastMessage(leadId) {
    return api.crm.getMessages(leadId).then(messages => 
      messages.length > 0 ? messages[messages.length - 1] : null
    );
  }
  
  function isOlderThan(timestamp, milliseconds) {
    return Date.now() - new Date(timestamp).getTime() > milliseconds;
  }
  
  function generateContextualFollowUp(lastMessageContent) {
    // Simple contextual response generation
    if (lastMessageContent.toLowerCase().includes('price') || lastMessageContent.toLowerCase().includes('cost')) {
      return "I understand you're interested in pricing. Let me provide you with a detailed quote that fits your needs.";
    } else if (lastMessageContent.toLowerCase().includes('demo') || lastMessageContent.toLowerCase().includes('trial')) {
      return "I'd be happy to schedule a demo for you. When would be a good time to show you our solution?";
    } else {
      return "Thanks for your message! I wanted to follow up and see if you have any additional questions I can help with.";
    }
  }
`;

// Example usage and testing functions
function createSampleAgent() {
  return {
    manifest: AGENT_MANIFEST,
    code: AGENT_CODE
  };
}

// Test inputs for different scenarios
const TEST_SCENARIOS = {
  analyzeLeads: {
    action: "analyze_leads"
  },
  
  sendFollowUps: {
    action: "send_follow_ups",
    leadIds: ["lead_1", "lead_2", "lead_3"]
  },
  
  generateInsights: {
    action: "generate_insights",
    timeframe: "30d"
  }
};

module.exports = {
  AGENT_MANIFEST,
  AGENT_CODE,
  TEST_SCENARIOS,
  createSampleAgent
};