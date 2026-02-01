/**
 * Zod schema for Captain → Player task
 */

import { z } from 'zod'
import { TaskTypeSchema, QualityGatesSchema } from './command.js'

export const DependenciesSchema = z.object({
  install: z.string().optional(),
  depends_on: z.string().nullable().optional(),
})

export const TaskSchema = z.object({
  task: z.object({
    id: z.string(),
    parent_id: z.string().nullable(),
    description: z.string(),
    goal: z.string(),
    type: TaskTypeSchema,
    status: z.enum(['assigned', 'in_progress', 'completed', 'done', 'failed', 'blocked']),
    timestamp: z.string().datetime(),
    completed_at: z.string().datetime().optional(),
    context: z.string().optional(),
    output_location: z.string().optional(),
    output_format: z.string().optional(),
    output_filename: z.string().optional(),
    quality_gates: QualityGatesSchema.optional(),
    dependencies: DependenciesSchema.optional(),
  }),
})

export type Task = z.infer<typeof TaskSchema>
export type TaskStatus = z.infer<typeof TaskSchema>['task']['status']
export type Dependencies = z.infer<typeof DependenciesSchema>
