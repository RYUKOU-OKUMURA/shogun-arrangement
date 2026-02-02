/**
 * Jest setup file
 * Global test configuration and utilities
 */

// Increase timeout for integration tests
jest.setTimeout(10000)

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}
