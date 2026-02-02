/**
 * Mock logger for testing
 */

export const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  success: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

export const resetMockLogger = () => {
  Object.values(mockLogger).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear()
    }
  })
}

export const logger = mockLogger
