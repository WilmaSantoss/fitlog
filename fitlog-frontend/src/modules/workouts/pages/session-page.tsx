import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  ChevronLeft,
  PlayCircle,
  Timer,
  Trash2,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Textarea } from '@/shared/ui/textarea';
import { IconButton } from '@/shared/ui/icon-button';
import { OverflowMenu } from '@/shared/ui/overflow-menu';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import {
  useDeleteSession,
  useExerciseSummariesQuery,
  useFinishSession,
  useReplaceSessionExercise,
  usePreviousByExerciseQuery,
  useRoutineExerciseAveragesQuery,
  useSessionQuery,
  useUpdateSessionNotes,
  useUpdateSessionSet,
} from '../hooks/use-sessions';
import { SessionSetRow } from '../components/session-set-row';
import { ReplaceExerciseDialog } from '../components/replace-exercise-dialog';
import { LibraryExerciseMedia } from '@/modules/exercises/components/library-exercise-media';
import { LibraryExerciseThumb } from '@/modules/exercises/components/library-exercise-thumb';
import { Switch } from '@/shared/ui/switch';
import { useSessionViewStore } from '@/shared/state/session-view.store';
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
  const showAnimations = useSessionViewStore((s) => s.showAnimations);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const replaceMutation = useReplaceSessionExercise();
  const setShowAnimations = useSessionViewStore((s) => s.setShowAnimations);
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
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-20 -mx-5 border-b border-line/60 bg-app px-5 pb-3 pt-3 md:-mx-10 md:-mt-8 md:px-10 md:pt-8">
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
            <Button size="sm" onClick={() => setFinishOpen(true)}>
              {t('workouts.finish')}
            </Button>
            <OverflowMenu
              label={t('common.moreActions')}
              items={[
                {
                  label: t('workouts.discard'),
                  icon: <Trash2 className="h-4 w-4" />,
                  tone: 'danger',
                  onSelect: () => setDiscardOpen(true),
                },
              ]}
            />
          </div>
        </div>

        {stats && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-fg-subtle">
                {t('workouts.duration')}
              </p>
              <p className="mt-1 font-mono text-xl font-semibold text-accent md:text-2xl">
                {stats.durationSeconds !== null
                  ? formatDuration(stats.durationSeconds)
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-fg-subtle">
                {t('workouts.volume')}
              </p>
              <p className="mt-1 text-xl font-semibold text-fg md:text-2xl">
                {formatNumber(stats.totalVolumeKg)}
                <span className="ml-1 text-xs font-normal text-fg-muted">
                  kg
                </span>
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-fg-subtle">
                {t('workouts.exercises')}
              </p>
              <p className="mt-1 text-xl font-semibold text-fg md:text-2xl">
                {stats.completedExercises}
                <span className="text-sm font-normal text-fg-muted">
                  /{stats.totalExercises}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {session.exercises.some((ex) => ex.libraryId || ex.videoUrl) && (
        <Switch
          label={t('workouts.showAnimations')}
          checked={showAnimations}
          onChange={setShowAnimations}
          className="justify-end"
        />
      )}

      <ul className="flex flex-col gap-3">
        {session.exercises.map((exercise, exIdx) => {
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
              <Card className="p-0 overflow-hidden">
                {!showAnimations ? null : exercise.videoUrl ? (
                  <video
                    key={exercise.videoUrl}
                    src={exercise.videoUrl}
                    className="block aspect-[16/6] w-full border-b border-line/40 object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : exercise.libraryId ? (
                  <LibraryExerciseMedia
                    libraryId={exercise.libraryId}
                    className="block aspect-[2/1] w-full border-b border-line/40"
                    fallback={<NoVideoPlaceholder />}
                  />
                ) : (
                  <NoVideoPlaceholder />
                )}
                <div className="p-5">
                <div className="flex gap-3">
                  {!showAnimations &&
                    (exercise.libraryId ? (
                      <LibraryExerciseThumb libraryId={exercise.libraryId} />
                    ) : exercise.videoUrl ? (
                      <video
                        key={exercise.videoUrl}
                        src={exercise.videoUrl}
                        className="aspect-[3/2] w-24 shrink-0 rounded-lg object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : null)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <h2 className="min-w-0 flex-1 text-lg font-semibold leading-snug text-accent">
                        {exercise.name}
                      </h2>
                      {durationSec !== null && (
                        <span className="mt-1 font-mono text-sm font-semibold text-fg">
                          {formatClock(durationSec)}
                        </span>
                      )}
                      <IconButton
                        label={t('workouts.replaceExercise')}
                        className="-mr-2 -mt-0.5 h-8 w-8 shrink-0"
                        onClick={() => setReplacingId(exercise.id)}
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                      </IconButton>
                    </div>
                    {exercise.replacedFrom && (
                      <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-warmup/10 px-2 py-0.5 text-xs text-warmup">
                        <ArrowLeftRight className="h-3 w-3" />
                        {t('workouts.replacedFrom', {
                          name: exercise.replacedFrom.name,
                        })}
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
                        <p className="mt-1 flex items-center gap-1 text-xs text-fg-muted">
                          <Timer className="h-3.5 w-3.5" />
                          {parts.join(' · ')}
                        </p>
                      ) : null;
                    })()}
                    {averageSec !== null && (
                      <p className="mt-1 font-mono text-[11px] text-fg-muted">
                        {t('workouts.exerciseAvg', {
                          time: formatClock(averageSec),
                        })}
                      </p>
                    )}
                    {exercise.notes && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-fg-muted">
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-[2.25rem_minmax(0,5rem)_1fr_1fr_2.25rem] gap-2 px-2 text-xs uppercase tracking-wide text-fg-subtle">
                  <span>{t('workouts.set')}</span>
                  <span>{t('workouts.previous')}</span>
                  <span>{t('workouts.weight')}</span>
                  <span>{t('workouts.reps')}</span>
                  <span />
                </div>
                <div className="mt-1 flex flex-col gap-1">
                  {exercise.sets.map((set, idx) => {
                    const previous = previousSets[idx] ?? null;
                    return (
                      <SessionSetRow
                        key={set.id}
                        set={set}
                        previous={previous}
                        exerciseName={exercise.name}
                        rests={exercise.rests}
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

      <ReplaceExerciseDialog
        exercise={
          session.exercises.find((ex) => ex.id === replacingId) ?? null
        }
        submitting={replaceMutation.isPending}
        onCancel={() => setReplacingId(null)}
        onConfirm={async (replacement) => {
          if (!replacingId) return;
          await replaceMutation.mutateAsync({
            sessionId: session.id,
            exerciseId: replacingId,
            replacement,
          });
          setReplacingId(null);
        }}
      />
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

function NoVideoPlaceholder() {
  return (
    <div
      className="relative flex aspect-[16/6] items-center justify-center border-b border-line/40 text-fg-subtle"
      style={{
        backgroundImage:
          'repeating-linear-gradient(-45deg, transparent 0 10px, rgba(255,255,255,0.02) 10px 20px)',
        backgroundColor: 'var(--color-surface-2)',
      }}
      aria-hidden
    >
      <div className="flex items-center gap-2 text-xs">
        <PlayCircle className="h-4 w-4" />
        <span className="lowercase">sem vídeo</span>
      </div>
    </div>
  );
}
