import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(
        () => {
          void registration.update();
        },
        60 * 60 * 1000,
      );
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-3 z-[70] flex justify-center px-3"
    >
      <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-accent/40 bg-surface px-4 py-3 shadow-2xl shadow-black/40">
        <RefreshCw className="h-5 w-5 shrink-0 text-accent" />
        <p className="min-w-0 flex-1 text-sm text-fg">
          Nova versão disponível.
        </p>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent hover:bg-accent/90"
        >
          Atualizar
        </button>
        <button
          type="button"
          aria-label="Dispensar"
          onClick={() => setNeedRefresh(false)}
          className="shrink-0 rounded-md px-2 py-1.5 text-xs text-fg-muted hover:text-fg"
        >
          Depois
        </button>
      </div>
    </div>
  );
}
