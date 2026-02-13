import { z } from 'zod'

export const answerFormSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500, 'Maximum 500 characters'),
  active: z.boolean(),
  order: z.number().int().min(0, 'Order must be 0 or greater'),
})

export type AnswerFormData = z.infer<typeof answerFormSchema>
