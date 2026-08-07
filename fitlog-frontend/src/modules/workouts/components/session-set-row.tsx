import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { SetTypePill } from './set-type-pill';
import type { RestByType, SessionSet } from '../domain/workout.types';
import type { ExercisePr, PreviousSet } from '../services/session.service';
import { useCelebrationStore } from '@/shared/state/celebration.store';
import { useRestTimerStore } from '@/shared/state/rest-timer.store';
import { scheduleRestEndNotification } from '@/shared/lib/push';

type Props = {
  set: SessionSet;
  previous?: PreviousSet | null;
  exerciseName: string;
  rests: RestByType;
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
  const trimmed = v.trim().replace(/\s+/g, '').replace(',', '.');
  if (trimmed === '') return null;
  // Blocos tipo "4+4+4+4" → soma (útil pra cluster/rest-pause).
  if (/^\d+(\+\d+)+$/.test(trimmed)) {
    return trimmed.split('+').reduce((a, s) => a + Number(s), 0);
  }
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function SessionSetRow({
  set,
  previous,
  exerciseName,
  rests,
  allTimePr,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const triggerCelebration = useCelebrationStore((s) => s.trigger);
  const startRest = useRestTimerStore((s) => s.start);
  const [kg, setKg] = useState(toStr(set.actualWeightKg));
  const [reps, setReps] = useState(toStr(set.actualReps));
  // Quando o usuário toca no botão check, a sequência de eventos no mobile é:
  // mousedown/touchstart → input perde foco (blur) → click. Como o blur dispara
  // commit() e o click dispara onChange(completed), acabavam duas mutations
  // concorrentes. Esta flag permite ao click anunciar "vou cuidar de tudo",
  // suprimindo o commit do blur.
  const skipNextBlurCommitRef = useRef(false);

  useEffect(() => {
    setKg(toStr(set.actualWeightKg));
    setReps(toStr(set.actualReps));
  }, [set.actualWeightKg, set.actualReps]);

  function commit() {
    if (skipNextBlurCommitRef.current) {
      skipNextBlurCommitRef.current = false;
      return;
    }
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
        set.completed && 'ring-1 ring-inset ring-success/50',
      )}
    >
      <SetTypePill type={set.type} />
      <span className="truncate text-sm text-fg-muted">{previousLabel}</span>
      <input
        type="text"
        inputMode="decimal"
        value={kg}
        onChange={(e) => setKg(e.target.value)}
        onBlur={commit}
        placeholder={
          set.plannedWeightKg !== null ? String(set.plannedWeightKg) : '—'
        }
        className="h-8 w-full rounded-md bg-surface-2 px-2 text-center text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <input
        type="text"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={commit}
        placeholder={set.plannedReps ?? '—'}
        className="h-8 w-full rounded-md bg-surface-2 px-2 text-center text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <button
        type="button"
        aria-label={t('common.confirm')}
        onPointerDown={() => {
          // Marca pra o próximo onBlur dos inputs não disparar uma 2ª mutation
          skipNextBlurCommitRef.current = true;
        }}
        onClick={() => {
          const newKg = parseNum(kg);
          const newReps = parseNum(reps);
          const willComplete = !set.completed;
          const patch: {
            actualWeightKg?: number | null;
            actualReps?: number | null;
            completed: boolean;
          } = { completed: willComplete };
          if (newKg !== set.actualWeightKg) patch.actualWeightKg = newKg;
          if (newReps !== set.actualReps) patch.actualReps = newReps;
          onChange(patch);

          // Se o tipo do set não tem descanso configurado, cai pra qualquer
          // outro que tenha (WS > FS > WU). Rotinas legadas migram os 3 iguais,
          // mas rotinas novas podem ter só um preenchido.
          const restForSet =
            rests[set.type] ?? rests.WS ?? rests.FS ?? rests.WU ?? null;
          if (willComplete && restForSet && restForSet > 0) {
            startRest(restForSet, exerciseName);
            const sessionId = useRestTimerStore.getState().restSessionId;
            if (sessionId) {
              void scheduleRestEndNotification(sessionId, restForSet, exerciseName);
            }
          }
          if (willComplete) {
            const currentKg = newKg ?? set.actualWeightKg;
            const currentReps = newReps ?? set.actualReps;
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
        }}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-md border transition-all active:scale-95',
          set.completed
            ? 'border-success/70 bg-success/15 text-success'
            : 'border-line bg-surface-2 text-fg-subtle hover:border-accent/60 hover:bg-accent/10 hover:text-accent',
        )}
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}
