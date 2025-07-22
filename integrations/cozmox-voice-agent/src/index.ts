/**
 * Cozmox Voice Agent - CRM Integration
 * 
 * A complete voice AI agent that handles incoming calls, schedules appointments,
 * qualifies leads, and provides customer support through natural voice conversations.
 */

// Note: AgentBuilder would be imported from the actual SDK when available
// For now, we'll create a minimal interface for development
interface AgentBuilder {
  withName(name: string): AgentBuilder
  withVersion(version: string): AgentBuilder
  withProvider(provider: string): AgentBuilder
  withDescription(description: string): AgentBuilder
  withCapability(capability: any): AgentBuilder
  withPermission(permission: any): AgentBuilder
  withPricing(pricing: any): AgentBuilder
  withConfigUI(ui: any): AgentBuilder
  withActionButton(button: any): AgentBuilder
  withSupportedDataTypes(types: string[]): AgentBuilder
  onCall(handler: (callData: any, context: any) => Promise<any>): AgentBuilder
  onContact(handler: (contactData: any, context: any) => Promise<any>): AgentBuilder
  onLead(handler: (leadData: any, context: any) => Promise<any>): AgentBuilder
  onInstall(handler: (config: any) => Promise<void>): AgentBuilder
  onStart(handler: (config: any) => Promise<void>): AgentBuilder
  onStop(handler: (config: any) => Promise<void>): AgentBuilder
  onConfigChange(handler: (oldConfig: any, newConfig: any) => Promise<void>): AgentBuilder
  build(): any
}

// Temporary implementation for development
class TempAgentBuilder implements AgentBuilder {
  withName(_name: string): AgentBuilder { return this }
  withVersion(_version: string): AgentBuilder { return this }
  withProvider(_provider: string): AgentBuilder { return this }
  withDescription(_description: string): AgentBuilder { return this }
  withCapability(_capability: any): AgentBuilder { return this }
  withPermission(_permission: any): AgentBuilder { return this }
  withPricing(_pricing: any): AgentBuilder { return this }
  withConfigUI(_ui: any): AgentBuilder { return this }
  withActionButton(_button: any): AgentBuilder { return this }
  withSupportedDataTypes(_types: string[]): AgentBuilder { return this }
  onCall(_handler: (callData: any, context: any) => Promise<any>): AgentBuilder { return this }
  onContact(_handler: (contactData: any, context: any) => Promise<any>): AgentBuilder { return this }
  onLead(_handler: (leadData: any, context: any) => Promise<any>): AgentBuilder { return this }
  onInstall(_handler: (config: any) => Promise<void>): AgentBuilder { return this }
  onStart(_handler: (config: any) => Promise<void>): AgentBuilder { return this }
  onStop(_handler: (config: any) => Promise<void>): AgentBuilder { return this }
  onConfigChange(_handler: (oldConfig: any, newConfig: any) => Promise<void>): AgentBuilder { return this }
  build(): any { return {} }
}
import { CozmoxVoiceAPI } from './services/cozmox-api'
import { CallProcessor } from './services/call-processor'
import { AppointmentScheduler } from './services/appointment-scheduler'
import { LeadQualifier } from './services/lead-qualifier'
import { createLogger } from './utils/logger'
import dotenv from 'dotenv'

dotenv.config()

const logger = createLogger('CozmoxVoiceAgent')

/**
 * Main Cozmox Voice Agent implementation
 */
const cozmoxVoiceAgent = new TempAgentBuilder()
  .withName('Cozmox Voice Assistant')
  .withVersion('1.5.2')
  .withProvider('Cozmox AI')
  .withDescription('AI-powered voice assistant for handling calls, booking appointments, and qualifying leads')
  
  // Define agent capabilities
  .withCapability({
    id: 'voice-call-handling',
    name: 'Voice Call Handling',
    description: 'Handle incoming and outgoing voice calls with AI conversations',
    inputTypes: ['call'],
    outputTypes: ['call-log', 'lead-update', 'appointment'],
    requiresApproval: false
  })
  .withCapability({
    id: 'appointment-booking',
    name: 'Appointment Booking',
    description: 'Schedule appointments based on voice conversations',
    inputTypes: ['call', 'message'],
    outputTypes: ['appointment', 'calendar-event'],
    requiresApproval: true // Requires approval before booking
  })
  .withCapability({
    id: 'lead-qualification',
    name: 'Lead Qualification',
    description: 'Qualify leads through voice interactions and scoring',
    inputTypes: ['call', 'contact'],
    outputTypes: ['lead-update', 'analytics'],
    requiresApproval: false
  })
  .withCapability({
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Provide automated customer support through voice',
    inputTypes: ['call'],
    outputTypes: ['call-log', 'support-ticket'],
    requiresApproval: false
  })

  // Define required permissions
  .withPermission({
    resource: 'call',
    actions: ['read', 'create', 'update'],
    constraints: { businessScope: true }
  })
  .withPermission({
    resource: 'contact',
    actions: ['read', 'update'],
    constraints: { businessScope: true }
  })
  .withPermission({
    resource: 'appointment',
    actions: ['create', 'read', 'update'],
    constraints: { businessScope: true }
  })
  .withPermission({
    resource: 'lead',
    actions: ['read', 'update'],
    constraints: { businessScope: true }
  })

  // Define pricing model
  .withPricing({
    model: 'usage',
    usage: {
      perMinute: 150, // ₹1.50 per minute
      freeLimit: 60   // 60 minutes free per month
    }
  })

  // Configure agent settings UI
  .withConfigUI({
    fields: [
      {
        name: 'apiKey',
        type: 'password',
        label: 'Cozmox API Key',
        description: 'Your Cozmox AI API key for voice processing',
        required: true,
        validation: { min: 32 }
      },
      {
        name: 'businessInfo',
        type: 'object',
        label: 'Business Information',
        required: true,
        properties: {
          name: {
            name: 'name',
            type: 'text',
            label: 'Business Name',
            required: true
          },
          industry: {
            name: 'industry',
            type: 'text',
            label: 'Industry',
            placeholder: 'e.g., Real Estate, Healthcare'
          },
          phone: {
            name: 'phone',
            type: 'text',
            label: 'Business Phone',
            validation: { pattern: '^\\+[1-9]\\d{1,14}$' }
          }
        }
      },
      {
        name: 'greetingMessage',
        type: 'textarea',
        label: 'Greeting Message',
        description: 'Customize the greeting message for incoming calls',
        default: 'Hello! Thank you for calling {businessName}. How can I help you today?',
        validation: { min: 10, max: 200 }
      },
      {
        name: 'businessHours',
        type: 'object',
        label: 'Business Hours',
        properties: {
          enabled: {
            name: 'enabled',
            type: 'boolean',
            label: 'Enable Business Hours',
            default: true
          },
          timezone: {
            name: 'timezone',
            type: 'select',
            label: 'Timezone',
            options: [
              { value: 'Asia/Kolkata', label: 'India (IST)' },
              { value: 'America/New_York', label: 'US Eastern' },
              { value: 'Europe/London', label: 'UK (GMT)' },
              { value: 'Asia/Singapore', label: 'Singapore' }
            ],
            default: 'Asia/Kolkata'
          },
          schedule: {
            name: 'schedule',
            type: 'object',
            label: 'Weekly Schedule',
            properties: {
              monday: {
                name: 'monday',
                type: 'object',
                label: 'Monday',
                properties: {
                  open: { name: 'open', type: 'time', label: 'Open', default: '09:00' },
                  close: { name: 'close', type: 'time', label: 'Close', default: '18:00' }
                }
              },
              tuesday: {
                name: 'tuesday',
                type: 'object', 
                label: 'Tuesday',
                properties: {
                  open: { name: 'open', type: 'time', label: 'Open', default: '09:00' },
                  close: { name: 'close', type: 'time', label: 'Close', default: '18:00' }
                }
              }
              // ... other days would follow similar pattern
            }
          }
        }
      },
      {
        name: 'appointmentSettings',
        type: 'object',
        label: 'Appointment Settings',
        properties: {
          enabled: {
            name: 'enabled',
            type: 'boolean',
            label: 'Enable Appointment Booking',
            default: true
          },
          duration: {
            name: 'duration',
            type: 'number',
            label: 'Default Appointment Duration (minutes)',
            default: 30,
            validation: { min: 15, max: 180 }
          },
          bufferTime: {
            name: 'bufferTime',
            type: 'number',
            label: 'Buffer Time Between Appointments (minutes)',
            default: 15,
            validation: { min: 0, max: 60 }
          },
          requiresApproval: {
            name: 'requiresApproval',
            type: 'boolean',
            label: 'Require Manual Approval',
            default: true
          }
        }
      },
      {
        name: 'leadQualification',
        type: 'object',
        label: 'Lead Qualification',
        properties: {
          enabled: {
            name: 'enabled',
            type: 'boolean',
            label: 'Enable Lead Qualification',
            default: true
          },
          qualifyingQuestions: {
            name: 'qualifyingQuestions',
            type: 'textarea',
            label: 'Qualifying Questions',
            description: 'Questions to ask during lead qualification (one per line)',
            placeholder: 'What is your budget range?\nWhen are you looking to start?\nWhat is your timeline?',
            validation: { max: 1000 }
          },
          scoringCriteria: {
            name: 'scoringCriteria',
            type: 'object',
            label: 'Scoring Criteria',
            properties: {
              budgetWeight: {
                name: 'budgetWeight',
                type: 'number',
                label: 'Budget Weight',
                default: 30,
                validation: { min: 0, max: 100 }
              },
              timelineWeight: {
                name: 'timelineWeight',
                type: 'number',
                label: 'Timeline Weight',
                default: 25,
                validation: { min: 0, max: 100 }
              },
              intentWeight: {
                name: 'intentWeight',
                type: 'number',
                label: 'Intent Weight',
                default: 45,
                validation: { min: 0, max: 100 }
              }
            }
          }
        }
      },
      {
        name: 'advancedSettings',
        type: 'object',
        label: 'Advanced Settings',
        properties: {
          voiceModel: {
            name: 'voiceModel',
            type: 'select',
            label: 'Voice Model',
            options: [
              { value: 'natural-female', label: 'Natural Female' },
              { value: 'natural-male', label: 'Natural Male' },
              { value: 'professional-female', label: 'Professional Female' },
              { value: 'professional-male', label: 'Professional Male' }
            ],
            default: 'professional-female'
          },
          language: {
            name: 'language',
            type: 'select',
            label: 'Primary Language',
            options: [
              { value: 'en-US', label: 'English (US)' },
              { value: 'en-GB', label: 'English (UK)' },
              { value: 'en-IN', label: 'English (India)' },
              { value: 'hi-IN', label: 'Hindi (India)' }
            ],
            default: 'en-IN'
          },
          maxCallDuration: {
            name: 'maxCallDuration',
            type: 'number',
            label: 'Max Call Duration (minutes)',
            default: 15,
            validation: { min: 1, max: 60 }
          },
          transcriptionEnabled: {
            name: 'transcriptionEnabled',
            type: 'boolean',
            label: 'Enable Call Transcription',
            default: true
          },
          sentimentAnalysis: {
            name: 'sentimentAnalysis',
            type: 'boolean',
            label: 'Enable Sentiment Analysis',
            default: true
          }
        }
      }
    ],
    sections: [
      {
        name: 'basic',
        title: 'Basic Configuration',
        fields: ['apiKey', 'businessInfo', 'greetingMessage']
      },
      {
        name: 'scheduling',
        title: 'Scheduling & Hours',
        fields: ['businessHours', 'appointmentSettings']
      },
      {
        name: 'qualification',
        title: 'Lead Qualification',
        fields: ['leadQualification']
      }
    ],
    advanced: {
      enabled: true,
      fields: ['advancedSettings']
    }
  })

  // Add action buttons for CRM interface
  .withActionButton({
    id: 'make-call',
    label: 'Make Call',
    icon: 'Phone',
    placement: 'contact-detail',
    tooltip: 'Initiate an outbound call to this contact',
    onClick: async (context: any) => {
      const { contact } = context
      return {
        type: 'call-initiated',
        data: {
          contactId: contact.id,
          phone: contact.phone,
          direction: 'outbound',
          initiatedBy: 'agent'
        }
      }
    }
  })
  .withActionButton({
    id: 'schedule-callback',
    label: 'Schedule Callback',
    icon: 'Calendar',
    placement: 'contact-detail',
    tooltip: 'Schedule a callback for this contact',
    onClick: async (context: any) => {
      const { contact } = context
      return {
        type: 'callback-scheduled',
        data: {
          contactId: contact.id,
          scheduledBy: 'agent'
        }
      }
    }
  })

  // Set supported data types
  .withSupportedDataTypes(['call', 'contact', 'lead', 'appointment'])

  // Handle incoming voice calls
  .onCall(async (callData, context) => {
    const { config } = context
    const callProcessor = new CallProcessor(config)
    
    logger.info('Processing incoming call', {
      callId: callData.data.id,
      phone: callData.data.phoneNumber,
      direction: callData.data.direction
    })

    try {
      // Initialize Cozmox Voice API
      const voiceAPI = new CozmoxVoiceAPI({
        apiKey: config.apiKey,
        voiceModel: config.advancedSettings?.voiceModel || 'professional-female',
        language: config.advancedSettings?.language || 'en-IN'
      })

      // Process the call
      const result = await callProcessor.processCall(callData.data, voiceAPI)

      // Handle different call outcomes
      switch (result.outcome) {
        case 'appointment_requested':
          if (config.appointmentSettings?.enabled && result.appointmentDetails) {
            const scheduler = new AppointmentScheduler(config)
            const appointmentRequest = {
              phoneNumber: callData.data.phoneNumber,
              contactId: result.contactId,
              ...result.appointmentDetails
            }
            const appointment = await scheduler.scheduleAppointment(appointmentRequest)
            
            return {
              type: 'appointment',
              data: appointment,
              requiresApproval: config.appointmentSettings.requiresApproval
            }
          }
          break

        case 'lead_qualified':
          if (config.leadQualification?.enabled && result.qualificationData) {
            const qualifier = new LeadQualifier(config)
            const leadUpdate = await qualifier.qualifyLead(result.qualificationData)
            
            return {
              type: 'lead-update',
              data: leadUpdate
            }
          }
          break

        case 'support_request':
          return {
            type: 'support-ticket',
            data: {
              subject: result.supportDetails?.issue || 'Support Request',
              description: result.transcript,
              priority: result.supportDetails?.priority || 'medium',
              contactId: result.contactId
            }
          }

        case 'information_provided':
        default:
          return {
            type: 'call-log',
            data: {
              callId: callData.data.id,
              duration: result.duration,
              outcome: result.outcome,
              transcript: result.transcript,
              summary: result.summary,
              nextActions: result.recommendedActions,
              sentiment: result.sentiment
            }
          }
      }

      return {
        type: 'call-log',
        data: result
      }
    } catch (error) {
      logger.error('Call processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        callId: callData.data.id
      })

      return {
        type: 'call-log',
        data: {
          callId: callData.data.id,
          outcome: 'error',
          error: error instanceof Error ? error.message : 'Processing failed'
        }
      }
    }
  })

  // Handle contact updates for lead qualification
  .onContact(async (contactData, context) => {
    const { config } = context
    
    if (!config.leadQualification?.enabled) {
      return {
        type: 'contact-processed',
        data: { contactId: contactData.data.id, action: 'skipped' }
      }
    }

    const qualifier = new LeadQualifier(config)
    const qualification = await qualifier.analyzeContact(contactData.data)

    return {
      type: 'lead-update',
      data: {
        contactId: contactData.data.id,
        score: qualification.score,
        stage: qualification.stage,
        notes: qualification.notes,
        nextActions: qualification.nextActions
      }
    }
  })

  // Handle lead updates
  .onLead(async (leadData, context) => {
    const { config } = context
    
    logger.info('Processing lead update', {
      leadId: leadData.data.id,
      stage: leadData.data.stage
    })

    // Update lead scoring based on new information
    if (config.leadQualification?.enabled) {
      const qualifier = new LeadQualifier(config)
      const updatedScore = await qualifier.updateLeadScore(leadData.data)

      return {
        type: 'lead-update',
        data: {
          leadId: leadData.data.id,
          score: updatedScore.score,
          confidence: updatedScore.confidence,
          reasoning: updatedScore.reasoning
        }
      }
    }

    return {
      type: 'lead-processed',
      data: { leadId: leadData.data.id }
    }
  })

  // Lifecycle hooks
  .onInstall(async (config) => {
    logger.info('Cozmox Voice Agent installed', { businessId: config.businessId })
    
    // Validate API key
    try {
      const voiceAPI = new CozmoxVoiceAPI({ apiKey: config.apiKey })
      await voiceAPI.validateConnection()
      logger.info('Cozmox API connection validated')
    } catch (error) {
      logger.error('Failed to validate Cozmox API connection', { error })
      throw new Error('Invalid Cozmox API key or connection failed')
    }
  })

  .onStart(async (config) => {
    logger.info('Cozmox Voice Agent started', { businessId: config.businessId })
  })

  .onStop(async (config) => {
    logger.info('Cozmox Voice Agent stopped', { businessId: config.businessId })
  })

  .onConfigChange(async (oldConfig, newConfig) => {
    logger.info('Cozmox Voice Agent configuration updated')
    
    // Re-validate API key if changed
    if (oldConfig.apiKey !== newConfig.apiKey) {
      const voiceAPI = new CozmoxVoiceAPI({ apiKey: newConfig.apiKey })
      await voiceAPI.validateConnection()
    }
  })

  // Build the agent
  .build()

export default cozmoxVoiceAgent