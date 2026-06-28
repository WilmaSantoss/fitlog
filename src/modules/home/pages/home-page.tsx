import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, Ruler } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { useMeasurementsQuery } from '@/modules/measurements/hooks/use-measurements';
import { useRoutinesQuery } from '@/modules/workouts/hooks/use-routines';
import {
  useActiveSessionsQuery,
  useFinishedSessionsQuery,
  useStartSessionFromRoutine,
} from '@/modules/workouts/hooks/use-sessions';
import { useProfileQuery } from '@/modules/profile/hooks/use-profile';
import { formatRelative, isThisWeek } from '@/shared/lib/date';
import { formatKg } from '@/shared/lib/format';
import type { Routine } from '@/modules/workouts/domain/workout.types';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex flex-col gap-1.5">
      <p className="text-xs uppercase tracking-wide text-fg-subtle">{label}</p>
      <p className="text-xl font-semibold text-fg">{value}</p>
    </Card>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const measurementsQ = useMeasurementsQuery();
  const routinesQ = useRoutinesQuery();
  const finishedQ = useFinishedSessionsQuery();
  const activeQ = useActiveSessionsQuery();
  const profileQ = useProfileQuery();
  const startMutation = useStartSessionFromRoutine();

  const lastMeasurement = useMemo(
    () => measurementsQ.data?.find((m) => m.weightKg !== null),
    [measurementsQ.data],
  );
  const lastSession = finishedQ.data?.[0];
  const weekCount = useMemo(
    () =>
      (finishedQ.data ?? []).filter(
        (s) => s.finishedAt !== null && isThisWeek(s.finishedAt),
      ).length,
    [finishedQ.data],
  );
  const activeSession = activeQ.data?.[0];

  const userName = profileQ.data?.name?.trim();

  async function handleStart(routine: Routine) {
    const session = await startMutation.mutateAsync(routine.id);
    if (session) navigate(`/treino/sessao/${session.id}`);
  }

  return (
    <div className="flex flex-col gap-5 pt-4">
      <header>
        <h1 className="text-2xl font-semibold text-fg">
          {userName ? (
            <>
              {t('home.greetingAnon')},{' '}
              <span className="bg-gradient-to-r from-accent to-dropset bg-clip-text text-transparent">
                {userName}
              </span>
            </>
          ) : (
            t('home.greetingAnon')
          )}
        </h1>
        <p className="text-sm text-fg-muted">{t('app.tagline')}</p>
      </header>

      {activeSession && (
        <Card
          interactive
          onClick={() => navigate(`/treino/sessao/${activeSession.id}`)}
          className="flex items-center justify-between gap-3 border-accent/40 bg-accent/10"
        >
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-accent">
              {t('workouts.inProgress')}
            </p>
            <p className="truncate text-base font-semibold text-fg">
              {activeSession.routineName}
            </p>
            <p className="text-xs text-fg-muted">
              {formatRelative(activeSession.startedAt)}
            </p>
          </div>
          <Button size="sm">{t('workouts.resume')}</Button>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t('home.statCurrentWeight')}
          value={lastMeasurement ? formatKg(lastMeasurement.weightKg) : '—'}
        />
        <StatCard
          label={t('home.statThisWeek')}
          value={t('home.workoutsCount', { count: weekCount })}
        />
        <StatCard
          label={t('home.statLastWorkout')}
          value={
            lastSession
              ? formatRelative(lastSession.finishedAt ?? lastSession.startedAt)
              : t('home.noWorkoutsYet')
          }
        />
        <StatCard
          label={t('home.statTotalRoutines')}
          value={String(routinesQ.data?.length ?? 0)}
        />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
          {t('home.sectionShortcuts')}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button
            variant="secondary"
            leadingIcon={<Ruler className="h-4 w-4" />}
            onClick={() => navigate('/medidas/nova')}
          >
            {t('home.quickAddMeasurement')}
          </Button>
          <Button
            variant="secondary"
            leadingIcon={<Dumbbell className="h-4 w-4" />}
            onClick={() => navigate('/treino')}
          >
            {t('home.quickStartWorkout')}
          </Button>
          <Button
            variant="secondary"
            leadingIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/treino/novo')}
          >
            {t('home.quickCreateRoutine')}
          </Button>
        </div>
      </section>

      {routinesQ.data && routinesQ.data.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t('home.sectionRecentRoutines')}
          </h2>
          <ul className="flex flex-col gap-2">
            {routinesQ.data.slice(0, 3).map((routine) => (
              <li key={routine.id}>
                <Card className="flex items-center justify-between gap-3">
                  <Link
                    to={`/treino/${routine.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate text-base font-semibold text-fg">
                      {routine.name}
                    </p>
                    <p className="truncate text-xs text-fg-muted">
                      {routine.exercises.length}{' '}
                      {routine.exercises.length === 1
                        ? 'exercício'
                        : 'exercícios'}
                    </p>
                  </Link>
                  <Button
                    size="sm"
                    onClick={() => handleStart(routine)}
                    disabled={routine.exercises.length === 0}
                  >
                    {t('workouts.startRoutine')}
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lastMeasurement && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t('home.sectionLatestMeasurement')}
          </h2>
          <Link to={`/medidas/${lastMeasurement.id}/editar`}>
            <Card interactive>
              <p className="text-xs text-fg-subtle">
                {formatRelative(lastMeasurement.recordedAt)}
              </p>
              <p className="mt-1 text-xl font-semibold text-fg">
                {formatKg(lastMeasurement.weightKg)}
              </p>
            </Card>
          </Link>
        </section>
      )}
    </div>
  );
}
