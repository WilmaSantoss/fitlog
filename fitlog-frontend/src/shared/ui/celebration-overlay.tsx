import { useEffect, useMemo } from 'react';
import { Award } from 'lucide-react';
import { useCelebrationStore } from '@/shared/state/celebration.store';
import { playEventSound } from '@/shared/lib/sound';
import { cn } from '@/shared/lib/cn';

const CONFETTI_COLORS = [
  '#7c3aed',
  '#a78bfa',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#38bdf8',
];

const AUTO_DISMISS_MS = 2800;

type ConfettiPiece = {
  readonly left: number;
  readonly delay: number;
  readonly duration: number;
  readonly drift: number;
  readonly color: string;
  readonly size: number;
};

function makeConfetti(count: number): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = [];
  for (let i = 0; i < count; i += 1) {
    pieces.push({
      left: Math.random() * 100,
      delay: Math.random() * 200,
      duration: 1600 + Math.random() * 1200,
      drift: -40 + Math.random() * 80,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
      size: 6 + Math.random() * 6,
    });
  }
  return pieces;
}

export function CelebrationOverlay() {
  const current = useCelebrationStore((s) => s.current);
  const dismiss = useCelebrationStore((s) => s.dismiss);

  const confetti = useMemo(
    () => (current ? makeConfetti(40) : []),
    [current?.id], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!current) return;
    playEventSound('pr');
    const handle = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(handle);
  }, [current, dismiss]);

  if (!current) return null;

  return (
    <div
      onClick={dismiss}
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((p, idx) => (
          <span
            key={idx}
            className="absolute top-0 block rounded-sm"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              animation: `fitlog-confetti ${p.duration}ms ${p.delay}ms cubic-bezier(0.2,0.6,0.4,1) forwards`,
              ['--drift' as unknown as string]: `${p.drift}px`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-6 max-w-sm rounded-2xl border border-accent/40 bg-surface px-6 py-7 text-center shadow-2xl shadow-black/60 animate-celebration-pop">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent">
          {current.kind === 'pr' ? (
            <span className="text-3xl" aria-hidden>
              🏆
            </span>
          ) : (
            <Award className="h-8 w-8" />
          )}
        </div>
        <p className="mt-4 text-xs font-medium uppercase tracking-widest text-accent">
          {current.kind === 'pr' ? 'NOVO RECORDE' : 'VOCÊ SUPEROU'}
        </p>
        <h2 className="mt-1 text-2xl font-bold text-fg">
          {current.title}{' '}
          <span className={cn('inline-block animate-celebration-emoji')}>
            {current.emoji}
          </span>
        </h2>
        <p className="mt-2 font-mono text-base text-fg-muted">
          {current.detail}
        </p>
      </div>
    </div>
  );
}
