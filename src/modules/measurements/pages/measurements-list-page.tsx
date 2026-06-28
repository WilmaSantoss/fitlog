import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { LineChart as LineChartIcon, Plus, Ruler } from 'lucide-react';
import { PageHeader } from '@/shared/ui/page-header';
import { IconButton } from '@/shared/ui/icon-button';
import { Card } from '@/shared/ui/card';
import { EmptyState } from '@/shared/ui/empty-state';
import { Button } from '@/shared/ui/button';
import { useMeasurementsQuery } from '../hooks/use-measurements';
import { formatDate, formatRelative } from '@/shared/lib/date';
import { formatKg, formatPct, formatCm } from '@/shared/lib/format';

export function MeasurementsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const query = useMeasurementsQuery();
  const items = query.data ?? [];

  return (
    <>
      <PageHeader
        title={t('measurements.title')}
        actions={
          <>
            <IconButton
              label={t('measurements.evolution')}
              onClick={() => navigate('/medidas/evolucao')}
            >
              <LineChartIcon className="h-5 w-5" />
            </IconButton>
            <IconButton
              label={t('measurements.new')}
              tone="accent"
              onClick={() => navigate('/medidas/nova')}
            >
              <Plus className="h-5 w-5" />
            </IconButton>
          </>
        }
      />

      {query.isLoading && (
        <p className="py-8 text-center text-sm text-fg-muted">
          {t('common.loading')}
        </p>
      )}

      {!query.isLoading && items.length === 0 && (
        <EmptyState
          icon={<Ruler className="h-8 w-8" />}
          title={t('measurements.empty')}
          action={
            <Button onClick={() => navigate('/medidas/nova')}>
              {t('measurements.emptyCta')}
            </Button>
          }
        />
      )}

      <ul className="flex flex-col gap-2">
        {items.map((m) => (
          <li key={m.id}>
            <Link to={`/medidas/${m.id}/editar`} className="block">
              <Card interactive className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-base font-semibold text-fg">
                    {formatDate(m.recordedAt)}
                  </h2>
                  <span className="text-xs text-fg-subtle">
                    {formatRelative(m.recordedAt)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-muted">
                  {m.weightKg !== null && (
                    <span>
                      <span className="text-fg">{formatKg(m.weightKg)}</span>
                    </span>
                  )}
                  {m.bodyFatPct !== null && (
                    <span>
                      {t('measurements.metrics.bodyFatPct')}:{' '}
                      <span className="text-fg">{formatPct(m.bodyFatPct)}</span>
                    </span>
                  )}
                  {m.waistCm !== null && (
                    <span>
                      {t('measurements.metrics.waistCm')}:{' '}
                      <span className="text-fg">{formatCm(m.waistCm)}</span>
                    </span>
                  )}
                  {m.hipCm !== null && (
                    <span>
                      {t('measurements.metrics.hipCm')}:{' '}
                      <span className="text-fg">{formatCm(m.hipCm)}</span>
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
