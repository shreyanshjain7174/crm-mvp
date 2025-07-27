# Cozmox Voice Agent Integration

A complete AI-powered voice assistant that seamlessly integrates with your CRM to handle incoming calls, schedule appointments, qualify leads, and provide customer support through natural voice conversations.

## Features

🎯 **Smart Call Handling**
- Automatic call answering with personalized greetings
- Natural conversation flow with AI-powered responses
- Business hours awareness and after-hours handling
- Multi-language support (English, Hindi, and more)

📅 **Intelligent Appointment Booking**
- Real-time availability checking
- Automatic scheduling with calendar integration
- Buffer time management between appointments
- Appointment confirmation and reminder system
- Approval workflow for business owners

🎪 **Advanced Lead Qualification**
- AI-powered conversation analysis
- Configurable scoring criteria (budget, timeline, intent)
- Automatic lead categorization (cold, warm, hot, qualified)
- Smart follow-up recommendations
- Detailed qualification reports

🎧 **Customer Support Automation**
- Intent recognition for support requests
- Automatic ticket creation and categorization
- Priority assignment based on conversation sentiment
- Escalation rules for complex issues

📊 **Comprehensive Analytics**
- Call duration and outcome tracking
- Lead conversion metrics
- Appointment booking rates
- Customer satisfaction insights
- Usage and billing analytics

## Quick Start

### 1. Installation

Install the Cozmox Voice Agent in your CRM:

```bash
# Install dependencies
npm install

# Build the agent
npm run build

# Install in CRM (from CRM dashboard)
POST /api/agents/install
{
  "agentId": "cozmox-voice-agent",
  "config": {
    "apiKey": "your_cozmox_api_key",
    "businessInfo": {
      "name": "Your Business Name",
      "phone": "+1234567890",
      "industry": "Your Industry"
    }
  }
}
```

### 2. Configuration

Configure your voice assistant through the CRM dashboard or via API:

```typescript
const config = {
  apiKey: "your_cozmox_api_key",
  businessInfo: {
    name: "Acme Corp",
    industry: "Software Development",
    phone: "+1234567890"
  },
  greetingMessage: "Hello! Thank you for calling Acme Corp. How can I help you today?",
  businessHours: {
    enabled: true,
    timezone: "Asia/Kolkata",
    schedule: {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      // ... other days
    }
  },
  appointmentSettings: {
    enabled: true,
    duration: 30,
    bufferTime: 15,
    requiresApproval: true
  },
  leadQualification: {
    enabled: true,
    scoringCriteria: {
      budgetWeight: 30,
      timelineWeight: 25,
      intentWeight: 45
    }
  }
}
```

### 3. Start Handling Calls

Once configured, your voice assistant will automatically:

1. **Answer incoming calls** with personalized greeting
2. **Understand customer intent** through natural conversation
3. **Book appointments** when customers request scheduling
4. **Qualify leads** by asking intelligent follow-up questions
5. **Create support tickets** for customer issues
6. **Log all interactions** with detailed analytics

## Use Cases

### Real Estate Agency
```typescript
{
  businessInfo: {
    name: "Prime Properties",
    industry: "Real Estate"
  },
  greetingMessage: "Hello! Thank you for calling Prime Properties. Are you looking to buy, sell, or rent a property?",
  leadQualification: {
    qualifyingQuestions: [
      "What type of property are you looking for?",
      "What's your budget range?",
      "When are you planning to move?",
      "Have you been pre-approved for financing?"
    ]
  }
}
```

### Healthcare Clinic
```typescript
{
  businessInfo: {
    name: "City Health Clinic",
    industry: "Healthcare"
  },
  appointmentSettings: {
    duration: 15, // Shorter slots for consultations
    bufferTime: 10,
    requiresApproval: false // Auto-book routine appointments
  },
  businessHours: {
    schedule: {
      monday: { open: "08:00", close: "17:00" },
      saturday: { open: "09:00", close: "13:00" }
    }
  }
}
```

### Legal Services
```typescript
{
  businessInfo: {
    name: "Johnson & Associates Law",
    industry: "Legal Services"
  },
  appointmentSettings: {
    duration: 60, // Longer consultation slots
    requiresApproval: true, // All appointments need approval
  },
  advancedSettings: {
    voiceModel: "professional-male",
    sentimentAnalysis: true // Important for sensitive calls
  }
}
```

## API Reference

### Call Events

The agent automatically handles these call events:

```typescript
// Incoming call received
onCall(async (callData, context) => {
  // Process call, analyze intent, take action
  return {
    type: 'call-log' | 'appointment' | 'lead-update' | 'support-ticket',
    data: { ... }
  }
})

// Contact information updated
onContact(async (contactData, context) => {
  // Analyze contact for lead qualification
  return {
    type: 'lead-update',
    data: { score, stage, notes }
  }
})
```

### Manual Actions

Trigger agent actions from CRM interface:

```typescript
// Make outbound call
POST /api/agents/cozmox-voice-agent/execute
{
  "action": "make-call",
  "data": {
    "contactId": "contact_123",
    "phone": "+1234567890",
    "message": "Following up on your inquiry..."
  }
}

// Schedule callback
POST /api/agents/cozmox-voice-agent/execute
{
  "action": "schedule-callback",
  "data": {
    "contactId": "contact_123",
    "preferredTime": "2024-07-25T14:00:00Z"
  }
}
```

### Configuration Management

```typescript
// Update agent configuration
PUT /api/agents/cozmox-voice-agent/config
{
  "config": {
    "greetingMessage": "Updated greeting message",
    "appointmentSettings": {
      "duration": 45
    }
  }
}

// Get agent metrics
GET /api/agents/cozmox-voice-agent/metrics?period=week

// Get call logs
GET /api/agents/cozmox-voice-agent/logs?level=info&limit=100
```

## Development

### Local Development

```bash
# Clone the repository
git clone <repository-url>
cd integrations/cozmox-voice-agent

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your settings
nano .env

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm test -- call-processor.test.ts

# Run in watch mode during development
npm run test -- --watch
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
COZMOX_API_KEY=your_api_key_here
BUSINESS_NAME="Your Business"
BUSINESS_PHONE=+1234567890

# Optional
VOICE_MODEL=professional-female
LANGUAGE=en-IN
LOG_LEVEL=info
```

## Pricing

The Cozmox Voice Agent uses a usage-based pricing model:

- **₹1.50 per minute** of call time
- **60 minutes free** per month
- **No setup fees** or monthly minimums
- **Real-time usage tracking** and billing

### Cost Examples

| Usage | Monthly Cost |
|-------|--------------|
| 50 calls, 5 min avg | Free (within 60 min limit) |
| 100 calls, 5 min avg | ₹600 (100 min over limit) |
| 200 calls, 3 min avg | ₹750 (150 min over limit) |

## Support

### Documentation
- [Integration Guide](docs/integration.md)
- [Configuration Reference](docs/configuration.md)
- [API Documentation](docs/api.md)
- [Troubleshooting](docs/troubleshooting.md)

### Getting Help
- 📧 Email: support@cozmox.ai
- 💬 Chat: Available in CRM dashboard
- 📱 WhatsApp: +91-9876543210
- 🌐 Website: [cozmox.ai](https://cozmox.ai)

### Issues and Feature Requests
- [GitHub Issues](https://github.com/cozmox-ai/voice-agent-crm/issues)
- [Feature Requests](https://github.com/cozmox-ai/voice-agent-crm/discussions)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v1.5.2 (Latest)
- ✅ Enhanced lead qualification with configurable scoring
- ✅ Improved appointment scheduling with conflict resolution
- ✅ Added sentiment analysis for better customer insights
- ✅ Multi-language support (English, Hindi)
- ✅ Business hours awareness and after-hours handling

### v1.5.1
- ✅ Added support for custom greeting messages
- ✅ Improved call outcome classification
- ✅ Enhanced error handling and logging
- ✅ Added webhook support for real-time updates

### v1.5.0
- ✅ Initial release with core voice handling
- ✅ Basic appointment booking functionality
- ✅ Lead qualification framework
- ✅ Customer support automation