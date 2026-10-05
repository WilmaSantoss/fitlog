import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2 } from 'lucide-react';
import { useLibraryExerciseQuery } from '../hooks/use-exercise-library';
import { ExerciseAnimation } from './exercise-animation';
import { ExercisePreviewDialog } from './exercise-preview-dialog';

type Props = {
  libraryId: string;
};

// Miniatura compacta (modo sem animação grande no treino): toque na foto ou
// em "Ver" abre a animação em tamanho grande.
export function LibraryExerciseThumb({ libraryId }: Props) {
  const { t } = useTranslation();
  const q = useLibraryExerciseQuery(libraryId);
  const [open, setOpen] = useState(false);
  const exercise = q.data;
  if (!exercise) return null;

  return (
    <div className="flex w-24 shrink-0 flex-col items-stretch gap-1.5">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('exercises.view')}
        className="overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        <ExerciseAnimation exercise={exercise} />
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1 rounded-md border border-line bg-surface-2 py-1 text-xs font-medium text-fg-muted transition-colors hover:text-fg"
      >
        <Maximize2 className="h-3 w-3" />
        {t('exercises.view')}
      </button>
      <ExercisePreviewDialog
        exercise={open ? exercise : null}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
