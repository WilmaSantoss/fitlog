import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_SOUND_ID,
  type SoundEvent,
} from '@/shared/lib/sound-options';

type State = {
  readonly prefs: Record<SoundEvent, string>;
  readonly setPref: (event: SoundEvent, optionId: string) => void;
};

export const useSoundPrefsStore = create<State>()(
  persist(
    (set) => ({
      prefs: {
        restDone: DEFAULT_SOUND_ID,
        pr: DEFAULT_SOUND_ID,
      },
      setPref: (event, optionId) =>
        set((s) => ({ prefs: { ...s.prefs, [event]: optionId } })),
    }),
    { name: 'fitlog.sound-prefs' },
  ),
);
