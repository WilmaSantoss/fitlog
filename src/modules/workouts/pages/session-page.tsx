import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Textarea } from '@/shared/ui/textarea';
import { IconButton } from '@/shared/ui/icon-button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  useDeleteSession,
  useExerciseSummariesQuery,
  useFinishSession,
  usePreviousByExerciseQuery,
  useRoutineExerciseAveragesQuery,
  useSessionQuery,
  useUpdateSessionNotes,
  useUpdateSessionSet,
} from '../hooks/use-sessions';
import { SessionSetRow } from '../components/session-set-row';
import { sessionService } from '../services/session.service';
import { formatClock, formatDuration, formatNumber } from '@/shared/lib/format';

export function SessionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ sessionId: string }>();
  const id = params.sessionId;

  const detail = useSessionQuery(id);
  const previousQ = usePreviousByExerciseQuery(id);
  const summariesQ = useExerciseSummariesQuery();
  const averagesQ = useRoutineExerciseAveragesQuery(
    detail.data?.routineId ?? null,
    id,
  );

  const prByExercise = useMemo(() => {
    const map = new Map<string, NonNullable<typeof summariesQ.data>[number]['pr']>();
    for (const s of summariesQ.data ?? []) {
      if (s.pr) map.set(s.name.trim().toLowerCase(), s.pr);
    }
    return map;
  }, [summariesQ.data]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, tick],
  );

  async function handleFinish() {
    if (!id) return;
    await finishMutation.mutateAsync(id);
    setFinishOpen(false);
    navigate(`/treino/historico/${id}`);
    // Após visualizar o detalhe, o usuário volta pra /treino?tab=history pelo botão back
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
      <p className="py-8 text-center text-sm text-fg-muted">
        {t('common.loading')}
      </p>
    );
  }

  if (!session) {
    return (
      <p className="py-8 text-center text-sm text-fg-muted">
        {t('common.empty')}
      </p>
    );
  }

  const previousMap = previousQ.data ?? new Map();
  const averagesMap = averagesQ.data ?? new Map();

  function exerciseStartIso(index: number): string {
    if (index === 0) return session!.startedAt;
    const prev = session!.exercises[index - 1];
    return prev?.completedAt ?? session!.startedAt;
  }

  return (
    <div className="flex flex-col gap-4 pt-2 md:pt-2">
      <div className="sticky top-0 z-20 -mx-5 border-b border-line/60 bg-app/95 px-5 pb-3 pt-3 backdrop-blur md:-mx-10 md:px-10">
        <div className="flex items-center gap-3">
          <IconButton
            label={t('common.back')}
            onClick={() => navigate('/treino')}
          >
            <ChevronLeft className="h-5 w-5" />
          </IconButton>
          <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-fg md:text-lg">
            {session.routineName}
          </h1>
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {stats && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-fg-subtle">
                {t('workouts.duration')}
              </p>
              <p className="font-mono text-base font-semibold text-accent md:text-lg">
                {stats.durationSeconds !== null
                  ? formatDuration(stats.durationSeconds)
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-fg-subtle">
                {t('workouts.volume')}
              </p>
              <p className="text-base font-semibold text-fg md:text-lg">
                {formatNumber(stats.totalVolumeKg)} kg
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-fg-subtle">
                {t('workouts.sets')}
              </p>
              <p className="text-base font-semibold text-fg md:text-lg">
                {stats.completedSets} / {stats.totalSets}
              </p>
            </div>
          </div>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {session.exercises.map((exercise, exIdx) => {
          let workingIndex = 0;
          const nameKey = exercise.name.trim().toLowerCase();
          const previousSets = previousMap.get(nameKey) ?? [];
          const averageSec = averagesMap.get(nameKey) ?? null;

          let durationSec: number | null = null;
          if (exercise.completedAt) {
            const startMs = new Date(exerciseStartIso(exIdx)).getTime();
            const endMs = new Date(exercise.completedAt).getTime();
            durationSec = Math.max(0, Math.round((endMs - startMs) / 1000));
          }

          return (
            <li key={exercise.id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-accent">
                    {exercise.name}
                  </h2>
                  <div className="text-right">
                    {durationSec !== null && (
                      <p className="font-mono text-sm font-semibold text-fg">
                        {formatClock(durationSec)}
                      </p>
                    )}
                    {averageSec !== null && (
                      <p className="font-mono text-[11px] text-fg-muted">
                        {t('workouts.exerciseAvg', {
                          time: formatClock(averageSec),
                        })}
                      </p>
                    )}
                  </div>
                </div>
                {exercise.notes && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-fg-muted">
                    {exercise.notes}
                  </p>
                )}
                {exercise.restSeconds !== null && (
                  <p className="mt-1 text-xs text-accent">
                    {t('workouts.rest')}: {formatDuration(exercise.restSeconds)}
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
                  {exercise.sets.map((set, idx) => {
                    if (set.type === 'normal') workingIndex += 1;
                    const workingN =
                      set.type === 'normal' ? workingIndex : undefined;
                    const previous = previousSets[idx] ?? null;
                    return (
                      <SessionSetRow
                        key={set.id}
                        set={set}
                        workingNumber={workingN}
                        previous={previous}
                        exerciseName={exercise.name}
                        restSeconds={exercise.restSeconds}
                        allTimePr={prByExercise.get(nameKey) ?? null}
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

      <Card>
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
    </div>
  );
}
