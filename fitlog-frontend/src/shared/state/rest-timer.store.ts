import { create } from 'zustand';

type State = {
  readonly secondsLeft: number | null;
  readonly totalSeconds: number;
  readonly exerciseName: string | null;
  readonly restSessionId: string | null;
  readonly start: (seconds: number, exerciseName?: string) => void;
  readonly adjust: (delta: number) => void;
  readonly tick: () => void;
  readonly skip: () => void;
};

export const useRestTimerStore = create<State>((set, get) => ({
  secondsLeft: null,
  totalSeconds: 0,
  exerciseName: null,
  restSessionId: null,
  start: (seconds, exerciseName) => {
    if (seconds <= 0) return;
    set({
      secondsLeft: seconds,
      totalSeconds: seconds,
      exerciseName: exerciseName ?? null,
      restSessionId: crypto.randomUUID(),
    });
  },
  adjust: (delta) => {
    const current = get().secondsLeft;
    if (current === null) return;
    const next = Math.max(0, current + delta);
    set({
      secondsLeft: next,
      totalSeconds: Math.max(get().totalSeconds, next),
    });
  },
  tick: () => {
    const current = get().secondsLeft;
    if (current === null) return;
    set({ secondsLeft: Math.max(0, current - 1) });
  },
  skip: () =>
    set({
      secondsLeft: null,
      totalSeconds: 0,
      exerciseName: null,
      restSessionId: null,
    }),
}));
