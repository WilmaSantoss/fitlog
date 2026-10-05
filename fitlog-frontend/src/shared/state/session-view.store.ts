import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Preferência de visualização da tela do treino em andamento (por aparelho).
type State = {
  // true: animação grande no topo de cada exercício.
  // false: só miniatura ao lado do nome, com "Ver" pra ampliar.
  readonly showAnimations: boolean;
  readonly setShowAnimations: (show: boolean) => void;
};

export const useSessionViewStore = create<State>()(
  persist(
    (set) => ({
      showAnimations: true,
      setShowAnimations: (show) => set({ showAnimations: show }),
    }),
    { name: 'fitlog.session-view' },
  ),
);
