import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/button';
import { ExercisePicker } from '@/modules/exercises/components/exercise-picker';
import type { SessionExercise } from '../domain/workout.types';
import type { ExerciseReplacement } from '../services/session.service';

type Props = {
  // null = fechado
  exercise: SessionExercise | null;
  submitting?: boolean;
  onConfirm: (replacement: ExerciseReplacement) => void;
  onCancel: () => void;
};

export function ReplaceExerciseDialog({
  exercise,
  submitting,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = exercise !== null;
  const [name, setName] = useState('');
  const [libraryId, setLibraryId] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // Começa vazio: a ideia é buscar o substituto, não editar o atual.
      setName('');
      setLibraryId(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const trimmed = name.trim();
  const sameAsCurrent =
    !!exercise && trimmed.toLowerCase() === exercise.name.trim().toLowerCase();
  const canConfirm = trimmed !== '' && !sameAsCurrent && !submitting;
  const hasCompletedSets = !!exercise?.sets.some((s) => s.completed);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto mt-[10vh] w-[min(94vw,30rem)] rounded-2xl border border-line bg-surface p-0 text-fg backdrop:bg-black/70"
    >
      {exercise && (
        <div className="flex flex-col gap-4 p-5">
          <div>
            <h2 className="text-lg font-semibold">{t('workouts.replaceTitle')}</h2>
            <p className="mt-1 text-sm text-fg-muted">
              {t('workouts.replaceBody', {
                name: exercise.replacedFrom?.name ?? exercise.name,
              })}
            </p>
          </div>

          <ExercisePicker
            name={name}
            libraryId={libraryId}
            onSelect={(ex) => {
              setName(ex.name);
              setLibraryId(ex.id);
            }}
            onFreeName={(free) => {
              setName(free);
              setLibraryId(null);
            }}
          />

          {hasCompletedSets && (
            <p className="rounded-lg border border-dashed border-warmup/50 bg-warmup/10 px-3 py-2 text-xs text-warmup">
              {t('workouts.replaceResetsSets')}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={!canConfirm}
              onClick={() => onConfirm({ name: trimmed, libraryId })}
            >
              {t('workouts.replaceConfirm')}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
