import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
  measurementFormSchema,
  type MeasurementFormParsed,
  type MeasurementFormValues,
} from '../domain/measurement.schema';
import type { Measurement, MeasurementInput } from '../domain/measurement.types';
import {
  dateInputToIsoUtc,
  isoToDateInput,
  todayIsoDateOnly,
} from '@/shared/lib/date';

type Props = {
  initial?: Measurement;
  onSubmit: (input: MeasurementInput) => Promise<void> | void;
  submitting?: boolean;
};

function toStr(value: number | null): string {
  return value === null ? '' : String(value);
}

function buildDefaults(initial?: Measurement): MeasurementFormValues {
  if (!initial) {
    return {
      recordedAt: todayIsoDateOnly(),
      weightKg: '',
      bodyFatPct: '',
      chestCm: '',
      shoulderCm: '',
      waistCm: '',
      hipCm: '',
      armCm: '',
      thighCm: '',
      calfCm: '',
      notes: '',
    };
  }
  return {
    recordedAt: isoToDateInput(initial.recordedAt),
    weightKg: toStr(initial.weightKg),
    bodyFatPct: toStr(initial.bodyFatPct),
    chestCm: toStr(initial.chestCm),
    shoulderCm: toStr(initial.shoulderCm),
    waistCm: toStr(initial.waistCm),
    hipCm: toStr(initial.hipCm),
    armCm: toStr(initial.armCm),
    thighCm: toStr(initial.thighCm),
    calfCm: toStr(initial.calfCm),
    notes: initial.notes ?? '',
  };
}

const numericFields = [
  'weightKg',
  'bodyFatPct',
  'chestCm',
  'shoulderCm',
  'waistCm',
  'hipCm',
  'armCm',
  'thighCm',
  'calfCm',
] as const;

export function MeasurementForm({ initial, onSubmit, submitting }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MeasurementFormValues, unknown, MeasurementFormParsed>({
    resolver: zodResolver(measurementFormSchema),
    defaultValues: buildDefaults(initial),
  });

  const handleValid: SubmitHandler<MeasurementFormParsed> = async (parsed) => {
    const input: MeasurementInput = {
      recordedAt: dateInputToIsoUtc(parsed.recordedAt),
      weightKg: parsed.weightKg,
      bodyFatPct: parsed.bodyFatPct,
      chestCm: parsed.chestCm,
      shoulderCm: parsed.shoulderCm,
      waistCm: parsed.waistCm,
      hipCm: parsed.hipCm,
      armCm: parsed.armCm,
      thighCm: parsed.thighCm,
      calfCm: parsed.calfCm,
      notes: parsed.notes,
    };
    await onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit(handleValid)} className="flex flex-col gap-4">
      <FormField
        label={t('measurements.fields.recordedAt')}
        htmlFor="recordedAt"
        error={errors.recordedAt?.message}
      >
        <Input
          id="recordedAt"
          type="date"
          invalid={!!errors.recordedAt}
          {...register('recordedAt')}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {numericFields.map((name) => (
          <FormField
            key={name}
            label={t(`measurements.fields.${name}`)}
            htmlFor={name}
            optional
            error={errors[name]?.message}
          >
            <Input
              id={name}
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="—"
              invalid={!!errors[name]}
              {...register(name)}
            />
          </FormField>
        ))}
      </div>

      <FormField
        label={t('measurements.fields.notes')}
        htmlFor="notes"
        optional
        error={errors.notes?.message}
      >
        <Textarea id="notes" rows={3} {...register('notes')} />
      </FormField>

      <div className="sticky bottom-0 z-10 -mx-5 mt-2 flex gap-2 border-t border-line/60 bg-app/90 px-5 py-3 backdrop-blur sm:bg-surface/90">
        <Button
          type="button"
          variant="ghost"
          fullWidth
          onClick={() => navigate(-1)}
          disabled={submitting}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          fullWidth
          disabled={submitting}
          leadingIcon={<Save className="h-4 w-4" />}
        >
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
