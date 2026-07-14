-- =============================================================
-- Web Push: notificação de fim de descanso
-- Rodar no Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================
-- Objetivo: quando o descanso entre séries termina com o iPhone
-- bloqueado, o iOS suspende o JS do PWA e o chime nunca dispara.
-- A saída é notificação web nativa agendada por Edge Function e
-- entregue pelo pg_cron via web-push.
--
-- Arquitetura dispatch-only:
--   Cliente → Edge Function schedule → INSERT pending_notifications
--   pg_cron (15s) → Edge Function dispatch → envia web-push
--   Dedup via unique(dedup_key) — nunca notificação dobrada.
-- =============================================================

-- Extensões (idempotente)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Enum de status. Append-only: se precisar de novo valor, ALTER TYPE ADD VALUE.
-- Nunca renomear/remover valor existente.
do $$ begin
  create type public.notification_status
    as enum ('pending', 'sent', 'failed', 'cancelled');
exception when duplicate_object then null;
end $$;

-- ----------------------------------
-- 1. Push subscriptions (endpoint do browser)
-- ----------------------------------
create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  endpoint      text not null,
  p256dh        text not null,
  auth_key      text not null,
  user_agent    text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_active_idx
  on public.push_subscriptions(user_id)
  where active = true;

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subs_own" on public.push_subscriptions;
create policy "push_subs_own" on public.push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ----------------------------------
-- 2. Pending notifications (fila + histórico)
-- ----------------------------------
create table if not exists public.pending_notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  dedup_key     text not null unique,
  fire_at       timestamptz not null,
  payload       jsonb not null,
  status        public.notification_status not null default 'pending',
  attempts      integer not null default 0,
  last_error    text,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz,
  cancelled_at  timestamptz
);

-- Índice parcial: acelera o SELECT do dispatch (só linhas pending, ordenadas por fire_at)
create index if not exists pending_notifications_due_idx
  on public.pending_notifications(fire_at)
  where status = 'pending';

alter table public.pending_notifications enable row level security;

-- Cliente só lê os próprios (útil pra debug)
drop policy if exists "pending_notif_read_own" on public.pending_notifications;
create policy "pending_notif_read_own" on public.pending_notifications
  for select
  using (auth.uid() = user_id);

-- Edge Function schedule-rest-notification usa o JWT do user pra inserir.
-- Sem SERVICE_ROLE_KEY, o insert está sujeito a RLS.
drop policy if exists "pending_notif_insert_own" on public.pending_notifications;
create policy "pending_notif_insert_own" on public.pending_notifications
  for insert
  with check (auth.uid() = user_id);

-- Cliente pode marcar como 'cancelled' via UPDATE direto (sem Edge Function)
-- Restrito: só muda pra 'cancelled' e só se ainda estiver 'pending'.
drop policy if exists "pending_notif_cancel_own" on public.pending_notifications;
create policy "pending_notif_cancel_own" on public.pending_notifications
  for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'cancelled');

-- ----------------------------------
-- 3. Config do dispatch (URL + token do cron -> Edge Function)
-- ----------------------------------
-- Supabase gerenciado não permite ALTER DATABASE ... SET, então guardamos
-- os valores em tabela. RLS habilitada sem policies = zero acesso do cliente.
-- pg_cron ignora RLS (roda como superuser interno), então lê normalmente.
--
-- Popular depois de rodar a migration:
--   insert into public.app_config (key, value) values
--     ('dispatch_url', 'https://<PROJECT-REF>.supabase.co/functions/v1/dispatch-notifications'),
--     ('dispatch_token', '<DISPATCH_TOKEN>')
--   on conflict (key) do update set value = excluded.value;
create table if not exists public.app_config (
  key   text primary key,
  value text not null
);

alter table public.app_config enable row level security;

-- ----------------------------------
-- 4. Job do pg_cron: dispara dispatch a cada 15s
-- ----------------------------------
-- Idempotência: se o job já existe, remove antes de recriar.
do $$
begin
  perform cron.unschedule('dispatch-rest-notifications')
  where exists (
    select 1 from cron.job where jobname = 'dispatch-rest-notifications'
  );
exception when others then null;
end $$;

select cron.schedule(
  'dispatch-rest-notifications',
  '15 seconds',
  $$
  select net.http_post(
    url := (select value from public.app_config where key = 'dispatch_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select value from public.app_config where key = 'dispatch_token')
    ),
    body := '{}'::jsonb
  );
  $$
);
