import {
  useController,
  useFieldArray,
  useWatch,
  type Control,
  type UseFormRegister,
  type FieldErrors,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { NotebookPen, Plus, Trash2, X } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { SET_TYPES, type SetType } from '../domain/workout.types';
import type {
  RoutineFormParsed,
  RoutineFormValues,
} from '../domain/workout.schema';
import { newId } from '@/shared/lib/uuid';
import { ExercisePicker } from '@/modules/exercises/components/exercise-picker';
import { ExerciseNoteDialog } from './exercise-note-dialog';

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
  // Valores atuais das séries (fields só reflete o array, não o select de
  // tipo que a usuária mudou). Série nova repete o tipo da última; sem
  // nenhuma, começa em WU.
  const currentSets = useWatch({
    control,
    name: `exercises.${index}.sets` as const,
  });
  const nextSetType: SetType = currentSets?.at(-1)?.type ?? 'WU';

  const exerciseErrors = errors.exercises?.[index];

  // Nome e vínculo com a biblioteca andam juntos: escolher da lista preenche
  // os dois; digitar livre zera o vínculo.
  const { field: nameField } = useController({
    control,
    name: `exercises.${index}.name` as const,
  });
  const { field: libraryIdField } = useController({
    control,
    name: `exercises.${index}.libraryId` as const,
  });
  // Nota fica num modal; no card só o ícone (destacado quando tem nota).
  const { field: notesField } = useController({
    control,
    name: `exercises.${index}.notes` as const,
  });
  const [noteOpen, setNoteOpen] = useState(false);
  const hasNote = (notesField.value ?? '').trim() !== '';

  return (
    <Card className="flex flex-col gap-3">
      {/* Lixeira no topo do card, alinhada ao rótulo — remove o exercício
          inteiro, não só o nome. */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={`exercises.${index}.name`}
            className="text-sm font-medium text-fg-muted"
          >
            {t('workouts.exerciseName')}
          </label>
          <div className="-mr-1.5 flex items-center gap-0.5">
            <IconButton
              label={t(hasNote ? 'workouts.editExerciseNote' : 'workouts.addExerciseNote')}
              tone={hasNote ? 'accent' : 'default'}
              className="relative h-8 w-8"
              aria-pressed={hasNote}
              onClick={() => setNoteOpen(true)}
            >
              <NotebookPen className="h-4 w-4" />
              {hasNote && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent" />
              )}
            </IconButton>
            <IconButton
              label={t('workouts.removeExercise')}
              tone="danger"
              className="h-8 w-8"
              onClick={onRemove}
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
        <ExercisePicker
          id={`exercises.${index}.name`}
          name={nameField.value}
          libraryId={libraryIdField.value ?? null}
          invalid={!!exerciseErrors?.name}
          inputRef={nameField.ref}
          onSelect={(exercise) => {
            nameField.onChange(exercise.name);
            libraryIdField.onChange(exercise.id);
          }}
          onFreeName={(name) => {
            nameField.onChange(name);
            libraryIdField.onChange(null);
          }}
        />
        {exerciseErrors?.name?.message && (
          <p className="text-xs text-failure">{exerciseErrors.name.message}</p>
        )}
      </div>

      <ExerciseNoteDialog
        open={noteOpen}
        exerciseName={nameField.value}
        value={notesField.value ?? ''}
        onCancel={() => setNoteOpen(false)}
        onSave={(value) => {
          notesField.onChange(value);
          setNoteOpen(false);
        }}
      />

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
                  placeholder="ex: 5-9"
                  invalid={!!setErrors?.reps}
                  {...register(
                    `exercises.${index}.sets.${setIndex}.reps` as const,
                  )}
                />
                <IconButton
                  label={t('workouts.removeSet')}
                  className="h-9 w-9 hover:bg-failure/10 hover:text-failure"
                  onClick={() => remove(setIndex)}
                >
                  <X className="h-4 w-4" />
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
              type: nextSetType,
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
