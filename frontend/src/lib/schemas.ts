import { z } from 'zod';

export const questionTypeSchema = z.object({
  type: z.string().min(1, 'Required'),
  count: z.coerce.number().int().min(1, 'Min 1').max(50, 'Max 50'),
  marks: z.coerce.number().int().min(1, 'Min 1').max(100, 'Max 100'),
});

export const createAssignmentSchema = z.object({
  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .refine((v) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, 'Due date must be today or later'),
  questionTypes: z.array(questionTypeSchema).min(1, 'Add at least one question type'),
  additionalInstructions: z.string().optional().default(''),
});

export type CreateAssignmentForm = z.infer<typeof createAssignmentSchema>;
