import { z } from 'zod';
import {
  optionalDecimalString,
  optionalRepsString,
  optionalRestString,
  optionalString,
} from '@/shared/lib/schema';
import { SET_TYPES } from './workout.types';

export const plannedSetSchema = z.object({
  id: z.string(),
  type: z.enum(SET_TYPES),
  reps: optionalRepsString,
  weightKg: optionalDecimalString,
});

export const restByTypeSchema = z.object({
  WU: optionalRestString,
  FS: optionalRestString,
  WS: optionalRestString,
});

export const routineExerciseSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Obrigatório.'),
  libraryId: z.string().nullable().default(null),
  notes: optionalString,
  videoUrl: z.string().nullable().default(null),
  sets: z.array(plannedSetSchema).min(1, 'Adicione pelo menos uma série.'),
});

export const routineFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Obrigatório.'),
    notes: optionalString,
    // Descanso por tipo vale pro treino inteiro (preenchido uma vez no form).
    rests: restByTypeSchema,
    exercises: z
      .array(routineExerciseSchema)
      .min(1, 'Adicione pelo menos um exercício.'),
  })
  // Os 3 descansos são obrigatórios — sem eles o timer não dispara.
  .superRefine((routine, ctx) => {
    for (const type of SET_TYPES) {
      if (routine.rests[type] === null) {
        ctx.addIssue({
          code: 'custom',
          path: ['rests', type],
          message: 'Obrigatório.',
        });
      }
    }
  });

export type RoutineFormValues = z.input<typeof routineFormSchema>;
export type RoutineFormParsed = z.output<typeof routineFormSchema>;
