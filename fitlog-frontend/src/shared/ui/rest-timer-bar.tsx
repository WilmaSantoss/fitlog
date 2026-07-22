import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRestTimerStore } from '@/shared/state/rest-timer.store';
import { playEventSound } from '@/shared/lib/sound';
import { cancelRestEndNotification } from '@/shared/lib/push';
import { formatClock } from '@/shared/lib/format';
import { cn } from '@/shared/lib/cn';

export function RestTimerBar() {
  const { t } = useTranslation();
  const secondsLeft = useRestTimerStore((s) => s.secondsLeft);
  const total = useRestTimerStore((s) => s.totalSeconds);
  const tick = useRestTimerStore((s) => s.tick);
  const adjust = useRestTimerStore((s) => s.adjust);
  const skip = useRestTimerStore((s) => s.skip);
  const playedZeroRef = useRef(false);

  // Tick a cada segundo enquanto o timer está rodando.
  // Também reagenda no visibilitychange/focus pra recompor quando o iOS
  // volta do lock — setInterval é pausado com a tela bloqueada.
  useEffect(() => {
    if (secondsLeft === null) {
      playedZeroRef.current = false;
      return;
    }
    const id = window.setInterval(tick, 1000);
    const onWake = () => tick();
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    window.addEventListener('pageshow', onWake);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
      window.removeEventListener('pageshow', onWake);
    };
  }, [secondsLeft, tick]);

  // Som + vibração quando zerar
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

  // Skip manual: cancela a notif agendada antes de zerar o store
  const handleSkip = () => {
    const sessionId = useRestTimerStore.getState().restSessionId;
    if (sessionId) void cancelRestEndNotification(sessionId);
    skip();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="shrink-0 border-t border-line/60 bg-app/95 backdrop-blur"
    >
      <div className="relative h-1 bg-surface-2">
        <div
          className={cn(
            'h-full transition-[width] duration-1000 ease-linear',
            isDone ? 'bg-success' : 'bg-accent',
          )}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <div className="mx-auto flex max-w-md items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => adjust(-15)}
          disabled={isDone}
          className="h-10 min-w-[3.25rem] rounded-lg border border-line bg-surface-2 px-3 text-sm font-medium text-fg transition-colors hover:bg-surface-2/70 disabled:opacity-40"
        >
          {t('workouts.restSub15')}
        </button>
        <p
          className={cn(
            'flex-1 text-center font-mono text-2xl font-bold tabular-nums leading-none',
            isDone ? 'text-success' : 'text-fg',
          )}
        >
          {formatClock(secondsLeft)}
        </p>
        <button
          type="button"
          onClick={() => adjust(15)}
          disabled={isDone}
          className="h-10 min-w-[3.25rem] rounded-lg border border-line bg-surface-2 px-3 text-sm font-medium text-fg transition-colors hover:bg-surface-2/70 disabled:opacity-40"
        >
          {t('workouts.restAdd15')}
        </button>
        <button
          type="button"
          onClick={handleSkip}
          className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent/90"
        >
          {t('workouts.restSkip')}
        </button>
      </div>
    </div>
  );
}
