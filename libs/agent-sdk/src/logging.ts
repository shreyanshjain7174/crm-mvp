/**
 * Agent Logging System
 * 
 * Provides structured logging for agents with different log levels,
 * context information, and integration with monitoring systems.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  agentId: string
  context?: Record<string, any>
  error?: Error
}

export interface LoggerConfig {
  level: LogLevel
  includeContext: boolean
  includeStack: boolean
  formatJson: boolean
}

/**
 * Structured logger for AI agents
 */
export class CRMLogger {
  private config: LoggerConfig = {
    level: LogLevel.INFO,
    includeContext: true,
    includeStack: false,
    formatJson: false
  }

  private listeners: Array<(entry: LogEntry) => void> = []

  constructor(
    private agentId: string,
    config?: Partial<LoggerConfig>
  ) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: Record<string, any>): void {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    this.log(LogLevel.ERROR, message, context, errorObj)
  }

  /**
   * Log with specific level
   */
  log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (level < this.config.level) {
      return // Skip logs below configured level
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      agentId: this.agentId,
      context: this.config.includeContext ? context : undefined,
      error
    }

    this.emit(entry)
  }

  /**
   * Add log listener
   */
  addListener(listener: (entry: LogEntry) => void): void {
    this.listeners.push(listener)
  }

  /**
   * Remove log listener
   */
  removeListener(listener: (entry: LogEntry) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: Record<string, any>): CRMLogger {
    const childLogger = new CRMLogger(this.agentId, this.config)
    
    // Override the log method to include additional context
    const originalLog = childLogger.log.bind(childLogger)
    childLogger.log = (level: LogLevel, message: string, context?: Record<string, any>, error?: Error) => {
      const mergedContext = { ...additionalContext, ...context }
      originalLog(level, message, mergedContext, error)
    }

    return childLogger
  }

  /**
   * Emit log entry to all listeners
   */
  private emit(entry: LogEntry): void {
    // Emit to console by default
    this.emitToConsole(entry)

    // Emit to all registered listeners
    for (const listener of this.listeners) {
      try {
        listener(entry)
      } catch (error) {
        // Prevent listener errors from breaking logging
        console.error('Error in log listener:', error)
      }
    }
  }

  /**
   * Emit log entry to console
   */
  private emitToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString()
    const levelName = LogLevel[entry.level]
    const prefix = `[${timestamp}] ${levelName} [${entry.agentId}]`

    if (this.config.formatJson) {
      console.log(JSON.stringify({
        timestamp: entry.timestamp,
        level: levelName,
        agentId: entry.agentId,
        message: entry.message,
        context: entry.context,
        error: entry.error ? {
          name: entry.error.name,
          message: entry.error.message,
          stack: this.config.includeStack ? entry.error.stack : undefined
        } : undefined
      }))
      return
    }

    // Format for human reading
    const contextStr = entry.context ? 
      `\\n  Context: ${JSON.stringify(entry.context, null, 2)}` : ''
    
    const errorStr = entry.error ? 
      `\\n  Error: ${entry.error.message}${this.config.includeStack ? '\\n  Stack: ' + entry.error.stack : ''}` : ''

    const fullMessage = `${prefix} ${entry.message}${contextStr}${errorStr}`

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(fullMessage)
        break
      case LogLevel.INFO:
        console.log(fullMessage)
        break
      case LogLevel.WARN:
        console.warn(fullMessage)
        break
      case LogLevel.ERROR:
        console.error(fullMessage)
        break
    }
  }
}

/**
 * Performance logging decorator
 */
export function logPerformance(logger: CRMLogger, operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      
      try {
        logger.debug(`Starting ${operation}`)
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime
        
        logger.info(`Completed ${operation}`, { 
          duration: `${duration}ms`,
          success: true
        })
        
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        
        logger.error(`Failed ${operation}`, error, {
          duration: `${duration}ms`,
          success: false
        })
        
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Create logger with common agent context
 */
export function createAgentLogger(
  agentId: string, 
  config?: Partial<LoggerConfig>
): CRMLogger {
  return new CRMLogger(agentId, config)
}

/**
 * Global logger registry for managing multiple agent loggers
 */
export class LoggerRegistry {
  private static instance: LoggerRegistry
  private loggers = new Map<string, CRMLogger>()
  private globalListeners: Array<(entry: LogEntry) => void> = []

  static getInstance(): LoggerRegistry {
    if (!LoggerRegistry.instance) {
      LoggerRegistry.instance = new LoggerRegistry()
    }
    return LoggerRegistry.instance
  }

  /**
   * Get or create logger for agent
   */
  getLogger(agentId: string, config?: Partial<LoggerConfig>): CRMLogger {
    if (!this.loggers.has(agentId)) {
      const logger = new CRMLogger(agentId, config)
      
      // Add global listeners to new logger
      for (const listener of this.globalListeners) {
        logger.addListener(listener)
      }
      
      this.loggers.set(agentId, logger)
    }
    
    return this.loggers.get(agentId)!
  }

  /**
   * Add global log listener for all agents
   */
  addGlobalListener(listener: (entry: LogEntry) => void): void {
    this.globalListeners.push(listener)
    
    // Add to existing loggers
    for (const logger of this.loggers.values()) {
      logger.addListener(listener)
    }
  }

  /**
   * Remove global log listener
   */
  removeGlobalListener(listener: (entry: LogEntry) => void): void {
    const index = this.globalListeners.indexOf(listener)
    if (index > -1) {
      this.globalListeners.splice(index, 1)
    }
    
    // Remove from existing loggers
    for (const logger of this.loggers.values()) {
      logger.removeListener(listener)
    }
  }

  /**
   * Set log level for all loggers
   */
  setGlobalLevel(level: LogLevel): void {
    for (const logger of this.loggers.values()) {
      logger.setLevel(level)
    }
  }

  /**
   * Get all active loggers
   */
  getAllLoggers(): CRMLogger[] {
    return Array.from(this.loggers.values())
  }

  /**
   * Clear all loggers
   */
  clear(): void {
    this.loggers.clear()
    this.globalListeners = []
  }
}