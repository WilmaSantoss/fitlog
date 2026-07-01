import { z } from 'zod';
import { optionalDecimalString, optionalString } from '@/shared/lib/schema';

export const measurementFormSchema = z.object({
  recordedAt: z.string().min(1, 'Obrigatório.'),
  weightKg: optionalDecimalString,
  bicepLeftCm: optionalDecimalString,
  bicepRightCm: optionalDecimalString,
  forearmLeftCm: optionalDecimalString,
  forearmRightCm: optionalDecimalString,
  bellyCm: optionalDecimalString,
  waistCm: optionalDecimalString,
  glutesCm: optionalDecimalString,
  thighLeftCm: optionalDecimalString,
  thighRightCm: optionalDecimalString,
  calfLeftCm: optionalDecimalString,
  calfRightCm: optionalDecimalString,
  notes: optionalString,
});

export type MeasurementFormValues = z.input<typeof measurementFormSchema>;
export type MeasurementFormParsed = z.output<typeof measurementFormSchema>;
