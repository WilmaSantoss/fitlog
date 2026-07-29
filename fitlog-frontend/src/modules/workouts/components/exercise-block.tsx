import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { FormField } from '@/shared/ui/form-field';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { SET_TYPES, type SetType } from '../domain/workout.types';
import type {
  RoutineFormParsed,
  RoutineFormValues,
} from '../domain/workout.schema';
import { newId } from '@/shared/lib/uuid';
import { VideoUpload } from './video-upload';

type Props = {
  index: number;
  control: Control<RoutineFormValues, unknown, RoutineFormParsed>;
  register: UseFormRegister<RoutineFormValues>;
  errors: FieldErrors<RoutineFormValues>;
  onRemove: () => void;
};

export function ExerciseBlock({
  index,
  control,
  register,
  errors,
  onRemove,
}: Props) {
  const { t } = useTranslation();

  const { fields, append, remove } = useFieldArray({
    control,
    name: `exercises.${index}.sets` as const,
  });

  const exerciseId = useWatch({
    control,
    name: `exercises.${index}.id` as const,
  });

  const exerciseErrors = errors.exercises?.[index];
  const restsErrors = exerciseErrors?.rests;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <FormField
            label={t('workouts.exerciseName')}
            htmlFor={`exercises.${index}.name`}
            error={exerciseErrors?.name?.message}
          >
            <Input
              id={`exercises.${index}.name`}
              placeholder="Ex.: Supino reto"
              invalid={!!exerciseErrors?.name}
              {...register(`exercises.${index}.name` as const)}
            />
          </FormField>
        </div>
        <div className="pt-7">
          <IconButton
            label={t('workouts.removeExercise')}
            tone="danger"
            onClick={onRemove}
          >
            <Trash2 className="h-5 w-5" />
          </IconButton>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-fg-muted">
          {t('workouts.restsByTypeLabel')}
        </span>
        <div className="grid grid-cols-3 gap-2">
          <FormField
            label="WU"
            htmlFor={`exercises.${index}.rests.WU`}
            optional
            error={restsErrors?.WU?.message}
          >
            <Input
              id={`exercises.${index}.rests.WU`}
              type="text"
              inputMode="text"
              placeholder="—"
              invalid={!!restsErrors?.WU}
              {...register(`exercises.${index}.rests.WU` as const)}
            />
          </FormField>
          <FormField
            label="FS"
            htmlFor={`exercises.${index}.rests.FS`}
            optional
            error={restsErrors?.FS?.message}
          >
            <Input
              id={`exercises.${index}.rests.FS`}
              type="text"
              inputMode="text"
              placeholder="—"
              invalid={!!restsErrors?.FS}
              {...register(`exercises.${index}.rests.FS` as const)}
            />
          </FormField>
          <FormField
            label="WS"
            htmlFor={`exercises.${index}.rests.WS`}
            optional
            error={restsErrors?.WS?.message}
          >
            <Input
              id={`exercises.${index}.rests.WS`}
              type="text"
              inputMode="text"
              placeholder="—"
              invalid={!!restsErrors?.WS}
              {...register(`exercises.${index}.rests.WS` as const)}
            />
          </FormField>
        </div>
        <span className="text-xs text-fg-subtle">
          {t('workouts.restsByTypeHint')}
        </span>
      </div>

      <FormField
        label={t('workouts.exerciseNotes')}
        htmlFor={`exercises.${index}.notes`}
        optional
        error={exerciseErrors?.notes?.message}
      >
        <Input
          id={`exercises.${index}.notes`}
          placeholder="—"
          {...register(`exercises.${index}.notes` as const)}
        />
      </FormField>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-fg-muted">
          Vídeo do exercício{' '}
          <span className="text-fg-subtle">({t('common.optional')})</span>
        </span>
        <Controller
          control={control}
          name={`exercises.${index}.videoUrl` as const}
          render={({ field }) => (
            <VideoUpload
              exerciseId={exerciseId}
              videoUrl={field.value ?? null}
              onChange={(url) => field.onChange(url)}
            />
          )}
        />
      </div>

      <div>
        <p className="mb-1 text-[11px] text-fg-subtle">
          {t('workouts.setTypesLegend')}
        </p>
        <div className="mb-2 grid grid-cols-[3.5rem_1fr_1fr_2.25rem] items-center gap-2 px-1 text-xs uppercase tracking-wide text-fg-subtle">
          <span>Tipo</span>
          <span>{t('workouts.weight')}</span>
          <span>{t('workouts.reps')}</span>
          <span />
        </div>
        <ul className="flex flex-col gap-2">
          {fields.map((field, setIndex) => {
            const setErrors = exerciseErrors?.sets?.[setIndex];
            return (
              <li
                key={field.id}
                className="grid grid-cols-[3.5rem_1fr_1fr_2.25rem] items-center gap-2"
              >
                <Select
                  aria-label={t('workouts.setType')}
                  invalid={!!setErrors?.type}
                  {...register(
                    `exercises.${index}.sets.${setIndex}.type` as const,
                  )}
                >
                  {SET_TYPES.map((type: SetType) => (
                    <option key={type} value={type} title={t(`workouts.setTypes.${type}`)}>
                      {type}
                    </option>
                  ))}
                </Select>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="kg"
                  invalid={!!setErrors?.weightKg}
                  {...register(
                    `exercises.${index}.sets.${setIndex}.weightKg` as const,
                  )}
                />
                <Input
                  type="text"
                  inputMode="text"
                  placeholder="8, 5-9 ou 4+4+4"
                  invalid={!!setErrors?.reps}
                  {...register(
                    `exercises.${index}.sets.${setIndex}.reps` as const,
                  )}
                />
                <IconButton
                  label={t('workouts.removeSet')}
                  tone="danger"
                  className="h-9 w-9"
                  onClick={() => remove(setIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </li>
            );
          })}
        </ul>
        {exerciseErrors?.sets?.message && (
          <p className="mt-1 text-xs text-failure">
            {exerciseErrors.sets.message}
          </p>
        )}
        <Button
          type="button"
          variant="ghost"
          fullWidth
          className="mt-2"
          leadingIcon={<Plus className="h-4 w-4" />}
          onClick={() =>
            append({
              id: newId(),
              type: 'WS',
              reps: '',
              weightKg: '',
            })
          }
        >
          {t('workouts.addSet')}
        </Button>
      </div>
    </Card>
  );
}
