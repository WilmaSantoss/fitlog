import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { SetTypePill } from './set-type-pill';
import type { SessionSet } from '../domain/workout.types';

type Props = {
  set: SessionSet;
  workingNumber?: number;
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

export function SessionSetRow({ set, workingNumber, onChange }: Props) {
  const { t } = useTranslation();
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

  const previousLabel =
    set.plannedWeightKg !== null && set.plannedReps !== null
      ? `${set.plannedWeightKg}kg × ${set.plannedReps}`
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
        type="number"
        inputMode="decimal"
        step="0.5"
        value={kg}
        onChange={(e) => setKg(e.target.value)}
        onBlur={commit}
        placeholder="—"
        className="h-9 w-full rounded-md bg-surface-2 px-2 text-center text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <input
        type="number"
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
          onChange({ completed: !set.completed });
        }}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
          set.completed
            ? 'bg-success text-on-accent'
            : 'bg-surface-2 text-fg-subtle hover:text-fg',
        )}
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}
