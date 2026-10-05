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
import { SET_TYPES, type Routine } from '../domain/workout.types';
import {
  routineRests,
  type RoutineInput,
} from '../services/routine.service';
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

function emptyRests() {
  return { WU: '', FS: '', WS: '' };
}

function buildDefaults(initial?: Routine): RoutineFormValues {
  if (!initial) {
    return {
      name: '',
      notes: '',
      rests: emptyRests(),
      exercises: [
        {
          id: newId(),
          name: '',
          libraryId: null,
          notes: '',
          videoUrl: null,
          sets: [
            {
              id: newId(),
              type: 'WU',
              reps: '',
              weightKg: '',
            },
          ],
        },
      ],
    };
  }
  const rests = routineRests(initial);
  return {
    name: initial.name,
    notes: initial.notes ?? '',
    rests: {
      WU: formatRestInput(rests.WU),
      FS: formatRestInput(rests.FS),
      WS: formatRestInput(rests.WS),
    },
    exercises: initial.exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      libraryId: ex.libraryId,
      notes: ex.notes ?? '',
      videoUrl: ex.videoUrl ?? null,
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
        libraryId: ex.libraryId,
        notes: ex.notes,
        rests: parsed.rests,
        videoUrl: ex.videoUrl,
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

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-fg-muted">
          {t('workouts.restsByTypeLabel')}
        </span>
        <div className="grid grid-cols-3 gap-2">
          {SET_TYPES.map((type) => (
            <FormField
              key={type}
              label={type}
              htmlFor={`rests.${type}`}
              error={errors.rests?.[type]?.message}
            >
              <Input
                id={`rests.${type}`}
                type="text"
                inputMode="text"
                placeholder="—"
                invalid={!!errors.rests?.[type]}
                {...register(`rests.${type}` as const)}
              />
            </FormField>
          ))}
        </div>
        <span className="text-xs text-fg-subtle">
          {t('workouts.restsByTypeHint')}
        </span>
      </div>

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
            libraryId: null,
            notes: '',
            videoUrl: null,
            sets: [
              {
                id: newId(),
                type: 'WU',
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
