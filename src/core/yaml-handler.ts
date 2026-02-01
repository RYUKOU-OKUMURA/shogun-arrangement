/**
 * YAML handler with Zod validation
 */

import fs from 'fs/promises'
import YAML from 'yaml'
import { z } from 'zod'
import { logger } from '../utils/logger.js'
import { YamlValidationError } from '../utils/errors.js'

export class YamlHandler {
  /**
   * Read YAML file and validate with Zod schema
   */
  async read<T>(filePath: string, schema: z.ZodSchema<T>): Promise<T> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const parsed = YAML.parse(content)

      // Zod validation
      const validated = schema.parse(parsed)
      logger.debug(`Successfully read and validated: ${filePath}`)
      return validated
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`YAML validation error in ${filePath}:`, error.errors)
        throw new YamlValidationError(
          `Invalid YAML schema: ${error.errors.map(e => e.message).join(', ')}`,
          { filePath, errors: error.errors }
        )
      }
      if (error instanceof Error) {
        logger.error(`Failed to read YAML file ${filePath}:`, error.message)
        throw error
      }
      throw new Error(`Unknown error reading YAML file: ${filePath}`)
    }
  }

  /**
   * Read YAML file without validation (for backward compatibility)
   */
  async readRaw(filePath: string): Promise<unknown> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const parsed = YAML.parse(content)
      logger.debug(`Successfully read (raw): ${filePath}`)
      return parsed
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Failed to read YAML file ${filePath}:`, error.message)
        throw error
      }
      throw new Error(`Unknown error reading YAML file: ${filePath}`)
    }
  }

  /**
   * Write data to YAML file with optional validation
   */
  async write<T>(filePath: string, data: T, schema?: z.ZodSchema<T>): Promise<void> {
    try {
      // Validate if schema provided
      if (schema) {
        schema.parse(data)
      }

      const yamlString = YAML.stringify(data, {
        indent: 2,
        lineWidth: 0, // Disable line wrapping
      })

      await fs.writeFile(filePath, yamlString, 'utf-8')
      logger.debug(`Successfully wrote: ${filePath}`)
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(`YAML validation error:`, error.errors)
        throw new YamlValidationError(
          `Invalid data for YAML: ${error.errors.map(e => e.message).join(', ')}`,
          { filePath, errors: error.errors }
        )
      }
      if (error instanceof Error) {
        logger.error(`Failed to write YAML file ${filePath}:`, error.message)
        throw error
      }
      throw new Error(`Unknown error writing YAML file: ${filePath}`)
    }
  }

  /**
   * Update specific field in YAML file
   */
  async updateField(filePath: string, path: string[], value: unknown): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8')
    const parsed = YAML.parse(content)

    // Navigate to the field and update
    let current: any = parsed
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) {
        throw new Error(`Path not found: ${path.slice(0, i + 1).join('.')}`)
      }
      current = current[path[i]]
    }

    const lastKey = path[path.length - 1]
    if (current[lastKey] === undefined) {
      throw new Error(`Path not found: ${path.join('.')}`)
    }

    current[lastKey] = value

    await this.write(filePath, parsed)
    logger.debug(`Updated field ${path.join('.')} in ${filePath}`)
  }

  /**
   * Check if YAML file exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
}

export const yamlHandler = new YamlHandler()
