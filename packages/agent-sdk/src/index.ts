/**
 * CRM Platform Agent SDK
 * 
 * Main entry point for the Agent SDK. Exports all public interfaces,
 * classes, and utilities needed to build AI agents.
 */

// Core types and interfaces
export * from './types'

// Agent builder and runtime
export { AgentBuilder } from './AgentBuilder'
export { AgentRuntime } from './AgentRuntime'

// Data validation and utilities
export { validateCRMData, ValidationSchema } from './validation'
export { AgentTester } from './testing'
export { CRMLogger } from './logging'

// Event system
export { AgentEventEmitter } from './events'

// Configuration and UI helpers
export { ConfigFieldBuilder, UIConfigurationBuilder } from './config'

// External service integration
export { ExternalServiceConnector } from './external'

// Default export for easy import
export { AgentBuilder as default } from './AgentBuilder'