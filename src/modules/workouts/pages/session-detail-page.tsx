import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { PageHeader } from '@/shared/ui/page-header';
import { IconButton } from '@/shared/ui/icon-button';
import { Card } from '@/shared/ui/card';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  useDeleteSession,
  useSessionQuery,
} from '../hooks/use-sessions';
import { sessionService } from '../services/session.service';
import { SetTypePill } from '../components/set-type-pill';
import { formatDate, formatTime } from '@/shared/lib/date';
import { formatDuration, formatKg, formatInt } from '@/shared/lib/format';

export function SessionDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ sessionId: string }>();
  const id = params.sessionId;
  const detail = useSessionQuery(id);
  const deleteMutation = useDeleteSession();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const session = detail.data;
  const stats = session ? sessionService.stats(session) : null;

  async function handleDelete() {
    if (!id) return;
    await deleteMutation.mutateAsync(id);
    setConfirmDeleteOpen(false);
    navigate('/treino?tab=history');
  }

  if (detail.isLoading) {
    return (
      <>
        <PageHeader title={t('workouts.title')} back="/treino?tab=history" />
        <p className="py-8 text-center text-sm text-fg-muted">
          {t('common.loading')}
        </p>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <PageHeader title={t('workouts.title')} back="/treino?tab=history" />
        <p className="py-8 text-center text-sm text-fg-muted">
          {t('common.empty')}
        </p>
      </>
    );
  }

  const date = session.finishedAt ?? session.startedAt;

  return (
    <>
      <PageHeader
        title={session.routineName}
        subtitle={`${formatDate(date)} · ${formatTime(date)}`}
        back="/treino?tab=history"
        actions={
          <IconButton
            label={t('common.delete')}
            tone="danger"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash2 className="h-5 w-5" />
          </IconButton>
        }
      />

      {stats && (
        <Card className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-fg-subtle">
              {t('workouts.duration')}
            </p>
            <p className="text-lg font-semibold text-accent">
              {stats.durationSeconds !== null
                ? formatDuration(stats.durationSeconds)
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-fg-subtle">
              {t('workouts.volume')}
            </p>
            <p className="text-lg font-semibold text-fg">
              {stats.totalVolumeKg} kg
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-fg-subtle">
              {t('workouts.sets')}
            </p>
            <p className="text-lg font-semibold text-fg">
              {stats.completedSets} / {stats.totalSets}
            </p>
          </div>
        </Card>
      )}

      {session.notes && (
        <Card className="mb-4 whitespace-pre-wrap text-sm text-fg-muted">
          {session.notes}
        </Card>
      )}

      <ul className="flex flex-col gap-3">
        {session.exercises.map((exercise) => {
          let workingIndex = 0;
          return (
            <li key={exercise.id}>
              <Card>
                <h2 className="text-base font-semibold text-accent">
                  {exercise.name}
                </h2>
                <div className="mt-3 grid grid-cols-[2.25rem_1fr_1fr_2rem] gap-2 text-xs uppercase tracking-wide text-fg-subtle">
                  <span>{t('workouts.set')}</span>
                  <span>{t('workouts.weight')}</span>
                  <span>{t('workouts.reps')}</span>
                  <span />
                </div>
                <ul>
                  {exercise.sets.map((set) => {
                    if (set.type === 'normal') workingIndex += 1;
                    const workingN =
                      set.type === 'normal' ? workingIndex : undefined;
                    return (
                      <li
                        key={set.id}
                        className="grid grid-cols-[2.25rem_1fr_1fr_2rem] items-center gap-2 border-t border-line/40 py-2 text-sm"
                      >
                        <SetTypePill type={set.type} workingNumber={workingN} />
                        <span className="text-fg">
                          {formatKg(set.actualWeightKg ?? set.plannedWeightKg)}
                        </span>
                        <span className="text-fg">
                          {set.actualReps !== null
                            ? formatInt(set.actualReps)
                            : (set.plannedReps ?? '—')}
                        </span>
                        <span
                          className={
                            set.completed
                              ? 'text-success text-base'
                              : 'text-fg-subtle text-base'
                          }
                        >
                          {set.completed ? '✓' : '·'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title={t('common.delete')}
        description={t('workouts.deleteSessionConfirm')}
        destructive
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}
