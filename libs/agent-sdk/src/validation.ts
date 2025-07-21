/**
 * Data Validation
 * 
 * Provides validation utilities for CRM data using Zod schemas.
 * Ensures data integrity and type safety for agent processing.
 */

import { z } from 'zod'
import { CRMData, ValidationError } from './types'

export type ValidationSchema = z.ZodSchema<any>

/**
 * Validate CRM data against a schema
 */
export function validateCRMData<T>(data: any, schema: ValidationSchema): data is T {
  try {
    schema.parse(data)
    return true
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        'Data validation failed',
        {
          errors: error.errors,
          data
        }
      )
    }
    throw error
  }
}

/**
 * Create a validation schema for message data
 */
export const createMessageSchema = () => z.object({
  type: z.literal('message'),
  businessId: z.string(),
  data: z.object({
    id: z.string(),
    content: z.string().min(1),
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format'),
    direction: z.enum(['inbound', 'outbound']),
    timestamp: z.date(),
    messageType: z.enum(['text', 'image', 'document', 'audio', 'video']),
    mediaUrl: z.string().url().optional()
  }),
  metadata: z.record(z.any()).optional()
})

/**
 * Create a validation schema for contact data
 */
export const createContactSchema = () => z.object({
  type: z.literal('contact'),
  businessId: z.string(),
  data: z.object({
    id: z.string(),
    name: z.string().optional(),
    phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format'),
    email: z.string().email().optional(),
    tags: z.array(z.string()),
    customFields: z.record(z.any()),
    lastContact: z.date().optional(),
    source: z.string().optional()
  }),
  metadata: z.record(z.any()).optional()
})

/**
 * Create a validation schema for lead data
 */
export const createLeadSchema = () => z.object({
  type: z.literal('lead'),
  businessId: z.string(),
  data: z.object({
    id: z.string(),
    contactId: z.string(),
    stage: z.string(),
    value: z.number().positive().optional(),
    source: z.string(),
    assignedTo: z.string().optional(),
    probability: z.number().min(0).max(100).optional(),
    expectedCloseDate: z.date().optional(),
    notes: z.string().optional()
  }),
  metadata: z.record(z.any()).optional()
})

/**
 * Predefined common validation schemas
 */
export const commonSchemas = {
  message: createMessageSchema(),
  contact: createContactSchema(),
  lead: createLeadSchema(),
  
  // Validation for agent responses
  agentResponse: z.object({
    type: z.string(),
    data: z.any(),
    confidence: z.number().min(0).max(1).optional(),
    requiresApproval: z.boolean().optional(),
    metadata: z.record(z.any()).optional()
  }),
  
  // Validation for phone numbers
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format'),
  
  // Validation for email addresses
  email: z.string().email('Invalid email format'),
  
  // Validation for URLs
  url: z.string().url('Invalid URL format'),
  
  // Validation for agent configuration
  agentConfig: z.record(z.any())
}

/**
 * Validate multiple data items
 */
export function validateBatch<T>(
  items: any[], 
  schema: ValidationSchema
): { valid: T[], invalid: { item: any, errors: z.ZodError }[] } {
  const valid: T[] = []
  const invalid: { item: any, errors: z.ZodError }[] = []
  
  for (const item of items) {
    try {
      const validatedItem = schema.parse(item)
      valid.push(validatedItem)
    } catch (error) {
      if (error instanceof z.ZodError) {
        invalid.push({ item, errors: error })
      }
    }
  }
  
  return { valid, invalid }
}

/**
 * Create a custom validation schema builder
 */
export class SchemaBuilder {
  private schema: z.ZodSchema = z.any()
  
  static create(): SchemaBuilder {
    return new SchemaBuilder()
  }
  
  string(): SchemaBuilder {
    this.schema = z.string()
    return this
  }
  
  number(): SchemaBuilder {
    this.schema = z.number()
    return this
  }
  
  boolean(): SchemaBuilder {
    this.schema = z.boolean()
    return this
  }
  
  array(itemSchema: z.ZodSchema): SchemaBuilder {
    this.schema = z.array(itemSchema)
    return this
  }
  
  object(shape: Record<string, z.ZodSchema>): SchemaBuilder {
    this.schema = z.object(shape)
    return this
  }
  
  optional(): SchemaBuilder {
    this.schema = this.schema.optional()
    return this
  }
  
  min(value: number): SchemaBuilder {
    if (this.schema instanceof z.ZodString) {
      this.schema = this.schema.min(value)
    } else if (this.schema instanceof z.ZodNumber) {
      this.schema = this.schema.min(value)
    }
    return this
  }
  
  max(value: number): SchemaBuilder {
    if (this.schema instanceof z.ZodString) {
      this.schema = this.schema.max(value)
    } else if (this.schema instanceof z.ZodNumber) {
      this.schema = this.schema.max(value)
    }
    return this
  }
  
  email(): SchemaBuilder {
    if (this.schema instanceof z.ZodString) {
      this.schema = this.schema.email()
    }
    return this
  }
  
  url(): SchemaBuilder {
    if (this.schema instanceof z.ZodString) {
      this.schema = this.schema.url()
    }
    return this
  }
  
  regex(pattern: RegExp, message?: string): SchemaBuilder {
    if (this.schema instanceof z.ZodString) {
      this.schema = this.schema.regex(pattern, message)
    }
    return this
  }
  
  build(): ValidationSchema {
    return this.schema
  }
}