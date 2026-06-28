import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { PageHeader } from '@/shared/ui/page-header';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Textarea } from '@/shared/ui/textarea';
import { IconButton } from '@/shared/ui/icon-button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  useDeleteSession,
  useFinishSession,
  useSessionQuery,
  useUpdateSessionNotes,
  useUpdateSessionSet,
} from '../hooks/use-sessions';
import { SessionSetRow } from '../components/session-set-row';
import { sessionService } from '../services/session.service';
import { formatDuration } from '@/shared/lib/format';

export function SessionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ sessionId: string }>();
  const id = params.sessionId;

  const detail = useSessionQuery(id);
  const updateSet = useUpdateSessionSet();
  const updateNotes = useUpdateSessionNotes();
  const finishMutation = useFinishSession();
  const deleteMutation = useDeleteSession();

  const [notesDraft, setNotesDraft] = useState('');
  const [discardOpen, setDiscardOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handle = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(handle);
  }, []);

  useEffect(() => {
    if (detail.data) setNotesDraft(detail.data.notes ?? '');
  }, [detail.data]);

  const session = detail.data;
  const stats = useMemo(
    () => (session ? sessionService.stats(session) : null),
    // Recompute when session changes OR every second to update timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, tick],
  );

  async function handleFinish() {
    if (!id) return;
    await finishMutation.mutateAsync(id);
    setFinishOpen(false);
    navigate(`/treino/historico/${id}`);
  }

  async function handleDiscard() {
    if (!id) return;
    await deleteMutation.mutateAsync(id);
    setDiscardOpen(false);
    navigate('/treino');
  }

  function handleNotesBlur() {
    if (!id || !session) return;
    const newNotes = notesDraft.trim().length === 0 ? null : notesDraft.trim();
    if (newNotes !== session.notes) {
      void updateNotes.mutateAsync({ sessionId: id, notes: newNotes });
    }
  }

  if (detail.isLoading) {
    return (
      <>
        <PageHeader title={t('workouts.title')} back="/treino" />
        <p className="py-8 text-center text-sm text-fg-muted">
          {t('common.loading')}
        </p>
      </>
    );
  }

  if (!session) {
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
        title={session.routineName}
        back="/treino"
        actions={
          <>
            <IconButton
              label={t('workouts.discard')}
              tone="danger"
              onClick={() => setDiscardOpen(true)}
            >
              <Trash2 className="h-5 w-5" />
            </IconButton>
            <Button size="sm" onClick={() => setFinishOpen(true)}>
              {t('workouts.finish')}
            </Button>
          </>
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

      <ul className="flex flex-col gap-3">
        {session.exercises.map((exercise) => {
          let workingIndex = 0;
          return (
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
                {exercise.restSeconds !== null && (
                  <p className="mt-1 text-xs text-accent">
                    {t('workouts.restSeconds')}: {exercise.restSeconds}s
                  </p>
                )}
                <div className="mt-3 grid grid-cols-[2.25rem_minmax(0,5rem)_1fr_1fr_2.25rem] gap-2 px-2 text-xs uppercase tracking-wide text-fg-subtle">
                  <span>{t('workouts.set')}</span>
                  <span>{t('workouts.previous')}</span>
                  <span>{t('workouts.weight')}</span>
                  <span>{t('workouts.reps')}</span>
                  <span />
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  {exercise.sets.map((set) => {
                    if (set.type === 'normal') workingIndex += 1;
                    const workingN =
                      set.type === 'normal' ? workingIndex : undefined;
                    return (
                      <SessionSetRow
                        key={set.id}
                        set={set}
                        workingNumber={workingN}
                        onChange={(patch) =>
                          updateSet.mutate({
                            sessionId: session.id,
                            exerciseId: exercise.id,
                            setId: set.id,
                            patch,
                          })
                        }
                      />
                    );
                  })}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Card className="mt-4">
        <label
          htmlFor="session-notes"
          className="mb-2 block text-sm font-medium text-fg-muted"
        >
          {t('common.notes')}
        </label>
        <Textarea
          id="session-notes"
          rows={3}
          placeholder={t('workouts.addNotes')}
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={handleNotesBlur}
        />
      </Card>

      <ConfirmDialog
        open={discardOpen}
        title={t('workouts.discard')}
        description={t('workouts.discardConfirm')}
        destructive
        confirmLabel={t('workouts.discard')}
        onConfirm={handleDiscard}
        onCancel={() => setDiscardOpen(false)}
      />
      <ConfirmDialog
        open={finishOpen}
        title={t('workouts.finish')}
        description={t('workouts.finishConfirm')}
        confirmLabel={t('workouts.finish')}
        onConfirm={handleFinish}
        onCancel={() => setFinishOpen(false)}
      />
    </>
  );
}
