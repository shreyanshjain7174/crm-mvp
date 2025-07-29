# API Documentation

## Overview

The CRM MVP API provides comprehensive endpoints for managing leads, contacts, messages, AI agents, and analytics. The API follows RESTful principles with JSON request/response formats.

**Base URL**: `https://crm-backend-api.fly.dev`  
**Version**: v1  
**Authentication**: JWT Bearer tokens  

## Table of Contents

- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Leads API](#leads-api)
- [Contacts API](#contacts-api)
- [Messages API](#messages-api)
- [AI Agents API](#ai-agents-api)
- [Analytics API](#analytics-api)
- [Integrations API](#integrations-api)
- [Notifications API](#notifications-api)
- [Achievements API](#achievements-api)
- [WebSocket Events](#websocket-events)

## Authentication

All API endpoints require authentication via JWT Bearer tokens in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## Error Handling

The API uses conventional HTTP status codes:

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error

**Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

## Rate Limiting

- **Rate Limit**: 1000 requests per hour per user
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests per hour
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Leads API

### Get All Leads
```http
GET /api/leads
```

**Query Parameters:**
- `status` - Filter by status (`new`, `contacted`, `qualified`, `converted`)
- `source` - Filter by source (`website`, `referral`, `social`)
- `limit` - Number of leads per page (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "leads": [
    {
      "id": "lead_123",
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Acme Corp",
      "status": "new",
      "source": "website",
      "value": 5000,
      "notes": "Interested in enterprise plan",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Single Lead
```http
GET /api/leads/{id}
```

### Create Lead
```http
POST /api/leads
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1987654321",
  "company": "Tech Startup",
  "source": "referral",
  "value": 10000,
  "notes": "High priority prospect"
}
```

### Update Lead
```http
PUT /api/leads/{id}
Content-Type: application/json

{
  "status": "qualified",
  "notes": "Scheduled demo for next week"
}
```

### Delete Lead
```http
DELETE /api/leads/{id}
```

## Contacts API

### Get All Contacts
```http
GET /api/contacts
```

**Query Parameters:**
- `search` - Full-text search across name, email, company
- `tags` - Filter by tags (comma-separated)
- `sort` - Sort field (`name`, `company`, `createdAt`)
- `order` - Sort order (`asc`, `desc`)

**Response:**
```json
{
  "contacts": [
    {
      "id": "contact_123",
      "name": "Alice Johnson",
      "email": "alice@company.com",
      "phone": "+1555123456",
      "company": "Innovation Inc",
      "position": "CTO",
      "tags": ["decision-maker", "technical"],
      "lastContactDate": "2024-01-10T14:20:00Z",
      "status": "active",
      "notes": "Key technical decision maker",
      "createdAt": "2023-12-01T09:00:00Z"
    }
  ],
  "total": 85
}
```

### Create Contact
```http
POST /api/contacts
Content-Type: application/json

{
  "name": "Bob Wilson",
  "email": "bob@startup.io",
  "phone": "+1555987654",
  "company": "AI Startup",
  "position": "CEO",
  "tags": ["founder", "AI"]
}
```

## Messages API

### Get Conversations
```http
GET /api/conversations
```

**Response:**
```json
{
  "conversations": [
    {
      "id": "conv_123",
      "leadId": "lead_123",
      "leadName": "John Smith",
      "lastMessage": {
        "content": "Thanks for the demo!",
        "timestamp": "2024-01-15T16:45:00Z",
        "sender": "lead"
      },
      "unreadCount": 2,
      "status": "active"
    }
  ]
}
```

### Get Messages for Lead
```http
GET /api/messages/{leadId}
```

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_123",
      "leadId": "lead_123",
      "content": "Hi, I'm interested in your product",
      "sender": "lead",
      "timestamp": "2024-01-15T10:30:00Z",
      "status": "delivered"
    },
    {
      "id": "msg_124",
      "leadId": "lead_123",
      "content": "Thanks for your interest! Let me schedule a demo.",
      "sender": "agent",
      "timestamp": "2024-01-15T10:35:00Z",
      "status": "delivered"
    }
  ]
}
```

### Send Message
```http
POST /api/messages
Content-Type: application/json

{
  "leadId": "lead_123",
  "content": "Thanks for the demo! When can we discuss pricing?",
  "sender": "lead"
}
```

## AI Agents API

### Get All Agents
```http
GET /api/agents
```

**Response:**
```json
{
  "agents": [
    {
      "id": "agent_123",
      "name": "Sales Assistant",
      "type": "sales",
      "status": "active",
      "capabilities": ["lead-qualification", "appointment-scheduling"],
      "performance": {
        "totalInteractions": 1250,
        "successRate": 0.78,
        "avgResponseTime": 1.2
      },
      "config": {
        "model": "gpt-4",
        "temperature": 0.7,
        "maxTokens": 1000
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Agent
```http
POST /api/agents
Content-Type: application/json

{
  "name": "Customer Support Bot",
  "type": "support",
  "capabilities": ["faq-answers", "ticket-routing"],
  "config": {
    "model": "gpt-3.5-turbo",
    "temperature": 0.5,
    "systemPrompt": "You are a helpful customer support assistant..."
  }
}
```

### Execute Agent
```http
POST /api/agents/{id}/execute
Content-Type: application/json

{
  "input": {
    "leadId": "lead_123",
    "message": "I need help with pricing",
    "context": {
      "previousInteractions": 3,
      "leadValue": 5000
    }
  }
}
```

**Response:**
```json
{
  "output": {
    "response": "I'd be happy to help with pricing information...",
    "actions": [
      {
        "type": "schedule_call",
        "parameters": {
          "leadId": "lead_123",
          "suggestedTime": "2024-01-16T14:00:00Z"
        }
      }
    ],
    "confidence": 0.92
  },
  "usage": {
    "inputTokens": 150,
    "outputTokens": 75,
    "totalCost": 0.0023
  }
}
```

## Analytics API

### Dashboard Stats
```http
GET /api/analytics/dashboard
```

**Response:**
```json
{
  "summary": {
    "totalLeads": 1250,
    "qualifiedLeads": 340,
    "conversionRate": 0.27,
    "totalRevenue": 125000,
    "avgDealSize": 5000
  },
  "trends": {
    "leadsThisMonth": 150,
    "leadsGrowth": 0.12,
    "revenueThisMonth": 25000,
    "revenueGrowth": 0.08
  },
  "sourceBreakdown": {
    "website": 45,
    "referral": 30,
    "social": 15,
    "advertising": 10
  }
}
```

### AI Performance
```http
GET /api/analytics/ai-performance
```

**Response:**
```json
{
  "agents": [
    {
      "agentId": "agent_123",
      "name": "Sales Assistant",
      "metrics": {
        "totalInteractions": 1250,
        "successfulInteractions": 975,
        "avgResponseTime": 1.2,
        "costPerInteraction": 0.02,
        "leadQualificationRate": 0.78
      }
    }
  ],
  "overall": {
    "totalCost": 125.50,
    "totalSavings": 15000,
    "automationRate": 0.65
  }
}
```

## Integrations API

### Get All Integrations
```http
GET /api/integrations
```

**Response:**
```json
{
  "integrations": [
    {
      "id": "integration_123",
      "name": "Slack",
      "type": "communication",
      "status": "connected",
      "category": "notifications",
      "config": {
        "webhookUrl": "https://hooks.slack.com/...",
        "channel": "#sales"
      },
      "lastSync": "2024-01-15T12:00:00Z"
    }
  ]
}
```

### Connect Integration
```http
POST /api/integrations/{id}/connect
Content-Type: application/json

{
  "credentials": {
    "apiKey": "your-api-key",
    "webhookUrl": "https://your-app.com/webhook"
  },
  "config": {
    "syncFrequency": "real-time",
    "dataTypes": ["leads", "messages"]
  }
}
```

## Notifications API

### Get User Notifications
```http
GET /api/notifications
```

**Query Parameters:**
- `status` - Filter by status (`unread`, `read`, `all`)
- `type` - Filter by type (`lead`, `message`, `system`)
- `limit` - Number per page (default: 20)

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif_123",
      "type": "lead",
      "title": "New qualified lead",
      "message": "John Smith has been qualified and is ready for follow-up",
      "data": {
        "leadId": "lead_123",
        "leadName": "John Smith"
      },
      "status": "unread",
      "createdAt": "2024-01-15T14:30:00Z"
    }
  ]
}
```

### Mark Notification as Read
```http
PUT /api/notifications/{id}/read
```

## Achievements API

### Get User Achievements
```http
GET /api/achievements
```

**Response:**
```json
{
  "achievements": [
    {
      "id": "achievement_123",
      "title": "First Sale",
      "description": "Closed your first deal",
      "category": "sales",
      "rarity": "common",
      "unlockedAt": "2024-01-10T15:00:00Z",
      "progress": {
        "current": 1,
        "target": 1,
        "percentage": 100
      }
    }
  ],
  "progress": {
    "totalUnlocked": 12,
    "totalAvailable": 50,
    "points": 1250
  }
}
```

## WebSocket Events

Connect to WebSocket at `wss://crm-backend-api.fly.dev/ws` with authentication:

```javascript
const ws = new WebSocket('wss://crm-backend-api.fly.dev/ws', [], {
  headers: {
    'Authorization': 'Bearer your-jwt-token'
  }
});
```

### Event Types

#### New Lead
```json
{
  "type": "lead.created",
  "data": {
    "id": "lead_123",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "source": "website"
  },
  "timestamp": "2024-01-15T16:30:00Z"
}
```

#### New Message
```json
{
  "type": "message.received",
  "data": {
    "id": "msg_123",
    "leadId": "lead_123",
    "content": "Hi, I'm interested in your product",
    "sender": "lead"
  },
  "timestamp": "2024-01-15T16:35:00Z"
}
```

#### Agent Status Update
```json
{
  "type": "agent.status",
  "data": {
    "agentId": "agent_123",
    "status": "processing",
    "currentTask": "Qualifying lead_456"
  },
  "timestamp": "2024-01-15T16:40:00Z"
}
```

#### Metrics Update
```json
{
  "type": "metrics.update",
  "data": {
    "metric": "leads_today",
    "value": 25,
    "change": "+2",
    "changeType": "increase"
  },
  "timestamp": "2024-01-15T16:45:00Z"
}
```

## SDK Examples

### JavaScript/Node.js
```javascript
import { CrmClient } from '@crm-mvp/sdk';

const client = new CrmClient({
  baseUrl: 'https://crm-backend-api.fly.dev',
  apiKey: 'your-api-key'
});

// Get leads
const leads = await client.leads.getAll({
  status: 'new',
  limit: 10
});

// Create lead
const newLead = await client.leads.create({
  name: 'John Doe',
  email: 'john@example.com',
  source: 'api'
});

// Execute AI agent
const result = await client.agents.execute('agent_123', {
  input: 'Qualify this lead',
  context: { leadId: 'lead_456' }
});
```

### Python
```python
from crm_mvp_sdk import CrmClient

client = CrmClient(
    base_url='https://crm-backend-api.fly.dev',
    api_key='your-api-key'
)

# Get leads
leads = client.leads.get_all(status='new', limit=10)

# Create lead
new_lead = client.leads.create({
    'name': 'John Doe',
    'email': 'john@example.com',
    'source': 'api'
})

# Execute AI agent
result = client.agents.execute('agent_123', {
    'input': 'Qualify this lead',
    'context': {'lead_id': 'lead_456'}
})
```

## Webhooks

Configure webhooks to receive real-time notifications:

### Webhook Events
- `lead.created` - New lead created
- `lead.updated` - Lead status/data updated
- `message.received` - New message from lead
- `agent.completed` - AI agent finished task
- `integration.error` - Integration error occurred

### Webhook Payload
```json
{
  "event": "lead.created",
  "data": {
    "id": "lead_123",
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "timestamp": "2024-01-15T16:50:00Z",
  "signature": "sha256=abc123..."
}
```

### Webhook Verification
Verify webhook signatures using HMAC SHA256:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}
```

## Changelog

### v1.2.0 (2024-01-15)
- Added WebSocket real-time events
- Enhanced AI agent execution API
- Improved analytics endpoints
- Added webhook signature verification

### v1.1.0 (2024-01-01)
- Added AI agents management
- Enhanced search capabilities
- Added achievements system
- Improved error handling

### v1.0.0 (2023-12-15)
- Initial API release
- Basic CRUD operations
- Authentication system
- Core CRM functionality

## Support

For API support and questions:
- **Documentation**: [https://docs.crm-mvp.com](https://docs.crm-mvp.com)
- **Email**: api-support@crm-mvp.com
- **Discord**: [CRM MVP Community](https://discord.gg/crm-mvp)

## Rate Limits & Quotas

| Plan | Requests/Hour | WebSocket Connections | AI Agent Calls/Day |
|------|---------------|---------------------|-------------------|
| Free | 1,000 | 5 | 100 |
| Pro | 10,000 | 25 | 1,000 |
| Enterprise | 100,000 | 100 | 10,000 |