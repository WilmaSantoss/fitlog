import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/ui/page-header';
import { Card } from '@/shared/ui/card';
import { EvolutionChart } from '../components/evolution-chart';
import { useEvolutionQuery } from '../hooks/use-measurements';
import {
  MEASUREMENT_METRICS,
  type MeasurementMetric,
} from '../domain/measurement.types';
import { cn } from '@/shared/lib/cn';

const metricUnits: Record<MeasurementMetric, string> = {
  weightKg: 'kg',
  bodyFatPct: '%',
  chestCm: 'cm',
  shoulderCm: 'cm',
  waistCm: 'cm',
  hipCm: 'cm',
  armCm: 'cm',
  thighCm: 'cm',
  calfCm: 'cm',
};

export function MeasurementEvolutionPage() {
  const { t } = useTranslation();
  const [metric, setMetric] = useState<MeasurementMetric>('weightKg');
  const query = useEvolutionQuery(metric);
  const data = query.data ?? [];

  const latest = data[data.length - 1];
  const first = data[0];
  const delta = latest && first ? latest.value - first.value : null;

  return (
    <>
      <PageHeader title={t('measurements.evolution')} back="/medidas" />

      <Card className="mb-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-fg-subtle">
              {t(`measurements.metrics.${metric}`)}
            </p>
            <p className="text-2xl font-semibold text-fg">
              {latest ? `${latest.value} ${metricUnits[metric]}` : '—'}
            </p>
          </div>
          {delta !== null && delta !== 0 && (
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold',
                delta > 0 ? 'bg-warmup/20 text-warmup' : 'bg-success/20 text-success',
              )}
            >
              {delta > 0 ? '+' : ''}
              {delta.toFixed(1)} {metricUnits[metric]}
            </span>
          )}
        </div>
        <div className="mt-4">
          <EvolutionChart data={data} unit={metricUnits[metric]} />
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        {MEASUREMENT_METRICS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              m === metric
                ? 'bg-accent text-on-accent'
                : 'bg-surface-2 text-fg-muted hover:text-fg',
            )}
          >
            {t(`measurements.metrics.${m}`)}
          </button>
        ))}
      </div>
    </>
  );
}
