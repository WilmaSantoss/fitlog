// Chamada pelo pg_cron a cada 15s. Autentica via bearer token compartilhado
// (não é chamada com JWT de usuário). Lê pending_notifications que já
// venceram, envia via Web Push, atualiza status.
//
// Handles importantes:
//   - Response 404/410 → subscription morta, marca inactive (soft cleanup)
//   - Outros erros → incrementa attempts, marca 'failed' após 3 tentativas
//   - 'cancelled' fica intocado (SELECT filtra por status='pending')

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import webpush from 'https://esm.sh/web-push@3.6.7';
import { corsHeaders, json } from '../_shared/cors.ts';

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 100;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization') ?? '';
  const expected = `Bearer ${Deno.env.get('DISPATCH_TOKEN') ?? ''}`;
  if (!Deno.env.get('DISPATCH_TOKEN') || authHeader !== expected) {
    return json({ error: 'forbidden' }, { status: 403 });
  }

  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT');
  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    return json({ error: 'vapid not configured' }, { status: 500 });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  // Usa service role pra bypassar RLS (é chamada machine-to-machine)
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: due, error: dueErr } = await admin
    .from('pending_notifications')
    .select('id, user_id, payload, attempts')
    .eq('status', 'pending')
    .lte('fire_at', new Date().toISOString())
    .order('fire_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (dueErr) return json({ error: dueErr.message }, { status: 500 });
  if (!due || due.length === 0) return json({ ok: true, processed: 0 });

  let sentCount = 0;
  let failedCount = 0;

  for (const notif of due) {
    const { data: subs, error: subsErr } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth_key')
      .eq('user_id', notif.user_id)
      .eq('active', true);

    if (subsErr) {
      await markFailed(admin, notif.id, notif.attempts, subsErr.message);
      failedCount += 1;
      continue;
    }

    if (!subs || subs.length === 0) {
      // Sem subscriptions ativas: marca como failed direto, não adianta retry
      await admin
        .from('pending_notifications')
        .update({ status: 'failed', last_error: 'no active subscriptions' })
        .eq('id', notif.id);
      failedCount += 1;
      continue;
    }

    let anySucceeded = false;
    let lastError: string | null = null;

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          JSON.stringify(notif.payload),
        );
        anySucceeded = true;
        await admin
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        lastError = (err as Error).message ?? 'unknown';
        if (status === 404 || status === 410) {
          // Subscription expirou / user desinstalou: soft delete
          await admin
            .from('push_subscriptions')
            .update({ active: false })
            .eq('id', sub.id);
        }
      }
    }

    if (anySucceeded) {
      await admin
        .from('pending_notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notif.id);
      sentCount += 1;
    } else {
      await markFailed(admin, notif.id, notif.attempts, lastError ?? 'all subs failed');
      failedCount += 1;
    }
  }

  return json({ ok: true, processed: due.length, sent: sentCount, failed: failedCount });
});

// deno-lint-ignore no-explicit-any
async function markFailed(admin: any, id: string, attempts: number, error: string) {
  const nextAttempts = attempts + 1;
  const status = nextAttempts >= MAX_ATTEMPTS ? 'failed' : 'pending';
  await admin
    .from('pending_notifications')
    .update({ status, attempts: nextAttempts, last_error: error })
    .eq('id', id);
}
