import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRestTimerStore } from '@/shared/state/rest-timer.store';
import { playEventSound } from '@/shared/lib/sound';
import { formatClock } from '@/shared/lib/format';
import { getSilentAudio } from '@/shared/lib/silent-audio';
import { cn } from '@/shared/lib/cn';

function setLockScreenMetadata(
  exerciseName: string | null,
  secondsLeft: number,
  total: number,
): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: exerciseName ?? 'Descanso',
      artist: `Descanso · ${formatClock(secondsLeft)}`,
      album: 'Fitlog',
      artwork: [
        { src: '/pwa-192.svg', sizes: '192x192', type: 'image/svg+xml' },
        { src: '/pwa-512.svg', sizes: '512x512', type: 'image/svg+xml' },
      ],
    });
    navigator.mediaSession.playbackState = 'playing';
    if (typeof navigator.mediaSession.setPositionState === 'function') {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(total, 1),
          position: Math.max(0, total - secondsLeft),
          playbackRate: 1,
        });
      } catch {
        // ignorar — alguns browsers reclamam de valores
      }
    }
  } catch {
    // MediaMetadata pode não existir em browsers antigos
  }
}

function clearLockScreenMetadata(): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.playbackState = 'none';
  for (const action of [
    'play',
    'pause',
    'stop',
    'seekbackward',
    'seekforward',
  ] as const) {
    try {
      navigator.mediaSession.setActionHandler(action, null);
    } catch {
      // ignorar
    }
  }
}

export function RestTimerBar() {
  const { t } = useTranslation();
  const secondsLeft = useRestTimerStore((s) => s.secondsLeft);
  const total = useRestTimerStore((s) => s.totalSeconds);
  const exerciseName = useRestTimerStore((s) => s.exerciseName);
  const tick = useRestTimerStore((s) => s.tick);
  const adjust = useRestTimerStore((s) => s.adjust);
  const skip = useRestTimerStore((s) => s.skip);
  const playedZeroRef = useRef(false);
  const adjustRef = useRef(adjust);
  const skipRef = useRef(skip);
  adjustRef.current = adjust;
  skipRef.current = skip;

  // Tick a cada segundo enquanto o timer está rodando
  useEffect(() => {
    if (secondsLeft === null) {
      playedZeroRef.current = false;
      return;
    }
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
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

  // MediaSession + áudio silencioso pra aparecer na tela de bloqueio
  useEffect(() => {
    const active = secondsLeft !== null;
    if (!active) {
      const audio = getSilentAudio();
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      clearLockScreenMetadata();
      return;
    }
    const audio = getSilentAudio();
    if (audio) {
      void audio.play().catch(() => {
        // se falhar (autoplay), só ignora — controles não aparecerão
      });
    }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('seekbackward', () =>
          adjustRef.current(-15),
        );
      } catch {
        // ignorar
      }
      try {
        navigator.mediaSession.setActionHandler('seekforward', () =>
          adjustRef.current(15),
        );
      } catch {
        // ignorar
      }
      try {
        navigator.mediaSession.setActionHandler('stop', () => skipRef.current());
      } catch {
        // ignorar
      }
    }
  }, [secondsLeft !== null]);

  // Atualiza o título/posição na tela de bloqueio a cada segundo
  useEffect(() => {
    if (secondsLeft === null) return;
    setLockScreenMetadata(exerciseName, secondsLeft, total);
  }, [secondsLeft, total, exerciseName]);

  if (secondsLeft === null) return null;

  const progress = total > 0 ? 1 - secondsLeft / total : 0;
  const isDone = secondsLeft === 0;

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
          onClick={skip}
          className="h-10 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent/90"
        >
          {t('workouts.restSkip')}
        </button>
      </div>
    </div>
  );
}
