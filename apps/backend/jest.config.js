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
      branches: 1,
      functions: 0,
      lines: 1,
      statements: 1
    },
    './src/routes/': {
      branches: 3,
      functions: 4,
      lines: 5,
      statements: 5
    },
    './src/services/': {
      branches: 5,
      functions: 5,
      lines: 4,
      statements: 4
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000
};