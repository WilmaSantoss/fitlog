import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LineChart as LineChartIcon,
  Plus,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { PageTitle } from '@/shared/ui/page-title';
import { useMeasurementsQuery } from '@/modules/measurements/hooks/use-measurements';
import {
  useExerciseEvolutionQuery,
  useExerciseSummariesQuery,
  useFinishedSessionsQuery,
} from '@/modules/workouts/hooks/use-sessions';
import { formatDate, formatDateShort, formatRelative } from '@/shared/lib/date';
import { formatCm } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';
import type {
  Measurement,
  MeasurementMetric,
} from '@/modules/measurements/domain/measurement.types';

type Tab = 'body' | 'exercises' | 'frequency';

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;
const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

function localDateKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const TRACKED_MEASURES: readonly MeasurementMetric[] = [
  'waistCm',
  'bellyCm',
  'glutesCm',
  'bicepLeftCm',
  'thighLeftCm',
];

function firstValueOf(
  measurements: readonly Measurement[],
  metric: MeasurementMetric,
): { value: number; recordedAt: string } | null {
  for (const m of measurements) {
    const v = m[metric];
    if (v !== null) return { value: v, recordedAt: m.recordedAt };
  }
  return null;
}

function startOfMonthIso(): string {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return first.toISOString();
}

export function ProgressPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('body');

  return (
    <div className="flex flex-col gap-6 pt-6 md:pt-2">
      <PageTitle
        title={t('progress.title')}
        subtitle={t('progress.subtitle')}
        actions={
          <Button
            leadingIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/medidas/nova')}
          >
            {t('measurements.new')}
          </Button>
        }
      />

      <div
        role="tablist"
        className="inline-flex w-full max-w-xs rounded-lg border border-line/60 bg-surface p-1 text-sm"
      >
        <TabButton
          active={tab === 'body'}
          onClick={() => setTab('body')}
          label={t('progress.tabBody')}
        />
        <TabButton
          active={tab === 'exercises'}
          onClick={() => setTab('exercises')}
          label={t('progress.tabExercises')}
        />
        <TabButton
          active={tab === 'frequency'}
          onClick={() => setTab('frequency')}
          label={t('progress.tabFrequency')}
        />
      </div>

      {tab === 'body' && <BodyTab />}
      {tab === 'exercises' && <ExercisesTab />}
      {tab === 'frequency' && <FrequencyTab />}
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
        'flex-1 rounded-md px-3 py-1.5 font-medium transition-colors',
        active
          ? 'bg-accent text-on-accent'
          : 'text-fg-muted hover:text-fg',
      )}
    >
      {label}
    </button>
  );
}

function BodyTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const measurementsQ = useMeasurementsQuery();
  const measurements = measurementsQ.data ?? [];

  const weightSeries = useMemo(
    () =>
      measurements
        .filter((m) => m.weightKg !== null)
        .map((m) => ({
          recordedAt: m.recordedAt,
          value: m.weightKg as number,
        }))
        .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
        .map((p) => ({
          label: formatDateShort(p.recordedAt),
          fullDate: formatDate(p.recordedAt),
          value: p.value,
        })),
    [measurements],
  );

  const hasAnyMeasurement = measurements.length > 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="flex flex-col gap-3 p-5 lg:col-span-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-fg">
            {t('progress.weightChart')}
          </h2>
          {weightSeries.length > 0 && (
            <p className="text-xs text-fg-muted">
              {t('progress.entriesCount', { count: weightSeries.length })}
            </p>
          )}
        </div>

        {weightSeries.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
            <LineChartIcon className="h-8 w-8 text-fg-subtle" />
            <p className="text-base font-medium text-fg">
              {t('progress.weightEmptyTitle')}
            </p>
            <p className="max-w-xs text-sm text-fg-muted">
              {t('progress.weightEmptyDesc')}
            </p>
            <Button onClick={() => navigate('/medidas/nova')}>
              {t('progress.registerWeight')}
            </Button>
          </div>
        ) : (
          <ChartContainer data={weightSeries} unit="kg" />
        )}
      </Card>

      <Card className="flex flex-col p-5">
        <h2 className="text-base font-semibold text-fg">
          {t('progress.measurements')}
        </h2>
        <ul className="mt-4 flex flex-col divide-y divide-line/40">
          {TRACKED_MEASURES.map((metric) => {
            const latest = firstValueOf(measurements, metric);
            return (
              <li
                key={metric}
                className="flex items-baseline justify-between gap-3 py-3"
              >
                <span className="text-sm text-fg">
                  {t(`measurements.metrics.${metric}`)}
                </span>
                <span
                  className={
                    latest
                      ? 'text-sm font-medium text-fg'
                      : 'text-sm text-fg-subtle'
                  }
                >
                  {latest ? formatCm(latest.value) : '— cm'}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-auto pt-4 text-xs text-fg-subtle">
          {hasAnyMeasurement
            ? t('progress.lastUpdate', {
                when: formatRelative(measurements[0]!.recordedAt),
              })
            : t('progress.noMeasurements')}
        </p>
      </Card>
    </div>
  );
}

function ExercisesTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const summariesQ = useExerciseSummariesQuery();
  const sessionsQ = useFinishedSessionsQuery();
  const summaries = summariesQ.data ?? [];
  const sessions = sessionsQ.data ?? [];

  const monthStart = useMemo(() => startOfMonthIso(), []);

  const monthStats = useMemo(() => {
    let volume = 0;
    let sessionsCount = 0;
    for (const session of sessions) {
      const when = session.finishedAt ?? session.startedAt;
      if (when < monthStart) continue;
      sessionsCount += 1;
      for (const ex of session.exercises) {
        for (const set of ex.sets) {
          if (
            set.completed &&
            set.actualWeightKg !== null &&
            set.actualReps !== null
          ) {
            volume += set.actualWeightKg * set.actualReps;
          }
        }
      }
    }
    return {
      volume: Math.round(volume * 10) / 10,
      sessionsCount,
    };
  }, [sessions, monthStart]);

  const topPr = summaries.find((s) => s.pr !== null) ?? null;

  const [selected, setSelected] = useState<string | null>(null);
  const activeName = selected ?? topPr?.name ?? null;
  const evolutionQ = useExerciseEvolutionQuery(activeName);

  const chartData = useMemo(
    () =>
      (evolutionQ.data ?? []).map((p) => ({
        label: formatDateShort(p.recordedAt),
        fullDate: formatDate(p.recordedAt),
        value: p.maxWeightKg,
      })),
    [evolutionQ.data],
  );

  if (summaries.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <LineChartIcon className="h-8 w-8 text-fg-subtle" />
        <p className="text-base font-medium text-fg">
          {t('progress.exercisesEmptyTitle')}
        </p>
        <p className="max-w-md text-sm text-fg-muted">
          {t('progress.exercisesEmptyDesc')}
        </p>
        <Button onClick={() => navigate('/treino')}>
          {t('progress.startWorkout')}
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatBlock
          label={t('progress.monthVolume')}
          value={`${monthStats.volume.toLocaleString('pt-BR')} kg`}
        />
        <StatBlock
          label={t('progress.monthWorkouts')}
          value={String(monthStats.sessionsCount)}
        />
        {topPr?.pr ? (
          <StatBlock
            label={t('progress.topPr', { name: topPr.name })}
            value={`${topPr.pr.weightKg} kg`}
            secondary={t('progress.prReps', { reps: topPr.pr.reps })}
          />
        ) : (
          <StatBlock
            label={t('progress.topPrLabel')}
            value="—"
            secondary={t('progress.noPrYet')}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-3 p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-fg">
              {activeName ?? t('progress.evolution')}
            </h2>
            <p className="text-xs text-fg-muted">
              {t('progress.maxWeightSeries')}
            </p>
          </div>
          {chartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-fg-muted">
              {t('progress.exerciseEvolutionEmpty')}
            </p>
          ) : (
            <ChartContainer data={chartData} unit="kg" />
          )}
        </Card>

        <Card className="flex flex-col p-5">
          <h2 className="text-base font-semibold text-fg">
            {t('progress.records')}
          </h2>
          <ul className="mt-3 flex flex-col divide-y divide-line/40">
            {summaries.map((s) => {
              const isActive =
                (activeName ?? '').toLowerCase() === s.name.toLowerCase();
              return (
                <li key={s.name}>
                  <button
                    type="button"
                    onClick={() => setSelected(s.name)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-md px-2 py-3 text-left transition-colors',
                      isActive
                        ? 'bg-accent/10 text-fg'
                        : 'hover:bg-surface-2/50 text-fg',
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {s.name}
                    </span>
                    <span className="shrink-0 text-right text-sm">
                      {s.pr ? (
                        <>
                          <span className="font-medium text-fg">
                            {s.pr.weightKg} kg
                          </span>
                          <span className="ml-1 text-xs text-fg-muted">
                            × {s.pr.reps}
                          </span>
                        </>
                      ) : (
                        <span className="text-fg-subtle">—</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function FrequencyTab() {
  const { t } = useTranslation();
  const sessionsQ = useFinishedSessionsQuery();
  const sessions = sessionsQ.data ?? [];

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => localDateKey(today.toISOString()), [today]);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const trainedDays = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) {
      const when = s.finishedAt ?? s.startedAt;
      set.add(localDateKey(when));
    }
    return set;
  }, [sessions]);

  const yearCount = useMemo(() => {
    let n = 0;
    for (const key of trainedDays) {
      if (key.startsWith(`${today.getFullYear()}-`)) n += 1;
    }
    return n;
  }, [trainedDays, today]);

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-`;
  const monthCount = useMemo(() => {
    let n = 0;
    for (const key of trainedDays) {
      if (key.startsWith(monthPrefix)) n += 1;
    }
    return n;
  }, [trainedDays, monthPrefix]);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const leadingBlanks = first.getDay();
    const result: ({ day: number; key: string } | null)[] = [];
    for (let i = 0; i < leadingBlanks; i += 1) result.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      const key = `${monthPrefix}${String(d).padStart(2, '0')}`;
      result.push({ day: d, key });
    }
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [viewYear, viewMonth, monthPrefix]);

  function goPrev() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }
  function goNext() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  if (sessions.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <CalendarDays className="h-8 w-8 text-fg-subtle" />
        <p className="max-w-md text-sm text-fg-muted">
          {t('progress.frequencyEmpty')}
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatBlock
          label={t('progress.frequencyYearLabel')}
          value={String(yearCount)}
          secondary={String(today.getFullYear())}
        />
        <StatBlock
          label={t('progress.frequencyMonthLabel')}
          value={String(monthCount)}
          secondary={`${MONTH_LABELS[viewMonth]} ${viewYear}`}
        />
      </div>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-fg">
            {MONTH_LABELS[viewMonth]} {viewYear}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label={t('progress.frequencyPrevMonth')}
              onClick={goPrev}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label={t('progress.frequencyNextMonth')}
              onClick={goNext}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="pb-1 text-[11px] font-medium uppercase tracking-wider text-fg-subtle"
            >
              {label}
            </div>
          ))}
          {cells.map((cell, idx) => {
            if (!cell) return <div key={idx} className="aspect-square" />;
            const trained = trainedDays.has(cell.key);
            const isToday = cell.key === todayKey;
            return (
              <div
                key={idx}
                className={cn(
                  'relative flex aspect-square items-center justify-center rounded-md text-sm transition-colors',
                  trained
                    ? 'bg-accent text-on-accent font-semibold shadow-sm shadow-accent/30'
                    : 'text-fg-muted',
                  isToday && !trained && 'ring-1 ring-accent/60 text-fg',
                  isToday && trained && 'ring-2 ring-accent/80 ring-offset-1 ring-offset-surface',
                )}
              >
                {cell.day}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function StatBlock({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string;
}) {
  return (
    <Card className="flex flex-col gap-1.5 p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
        {label}
      </p>
      <p className="text-2xl font-semibold text-fg">{value}</p>
      {secondary && <p className="text-xs text-fg-muted">{secondary}</p>}
    </Card>
  );
}

function ChartContainer({
  data,
  unit,
}: {
  data: readonly { label: string; fullDate: string; value: number }[];
  unit: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={[...data]}
          margin={{ top: 10, right: 12, bottom: 0, left: -10 }}
        >
          <CartesianGrid
            stroke="#262d3d"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke="#9aa3b2"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9aa3b2"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={48}
            unit={` ${unit}`}
          />
          <Tooltip
            contentStyle={{
              background: '#161b27',
              border: '1px solid #262d3d',
              borderRadius: 12,
              color: '#f5f7fa',
              fontSize: 12,
            }}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.fullDate ?? ''
            }
            formatter={(value) => [`${value} ${unit}`, '']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#7c3aed"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#7c3aed', stroke: '#7c3aed' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
