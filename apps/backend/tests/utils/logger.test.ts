import winston from 'winston';
import { logger } from '../../src/utils/logger';

describe('Logger Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    
    // Clear all existing transports and handlers
    logger.clear();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
    logger.clear();
  });

  describe('Logger Configuration', () => {
    it('should create logger with default configuration', () => {
      expect(logger).toBeInstanceOf(winston.Logger);
      expect(logger.level).toBe('info');
    });

    it('should use environment LOG_LEVEL when provided', () => {
      process.env.LOG_LEVEL = 'debug';
      
      const testLogger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        defaultMeta: { service: 'crm-backend' },
      });

      expect(testLogger.level).toBe('debug');
    });

    it('should use default log level when LOG_LEVEL is not set', () => {
      delete process.env.LOG_LEVEL;
      
      const testLogger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        defaultMeta: { service: 'crm-backend' },
      });

      expect(testLogger.level).toBe('info');
    });

    it('should include service metadata', () => {
      const testLogger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        defaultMeta: { service: 'crm-backend' },
      });

      expect(testLogger.defaultMeta).toEqual({ service: 'crm-backend' });
    });

    it('should configure JSON format with timestamp and error stack', () => {
      // Test that the logger format includes timestamp and error handling
      const testLogger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json()
        ),
        transports: [
          new winston.transports.Console()
        ]
      });

      expect(testLogger.format).toBeDefined();
    });
  });

  describe('Transport Configuration', () => {
    it('should configure file transports for error and combined logs', () => {
      const testLogger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: [
          new winston.transports.File({ filename: 'error.log', level: 'error' }),
          new winston.transports.File({ filename: 'combined.log' }),
        ],
      });

      expect(testLogger.transports).toHaveLength(2);
      
      const errorTransport = testLogger.transports.find(
        t => t instanceof winston.transports.File && (t as any).filename === 'error.log'
      );
      const combinedTransport = testLogger.transports.find(
        t => t instanceof winston.transports.File && (t as any).filename === 'combined.log'
      );

      expect(errorTransport).toBeDefined();
      expect(combinedTransport).toBeDefined();
      expect((errorTransport as any).level).toBe('error');
    });

    it('should add console transport in non-production environment', () => {
      process.env.NODE_ENV = 'development';
      
      const testLogger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: []
      });

      if (process.env.NODE_ENV !== 'production') {
        testLogger.add(new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }));
      }

      const consoleTransport = testLogger.transports.find(
        t => t instanceof winston.transports.Console
      );
      
      expect(consoleTransport).toBeDefined();
    });

    it('should not add console transport in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const testLogger = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: []
      });

      if (process.env.NODE_ENV !== 'production') {
        testLogger.add(new winston.transports.Console());
      }

      const consoleTransport = testLogger.transports.find(
        t => t instanceof winston.transports.Console
      );
      
      expect(consoleTransport).toBeUndefined();
    });
  });

  describe('Logging Methods', () => {
    let mockTransport: winston.transports.ConsoleTransportInstance;
    let logSpy: jest.SpyInstance;

    beforeEach(() => {
      // Create a mock transport to capture log calls
      mockTransport = new winston.transports.Console({ silent: true });
      logSpy = jest.spyOn(mockTransport, 'log').mockImplementation(() => {});
      
      logger.add(mockTransport);
    });

    afterEach(() => {
      logger.remove(mockTransport);
      logSpy.mockRestore();
    });

    it('should log info messages', () => {
      const message = 'Test info message';
      logger.info(message);
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: message
        }),
        expect.any(Function)
      );
    });

    it('should log error messages', () => {
      const message = 'Test error message';
      logger.error(message);
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          message: message
        }),
        expect.any(Function)
      );
    });

    it('should log warn messages', () => {
      const message = 'Test warning message';
      logger.warn(message);
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warn',
          message: message
        }),
        expect.any(Function)
      );
    });

    it('should log debug messages when level allows', () => {
      logger.level = 'debug';
      const message = 'Test debug message';
      logger.debug(message);
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
          message: message
        }),
        expect.any(Function)
      );
    });

    it('should not log debug messages when level is info', () => {
      logger.level = 'info';
      const message = 'Test debug message';
      logger.debug(message);
      
      // Debug should be filtered out at info level
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('should log with additional metadata', () => {
      const message = 'Test message with metadata';
      const metadata = { userId: '123', action: 'login' };
      
      logger.info(message, metadata);
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: message,
          userId: '123',
          action: 'login'
        }),
        expect.any(Function)
      );
    });

    it('should include service metadata in all logs', () => {
      const message = 'Test service metadata';
      logger.info(message);
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          message: message,
          service: 'crm-backend'
        }),
        expect.any(Function)
      );
    });
  });

  describe('Error Handling', () => {
    let mockTransport: winston.transports.ConsoleTransportInstance;
    let logSpy: jest.SpyInstance;

    beforeEach(() => {
      mockTransport = new winston.transports.Console({ silent: true });
      logSpy = jest.spyOn(mockTransport, 'log').mockImplementation(() => {});
      logger.add(mockTransport);
    });

    afterEach(() => {
      logger.remove(mockTransport);
      logSpy.mockRestore();
    });

    it('should log Error objects with stack traces', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          message: 'Error occurred',
          stack: expect.stringContaining('Test error')
        }),
        expect.any(Function)
      );
    });

    it('should handle logging of nested error objects', () => {
      const nestedError = new Error('Nested error');
      const parentError = new Error('Parent error');
      (parentError as any).cause = nestedError;
      
      logger.error('Complex error scenario', { error: parentError });
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          message: 'Complex error scenario',
          error: expect.objectContaining({
            message: 'Parent error'
          })
        }),
        expect.any(Function)
      );
    });

    it('should handle circular references in logged objects', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;
      
      // Should not throw error due to circular reference
      expect(() => {
        logger.info('Circular object test', { data: circularObj });
      }).not.toThrow();
      
      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe('Log Levels', () => {
    let mockTransport: winston.transports.ConsoleTransportInstance;
    let logSpy: jest.SpyInstance;

    beforeEach(() => {
      mockTransport = new winston.transports.Console({ silent: true });
      logSpy = jest.spyOn(mockTransport, 'log').mockImplementation(() => {});
      logger.add(mockTransport);
    });

    afterEach(() => {
      logger.remove(mockTransport);
      logSpy.mockRestore();
    });

    it('should respect log level hierarchy', () => {
      logger.level = 'warn';
      
      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');
      
      // Should log error and warn, but not info or debug
      expect(logSpy).toHaveBeenCalledTimes(2);
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'error' }),
        expect.any(Function)
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'warn' }),
        expect.any(Function)
      );
    });

    it('should allow changing log level dynamically', () => {
      logger.level = 'error';
      logger.info('This should not be logged');
      
      expect(logSpy).not.toHaveBeenCalled();
      
      logger.level = 'info';
      logger.info('This should be logged');
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'info' }),
        expect.any(Function)
      );
    });

    it('should support custom log levels', () => {
      // Winston supports custom levels
      const customLogger = winston.createLogger({
        levels: {
          critical: 0,
          error: 1,
          warn: 2,
          info: 3,
          debug: 4
        },
        level: 'info',
        transports: [mockTransport]
      });

      (customLogger as any).critical('Critical message');
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'critical' }),
        expect.any(Function)
      );
    });
  });

  describe('Performance', () => {
    let mockTransport: winston.transports.ConsoleTransportInstance;

    beforeEach(() => {
      mockTransport = new winston.transports.Console({ silent: true });
      logger.add(mockTransport);
    });

    afterEach(() => {
      logger.remove(mockTransport);
    });

    it('should handle high-frequency logging efficiently', () => {
      const startTime = Date.now();
      
      // Log many messages quickly
      for (let i = 0; i < 1000; i++) {
        logger.info(`Log message ${i}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });

    it('should not block when logging large objects', () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is item number ${i} with some description text`,
          metadata: {
            created: new Date(),
            tags: [`tag${i}`, `category${i % 10}`],
            nested: {
              level1: { level2: { level3: { value: i } } }
            }
          }
        }))
      };
      
      const startTime = Date.now();
      logger.info('Large object log', largeObject);
      const endTime = Date.now();
      
      // Should not take too long to serialize and log
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should handle concurrent logging from multiple sources', async () => {
      const promises = Array.from({ length: 100 }, async (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            logger.info(`Concurrent log ${i}`, { threadId: i });
            resolve();
          }, Math.random() * 10);
        });
      });
      
      const startTime = Date.now();
      await Promise.all(promises);
      const endTime = Date.now();
      
      // Should handle concurrent logging efficiently
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Format and Output', () => {
    it('should format logs as JSON by default', () => {
      const mockWrite = jest.fn();
      const testTransport = new winston.transports.Console({
        silent: false
      });
      
      // Mock the write method to capture output
      (testTransport as any).write = mockWrite;
      
      const testLogger = winston.createLogger({
        format: winston.format.json(),
        transports: [testTransport]
      });
      
      testLogger.info('Test message', { key: 'value' });
      
      // Should produce JSON output
      expect(mockWrite).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test message"')
      );
      expect(mockWrite).toHaveBeenCalledWith(
        expect.stringContaining('"key":"value"')
      );
    });

    it('should include timestamp in log output', () => {
      const mockWrite = jest.fn();
      const testTransport = new winston.transports.Console();
      (testTransport as any).write = mockWrite;
      
      const testLogger = winston.createLogger({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        transports: [testTransport]
      });
      
      testLogger.info('Timestamp test');
      
      expect(mockWrite).toHaveBeenCalledWith(
        expect.stringContaining('"timestamp"')
      );
    });

    it('should colorize console output in development', () => {
      process.env.NODE_ENV = 'development';
      
      const consoleTransport = new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      });
      
      expect(consoleTransport.format).toBeDefined();
    });
  });

  describe('Transport Management', () => {
    it('should allow adding custom transports', () => {
      const customTransport = new winston.transports.Console({ silent: true });
      
      logger.add(customTransport);
      
      expect(logger.transports).toContain(customTransport);
      
      logger.remove(customTransport);
    });

    it('should allow removing transports', () => {
      const customTransport = new winston.transports.Console({ silent: true });
      
      logger.add(customTransport);
      expect(logger.transports).toContain(customTransport);
      
      logger.remove(customTransport);
      expect(logger.transports).not.toContain(customTransport);
    });

    it('should handle transport errors gracefully', () => {
      const faultyTransport = new winston.transports.Console({ silent: true });
      
      // Mock transport to throw error
      jest.spyOn(faultyTransport, 'log').mockImplementation(() => {
        throw new Error('Transport error');
      });
      
      logger.add(faultyTransport);
      
      // Should not crash the application
      expect(() => {
        logger.info('Test message');
      }).not.toThrow();
      
      logger.remove(faultyTransport);
    });
  });
});