/**
 * Application Configuration
 * 
 * Centralized configuration for API endpoints, environment variables,
 * and other application settings.
 */

// API Configuration - Use full backend URL for production
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://crm-backend-api.fly.dev';

// WebSocket Configuration - Use backend WebSocket URL
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://crm-backend-api.fly.dev';

// App Configuration
export const APP_CONFIG = {
  name: 'CRM MVP',
  version: '1.0.0',
  description: 'AI Agent Platform for SME CRMs',
} as const;

// Demo Mode
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Feature Flags
export const FEATURES = {
  aiEmployees: process.env.NEXT_PUBLIC_AI_EMPLOYEES_ENABLED === 'true',
  agentMarketplace: true,
  realTimeChat: true,
  analytics: true,
} as const;

// Pagination Defaults
export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
} as const;

// UI Configuration
export const UI_CONFIG = {
  debounceDelay: 300, // ms
  animationDuration: 300, // ms
  toastDuration: 5000, // ms
} as const;