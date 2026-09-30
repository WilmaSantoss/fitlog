import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Dumbbell, History, Play, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageTitle } from '@/shared/ui/page-title';
import { useRoutinesQuery } from '../hooks/use-routines';
import {
  useActiveSessionsQuery,
  useFinishedSessionsQuery,
  useStartSessionFromRoutine,
} from '../hooks/use-sessions';
import { sessionService } from '../services/session.service';
import type { Routine } from '../domain/workout.types';
import { formatDate, formatRelative } from '@/shared/lib/date';
import { formatClock } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

type Tab = 'routines' | 'history';

function isTab(v: string | null): v is Tab {
  return v === 'routines' || v === 'history';
}

export function RoutinesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: Tab = isTab(tabParam) ? tabParam : 'routines';

  const routinesQ = useRoutinesQuery();
  const activeSessionsQ = useActiveSessionsQuery();
  const finishedSessionsQ = useFinishedSessionsQuery();
  const startMutation = useStartSessionFromRoutine();

  const routines = routinesQ.data ?? [];
  const activeSessions = activeSessionsQ.data ?? [];
  const finishedSessions = finishedSessionsQ.data ?? [];

  function setTab(next: Tab) {
    const params = new URLSearchParams(searchParams);
    if (next === 'routines') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
  }

  async function handleStart(routine: Routine) {
    const session = await startMutation.mutateAsync(routine.id);
    if (session) navigate(`/treino/sessao/${session.id}`);
  }

  return (
    <div className="flex flex-col gap-6 pt-6 md:pt-2">
      <PageTitle
        title={t('workouts.title')}
        subtitle={t('workouts.subtitle', {
          routines: t('workouts.routinesCount', { count: routines.length }),
          sessions: t('workouts.sessionsCount', {
            count: finishedSessions.length,
          }),
        })}
      />

      <div role="tablist" className="flex items-center gap-6 border-b border-line/40">
        <TabButton
          active={tab === 'routines'}
          onClick={() => setTab('routines')}
          label={t('workouts.tabRoutines')}
        />
        <TabButton
          active={tab === 'history'}
          onClick={() => setTab('history')}
          label={t('workouts.tabHistory')}
        />
      </div>

      {tab === 'routines' ? (
        <RoutinesTab
          routines={routines}
          isLoading={routinesQ.isLoading}
          activeSessions={activeSessions}
          onStart={handleStart}
        />
      ) : (
        <HistoryTab
          isLoading={finishedSessionsQ.isLoading}
          sessions={finishedSessions}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        '-mb-px border-b-2 pb-3 text-sm font-medium transition-colors',
        active
          ? 'border-accent text-fg'
          : 'border-transparent text-fg-muted hover:text-fg',
      )}
    >
      {label}
    </button>
  );
}

type RoutinesTabProps = {
  routines: readonly Routine[];
  isLoading: boolean;
  activeSessions: readonly { id: string; routineName: string; startedAt: string }[];
  onStart: (routine: Routine) => void;
};

function RoutinesTab({
  routines,
  isLoading,
  activeSessions,
  onStart,
}: RoutinesTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      {activeSessions.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
            {t('workouts.inProgress')}
          </h2>
          {activeSessions.map((session) => (
            <Card
              key={session.id}
              interactive
              onClick={() => navigate(`/treino/sessao/${session.id}`)}
              className="flex items-center justify-between gap-3 border-accent/40 bg-accent/10"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">
                  {session.routineName}
                </p>
                <p className="text-xs text-fg-muted">
                  {t('workouts.resume')} · {formatRelative(session.startedAt)}
                </p>
              </div>
              <Button size="sm">{t('workouts.resume')}</Button>
            </Card>
          ))}
        </section>
      )}

      {isLoading && (
        <p className="py-8 text-center text-sm text-fg-muted">
          {t('common.loading')}
        </p>
      )}

      {!isLoading && routines.length === 0 && (
        <EmptyState
          icon={<Dumbbell className="h-8 w-8" />}
          title={t('workouts.routinesEmpty')}
          action={
            <Button onClick={() => navigate('/treino/novo')}>
              {t('workouts.routinesEmptyCta')}
            </Button>
          }
        />
      )}

      {routines.length > 0 && (
        <ul className="flex flex-col gap-3">
          {routines.map((routine) => (
            <li key={routine.id}>
              <RoutineCard
                routine={routine}
                onOpen={() => navigate(`/treino/${routine.id}`)}
                onStart={() => onStart(routine)}
              />
            </li>
          ))}
        </ul>
      )}

      {!isLoading && (
        <button
          type="button"
          onClick={() => navigate('/treino/novo')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line px-4 py-4 text-sm font-medium text-fg-muted transition-colors hover:border-accent/60 hover:text-accent"
        >
          <Plus className="h-4 w-4" />
          {t('workouts.createNewRoutine')}
        </button>
      )}
    </>
  );
}

function RoutineCard({
  routine,
  onOpen,
  onStart,
}: {
  routine: Routine;
  onOpen: () => void;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  const chips = routine.exercises.slice(0, 4);
  const remaining = Math.max(0, routine.exercises.length - chips.length);

  return (
    <Card
      interactive
      onClick={onOpen}
      className="flex flex-col gap-4 p-5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="truncate text-lg font-semibold text-fg">
          {routine.name}
        </h3>
        <span className="shrink-0 text-xs text-fg-subtle">
          {t('home.exercisesCount', { count: routine.exercises.length })}
        </span>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((ex) => (
            <span
              key={ex.id}
              className="inline-flex items-center rounded-md bg-surface-2 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-fg-muted"
            >
              {ex.name}
            </span>
          ))}
          {remaining > 0 && (
            <span className="text-xs text-fg-subtle">+{remaining}</span>
          )}
        </div>
      )}

      <Button
        size="md"
        fullWidth
        onClick={(e) => {
          e.stopPropagation();
          onStart();
        }}
        disabled={routine.exercises.length === 0}
        leadingIcon={<Play className="h-4 w-4" />}
      >
        {t('workouts.startRoutine')}
      </Button>
    </Card>
  );
}

type HistoryTabProps = {
  isLoading: boolean;
  sessions: readonly import('../domain/workout.types').WorkoutSession[];
};

function HistoryTab({ isLoading, sessions }: HistoryTabProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-fg-muted">
        {t('common.loading')}
      </p>
    );
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-8 w-8" />}
        title={t('workouts.historyEmpty')}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {sessions.map((s) => {
        const stats = sessionService.stats(s);
        const date = s.finishedAt ?? s.startedAt;
        return (
          <li key={s.id}>
            <Link to={`/treino/historico/${s.id}`} className="block">
              <Card interactive className="flex flex-col gap-1 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="truncate text-base font-semibold text-fg">
                    {s.routineName}
                  </h3>
                  <span className="shrink-0 text-xs text-fg-subtle">
                    {formatRelative(date)}
                  </span>
                </div>
                <p className="text-xs text-fg-muted">{formatDate(date)}</p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                  <span className="font-mono text-fg">
                    {stats.durationSeconds !== null
                      ? formatClock(stats.durationSeconds)
                      : '—'}
                  </span>
                  <span className="text-fg-muted">
                    {stats.totalVolumeKg.toLocaleString('pt-BR')} kg
                  </span>
                  <span className="text-fg-muted">
                    {stats.completedExercises}/{stats.totalExercises} exercícios
                  </span>
                </p>
              </Card>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
