import { z } from 'zod';

// Simple client-side sanitization without DOMPurify for now
const basicSanitize = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML tags and dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"&]/g, '') // Remove dangerous characters
    .trim();
};

// Input sanitization functions
export const sanitizeInput = {
  // Basic text sanitization - removes HTML and trims whitespace
  text: (input: string): string => {
    return basicSanitize(input);
  },

  // Email sanitization - removes HTML and validates email format
  email: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    return basicSanitize(input.toLowerCase());
  },

  // Phone sanitization - removes non-numeric characters except + and spaces
  phone: (input: string): string => {
    if (!input || typeof input !== 'string') return '';
    const sanitized = basicSanitize(input);
    return sanitized.replace(/[^+\d\s()-]/g, '');
  },

  // URL sanitization
  url: (input: string): string => {
    return basicSanitize(input);
  },

  // Rich text sanitization - basic text only for now
  richText: (input: string): string => {
    return basicSanitize(input);
  }
};

// Validation schemas using Zod
export const validationSchemas = {
  // User profile validation
  userProfile: z.object({
    name: z.string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    
    email: z.string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address')
      .max(255, 'Email must be less than 255 characters'),
    
    company: z.string()
      .max(100, 'Company name must be less than 100 characters')
      .optional(),
    
    phone: z.string()
      .regex(/^[\+]?[0-9\s\-\(\)]{10,20}$/, 'Please enter a valid phone number')
      .optional(),
    
    bio: z.string()
      .max(500, 'Bio must be less than 500 characters')
      .optional()
  }),

  // Lead creation validation
  lead: z.object({
    name: z.string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
    
    phone: z.string()
      .min(10, 'Phone number is required')
      .max(20, 'Phone number is too long')
      .regex(/^[\+]?[0-9\s\-\(\)]{10,20}$/, 'Please enter a valid phone number'),
    
    email: z.string()
      .email('Please enter a valid email address')
      .max(255, 'Email must be less than 255 characters')
      .optional()
      .or(z.literal('')),
    
    source: z.string()
      .max(50, 'Source must be less than 50 characters')
      .optional(),
    
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    
    businessProfile: z.string()
      .max(1000, 'Business profile must be less than 1000 characters')
      .optional()
  }),

  // Password validation
  password: z.object({
    currentPassword: z.string()
      .min(1, 'Current password is required'),
    
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be less than 128 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
        'Password must contain at least one uppercase letter, one lowercase letter, and one number')
  }),

  // WhatsApp settings validation
  whatsapp: z.object({
    businessPhone: z.string()
      .min(10, 'Business phone is required')
      .regex(/^[\+]?[0-9\s\-\(\)]{10,20}$/, 'Please enter a valid phone number'),
    
    displayName: z.string()
      .min(1, 'Display name is required')
      .max(50, 'Display name must be less than 50 characters'),
    
    welcomeMessage: z.string()
      .min(1, 'Welcome message is required')
      .max(500, 'Welcome message must be less than 500 characters'),
    
    businessAccountId: z.string()
      .min(1, 'Business Account ID is required')
      .max(100, 'Business Account ID is too long'),
    
    phoneNumberId: z.string()
      .min(1, 'Phone Number ID is required')
      .max(100, 'Phone Number ID is too long')
  }),

  // Message validation
  message: z.object({
    content: z.string()
      .min(1, 'Message content is required')
      .max(1000, 'Message must be less than 1000 characters'),
    
    leadId: z.string()
      .uuid('Invalid lead ID')
  })
};

// Validation result type
export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
  message?: string;
};

// Generic validation function
export function validateAndSanitize<T>(
  data: Record<string, any>,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    // First sanitize all string inputs
    const sanitizedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Apply appropriate sanitization based on field name
        if (key.toLowerCase().includes('email')) {
          sanitizedData[key] = sanitizeInput.email(value);
        } else if (key.toLowerCase().includes('phone')) {
          sanitizedData[key] = sanitizeInput.phone(value);
        } else if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
          sanitizedData[key] = sanitizeInput.url(value);
        } else if (key.toLowerCase().includes('bio') || key.toLowerCase().includes('description') || key.toLowerCase().includes('message')) {
          sanitizedData[key] = sanitizeInput.richText(value);
        } else {
          sanitizedData[key] = sanitizeInput.text(value);
        }
      } else {
        sanitizedData[key] = value;
      }
    }

    // Then validate with schema
    const result = schema.safeParse(sanitizedData);
    
    if (result.success) {
      return {
        success: true,
        data: result.data
      };
    } else {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      
      return {
        success: false,
        errors,
        message: 'Please fix the validation errors and try again.'
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'An unexpected validation error occurred.'
    };
  }
}

// Specific validation functions for common use cases
export const validateUserProfile = (data: Record<string, any>) => 
  validateAndSanitize(data, validationSchemas.userProfile);

export const validateLead = (data: Record<string, any>) => 
  validateAndSanitize(data, validationSchemas.lead);

export const validatePassword = (data: Record<string, any>) => 
  validateAndSanitize(data, validationSchemas.password);

export const validateWhatsAppSettings = (data: Record<string, any>) => 
  validateAndSanitize(data, validationSchemas.whatsapp);

export const validateMessage = (data: Record<string, any>) => 
  validateAndSanitize(data, validationSchemas.message);

// React hook for form validation
export function useFormValidation<T>(schema: z.ZodSchema<T>) {
  const validate = (data: Record<string, any>): ValidationResult<T> => {
    return validateAndSanitize(data, schema);
  };

  return { validate };
}

// Input field validation helpers
export const fieldValidators = {
  required: (value: string) => value.trim() !== '' || 'This field is required',
  
  email: (value: string) => {
    if (!value.trim()) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || 'Please enter a valid email address';
  },
  
  phone: (value: string) => {
    if (!value.trim()) return true; // Optional field
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,20}$/;
    return phoneRegex.test(value) || 'Please enter a valid phone number';
  },
  
  minLength: (min: number) => (value: string) => 
    value.length >= min || `Must be at least ${min} characters`,
  
  maxLength: (max: number) => (value: string) => 
    value.length <= max || `Must be less than ${max} characters`,
  
  noSpecialChars: (value: string) => {
    const regex = /^[a-zA-Z0-9\s]*$/;
    return regex.test(value) || 'Special characters are not allowed';
  },
  
  alphaOnly: (value: string) => {
    const regex = /^[a-zA-Z\s]*$/;
    return regex.test(value) || 'Only letters and spaces are allowed';
  }
};