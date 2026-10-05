import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftRight, Check, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/shared/ui/page-header';
import { OverflowMenu } from '@/shared/ui/overflow-menu';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { cn } from '@/shared/lib/cn';
import {
  useDeleteSession,
  useSessionQuery,
  useSyncRoutineWeights,
  useUpdateSessionFinishedAt,
  useUpdateSessionSet,
} from '../hooks/use-sessions';
import { sessionService } from '../services/session.service';
import { SetTypePill } from '../components/set-type-pill';
import {
  datetimeLocalInputToIso,
  formatDate,
  formatTime,
  isoToDatetimeLocalInput,
} from '@/shared/lib/date';
import { formatDuration, formatKg, formatInt } from '@/shared/lib/format';
import type { SessionSet } from '../domain/workout.types';

function parseNum(v: string): number | null {
  const trimmed = v.trim().replace(/\s+/g, '').replace(',', '.');
  if (trimmed === '') return null;
  if (/^\d+(\+\d+)+$/.test(trimmed)) {
    return trimmed.split('+').reduce((a, s) => a + Number(s), 0);
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function toStr(v: number | null): string {
  return v === null ? '' : String(v);
}

type EditableSetRowProps = {
  set: SessionSet;
  onChange: (patch: {
    actualWeightKg?: number | null;
    actualReps?: number | null;
    completed?: boolean;
  }) => void;
};

function EditableSetRow({ set, onChange }: EditableSetRowProps) {
  const { t } = useTranslation();
  const [kg, setKg] = useState(toStr(set.actualWeightKg));
  const [reps, setReps] = useState(toStr(set.actualReps));

  useEffect(() => {
    setKg(toStr(set.actualWeightKg));
    setReps(toStr(set.actualReps));
  }, [set.actualWeightKg, set.actualReps]);

  function commit() {
    const newKg = parseNum(kg);
    const newReps = parseNum(reps);
    if (newKg !== set.actualWeightKg || newReps !== set.actualReps) {
      onChange({ actualWeightKg: newKg, actualReps: newReps });
    }
  }

  return (
    <div
      className={cn(
        'grid grid-cols-[2.25rem_1fr_1fr_2.25rem] items-center gap-2 rounded-lg px-2 py-2 transition-colors',
        set.completed && 'bg-done/10 ring-1 ring-inset ring-done/40',
      )}
    >
      <SetTypePill type={set.type} />
      <input
        type="text"
        inputMode="decimal"
        value={kg}
        onChange={(e) => setKg(e.target.value)}
        onBlur={commit}
        placeholder={
          set.plannedWeightKg !== null ? String(set.plannedWeightKg) : '—'
        }
        className="h-8 w-full rounded-md bg-surface-2 px-2 text-center text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <input
        type="text"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={commit}
        placeholder={set.plannedReps ?? '—'}
        className="h-8 w-full rounded-md bg-surface-2 px-2 text-center text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <button
        type="button"
        aria-label={t('common.confirm')}
        onClick={() => {
          const newKg = parseNum(kg);
          const newReps = parseNum(reps);
          const patch: {
            actualWeightKg?: number | null;
            actualReps?: number | null;
            completed: boolean;
          } = { completed: !set.completed };
          if (newKg !== set.actualWeightKg) patch.actualWeightKg = newKg;
          if (newReps !== set.actualReps) patch.actualReps = newReps;
          onChange(patch);
        }}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md border transition-all active:scale-95',
          set.completed
            ? 'border-done bg-done text-app'
            : 'border-line bg-surface-2 text-fg-subtle hover:border-accent/60 hover:bg-accent/10 hover:text-accent',
        )}
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}

export function SessionDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ sessionId: string }>();
  const id = params.sessionId;
  const detail = useSessionQuery(id);
  const deleteMutation = useDeleteSession();
  const updateSet = useUpdateSessionSet();
  const updateFinishedAt = useUpdateSessionFinishedAt();
  const syncRoutineWeights = useSyncRoutineWeights();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [finishedAtDraft, setFinishedAtDraft] = useState('');
  const [finishedAtError, setFinishedAtError] = useState<string | null>(null);

  const session = detail.data;
  const stats = session ? sessionService.stats(session) : null;

  useEffect(() => {
    if (session?.finishedAt) {
      setFinishedAtDraft(isoToDatetimeLocalInput(session.finishedAt));
      setFinishedAtError(null);
    }
  }, [session?.finishedAt]);

  async function handleDelete() {
    if (!id) return;
    await deleteMutation.mutateAsync(id);
    setConfirmDeleteOpen(false);
    navigate('/treino?tab=history');
  }

  function handleDoneEditing() {
    setEditMode(false);
    // Corrigiu peso? Leva pra rotina, pro próximo treino já vir certo.
    if (id) syncRoutineWeights.mutate(id);
  }

  function commitFinishedAt() {
    if (!id || !session) return;
    if (!finishedAtDraft) return;
    const iso = datetimeLocalInputToIso(finishedAtDraft);
    const ms = new Date(iso).getTime();
    const startMs = new Date(session.startedAt).getTime();
    if (!Number.isFinite(ms) || ms < startMs || ms > Date.now()) {
      setFinishedAtError(t('workouts.finishedAtInvalid'));
      return;
    }
    setFinishedAtError(null);
    if (iso !== session.finishedAt) {
      void updateFinishedAt.mutateAsync({ sessionId: id, finishedAt: iso });
    }
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
          <>
            {editMode ? (
              <Button size="sm" onClick={handleDoneEditing}>
                {t('workouts.doneEditing')}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                leadingIcon={<Pencil className="h-4 w-4" />}
                onClick={() => setEditMode(true)}
              >
                {t('common.edit')}
              </Button>
            )}
            <OverflowMenu
              label={t('common.moreActions')}
              items={[
                {
                  label: t('workouts.deleteSession'),
                  icon: <Trash2 className="h-4 w-4" />,
                  tone: 'danger',
                  onSelect: () => setConfirmDeleteOpen(true),
                },
              ]}
            />
          </>
        }
      />

      {editMode && session.finishedAt && (
        <Card className="mb-4">
          <label
            htmlFor="finished-at"
            className="mb-2 block text-xs uppercase tracking-wide text-fg-subtle"
          >
            {t('workouts.finishedAtLabel')}
          </label>
          <input
            id="finished-at"
            type="datetime-local"
            value={finishedAtDraft}
            onChange={(e) => setFinishedAtDraft(e.target.value)}
            onBlur={commitFinishedAt}
            className={cn(
              'h-11 w-full rounded-lg border bg-surface-2 px-3.5 text-[15px] text-fg placeholder:text-fg-subtle',
              'focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30',
              finishedAtError
                ? 'border-failure focus:border-failure focus:ring-failure/30'
                : 'border-line',
            )}
          />
          {finishedAtError && (
            <p className="mt-2 text-xs text-failure">{finishedAtError}</p>
          )}
        </Card>
      )}

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
        {session.exercises.map((exercise) => (
          <li key={exercise.id}>
            <Card>
              <h2 className="text-base font-semibold text-accent">
                {exercise.name}
              </h2>
              {exercise.replacedFrom && (
                <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-warmup/10 px-2 py-0.5 text-xs text-warmup">
                  <ArrowLeftRight className="h-3 w-3" />
                  {t('workouts.replacedFrom', {
                    name: exercise.replacedFrom.name,
                  })}
                </p>
              )}
              {editMode ? (
                <>
                  <div className="mt-3 grid grid-cols-[2.25rem_1fr_1fr_2.25rem] gap-2 px-2 text-xs uppercase tracking-wide text-fg-subtle">
                    <span>{t('workouts.set')}</span>
                    <span>{t('workouts.weight')}</span>
                    <span>{t('workouts.reps')}</span>
                    <span />
                  </div>
                  <div className="mt-1 flex flex-col gap-1">
                    {exercise.sets.map((set) => (
                      <EditableSetRow
                        key={set.id}
                        set={set}
                        onChange={(patch) =>
                          updateSet.mutate({
                            sessionId: session.id,
                            exerciseId: exercise.id,
                            setId: set.id,
                            patch,
                          })
                        }
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-[2.25rem_1fr_1fr_2rem] gap-2 text-xs uppercase tracking-wide text-fg-subtle">
                    <span>{t('workouts.set')}</span>
                    <span>{t('workouts.weight')}</span>
                    <span>{t('workouts.reps')}</span>
                    <span />
                  </div>
                  <ul>
                    {exercise.sets.map((set) => (
                      <li
                        key={set.id}
                        className="grid grid-cols-[2.25rem_1fr_1fr_2rem] items-center gap-2 border-t border-line/40 py-2 text-sm"
                      >
                        <SetTypePill type={set.type} />
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
                              ? 'text-done text-base'
                              : 'text-fg-subtle text-base'
                          }
                        >
                          {set.completed ? '✓' : '·'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          </li>
        ))}
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
