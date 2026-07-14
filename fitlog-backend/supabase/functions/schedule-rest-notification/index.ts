// Recebe o "vou descansar X segundos" do cliente e registra uma linha
// em pending_notifications. Não envia nada — quem envia é o dispatch.
//
// Idempotência via dedup_key único (rest_end:user_id:restSessionId).
// Se o cliente chama duas vezes com o mesmo restSessionId (retry, double tap),
// o ON CONFLICT DO NOTHING garante que só sobra uma linha.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders, json } from '../_shared/cors.ts';

type Body = {
  restSessionId: string;
  fireAt: string; // ISO
  exerciseName: string | null;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, { status: 405 });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'missing auth' }, { status: 401 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return json({ error: 'invalid auth' }, { status: 401 });
  const userId = userData.user.id;

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json' }, { status: 400 });
  }

  if (!body.restSessionId || !body.fireAt) {
    return json({ error: 'restSessionId and fireAt required' }, { status: 400 });
  }

  const dedupKey = `rest_end:${userId}:${body.restSessionId}`;

  const { error: insertErr } = await supabase.from('pending_notifications').insert({
    user_id: userId,
    dedup_key: dedupKey,
    fire_at: body.fireAt,
    payload: {
      title: 'Descanso terminado',
      body: body.exerciseName
        ? `Próxima série: ${body.exerciseName}`
        : 'Bora pra próxima série!',
      restSessionId: body.restSessionId,
    },
  });

  // Postgres error 23505 = unique_violation. É o esperado quando o cliente
  // chama duas vezes com o mesmo restSessionId — não é erro.
  if (insertErr && insertErr.code !== '23505') {
    return json({ error: insertErr.message }, { status: 500 });
  }

  return json({ ok: true, dedupKey });
});
