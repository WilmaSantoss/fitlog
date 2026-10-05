import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui/card';
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

export const MEASUREMENT_FORM_ID = 'measurement-form';

type Props = {
  initial?: Measurement;
  onSubmit: (input: MeasurementInput) => Promise<void> | void;
};

function toStr(value: number | null): string {
  return value === null ? '' : String(value);
}

function buildDefaults(initial?: Measurement): MeasurementFormValues {
  if (!initial) {
    return {
      recordedAt: todayIsoDateOnly(),
      weightKg: '',
      bicepLeftCm: '',
      bicepRightCm: '',
      forearmLeftCm: '',
      forearmRightCm: '',
      bellyCm: '',
      waistCm: '',
      glutesCm: '',
      thighLeftCm: '',
      thighRightCm: '',
      calfLeftCm: '',
      calfRightCm: '',
      notes: '',
    };
  }
  return {
    recordedAt: isoToDateInput(initial.recordedAt),
    weightKg: toStr(initial.weightKg),
    bicepLeftCm: toStr(initial.bicepLeftCm),
    bicepRightCm: toStr(initial.bicepRightCm),
    forearmLeftCm: toStr(initial.forearmLeftCm),
    forearmRightCm: toStr(initial.forearmRightCm),
    bellyCm: toStr(initial.bellyCm),
    waistCm: toStr(initial.waistCm),
    glutesCm: toStr(initial.glutesCm),
    thighLeftCm: toStr(initial.thighLeftCm),
    thighRightCm: toStr(initial.thighRightCm),
    calfLeftCm: toStr(initial.calfLeftCm),
    calfRightCm: toStr(initial.calfRightCm),
    notes: initial.notes ?? '',
  };
}

// Agrupamos por membro/região pra dar contexto visual ao par esquerdo/direito.
type FieldGroup = {
  readonly labelKey: string;
  readonly fields: readonly (keyof MeasurementFormValues)[];
};

const groups: readonly FieldGroup[] = [
  { labelKey: 'measurements.groups.weight', fields: ['weightKg'] },
  {
    labelKey: 'measurements.groups.bicep',
    fields: ['bicepLeftCm', 'bicepRightCm'],
  },
  {
    labelKey: 'measurements.groups.forearm',
    fields: ['forearmLeftCm', 'forearmRightCm'],
  },
  {
    labelKey: 'measurements.groups.core',
    fields: ['bellyCm', 'waistCm', 'glutesCm'],
  },
  {
    labelKey: 'measurements.groups.thigh',
    fields: ['thighLeftCm', 'thighRightCm'],
  },
  {
    labelKey: 'measurements.groups.calf',
    fields: ['calfLeftCm', 'calfRightCm'],
  },
];

export function MeasurementForm({ initial, onSubmit }: Props) {
  const { t } = useTranslation();
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
      bicepLeftCm: parsed.bicepLeftCm,
      bicepRightCm: parsed.bicepRightCm,
      forearmLeftCm: parsed.forearmLeftCm,
      forearmRightCm: parsed.forearmRightCm,
      bellyCm: parsed.bellyCm,
      waistCm: parsed.waistCm,
      glutesCm: parsed.glutesCm,
      thighLeftCm: parsed.thighLeftCm,
      thighRightCm: parsed.thighRightCm,
      calfLeftCm: parsed.calfLeftCm,
      calfRightCm: parsed.calfRightCm,
      notes: parsed.notes,
    };
    await onSubmit(input);
  };

  return (
    // Cancelar/Salvar ficam no cabeçalho da página (form={MEASUREMENT_FORM_ID}).
    <form
      id={MEASUREMENT_FORM_ID}
      onSubmit={handleSubmit(handleValid)}
      className="flex flex-col gap-5 pb-[env(safe-area-inset-bottom)]"
    >
      <FormField
        label={t('measurements.fields.recordedAt')}
        htmlFor="recordedAt"
        error={errors.recordedAt?.message}
      >
        <Input
          id="recordedAt"
          type="date"
          invalid={!!errors.recordedAt}
          className="max-w-xs"
          {...register('recordedAt')}
        />
      </FormField>

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <Card key={group.labelKey} className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
                {t(group.labelKey)}
              </h3>
              <span className="h-px flex-1 bg-line/60" />
            </div>
            <div
              className={
                group.fields.length === 1
                  ? 'grid max-w-xs grid-cols-1 gap-3'
                  : 'grid grid-cols-2 gap-3 sm:grid-cols-3'
              }
            >
              {group.fields.map((name) => (
                <FormField
                  key={name}
                  label={t(`measurements.fields.${name}`)}
                  htmlFor={name}
                  optional
                  error={errors[name]?.message}
                >
                  <Input
                    id={name}
                    type="text"
                    inputMode="decimal"
                    placeholder="—"
                    invalid={!!errors[name]}
                    {...register(name)}
                  />
                </FormField>
              ))}
            </div>
          </Card>
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

    </form>
  );
}
