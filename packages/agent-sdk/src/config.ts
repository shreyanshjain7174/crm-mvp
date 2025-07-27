/**
 * Configuration Builders
 * 
 * Provides fluent builders for creating agent configuration interfaces
 * and defining how users interact with agent settings.
 */

import { ConfigField, AgentUIConfiguration } from './types'

/**
 * Builder for individual configuration fields
 */
export class ConfigFieldBuilder {
  private field: ConfigField

  constructor(name: string, type: ConfigField['type']) {
    this.field = {
      name,
      type,
      label: name.charAt(0).toUpperCase() + name.slice(1),
      required: false
    }
  }

  /**
   * Set field label
   */
  label(label: string): ConfigFieldBuilder {
    this.field.label = label
    return this
  }

  /**
   * Set field description
   */
  description(description: string): ConfigFieldBuilder {
    this.field.description = description
    return this
  }

  /**
   * Set placeholder text
   */
  placeholder(placeholder: string): ConfigFieldBuilder {
    this.field.placeholder = placeholder
    return this
  }

  /**
   * Mark field as required
   */
  required(required: boolean = true): ConfigFieldBuilder {
    this.field.required = required
    return this
  }

  /**
   * Set default value
   */
  default(value: any): ConfigFieldBuilder {
    this.field.default = value
    return this
  }

  /**
   * Add options for select/multiselect fields
   */
  options(options: Array<{ value: string; label: string }> | string[]): ConfigFieldBuilder {
    if (Array.isArray(options) && typeof options[0] === 'string') {
      this.field.options = (options as string[]).map(opt => ({ value: opt, label: opt }))
    } else {
      this.field.options = options as Array<{ value: string; label: string }>
    }
    return this
  }

  /**
   * Add validation rules
   */
  validation(validation: ConfigField['validation']): ConfigFieldBuilder {
    this.field.validation = validation
    return this
  }

  /**
   * Set minimum value/length
   */
  min(min: number): ConfigFieldBuilder {
    if (!this.field.validation) this.field.validation = {}
    this.field.validation.min = min
    return this
  }

  /**
   * Set maximum value/length
   */
  max(max: number): ConfigFieldBuilder {
    if (!this.field.validation) this.field.validation = {}
    this.field.validation.max = max
    return this
  }

  /**
   * Set validation pattern (regex)
   */
  pattern(pattern: string, message?: string): ConfigFieldBuilder {
    if (!this.field.validation) this.field.validation = {}
    this.field.validation.pattern = pattern
    if (message) this.field.validation.message = message
    return this
  }

  /**
   * Add conditional dependency
   */
  dependsOn(field: string, value: any, show: boolean = true): ConfigFieldBuilder {
    this.field.dependent = { field, value, show }
    return this
  }

  /**
   * For object type fields, define properties
   */
  properties(properties: Record<string, ConfigField>): ConfigFieldBuilder {
    if (this.field.type === 'object') {
      this.field.properties = properties
    }
    return this
  }

  /**
   * Build the field
   */
  build(): ConfigField {
    return { ...this.field }
  }
}

/**
 * Builder for complete UI configuration
 */
export class UIConfigurationBuilder {
  private config: AgentUIConfiguration = { fields: [] }

  /**
   * Add a field using builder
   */
  addField(builder: ConfigFieldBuilder): UIConfigurationBuilder {
    this.config.fields.push(builder.build())
    return this
  }

  /**
   * Add a field directly
   */
  field(field: ConfigField): UIConfigurationBuilder {
    this.config.fields.push(field)
    return this
  }

  /**
   * Add a text field
   */
  text(name: string): ConfigFieldBuilder {
    const builder = new ConfigFieldBuilder(name, 'text')
    this.config.fields.push(builder.build())
    return builder
  }

  /**
   * Add a textarea field
   */
  textarea(name: string): ConfigFieldBuilder {
    const builder = new ConfigFieldBuilder(name, 'textarea')
    this.config.fields.push(builder.build())
    return builder
  }

  /**
   * Add a number field
   */
  number(name: string): ConfigFieldBuilder {
    const builder = new ConfigFieldBuilder(name, 'number')
    this.config.fields.push(builder.build())
    return builder
  }

  /**
   * Add a boolean field
   */
  boolean(name: string): ConfigFieldBuilder {
    const builder = new ConfigFieldBuilder(name, 'boolean')
    this.config.fields.push(builder.build())
    return builder
  }

  /**
   * Add a select field
   */
  select(name: string, options: string[] | Array<{ value: string; label: string }>): ConfigFieldBuilder {
    const builder = new ConfigFieldBuilder(name, 'select')
    builder.options(options)
    this.config.fields.push(builder.build())
    return builder
  }

  /**
   * Add an email field
   */
  email(name: string): ConfigFieldBuilder {
    const builder = new ConfigFieldBuilder(name, 'email')
    this.config.fields.push(builder.build())
    return builder
  }

  /**
   * Add a password field
   */
  password(name: string): ConfigFieldBuilder {
    const builder = new ConfigFieldBuilder(name, 'password')
    this.config.fields.push(builder.build())
    return builder
  }

  /**
   * Add a URL field
   */
  url(name: string): ConfigFieldBuilder {
    const builder = new ConfigFieldBuilder(name, 'url')
    this.config.fields.push(builder.build())
    return builder
  }

  /**
   * Add sections to group fields
   */
  addSection(name: string, title: string, fieldNames: string[], description?: string): UIConfigurationBuilder {
    if (!this.config.sections) {
      this.config.sections = []
    }
    
    this.config.sections.push({
      name,
      title,
      description,
      fields: fieldNames
    })
    
    return this
  }

  /**
   * Configure advanced settings
   */
  advanced(enabled: boolean, fieldNames: string[]): UIConfigurationBuilder {
    this.config.advanced = {
      enabled,
      fields: fieldNames
    }
    return this
  }

  /**
   * Build the configuration
   */
  build(): AgentUIConfiguration {
    return { ...this.config }
  }
}

/**
 * Predefined common configuration patterns
 */
export class CommonConfigs {
  /**
   * Basic AI model configuration
   */
  static aiModel(models: string[] = ['gpt-4', 'claude-3', 'local-llama']): ConfigFieldBuilder {
    return new ConfigFieldBuilder('aiModel', 'select')
      .label('AI Model')
      .description('Select the AI model to use for processing')
      .options(models)
      .default('local-llama')
      .required()
  }

  /**
   * Response template configuration
   */
  static responseTemplate(): ConfigFieldBuilder {
    return new ConfigFieldBuilder('responseTemplate', 'textarea')
      .label('Response Template')
      .description('Template for automated responses. Use {name}, {business} etc. for variables.')
      .placeholder('Hello {name}, thanks for your message...')
      .required()
      .validation({ min: 10, max: 1000 })
  }

  /**
   * Business hours configuration
   */
  static businessHours(): ConfigFieldBuilder {
    const hoursField: ConfigField = {
      name: 'businessHours',
      type: 'object',
      label: 'Business Hours',
      description: 'Configure when the agent should be active',
      required: false,
      properties: {
        enabled: {
          name: 'enabled',
          type: 'boolean',
          label: 'Enable Business Hours',
          default: false,
          required: false
        },
        start: {
          name: 'start',
          type: 'time',
          label: 'Start Time',
          default: '09:00',
          required: false,
          dependent: { field: 'enabled', value: true, show: true }
        },
        end: {
          name: 'end',
          type: 'time',
          label: 'End Time',
          default: '18:00',
          required: false,
          dependent: { field: 'enabled', value: true, show: true }
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
          default: 'Asia/Kolkata',
          required: false,
          dependent: { field: 'enabled', value: true, show: true }
        }
      }
    }

    return new ConfigFieldBuilder('businessHours', 'object').properties(hoursField.properties!)
  }

  /**
   * API credentials configuration
   */
  static apiCredentials(serviceName: string): ConfigFieldBuilder {
    const credentialsField: ConfigField = {
      name: 'credentials',
      type: 'object',
      label: `${serviceName} Credentials`,
      description: `API credentials for ${serviceName} integration`,
      required: true,
      properties: {
        apiKey: {
          name: 'apiKey',
          type: 'password',
          label: 'API Key',
          required: true,
          validation: { min: 20 }
        },
        baseUrl: {
          name: 'baseUrl',
          type: 'url',
          label: 'Base URL',
          placeholder: 'https://api.example.com',
          required: false
        }
      }
    }

    return new ConfigFieldBuilder('credentials', 'object').properties(credentialsField.properties!)
  }

  /**
   * Auto-approval settings
   */
  static autoApproval(): ConfigFieldBuilder {
    const autoApprovalField: ConfigField = {
      name: 'autoApproval',
      type: 'object',
      label: 'Auto-Approval Settings',
      description: 'Configure when agent can act without human approval',
      required: false,
      properties: {
        enabled: {
          name: 'enabled',
          type: 'boolean',
          label: 'Enable Auto-Approval',
          default: false,
          required: false
        },
        confidenceThreshold: {
          name: 'confidenceThreshold',
          type: 'number',
          label: 'Confidence Threshold',
          description: 'Minimum confidence (0-100) required for auto-approval',
          default: 80,
          validation: { min: 0, max: 100 },
          required: false,
          dependent: { field: 'enabled', value: true, show: true }
        },
        maxActionsPerHour: {
          name: 'maxActionsPerHour',
          type: 'number',
          label: 'Max Actions Per Hour',
          description: 'Maximum number of auto-approved actions per hour',
          default: 10,
          validation: { min: 1, max: 100 },
          required: false,
          dependent: { field: 'enabled', value: true, show: true }
        }
      }
    }

    return new ConfigFieldBuilder('autoApproval', 'object').properties(autoApprovalField.properties!)
  }
}

/**
 * Configuration validator
 */
export class ConfigValidator {
  /**
   * Validate configuration against field definitions
   */
  static validate(config: Record<string, any>, fields: ConfigField[]): {
    valid: boolean
    errors: Array<{ field: string, message: string }>
  } {
    const errors: Array<{ field: string, message: string }> = []

    for (const field of fields) {
      const value = config[field.name]

      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({ field: field.name, message: `${field.label} is required` })
        continue
      }

      // Skip validation if field is optional and empty
      if (!field.required && (value === undefined || value === null || value === '')) {
        continue
      }

      // Type validation
      if (!this.validateType(value, field.type)) {
        errors.push({ field: field.name, message: `${field.label} must be of type ${field.type}` })
        continue
      }

      // Custom validation rules
      if (field.validation) {
        const validationErrors = this.validateRules(value, field)
        errors.push(...validationErrors.map(msg => ({ field: field.name, message: msg })))
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate value type
   */
  private static validateType(value: any, type: ConfigField['type']): boolean {
    switch (type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'url':
      case 'password':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number'
      case 'boolean':
        return typeof value === 'boolean'
      case 'select':
      case 'multiselect':
        return true // Options validation would happen in rules
      case 'date':
        return value instanceof Date || typeof value === 'string'
      case 'time':
        return typeof value === 'string'
      case 'object':
        return typeof value === 'object' && value !== null
      default:
        return true
    }
  }

  /**
   * Validate against field rules
   */
  private static validateRules(value: any, field: ConfigField): string[] {
    const errors: string[] = []
    const validation = field.validation!

    if (validation.min !== undefined) {
      if (typeof value === 'string' && value.length < validation.min) {
        errors.push(`${field.label} must be at least ${validation.min} characters`)
      } else if (typeof value === 'number' && value < validation.min) {
        errors.push(`${field.label} must be at least ${validation.min}`)
      }
    }

    if (validation.max !== undefined) {
      if (typeof value === 'string' && value.length > validation.max) {
        errors.push(`${field.label} must be no more than ${validation.max} characters`)
      } else if (typeof value === 'number' && value > validation.max) {
        errors.push(`${field.label} must be no more than ${validation.max}`)
      }
    }

    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(value)) {
        errors.push(validation.message || `${field.label} format is invalid`)
      }
    }

    return errors
  }
}