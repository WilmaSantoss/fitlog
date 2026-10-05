-- =============================================================
-- Web Push: reduzir atraso da notificação de fim de descanso
-- Rodar no Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================
-- Problema: o pg_cron chamava o dispatch a cada 15s, então o push
-- chegava até ~15s depois do fim do descanso (mais cold start da
-- Edge Function e entrega do APNs).
--
-- Solução:
--   - Cron roda a cada 1s, mas só no Postgres: checa se tem linha
--     vencida e só então chama a Edge Function. Sem invocação à toa.
--   - Dispatch "reserva" as linhas (status 'processing') antes de
--     enviar, via FOR UPDATE SKIP LOCKED. Com o cron a cada 1s, duas
--     invocações podem se sobrepor — a reserva garante envio único.
--   - Limpeza diária do cron.job_run_details (1 linha por segundo).
-- =============================================================

-- Enum append-only: só adiciona valor novo.
alter type public.notification_status add value if not exists 'processing';

-- plpgsql (e não sql) de propósito: o corpo não é validado na criação, então
-- dá pra referenciar 'processing' na mesma transação que o ADD VALUE.
create or replace function public.claim_due_notifications(batch_size integer default 100)
returns setof public.pending_notifications
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Linha que ficou presa em 'processing' (function caiu no meio) já passou
  -- do TTL do push (60s) — não adianta mais entregar.
  update public.pending_notifications
     set status = 'failed', last_error = 'stuck in processing'
   where status = 'processing'
     and fire_at < now() - interval '2 minutes';

  return query
  update public.pending_notifications p
     set status = 'processing'
   where p.id in (
     select id
       from public.pending_notifications
      where status = 'pending'
        and fire_at <= now()
      order by fire_at
      limit batch_size
      for update skip locked
   )
  returning p.*;
end;
$$;

revoke all on function public.claim_due_notifications(integer) from public, anon, authenticated;
grant execute on function public.claim_due_notifications(integer) to service_role;

-- ----------------------------------
-- Cron: a cada 1s, só chama a Edge Function se houver algo vencido
-- ----------------------------------
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
  '1 seconds',
  $cron$
  do $do$
  begin
    if exists (
      select 1 from public.pending_notifications
       where status = 'pending' and fire_at <= now()
    ) then
      perform net.http_post(
        url := (select value from public.app_config where key = 'dispatch_url'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select value from public.app_config where key = 'dispatch_token')
        ),
        body := '{}'::jsonb
      );
    end if;
  end
  $do$;
  $cron$
);

-- ----------------------------------
-- Limpeza diária do histórico do cron (senão acumula ~86 mil linhas/dia)
-- ----------------------------------
do $$
begin
  perform cron.unschedule('cleanup-cron-run-details')
  where exists (
    select 1 from cron.job where jobname = 'cleanup-cron-run-details'
  );
exception when others then null;
end $$;

select cron.schedule(
  'cleanup-cron-run-details',
  '0 4 * * *',
  $$delete from cron.job_run_details where end_time < now() - interval '1 day'$$
);
