import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type State = {
  readonly restEndEnabled: boolean;
  readonly setRestEndEnabled: (enabled: boolean) => void;
};

export const usePushPrefsStore = create<State>()(
  persist(
    (set) => ({
      restEndEnabled: false,
      setRestEndEnabled: (enabled) => set({ restEndEnabled: enabled }),
    }),
    { name: 'fitlog.push-prefs' },
  ),
);
