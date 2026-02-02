/**
 * Tests for YAML Handler
 */

import fs from 'fs/promises'
import { z } from 'zod'
import { YamlHandler } from '../yaml-handler.js'
import { YamlValidationError } from '../../utils/errors.js'

// Mock fs/promises
jest.mock('fs/promises')

// Mock logger
jest.mock('../../utils/logger.js', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('YamlHandler', () => {
  let yamlHandler: YamlHandler
  const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>

  beforeEach(() => {
    yamlHandler = new YamlHandler()
    jest.clearAllMocks()
  })

  describe('read', () => {
    const testSchema = z.object({
      name: z.string(),
      age: z.number(),
    })

    it('should read and validate YAML file successfully', async () => {
      const yamlContent = 'name: John\nage: 30'
      mockReadFile.mockResolvedValue(yamlContent)

      const result = await yamlHandler.read('/test/file.yaml', testSchema)

      expect(result).toEqual({ name: 'John', age: 30 })
      expect(mockReadFile).toHaveBeenCalledWith('/test/file.yaml', 'utf-8')
    })

    it('should throw YamlValidationError for invalid schema', async () => {
      const yamlContent = 'name: John\nage: invalid'
      mockReadFile.mockResolvedValue(yamlContent)

      await expect(yamlHandler.read('/test/file.yaml', testSchema)).rejects.toThrow(
        YamlValidationError
      )
    })

    it('should throw error for non-existent file', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'))

      await expect(yamlHandler.read('/test/missing.yaml', testSchema)).rejects.toThrow(
        'File not found'
      )
    })

    it('should handle malformed YAML', async () => {
      const yamlContent = 'name: John\n  invalid_indent: value'
      mockReadFile.mockResolvedValue(yamlContent)

      await expect(yamlHandler.read('/test/file.yaml', testSchema)).rejects.toThrow()
    })
  })

  describe('readRaw', () => {
    it('should read YAML without validation', async () => {
      const yamlContent = 'name: John\nage: 30\nextra: field'
      mockReadFile.mockResolvedValue(yamlContent)

      const result = await yamlHandler.readRaw('/test/file.yaml')

      expect(result).toEqual({ name: 'John', age: 30, extra: 'field' })
    })

    it('should throw error for invalid file', async () => {
      mockReadFile.mockRejectedValue(new Error('Read error'))

      await expect(yamlHandler.readRaw('/test/file.yaml')).rejects.toThrow('Read error')
    })
  })

  describe('write', () => {
    const testSchema = z.object({
      name: z.string(),
      age: z.number(),
    })

    it('should write data to YAML file', async () => {
      const data = { name: 'John', age: 30 }
      mockWriteFile.mockResolvedValue()

      await yamlHandler.write('/test/file.yaml', data)

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/test/file.yaml',
        expect.stringContaining('name: John'),
        'utf-8'
      )
    })

    it('should write data with schema validation', async () => {
      const data = { name: 'John', age: 30 }
      mockWriteFile.mockResolvedValue()

      await yamlHandler.write('/test/file.yaml', data, testSchema)

      expect(mockWriteFile).toHaveBeenCalled()
    })

    it('should throw YamlValidationError for invalid data', async () => {
      const invalidData = { name: 'John', age: 'invalid' } as any

      await expect(
        yamlHandler.write('/test/file.yaml', invalidData, testSchema)
      ).rejects.toThrow(YamlValidationError)
    })

    it('should throw error for write failure', async () => {
      const data = { name: 'John', age: 30 }
      mockWriteFile.mockRejectedValue(new Error('Write failed'))

      await expect(yamlHandler.write('/test/file.yaml', data)).rejects.toThrow(
        'Write failed'
      )
    })
  })

  describe('updateField', () => {
    it('should update specific field in YAML', async () => {
      const yamlContent = 'name: John\nage: 30\nstatus: active'
      mockReadFile.mockResolvedValue(yamlContent)
      mockWriteFile.mockResolvedValue()

      await yamlHandler.updateField('/test/file.yaml', ['age'], 31)

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/test/file.yaml',
        expect.stringContaining('age: 31'),
        'utf-8'
      )
    })

    it('should update nested field', async () => {
      const yamlContent = 'user:\n  name: John\n  age: 30'
      mockReadFile.mockResolvedValue(yamlContent)
      mockWriteFile.mockResolvedValue()

      await yamlHandler.updateField('/test/file.yaml', ['user', 'age'], 31)

      expect(mockWriteFile).toHaveBeenCalled()
    })

    it('should throw error for non-existent path', async () => {
      const yamlContent = 'name: John'
      mockReadFile.mockResolvedValue(yamlContent)

      await expect(
        yamlHandler.updateField('/test/file.yaml', ['missing', 'field'], 'value')
      ).rejects.toThrow('Path not found')
    })
  })

  describe('exists', () => {
    it('should return true for existing file', async () => {
      mockAccess.mockResolvedValue()

      const result = await yamlHandler.exists('/test/file.yaml')

      expect(result).toBe(true)
    })

    it('should return false for non-existent file', async () => {
      mockAccess.mockRejectedValue(new Error('File not found'))

      const result = await yamlHandler.exists('/test/missing.yaml')

      expect(result).toBe(false)
    })
  })
})
