import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Play } from 'lucide-react';
import type { Routine } from '../domain/workout.types';

type Props = {
  routine: Routine;
  onStart: (routine: Routine) => void;
};

export function RoutineCard({ routine, onStart }: Props) {
  const { t } = useTranslation();
  const preview = routine.exercises
    .slice(0, 4)
    .map((e) => e.name)
    .join(', ');
  const moreCount = Math.max(0, routine.exercises.length - 4);

  return (
    <Card className="flex flex-col gap-3">
      <Link to={`/treino/${routine.id}`} className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-fg">{routine.name}</h2>
        {routine.exercises.length === 0 ? (
          <p className="text-sm text-fg-subtle">
            {t('workouts.routinesEmpty')}
          </p>
        ) : (
          <p className="line-clamp-2 text-sm text-fg-muted">
            {preview}
            {moreCount > 0 && ` +${moreCount}`}
          </p>
        )}
      </Link>
      <Button
        fullWidth
        onClick={() => onStart(routine)}
        leadingIcon={<Play className="h-4 w-4" />}
        disabled={routine.exercises.length === 0}
      >
        {t('workouts.startRoutine')}
      </Button>
    </Card>
  );
}
