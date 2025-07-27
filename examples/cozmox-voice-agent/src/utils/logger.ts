/**
 * Logger Utility
 * 
 * Provides structured logging for the Cozmox Voice Agent
 */

import winston from 'winston'

export interface LogContext {
  [key: string]: any
}

export const createLogger = (component: string) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ level, message, timestamp, component: comp, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          component: comp || component,
          message,
          ...meta
        })
      })
    ),
    defaultMeta: { component },
    transports: [
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log' 
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
          winston.format.printf(({ level, message, component: comp, timestamp, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
            return `${timestamp} [${comp || component}] ${level}: ${message}${metaStr}`
          })
        )
      })
    ]
  })
}