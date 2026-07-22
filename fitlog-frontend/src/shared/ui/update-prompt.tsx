import { useEffect, useRef, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { CheckCircle2, RefreshCw } from 'lucide-react';

const JUST_UPDATED_KEY = 'fitlog:just-updated';

export function UpdatePrompt() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      registrationRef.current = registration;
      // Tenta uma vez ao montar
      void registration.update();
      // E a cada 30 minutos enquanto o app fica aberto
      setInterval(
        () => {
          void registration.update();
        },
        30 * 60 * 1000,
      );
    },
  });

  // Sempre que o app volta pro foreground ou ganha foco, força um check
  useEffect(() => {
    function checkForUpdate() {
      const reg = registrationRef.current;
      if (!reg) return;
      void reg.update();
    }
    function handleVisibility() {
      if (document.visibilityState === 'visible') checkForUpdate();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', checkForUpdate);
    window.addEventListener('online', checkForUpdate);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', checkForUpdate);
      window.removeEventListener('online', checkForUpdate);
    };
  }, []);

  // Após o reload disparado pelo updateServiceWorker, mostra confirmação.
  const [justUpdated, setJustUpdated] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(JUST_UPDATED_KEY) === '1') {
        localStorage.removeItem(JUST_UPDATED_KEY);
        setJustUpdated(true);
        const id = window.setTimeout(() => setJustUpdated(false), 3500);
        return () => window.clearTimeout(id);
      }
    } catch {
      // localStorage indisponível — ignora
    }
  }, []);

  const handleUpdate = () => {
    try {
      localStorage.setItem(JUST_UPDATED_KEY, '1');
    } catch {
      // ignora
    }
    void updateServiceWorker(true);
  };

  if (justUpdated) {
    return (
      <div
        role="status"
        className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-[70] flex justify-center px-3 md:bottom-4"
      >
        <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-success/40 bg-surface px-4 py-3 shadow-2xl shadow-black/40">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          <p className="min-w-0 flex-1 text-sm text-fg">
            App atualizado com sucesso.
          </p>
        </div>
      </div>
    );
  }

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      // No mobile senta acima do bottom-nav (~64px + safe-area).
      // No desktop, sem bottom-nav, cola ~1rem do fundo.
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-[70] flex justify-center px-3 md:bottom-4"
    >
      <div className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-accent/40 bg-surface px-4 py-3 shadow-2xl shadow-black/40">
        <RefreshCw className="h-5 w-5 shrink-0 text-accent" />
        <p className="min-w-0 flex-1 text-sm text-fg">
          Nova versão disponível.
        </p>
        <button
          type="button"
          onClick={handleUpdate}
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
