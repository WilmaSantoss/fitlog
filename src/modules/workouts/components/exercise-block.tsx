import {
  useFieldArray,
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

  const { fields, append } = useFieldArray({
    control,
    name: `exercises.${index}.sets` as const,
  });

  const exerciseErrors = errors.exercises?.[index];

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

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label={t('workouts.restSeconds')}
          htmlFor={`exercises.${index}.restSeconds`}
          optional
          error={exerciseErrors?.restSeconds?.message}
        >
          <Input
            id={`exercises.${index}.restSeconds`}
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="90"
            invalid={!!exerciseErrors?.restSeconds}
            {...register(`exercises.${index}.restSeconds` as const)}
          />
        </FormField>
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
      </div>

      <div>
        <div className="mb-2 grid grid-cols-[3.5rem_1fr_1fr] items-center gap-2 px-1 text-xs uppercase tracking-wide text-fg-subtle">
          <span>Tipo</span>
          <span>{t('workouts.weight')}</span>
          <span>{t('workouts.reps')}</span>
        </div>
        <ul className="flex flex-col gap-2">
          {fields.map((field, setIndex) => {
            const setErrors = exerciseErrors?.sets?.[setIndex];
            return (
              <li
                key={field.id}
                className="grid grid-cols-[3.5rem_1fr_1fr] items-center gap-2"
              >
                <Select
                  aria-label={t('workouts.setType')}
                  invalid={!!setErrors?.type}
                  {...register(
                    `exercises.${index}.sets.${setIndex}.type` as const,
                  )}
                >
                  {SET_TYPES.map((type: SetType) => (
                    <option key={type} value={type}>
                      {t(`workouts.setTypeShort.${type}`, { n: setIndex + 1 })}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  step="0.5"
                  inputMode="decimal"
                  placeholder="kg"
                  invalid={!!setErrors?.weightKg}
                  {...register(
                    `exercises.${index}.sets.${setIndex}.weightKg` as const,
                  )}
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="reps"
                  invalid={!!setErrors?.reps}
                  {...register(
                    `exercises.${index}.sets.${setIndex}.reps` as const,
                  )}
                />
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
              type: 'normal',
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
