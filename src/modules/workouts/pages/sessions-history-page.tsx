import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { PageHeader } from '@/shared/ui/page-header';
import { Card } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { useFinishedSessionsQuery } from '../hooks/use-sessions';
import { sessionService } from '../services/session.service';
import { formatDate, formatRelative } from '@/shared/lib/date';
import { formatDuration } from '@/shared/lib/format';

export function SessionsHistoryPage() {
  const { t } = useTranslation();
  const query = useFinishedSessionsQuery();
  const items = query.data ?? [];

  return (
    <>
      <PageHeader title={t('workouts.history')} back="/treino" />

      {query.isLoading && (
        <p className="py-8 text-center text-sm text-fg-muted">
          {t('common.loading')}
        </p>
      )}

      {!query.isLoading && items.length === 0 && (
        <EmptyState
          icon={<History className="h-8 w-8" />}
          title={t('workouts.historyEmpty')}
        />
      )}

      <ul className="flex flex-col gap-2">
        {items.map((s) => {
          const stats = sessionService.stats(s);
          const date = s.finishedAt ?? s.startedAt;
          return (
            <li key={s.id}>
              <Link to={`/treino/historico/${s.id}`} className="block">
                <Card interactive className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-base font-semibold text-fg">
                      {s.routineName}
                    </h2>
                    <span className="text-xs text-fg-subtle">
                      {formatRelative(date)}
                    </span>
                  </div>
                  <p className="text-xs text-fg-muted">{formatDate(date)}</p>
                  <p className="text-sm text-fg-muted">
                    {t('workouts.summaryStats', {
                      exercises: s.exercises.length,
                      sets: stats.completedSets,
                      volume: stats.totalVolumeKg,
                    })}{' '}
                    ·{' '}
                    {stats.durationSeconds !== null
                      ? formatDuration(stats.durationSeconds)
                      : '—'}
                  </p>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
