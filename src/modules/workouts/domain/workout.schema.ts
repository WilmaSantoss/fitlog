import { z } from 'zod';
import {
  optionalDecimalString,
  optionalIntString,
  optionalString,
} from '@/shared/lib/schema';
import { SET_TYPES } from './workout.types';

export const plannedSetSchema = z.object({
  id: z.string(),
  type: z.enum(SET_TYPES),
  reps: optionalIntString,
  weightKg: optionalDecimalString,
});

export const routineExerciseSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Obrigatório.'),
  notes: optionalString,
  restSeconds: optionalIntString,
  sets: z.array(plannedSetSchema).min(1, 'Adicione pelo menos uma série.'),
});

export const routineFormSchema = z.object({
  name: z.string().trim().min(1, 'Obrigatório.'),
  notes: optionalString,
  exercises: z
    .array(routineExerciseSchema)
    .min(1, 'Adicione pelo menos um exercício.'),
});

export type RoutineFormValues = z.input<typeof routineFormSchema>;
export type RoutineFormParsed = z.output<typeof routineFormSchema>;
