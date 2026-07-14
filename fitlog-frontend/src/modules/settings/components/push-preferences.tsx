import { useEffect, useState } from 'react';
import { Card } from '@/shared/ui/card';
import { usePushPrefsStore } from '@/shared/state/push-prefs.store';
import {
  getPermissionState,
  isPushSupported,
  requestPermissionAndSubscribe,
  unsubscribe,
} from '@/shared/lib/push';

type Status =
  | { kind: 'unsupported' }
  | { kind: 'off' }
  | { kind: 'on' }
  | { kind: 'denied' }
  | { kind: 'error'; message: string };

export function PushPreferences() {
  const enabled = usePushPrefsStore((s) => s.restEndEnabled);
  const setEnabled = usePushPrefsStore((s) => s.setRestEndEnabled);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: enabled ? 'on' : 'off' });

  useEffect(() => {
    if (!isPushSupported()) {
      setStatus({ kind: 'unsupported' });
      return;
    }
    const perm = getPermissionState();
    if (perm === 'denied') setStatus({ kind: 'denied' });
    else if (enabled && perm === 'granted') setStatus({ kind: 'on' });
    else setStatus({ kind: 'off' });
  }, [enabled]);

  const supported = isPushSupported();

  async function handleToggle(next: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      if (next) {
        const res = await requestPermissionAndSubscribe();
        if (res.ok) {
          setEnabled(true);
          setStatus({ kind: 'on' });
        } else if (res.reason === 'denied') {
          setStatus({ kind: 'denied' });
        } else if (res.reason === 'unsupported') {
          setStatus({ kind: 'unsupported' });
        } else if (res.reason === 'no-vapid') {
          setStatus({
            kind: 'error',
            message: 'VAPID_PUBLIC_KEY não configurada.',
          });
        } else {
          setStatus({
            kind: 'error',
            message: res.error ?? 'falha ao inscrever',
          });
        }
      } else {
        await unsubscribe();
        setEnabled(false);
        setStatus({ kind: 'off' });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-fg-subtle">
          Notificações
        </h2>
        <p className="mt-1 text-xs text-fg-muted">
          Receba um aviso na tela de bloqueio quando o descanso terminar. No
          iPhone toca o som padrão do sistema; no app aberto, toca o chime que
          você escolheu em Sons.
        </p>
      </div>

      <label className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-fg">
          Fim de descanso
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={!supported || busy}
          onClick={() => void handleToggle(!enabled)}
          className={
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 ' +
            (enabled ? 'bg-accent' : 'bg-surface-2 border border-line')
          }
        >
          <span
            className={
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' +
              (enabled ? 'translate-x-6' : 'translate-x-1')
            }
          />
        </button>
      </label>

      {status.kind === 'denied' && (
        <p className="rounded-lg border border-dashed border-line/60 bg-surface-2/30 px-3 py-2 text-xs text-fg-muted">
          Permissão negada. Habilite notificações do Fitlog nos Ajustes do
          iPhone (Ajustes → Notificações → Fitlog).
        </p>
      )}
      {status.kind === 'unsupported' && (
        <p className="rounded-lg border border-dashed border-line/60 bg-surface-2/30 px-3 py-2 text-xs text-fg-muted">
          Este navegador não suporta notificações Web Push. No iPhone, instale
          o app na tela de início e reabra por lá.
        </p>
      )}
      {status.kind === 'error' && (
        <p className="rounded-lg border border-dashed border-danger/60 bg-danger/10 px-3 py-2 text-xs text-danger">
          Erro: {status.message}
        </p>
      )}
    </Card>
  );
}
