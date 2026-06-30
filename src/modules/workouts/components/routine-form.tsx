import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Save } from 'lucide-react';
import { formatRestInput } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { FormField } from '@/shared/ui/form-field';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
  routineFormSchema,
  type RoutineFormParsed,
  type RoutineFormValues,
} from '../domain/workout.schema';
import type { Routine } from '../domain/workout.types';
import type { RoutineInput } from '../services/routine.service';
import { ExerciseBlock } from './exercise-block';
import { newId } from '@/shared/lib/uuid';

type Props = {
  initial?: Routine;
  onSubmit: (input: RoutineInput) => Promise<void> | void;
  submitting?: boolean;
};

function toStr(v: number | null): string {
  return v === null ? '' : String(v);
}

function buildDefaults(initial?: Routine): RoutineFormValues {
  if (!initial) {
    return {
      name: '',
      notes: '',
      exercises: [
        {
          id: newId(),
          name: '',
          notes: '',
          restSeconds: '',
          sets: [
            {
              id: newId(),
              type: 'normal',
              reps: '',
              weightKg: '',
            },
          ],
        },
      ],
    };
  }
  return {
    name: initial.name,
    notes: initial.notes ?? '',
    exercises: initial.exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      notes: ex.notes ?? '',
      restSeconds: formatRestInput(ex.restSeconds),
      sets: ex.sets.map((s) => ({
        id: s.id,
        type: s.type,
        reps: s.reps ?? '',
        weightKg: toStr(s.weightKg),
      })),
    })),
  };
}

export function RoutineForm({ initial, onSubmit, submitting }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const form = useForm<RoutineFormValues, unknown, RoutineFormParsed>({
    resolver: zodResolver(routineFormSchema),
    defaultValues: buildDefaults(initial),
  });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  const exerciseArray = useFieldArray({ control, name: 'exercises' });

  const handleValid: SubmitHandler<RoutineFormParsed> = async (parsed) => {
    const input: RoutineInput = {
      name: parsed.name,
      notes: parsed.notes,
      exercises: parsed.exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        notes: ex.notes,
        restSeconds: ex.restSeconds,
        sets: ex.sets.map((s) => ({
          id: s.id,
          type: s.type,
          reps: s.reps,
          weightKg: s.weightKg,
        })),
      })),
    };
    await onSubmit(input);
  };

  return (
    <form onSubmit={handleSubmit(handleValid)} className="flex flex-col gap-4">
      <FormField
        label={t('workouts.routineName')}
        htmlFor="name"
        error={errors.name?.message}
      >
        <Input
          id="name"
          placeholder="Ex.: Push A"
          invalid={!!errors.name}
          {...register('name')}
        />
      </FormField>

      <FormField
        label={t('workouts.routineNotes')}
        htmlFor="notes"
        optional
        error={errors.notes?.message}
      >
        <Textarea id="notes" rows={2} {...register('notes')} />
      </FormField>

      <ul className="flex flex-col gap-3">
        {exerciseArray.fields.map((field, index) => (
          <li key={field.id}>
            <ExerciseBlock
              index={index}
              control={control}
              register={register}
              errors={errors}
              onRemove={() => exerciseArray.remove(index)}
            />
          </li>
        ))}
      </ul>

      {errors.exercises?.message && (
        <p className="text-xs text-failure">{errors.exercises.message}</p>
      )}

      <Button
        type="button"
        variant="secondary"
        fullWidth
        leadingIcon={<Plus className="h-4 w-4" />}
        onClick={() =>
          exerciseArray.append({
            id: newId(),
            name: '',
            notes: '',
            restSeconds: '',
            sets: [
              {
                id: newId(),
                type: 'normal',
                reps: '',
                weightKg: '',
              },
            ],
          })
        }
      >
        {t('workouts.addExercise')}
      </Button>

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
