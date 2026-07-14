import { supabase, requireUserId } from '@/shared/db/supabase';
import { usePushPrefsStore } from '@/shared/state/push-prefs.store';

const VAPID_PUBLIC_KEY = import.meta.env['VITE_VAPID_PUBLIC_KEY'] as
  | string
  | undefined;

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getPermissionState(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i);
  return buffer;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.ready;
  return reg;
}

export async function requestPermissionAndSubscribe(): Promise<
  { ok: true } | { ok: false; reason: 'denied' | 'unsupported' | 'no-vapid' | 'error'; error?: string }
> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };
  if (!VAPID_PUBLIC_KEY) return { ok: false, reason: 'no-vapid' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: 'denied' };

  try {
    const userId = await requireUserId();
    const reg = await getRegistration();

    // Reusa subscription existente ou cria nova
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const json = sub.toJSON();
    const endpoint = sub.endpoint;
    const p256dh = json.keys?.['p256dh'];
    const auth = json.keys?.['auth'];
    if (!p256dh || !auth) return { ok: false, reason: 'error', error: 'missing keys' };

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth_key: auth,
        user_agent: navigator.userAgent,
        active: true,
      },
      { onConflict: 'user_id,endpoint' },
    );
    if (error) return { ok: false, reason: 'error', error: error.message };

    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'error', error: (err as Error).message };
  }
}

export async function unsubscribe(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const reg = await getRegistration();
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();

    const userId = await requireUserId().catch(() => null);
    if (userId) {
      await supabase
        .from('push_subscriptions')
        .update({ active: false })
        .eq('user_id', userId)
        .eq('endpoint', endpoint);
    }
  } catch {
    // ignora — melhor esforço
  }
}

export async function scheduleRestEndNotification(
  restSessionId: string,
  restSeconds: number,
  exerciseName: string | null,
): Promise<void> {
  if (!usePushPrefsStore.getState().restEndEnabled) return;
  if (!isPushSupported()) return;
  if (Notification.permission !== 'granted') return;

  const fireAt = new Date(Date.now() + restSeconds * 1000).toISOString();

  try {
    const { error } = await supabase.functions.invoke('schedule-rest-notification', {
      body: { restSessionId, fireAt, exerciseName },
    });
    if (error) console.warn('[push] schedule failed:', error.message);
  } catch (err) {
    console.warn('[push] schedule threw:', (err as Error).message);
  }
}

export async function cancelRestEndNotification(restSessionId: string): Promise<void> {
  if (!usePushPrefsStore.getState().restEndEnabled) return;
  if (!isPushSupported()) return;

  try {
    const userId = await requireUserId();
    const dedupKey = `rest_end:${userId}:${restSessionId}`;
    await supabase
      .from('pending_notifications')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('dedup_key', dedupKey)
      .eq('status', 'pending');
  } catch {
    // ignora — se o cancel falhar, no pior caso o user vê o ding
  }
}
