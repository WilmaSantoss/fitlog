import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, History, Plus } from 'lucide-react';
import { PageHeader } from '@/shared/ui/page-header';
import { IconButton } from '@/shared/ui/icon-button';
import { EmptyState } from '@/shared/ui/empty-state';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { useRoutinesQuery } from '../hooks/use-routines';
import {
  useActiveSessionsQuery,
  useStartSessionFromRoutine,
} from '../hooks/use-sessions';
import { RoutineCard } from '../components/routine-card';
import type { Routine } from '../domain/workout.types';
import { formatRelative } from '@/shared/lib/date';

export function RoutinesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const routinesQ = useRoutinesQuery();
  const activeSessionsQ = useActiveSessionsQuery();
  const startMutation = useStartSessionFromRoutine();

  const routines = routinesQ.data ?? [];
  const activeSessions = activeSessionsQ.data ?? [];

  async function handleStart(routine: Routine) {
    const session = await startMutation.mutateAsync(routine.id);
    if (session) navigate(`/treino/sessao/${session.id}`);
  }

  return (
    <>
      <PageHeader
        title={t('workouts.title')}
        actions={
          <>
            <IconButton
              label={t('workouts.history')}
              onClick={() => navigate('/treino/historico')}
            >
              <History className="h-5 w-5" />
            </IconButton>
            <IconButton
              label={t('workouts.newRoutine')}
              tone="accent"
              onClick={() => navigate('/treino/novo')}
            >
              <Plus className="h-5 w-5" />
            </IconButton>
          </>
        }
      />

      {activeSessions.length > 0 && (
        <section className="mb-4 flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t('workouts.inProgress')}
          </h2>
          {activeSessions.map((session) => (
            <Card
              key={session.id}
              interactive
              onClick={() => navigate(`/treino/sessao/${session.id}`)}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">
                  {session.routineName}
                </p>
                <p className="text-xs text-fg-muted">
                  {t('workouts.resume')} · {formatRelative(session.startedAt)}
                </p>
              </div>
              <span className="inline-block h-2 w-2 rounded-full bg-success" />
            </Card>
          ))}
        </section>
      )}

      {routinesQ.isLoading && (
        <p className="py-8 text-center text-sm text-fg-muted">
          {t('common.loading')}
        </p>
      )}

      {!routinesQ.isLoading && routines.length === 0 && (
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

      <ul className="flex flex-col gap-3">
        {routines.map((r) => (
          <li key={r.id}>
            <RoutineCard routine={r} onStart={handleStart} />
          </li>
        ))}
      </ul>
    </>
  );
}
