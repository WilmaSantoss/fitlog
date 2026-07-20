import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LineChart, Play, Plus } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { PageTitle } from '@/shared/ui/page-title';
import { useMeasurementsQuery } from '@/modules/measurements/hooks/use-measurements';
import { useRoutinesQuery } from '@/modules/workouts/hooks/use-routines';
import {
  useActiveSessionsQuery,
  useFinishedSessionsQuery,
} from '@/modules/workouts/hooks/use-sessions';
import { useProfileQuery } from '@/modules/profile/hooks/use-profile';
import { formatRelative, isThisWeek } from '@/shared/lib/date';
import { formatKg } from '@/shared/lib/format';

const WEEK_GOAL = 4;

const WEEKDAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'] as const;
const MONTH_SHORT = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
] as const;

function formatEyebrowDate(d: Date): string {
  return `${WEEKDAY_SHORT[d.getDay()]} · ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

type StatRowProps = {
  label: string;
  children: React.ReactNode;
};

function StatRow({ label, children }: StatRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0 border-b border-line/40 last:border-b-0">
      <span className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
        {label}
      </span>
      <div className="text-right">{children}</div>
    </div>
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
  const canStart = routines.length > 0;

  return (
    <div className="flex flex-col gap-6 pt-6 md:pt-2">
      <PageTitle
        eyebrow={
          <span className="inline-flex items-center gap-2">
            <span className="h-px w-6 bg-accent" />
            {formatEyebrowDate(new Date())}
          </span>
        }
        title={
          userName
            ? `${t('home.greetingAnon')}, ${userName}`
            : t('home.greetingAnon')
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

      <Card className="px-5 py-2">
        <StatRow label={t('home.statThisWeek')}>
          <span className="text-2xl font-semibold text-fg tabular-nums">
            {weekCount}
            <span className="ml-0.5 text-sm font-normal text-fg-muted">
              /{WEEK_GOAL}
            </span>
          </span>
        </StatRow>

        <StatRow label={t('home.statCurrentWeight')}>
          {lastWeight ? (
            <div className="flex flex-col items-end">
              <span className="text-base font-semibold text-fg">
                {formatKg(lastWeight.weightKg)}
              </span>
              <span className="text-[11px] text-fg-muted">
                {formatRelative(lastWeight.recordedAt)}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/medidas/nova')}
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              {t('home.registerWeight')} →
            </button>
          )}
        </StatRow>

        <StatRow label={t('home.statLastWorkout')}>
          {lastSession ? (
            <div className="flex items-baseline justify-end gap-2">
              <span className="text-base font-semibold text-fg">
                {lastSession.routineName}
              </span>
              <span className="text-xs text-fg-muted">
                ·{' '}
                {formatRelative(
                  lastSession.finishedAt ?? lastSession.startedAt,
                )}
              </span>
            </div>
          ) : (
            <span className="text-sm text-fg-muted">
              {t('home.startToday')}
            </span>
          )}
        </StatRow>
      </Card>

      <Button
        size="md"
        fullWidth
        leadingIcon={<Play className="h-4 w-4" />}
        disabled={!canStart}
        onClick={() => navigate('/treino')}
      >
        {t('home.quickStartWorkout')}
      </Button>

      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
          {t('home.sectionShortcuts')}
        </h2>
        <Card className="divide-y divide-line/40 p-0">
          <ShortcutRow
            icon={<LineChart className="h-4 w-4" />}
            label={t('home.quickAddMeasurement')}
            onClick={() => navigate('/medidas/nova')}
          />
          <ShortcutRow
            icon={<Plus className="h-4 w-4" />}
            label={t('home.quickCreateRoutine')}
            onClick={() => navigate('/treino/novo')}
          />
        </Card>
      </section>
    </div>
  );
}

function ShortcutRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-2/60"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-fg">{label}</span>
      <ChevronRight className="h-4 w-4 text-fg-subtle" />
    </button>
  );
}
