# Agent Adapter SDK

The Agent Adapter SDK enables developers to build AI agents that seamlessly integrate with the CRM platform. This SDK provides the tools, interfaces, and runtime support needed to create agents that can interact with CRM data, respond to events, and provide value to SME users.

## Overview

The SDK follows the **Universal Agent Protocol (UAP)** specification, ensuring all agents can communicate with the platform regardless of their underlying implementation (Local AI, OpenAI, Anthropic, etc.).

## Quick Start

### Installation

```bash
npm install @crm-platform/agent-sdk
# or
yarn add @crm-platform/agent-sdk
```

### Basic Agent Creation

```typescript
import { AgentBuilder, CRMData, AgentData } from '@crm-platform/agent-sdk'

const agent = new AgentBuilder()
  .withName('WhatsApp Auto Responder')
  .withVersion('1.0.0')
  .withProvider('Your Company')
  .withDescription('Automatically respond to WhatsApp messages')
  .withCapability({
    id: 'auto-reply',
    name: 'Auto Reply',
    description: 'Respond to messages automatically',
    inputTypes: ['message'],
    outputTypes: ['message'],
    requiresApproval: false
  })
  .withPermission({
    resource: 'message',
    actions: ['read', 'create'],
    constraints: { businessScope: true }
  })
  .onMessage(async (message) => {
    // Your AI logic here
    const response = await generateResponse(message.content)
    return { type: 'message', content: response }
  })
  .build()

export default agent
```

## Core Concepts

### Agent Manifest

Every agent must declare its capabilities, permissions, and metadata:

```typescript
interface AgentManifest {
  id: string
  name: string
  version: string
  provider: string
  description: string
  capabilities: AgentCapability[]
  permissions: Permission[]
  pricing: PricingModel
  ui: UIConfiguration
  supportedDataTypes: string[]
}
```

### Data Flow

Agents receive CRM data and return structured responses:

```typescript
// Input: CRM data flows to your agent
interface CRMData {
  type: 'message' | 'contact' | 'conversation' | 'lead'
  businessId: string
  data: any
  metadata: Record<string, any>
}

// Output: Your agent returns structured data
interface AgentData {
  type: string
  data: any
  confidence?: number
  requiresApproval?: boolean
  metadata?: Record<string, any>
}
```

### Event Handlers

Agents can respond to various CRM events:

```typescript
agent
  .onMessage(async (message) => { /* Handle new messages */ })
  .onContact(async (contact) => { /* Handle contact updates */ })
  .onLead(async (lead) => { /* Handle lead changes */ })
  .onConversation(async (conversation) => { /* Handle conversation events */ })
```

## Advanced Features

### Configuration UI

Define how users configure your agent:

```typescript
agent.withConfigUI({
  fields: [
    {
      name: 'responseTemplate',
      type: 'textarea',
      label: 'Response Template',
      required: true,
      placeholder: 'Hello! Thanks for your message...'
    },
    {
      name: 'aiModel',
      type: 'select',
      label: 'AI Model',
      options: ['gpt-4', 'claude-3', 'local-llama'],
      default: 'local-llama'
    }
  ]
})
```

### Action Buttons

Add custom actions to the CRM interface:

```typescript
agent.withActionButton({
  id: 'send-follow-up',
  label: 'Send Follow-up',
  icon: 'MessageSquare',
  placement: 'contact-detail',
  onClick: async (context) => {
    const followUp = await generateFollowUp(context.contact)
    return { type: 'message', content: followUp }
  }
})
```

### Data Validation

Ensure data integrity with built-in validation:

```typescript
import { validateCRMData, ValidationSchema } from '@crm-platform/agent-sdk'

const messageSchema: ValidationSchema = {
  type: 'object',
  properties: {
    content: { type: 'string', minLength: 1 },
    phone: { type: 'string', pattern: '^\\+[1-9]\\d{1,14}$' }
  },
  required: ['content', 'phone']
}

agent.onMessage(async (message) => {
  const isValid = validateCRMData(message, messageSchema)
  if (!isValid) {
    throw new Error('Invalid message format')
  }
  // Process message...
})
```

## Testing Your Agent

### Local Development

```typescript
import { AgentTester } from '@crm-platform/agent-sdk'

const tester = new AgentTester(agent)

// Test message handling
const result = await tester.sendMessage({
  content: 'Hello, I need help with pricing',
  phone: '+911234567890',
  businessId: 'test-business'
})

console.log('Agent response:', result)
```

### Unit Tests

```typescript
import { describe, test, expect } from '@jest/globals'
import { AgentTester } from '@crm-platform/agent-sdk'

describe('WhatsApp Auto Responder', () => {
  test('should respond to pricing inquiries', async () => {
    const tester = new AgentTester(agent)
    const result = await tester.sendMessage({
      content: 'What are your prices?',
      phone: '+911234567890'
    })
    
    expect(result.type).toBe('message')
    expect(result.content).toContain('pricing')
  })
})
```

## Deployment

### Package Your Agent

```bash
# Build your agent
npm run build

# Package for marketplace
npm run package
```

### Agent Manifest File

Create an `agent.manifest.json`:

```json
{
  "id": "whatsapp-auto-responder",
  "name": "WhatsApp Auto Responder",
  "version": "1.0.0",
  "provider": "Your Company",
  "description": "Automatically respond to WhatsApp messages with intelligent replies",
  "main": "./dist/index.js",
  "pricing": {
    "model": "subscription",
    "subscription": {
      "monthlyPrice": 99900,
      "limits": {
        "messages": 5000,
        "apiCalls": 10000
      }
    }
  },
  "keywords": ["whatsapp", "automation", "customer-service"],
  "category": "whatsapp"
}
```

### Submit to Marketplace

```bash
# Login to CRM Platform
crm-cli login

# Submit your agent
crm-cli publish ./agent.manifest.json
```

## Examples

### WhatsApp Auto Responder

A complete example of an agent that automatically responds to WhatsApp messages:

```typescript
import { AgentBuilder, MessageData } from '@crm-platform/agent-sdk'

export default new AgentBuilder()
  .withName('WhatsApp Auto Responder')
  .withVersion('1.0.0')
  .withProvider('Local AI Co.')
  .withDescription('Automatically respond to WhatsApp messages with intelligent replies')
  .withCapability({
    id: 'auto-reply',
    name: 'Auto Reply',
    description: 'Automatic message responses',
    inputTypes: ['message'],
    outputTypes: ['message'],
    requiresApproval: false
  })
  .withPermission({
    resource: 'message',
    actions: ['read', 'create'],
    constraints: { businessScope: true }
  })
  .withConfigUI({
    fields: [
      {
        name: 'responseTemplate',
        type: 'textarea',
        label: 'Default Response Template',
        required: true,
        default: 'Hello! Thanks for your message. We\\'ll get back to you soon.'
      },
      {
        name: 'businessHours',
        type: 'object',
        label: 'Business Hours',
        properties: {
          start: { type: 'time', default: '09:00' },
          end: { type: 'time', default: '18:00' }
        }
      }
    ]
  })
  .onMessage(async (message: MessageData, config) => {
    const isBusinessHours = checkBusinessHours(config.businessHours)
    
    if (!isBusinessHours) {
      return {
        type: 'message',
        content: 'Thanks for your message! We\\'re currently closed but will respond first thing in the morning.',
        metadata: { scheduled: true }
      }
    }
    
    // Use AI to generate contextual response
    const response = await generateIntelligentResponse(message.content, config.responseTemplate)
    
    return {
      type: 'message',
      content: response,
      confidence: 0.8,
      metadata: { automated: true }
    }
  })
  .build()

function checkBusinessHours(hours: any): boolean {
  const now = new Date()
  const currentHour = now.getHours()
  const startHour = parseInt(hours.start.split(':')[0])
  const endHour = parseInt(hours.end.split(':')[0])
  
  return currentHour >= startHour && currentHour < endHour
}

async function generateIntelligentResponse(message: string, template: string): Promise<string> {
  // Implement your AI logic here
  // This could use local AI, OpenAI, Claude, etc.
  return template
}
```

### Voice Agent Integration

Example of integrating with external voice services:

```typescript
import { AgentBuilder } from '@crm-platform/agent-sdk'
import { CozmoxVoiceAPI } from 'cozmox-sdk'

export default new AgentBuilder()
  .withName('Cozmox Voice Assistant')
  .withVersion('1.5.0')
  .withProvider('Cozmox AI')
  .withDescription('Handle voice calls with AI-powered conversations')
  .withCapability({
    id: 'voice-call',
    name: 'Voice Calls',
    description: 'Answer and handle voice calls',
    inputTypes: ['call'],
    outputTypes: ['call-log', 'lead-update'],
    requiresApproval: false
  })
  .withExternalService({
    name: 'cozmox',
    apiKey: process.env.COZMOX_API_KEY,
    webhook: '/webhook/cozmox'
  })
  .onCall(async (call) => {
    const voiceAPI = new CozmoxVoiceAPI()
    const result = await voiceAPI.handleCall(call.phoneNumber, {
      greeting: 'Hello! How can I help you today?',
      businessContext: call.businessInfo
    })
    
    return {
      type: 'call-log',
      data: {
        duration: result.duration,
        transcript: result.transcript,
        outcome: result.outcome,
        nextActions: result.recommendedActions
      }
    }
  })
  .build()
```

## API Reference

### AgentBuilder

The main class for building agents:

- `.withName(name: string)` - Set agent name
- `.withVersion(version: string)` - Set agent version
- `.withProvider(provider: string)` - Set provider name
- `.withDescription(description: string)` - Set agent description
- `.withCapability(capability: AgentCapability)` - Add a capability
- `.withPermission(permission: Permission)` - Add a permission
- `.withConfigUI(config: UIConfiguration)` - Define configuration UI
- `.withActionButton(button: ActionButton)` - Add action button
- `.onMessage(handler)` - Handle message events
- `.onContact(handler)` - Handle contact events
- `.onLead(handler)` - Handle lead events
- `.onCall(handler)` - Handle call events
- `.build()` - Build the final agent

### Utilities

- `validateCRMData(data, schema)` - Validate data against schema
- `AgentTester` - Test agents locally
- `CRMLogger` - Structured logging for agents

## Support

- **Documentation**: [docs.crm-platform.com/agent-sdk](https://docs.crm-platform.com/agent-sdk)
- **Examples**: [github.com/crm-platform/agent-examples](https://github.com/crm-platform/agent-examples)
- **Community**: [discord.gg/crm-agents](https://discord.gg/crm-agents)
- **Issues**: [github.com/crm-platform/agent-sdk/issues](https://github.com/crm-platform/agent-sdk/issues)

## License

MIT License - see LICENSE file for details.