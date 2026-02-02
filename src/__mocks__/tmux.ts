/**
 * Mock tmux helper for testing
 */

export const mockTmuxHelper = {
  sendKeys: jest.fn().mockResolvedValue(undefined),
  sendKeysToPane: jest.fn().mockResolvedValue(undefined),
  capturePane: jest.fn().mockResolvedValue(''),
  listPanes: jest.fn().mockResolvedValue([]),
  hasSession: jest.fn().mockResolvedValue(true),
  createSession: jest.fn().mockResolvedValue(undefined),
  killSession: jest.fn().mockResolvedValue(undefined),
}

export const resetMockTmux = () => {
  Object.values(mockTmuxHelper).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear()
    }
  })
}
