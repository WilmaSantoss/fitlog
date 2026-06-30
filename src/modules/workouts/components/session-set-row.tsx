import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { SetTypePill } from './set-type-pill';
import type { SessionSet } from '../domain/workout.types';
import type { ExercisePr, PreviousSet } from '../services/session.service';
import { useCelebrationStore } from '@/shared/state/celebration.store';
import { useRestTimerStore } from '@/shared/state/rest-timer.store';

type Props = {
  set: SessionSet;
  workingNumber?: number;
  previous?: PreviousSet | null;
  exerciseName: string;
  restSeconds: number | null;
  allTimePr?: ExercisePr | null;
  onChange: (patch: {
    actualWeightKg?: number | null;
    actualReps?: number | null;
    completed?: boolean;
  }) => void;
};

function toStr(v: number | null): string {
  return v === null ? '' : String(v);
}

function parseNum(v: string): number | null {
  const trimmed = v.trim().replace(',', '.');
  if (trimmed === '') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function SessionSetRow({
  set,
  workingNumber,
  previous,
  exerciseName,
  restSeconds,
  allTimePr,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const triggerCelebration = useCelebrationStore((s) => s.trigger);
  const startRest = useRestTimerStore((s) => s.start);
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

  const previousLabel = previous
    ? `${previous.weightKg}kg × ${previous.reps}`
    : '—';

  return (
    <div
      className={cn(
        'grid grid-cols-[2.25rem_minmax(0,5rem)_1fr_1fr_2.25rem] items-center gap-2 rounded-lg px-2 py-2 transition-colors',
        set.completed && 'bg-success/10',
      )}
    >
      <SetTypePill type={set.type} workingNumber={workingNumber} />
      <span className="truncate text-xs text-fg-subtle">{previousLabel}</span>
      <input
        type="text"
        inputMode="decimal"
        value={kg}
        onChange={(e) => setKg(e.target.value)}
        onBlur={commit}
        placeholder="—"
        className="h-9 w-full rounded-md bg-surface-2 px-2 text-center text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <input
        type="text"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={commit}
        placeholder="—"
        className="h-9 w-full rounded-md bg-surface-2 px-2 text-center text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <button
        type="button"
        aria-label={t('common.confirm')}
        onClick={() => {
          commit();
          const willComplete = !set.completed;
          if (willComplete && restSeconds && restSeconds > 0) {
            startRest(restSeconds, exerciseName);
          }
          if (willComplete) {
            const currentKg = parseNum(kg) ?? set.actualWeightKg;
            const currentReps = parseNum(reps) ?? set.actualReps;
            if (currentKg !== null && currentReps !== null) {
              const beatPr =
                allTimePr &&
                (currentKg > allTimePr.weightKg ||
                  (currentKg === allTimePr.weightKg &&
                    currentReps > allTimePr.reps));
              const beatLast =
                previous &&
                (currentKg > previous.weightKg ||
                  (currentKg === previous.weightKg &&
                    currentReps > previous.reps));
              if (beatPr) {
                triggerCelebration({
                  kind: 'pr',
                  title: exerciseName,
                  detail: `${currentKg}kg × ${currentReps}`,
                  emoji: '🏆',
                });
              } else if (beatLast) {
                triggerCelebration({
                  kind: 'beatLast',
                  title: exerciseName,
                  detail: `${currentKg}kg × ${currentReps} · antes ${previous.weightKg}kg × ${previous.reps}`,
                  emoji: '💪',
                });
              }
            }
          }
          onChange({ completed: willComplete });
        }}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all active:scale-95',
          set.completed
            ? 'border-success bg-success text-on-accent shadow-md shadow-success/40'
            : 'border-line bg-surface-2 text-fg-muted hover:border-accent/60 hover:bg-accent/10 hover:text-accent',
        )}
      >
        <Check className={cn('h-5 w-5', set.completed && 'stroke-[3]')} />
      </button>
    </div>
  );
}
