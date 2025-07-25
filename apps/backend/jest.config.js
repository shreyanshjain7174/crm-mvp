module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // Main entry point
    '!src/types/**/*', // Type definitions
    '!src/db/migrations/**/*', // SQL migration files
    '!src/sample-agents/**/*' // Sample agent files
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80
    },
    './src/routes/auth.ts': {
      branches: 85,
      functions: 90,
      lines: 95,
      statements: 95
    },
    './src/routes/contacts.ts': {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90
    },
    './src/routes/messages.ts': {
      branches: 75,
      functions: 80,
      lines: 85,
      statements: 85
    },
    './src/services/': {
      branches: 75,
      functions: 80,
      lines: 85,
      statements: 85
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000
};