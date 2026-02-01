/**
 * Zod schema for Director → Captain command
 */

import { z } from 'zod'

export const TaskTypeSchema = z.enum(['feature', 'fix', 'refactor', 'docs', 'test'])

export const QualityGatesSchema = z.object({
  lint: z.boolean().optional(),
  typecheck: z.boolean().optional(),
  test_coverage: z.number().min(0).max(100).optional(),
  max_lines: z.number().optional(),
  comprehensive: z.boolean().optional(),
  sources_cited: z.boolean().optional(),
})

export const SubtaskSchema = z.object({
  id: z.string(),
  description: z.string(),
  assigned_to: z.string(),
  goal: z.string(),
  type: TaskTypeSchema,
  context: z.string().optional(),
  output_location: z.string().optional(),
  output_format: z.string().optional(),
  output_filename: z.string().optional(),
  depends_on: z.string().nullable().optional(),
  quality_gates: QualityGatesSchema.optional(),
})

export const CommandSchema = z.object({
  command: z.object({
    id: z.string(),
    timestamp: z.string().datetime(),
    description: z.string(),
    type: TaskTypeSchema,
    status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
    small_pr: z.boolean().default(true),
    tdd_required: z.boolean().default(true),
    subtasks: z.array(SubtaskSchema),
  }),
})

export type Command = z.infer<typeof CommandSchema>
export type Subtask = z.infer<typeof SubtaskSchema>
export type TaskType = z.infer<typeof TaskTypeSchema>
export type QualityGates = z.infer<typeof QualityGatesSchema>
