import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRestTimerStore } from '@/shared/state/rest-timer.store';
import { playEventSound } from '@/shared/lib/sound';
import { formatClock } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

export function RestTimerBar() {
  const { t } = useTranslation();
  const secondsLeft = useRestTimerStore((s) => s.secondsLeft);
  const total = useRestTimerStore((s) => s.totalSeconds);
  const exerciseName = useRestTimerStore((s) => s.exerciseName);
  const tick = useRestTimerStore((s) => s.tick);
  const adjust = useRestTimerStore((s) => s.adjust);
  const skip = useRestTimerStore((s) => s.skip);
  const playedZeroRef = useRef(false);

  useEffect(() => {
    if (secondsLeft === null) {
      playedZeroRef.current = false;
      return;
    }
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft, tick]);

  useEffect(() => {
    if (secondsLeft === 0 && !playedZeroRef.current) {
      playedZeroRef.current = true;
      playEventSound('restDone');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([180, 100, 180, 100, 320]);
      }
      const id = window.setTimeout(() => skip(), 1800);
      return () => window.clearTimeout(id);
    }
  }, [secondsLeft, skip]);

  if (secondsLeft === null) return null;

  const progress = total > 0 ? 1 - secondsLeft / total : 0;
  const isDone = secondsLeft === 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+72px)] md:pb-6"
    >
      <div className="pointer-events-auto w-full max-w-md overflow-hidden rounded-t-2xl border border-line/60 bg-surface shadow-2xl shadow-black/40 md:rounded-2xl">
        <div className="relative h-1 bg-surface-2">
          <div
            className={cn(
              'h-full transition-[width] duration-1000 ease-linear',
              isDone ? 'bg-success' : 'bg-accent',
            )}
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <div className="flex flex-col items-center gap-3 px-4 py-4">
          {exerciseName && (
            <p className="truncate text-xs uppercase tracking-wider text-fg-subtle">
              {t('workouts.restRunning')} · {exerciseName}
            </p>
          )}
          <p
            className={cn(
              'font-mono text-5xl font-bold tabular-nums',
              isDone ? 'text-success' : 'text-fg',
            )}
          >
            {formatClock(secondsLeft)}
          </p>
          <div className="grid w-full grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => adjust(-15)}
              disabled={isDone}
              className="h-11 rounded-lg border border-line bg-surface-2 text-sm font-medium text-fg transition-colors hover:bg-surface-2/70 disabled:opacity-40"
            >
              {t('workouts.restSub15')}
            </button>
            <button
              type="button"
              onClick={() => adjust(15)}
              disabled={isDone}
              className="h-11 rounded-lg border border-line bg-surface-2 text-sm font-medium text-fg transition-colors hover:bg-surface-2/70 disabled:opacity-40"
            >
              {t('workouts.restAdd15')}
            </button>
            <button
              type="button"
              onClick={skip}
              className="h-11 rounded-lg bg-accent text-sm font-semibold text-on-accent transition-colors hover:bg-accent/90"
            >
              {t('workouts.restSkip')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
