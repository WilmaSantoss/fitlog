import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Pencil, Play, Trash2 } from 'lucide-react';
import { PageHeader } from '@/shared/ui/page-header';
import { IconButton } from '@/shared/ui/icon-button';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  useDeleteRoutine,
  useDuplicateRoutine,
  useRoutineQuery,
} from '../hooks/use-routines';
import { useStartSessionFromRoutine } from '../hooks/use-sessions';
import { SetTypePill } from '../components/set-type-pill';
import { formatKg, formatDuration } from '@/shared/lib/format';

export function RoutineDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ routineId: string }>();
  const id = params.routineId;
  const detail = useRoutineQuery(id);
  const startMutation = useStartSessionFromRoutine();
  const duplicateMutation = useDuplicateRoutine();
  const deleteMutation = useDeleteRoutine();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const routine = detail.data;

  async function handleStart() {
    if (!id) return;
    const session = await startMutation.mutateAsync(id);
    if (session) navigate(`/treino/sessao/${session.id}`);
  }

  async function handleDuplicate() {
    if (!id) return;
    const copy = await duplicateMutation.mutateAsync(id);
    if (copy) navigate(`/treino/${copy.id}`);
  }

  async function handleDelete() {
    if (!id) return;
    await deleteMutation.mutateAsync(id);
    setConfirmDeleteOpen(false);
    navigate('/treino');
  }

  if (detail.isLoading) {
    return (
      <>
        <PageHeader title="…" back="/treino" />
        <p className="py-8 text-center text-sm text-fg-muted">
          {t('common.loading')}
        </p>
      </>
    );
  }

  if (!routine) {
    return (
      <>
        <PageHeader title={t('workouts.title')} back="/treino" />
        <p className="py-8 text-center text-sm text-fg-muted">
          {t('common.empty')}
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={routine.name}
        back="/treino"
        actions={
          <>
            <IconButton
              label={t('common.edit')}
              onClick={() => navigate(`/treino/${routine.id}/editar`)}
            >
              <Pencil className="h-5 w-5" />
            </IconButton>
            <IconButton
              label={t('common.duplicate')}
              onClick={handleDuplicate}
            >
              <Copy className="h-5 w-5" />
            </IconButton>
            <IconButton
              label={t('common.delete')}
              tone="danger"
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 className="h-5 w-5" />
            </IconButton>
          </>
        }
      />

      {routine.notes && (
        <Card className="mb-4 whitespace-pre-wrap text-sm text-fg-muted">
          {routine.notes}
        </Card>
      )}

      <Button
        fullWidth
        size="lg"
        className="mb-4"
        leadingIcon={<Play className="h-5 w-5" />}
        onClick={handleStart}
        disabled={routine.exercises.length === 0}
      >
        {t('workouts.startRoutine')}
      </Button>

      <ul className="flex flex-col gap-3">
        {routine.exercises.map((exercise) => (
          <li key={exercise.id}>
            <Card>
              <h2 className="text-base font-semibold text-accent">
                {exercise.name}
              </h2>
              {exercise.notes && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-fg-muted">
                  {exercise.notes}
                </p>
              )}
              {(() => {
                const parts: string[] = [];
                if (exercise.rests.WU !== null)
                  parts.push(`WU ${formatDuration(exercise.rests.WU)}`);
                if (exercise.rests.FS !== null)
                  parts.push(`FS ${formatDuration(exercise.rests.FS)}`);
                if (exercise.rests.WS !== null)
                  parts.push(`WS ${formatDuration(exercise.rests.WS)}`);
                return parts.length > 0 ? (
                  <p className="mt-1 text-xs text-accent">
                    {t('workouts.rest')}: {parts.join(' · ')}
                  </p>
                ) : null;
              })()}
              <div className="mt-3 grid grid-cols-[3.5rem_1fr_1fr] gap-2 text-xs uppercase tracking-wide text-fg-subtle">
                <span>{t('workouts.set')}</span>
                <span>{t('workouts.weight')}</span>
                <span>{t('workouts.reps')}</span>
              </div>
              <ul className="mt-1 flex flex-col">
                {exercise.sets.map((set) => (
                  <li
                    key={set.id}
                    className="grid grid-cols-[3.5rem_1fr_1fr] items-center gap-2 border-t border-line/40 py-2 text-sm"
                  >
                    <SetTypePill type={set.type} />
                    <span className="text-fg">{formatKg(set.weightKg)}</span>
                    <span className="text-fg">{set.reps ?? '—'}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title={t('common.delete')}
        description={t('workouts.deleteRoutineConfirm')}
        destructive
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}
