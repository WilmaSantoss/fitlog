import { z } from 'zod';
import { optionalDecimalString, optionalString } from '@/shared/lib/schema';

export const measurementFormSchema = z.object({
  recordedAt: z.string().min(1, 'Obrigatório.'),
  weightKg: optionalDecimalString,
  bodyFatPct: optionalDecimalString,
  chestCm: optionalDecimalString,
  shoulderCm: optionalDecimalString,
  waistCm: optionalDecimalString,
  hipCm: optionalDecimalString,
  armCm: optionalDecimalString,
  thighCm: optionalDecimalString,
  calfCm: optionalDecimalString,
  notes: optionalString,
});

export type MeasurementFormValues = z.input<typeof measurementFormSchema>;
export type MeasurementFormParsed = z.output<typeof measurementFormSchema>;
