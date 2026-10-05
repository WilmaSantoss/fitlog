import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { IconButton } from '@/shared/ui/icon-button';
import type { LibraryExercise } from '../domain/exercise.types';
import { ExerciseAnimation } from './exercise-animation';

type Props = {
  exercise: LibraryExercise | null;
  onClose: () => void;
};

// Animação em tamanho grande — no celular a miniatura do form é pequena
// demais pra entender o movimento.
export function ExercisePreviewDialog({ exercise, onClose }: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = exercise !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // Clique no fundo escuro (fora do conteúdo) fecha.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-[min(94vw,40rem)] overflow-hidden rounded-2xl border border-line bg-surface p-0 text-fg backdrop:bg-black/70"
    >
      {exercise && (
        <div className="flex flex-col">
          <ExerciseAnimation exercise={exercise} />
          <div className="flex items-start gap-3 p-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold">{exercise.name}</h2>
              <p className="mt-0.5 text-xs text-fg-muted">
                {exercise.primaryMuscles
                  .map((m) => t(`exercises.muscles.${m}`))
                  .join(' · ')}
              </p>
            </div>
            <IconButton label={t('common.close')} onClick={onClose}>
              <X className="h-5 w-5" />
            </IconButton>
          </div>
        </div>
      )}
    </dialog>
  );
}
