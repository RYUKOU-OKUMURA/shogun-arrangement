/**
 * Zod schema for Player → Captain report
 */

import { z } from 'zod'

export const QualityMetricsSchema = z.object({
  test_coverage: z.number().optional(),
  lines_of_code: z.number().optional(),
  lint_passed: z.boolean().optional(),
  typecheck_passed: z.boolean().optional(),
  tests_passed: z.boolean().optional(),
})

export const ReportSchema = z.object({
  player_id: z.string(),
  task_id: z.string(),
  status: z.enum(['completed', 'failed', 'blocked']),
  timestamp: z.string().datetime(),
  report_location: z.string().optional(),
  quality_metrics: QualityMetricsSchema.optional(),
  blockers: z.array(z.string()).optional(),
})

export type Report = z.infer<typeof ReportSchema>
export type QualityMetrics = z.infer<typeof QualityMetricsSchema>
