import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Play, Plus, Ruler } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { PageTitle } from '@/shared/ui/page-title';
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
import { cn } from '@/shared/lib/cn';

const WEEK_GOAL = 4;

type StatProps = {
  label: string;
  value: string;
  secondary?: string;
  secondaryTone?: 'muted' | 'accent';
  onSecondaryClick?: () => void;
};

function Stat({
  label,
  value,
  secondary,
  secondaryTone = 'muted',
  onSecondaryClick,
}: StatProps) {
  return (
    <Card className="flex flex-col gap-2 p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
        {label}
      </p>
      <p className="text-2xl font-semibold text-fg">{value}</p>
      {secondary &&
        (onSecondaryClick ? (
          <button
            type="button"
            onClick={onSecondaryClick}
            className={cn(
              'mt-auto self-start text-xs font-medium transition-colors',
              secondaryTone === 'accent'
                ? 'text-accent hover:text-accent-hover'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            {secondary}
          </button>
        ) : (
          <p
            className={cn(
              'mt-auto text-xs',
              secondaryTone === 'accent' ? 'text-accent' : 'text-fg-muted',
            )}
          >
            {secondary}
          </p>
        ))}
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

  const lastWeight = useMemo(
    () => measurementsQ.data?.find((m) => m.weightKg !== null) ?? null,
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
  const routines = routinesQ.data ?? [];

  async function handleStart(routine: Routine) {
    const session = await startMutation.mutateAsync(routine.id);
    if (session) navigate(`/treino/sessao/${session.id}`);
  }

  return (
    <div className="flex flex-col gap-6 pt-6 md:pt-2">
      <PageTitle
        title={
          userName ? `${t('home.greetingAnon')}, ${userName}` : t('home.greetingAnon')
        }
        subtitle={t('app.tagline')}
      />

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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label={t('home.statCurrentWeight')}
          value={lastWeight ? formatKg(lastWeight.weightKg) : '—'}
          secondary={
            lastWeight
              ? formatRelative(lastWeight.recordedAt)
              : t('home.registerWeight')
          }
          secondaryTone={lastWeight ? 'muted' : 'accent'}
          onSecondaryClick={
            lastWeight ? undefined : () => navigate('/medidas/nova')
          }
        />
        <Stat
          label={t('home.statThisWeek')}
          value={t('home.workoutsCount', { count: weekCount })}
          secondary={t('home.weekGoal', { goal: WEEK_GOAL })}
        />
        <Stat
          label={t('home.statLastWorkout')}
          value={
            lastSession
              ? lastSession.routineName
              : t('home.statNoWorkoutsShort')
          }
          secondary={
            lastSession
              ? formatRelative(lastSession.finishedAt ?? lastSession.startedAt)
              : t('home.startToday')
          }
        />
        <Stat
          label={t('home.statTotalRoutines')}
          value={String(routines.length)}
          secondary={t('home.routinesActive', { count: routines.length })}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
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

      {routines.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
            {t('home.sectionRecentRoutines')}
          </h2>
          <ul className="flex flex-col gap-3">
            {routines.slice(0, 3).map((routine) => {
              const exerciseNames = routine.exercises
                .slice(0, 2)
                .map((e) => e.name)
                .join(', ');
              return (
                <li key={routine.id}>
                  <Card
                    interactive
                    onClick={() => navigate(`/treino/${routine.id}`)}
                    className="flex items-center justify-between gap-3 p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                        <Dumbbell className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-fg">
                          {routine.name}
                        </p>
                        <p className="truncate text-xs text-fg-muted">
                          {t('home.exercisesCount', {
                            count: routine.exercises.length,
                          })}
                          {exerciseNames && ` · ${exerciseNames}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStart(routine);
                      }}
                      disabled={routine.exercises.length === 0}
                      leadingIcon={<Play className="h-3.5 w-3.5" />}
                    >
                      {t('home.startShort')}
                    </Button>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
