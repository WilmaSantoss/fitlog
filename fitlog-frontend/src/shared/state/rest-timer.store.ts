import { create } from 'zustand';

type State = {
  readonly secondsLeft: number | null;
  readonly totalSeconds: number;
  readonly endsAt: number | null;
  readonly exerciseName: string | null;
  readonly restSessionId: string | null;
  readonly start: (seconds: number, exerciseName?: string) => void;
  readonly adjust: (delta: number) => void;
  readonly tick: () => void;
  readonly skip: () => void;
};

function remainingFromEndsAt(endsAt: number | null): number | null {
  if (endsAt === null) return null;
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

export const useRestTimerStore = create<State>((set, get) => ({
  secondsLeft: null,
  totalSeconds: 0,
  endsAt: null,
  exerciseName: null,
  restSessionId: null,
  start: (seconds, exerciseName) => {
    if (seconds <= 0) return;
    set({
      secondsLeft: seconds,
      totalSeconds: seconds,
      endsAt: Date.now() + seconds * 1000,
      exerciseName: exerciseName ?? null,
      restSessionId: crypto.randomUUID(),
    });
  },
  adjust: (delta) => {
    const { endsAt, totalSeconds } = get();
    if (endsAt === null) return;
    const nextEndsAt = Math.max(Date.now(), endsAt + delta * 1000);
    const nextSecondsLeft = remainingFromEndsAt(nextEndsAt) ?? 0;
    set({
      endsAt: nextEndsAt,
      secondsLeft: nextSecondsLeft,
      totalSeconds: Math.max(totalSeconds, nextSecondsLeft),
      // Novo id: o push agendado é único por id (dedup_key), então pra
      // reagendar no horário novo precisa de outro.
      restSessionId: crypto.randomUUID(),
    });
  },
  tick: () => {
    const { endsAt } = get();
    if (endsAt === null) return;
    const next = remainingFromEndsAt(endsAt);
    if (next === null) return;
    set({ secondsLeft: next });
  },
  skip: () =>
    set({
      secondsLeft: null,
      totalSeconds: 0,
      endsAt: null,
      exerciseName: null,
      restSessionId: null,
    }),
}));
