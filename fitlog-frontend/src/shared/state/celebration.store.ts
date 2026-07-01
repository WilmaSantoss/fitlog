import { create } from 'zustand';

export type CelebrationKind = 'pr' | 'beatLast';

export type CelebrationData = {
  readonly id: string;
  readonly kind: CelebrationKind;
  readonly title: string;
  readonly detail: string;
  readonly emoji: string;
};

type State = {
  readonly current: CelebrationData | null;
  readonly trigger: (data: Omit<CelebrationData, 'id'>) => void;
  readonly dismiss: () => void;
};

export const useCelebrationStore = create<State>((set) => ({
  current: null,
  trigger: (data) =>
    set({
      current: {
        ...data,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      },
    }),
  dismiss: () => set({ current: null }),
}));
