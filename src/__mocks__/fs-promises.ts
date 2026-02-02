/**
 * Mock fs/promises for testing
 */

export const mockFs = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  access: jest.fn(),
  mkdir: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
  unlink: jest.fn(),
}

export const resetMockFs = () => {
  Object.values(mockFs).forEach((fn) => {
    if (typeof fn === 'function' && 'mockClear' in fn) {
      fn.mockClear()
    }
  })
}

export default mockFs
