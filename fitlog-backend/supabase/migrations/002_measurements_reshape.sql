-- =============================================================
-- Reformata medidas: novo conjunto de campos (esq./dir. onde faz sentido)
-- Rodar no Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================
-- Antes: body_fat_pct, chest_cm, shoulder_cm, hip_cm, arm_cm, thigh_cm, calf_cm
-- Depois: bicep_l/r, forearm_l/r, belly, glutes, thigh_l/r, calf_l/r
-- weight_kg e waist_cm são mantidos.
--
-- Como a Wilma ainda não tem dados de produção pra migrar semanticamente
-- (braço → muque esquerdo/direito, coxa → cambito esq./dir., etc), esta migração
-- é destrutiva pros campos antigos.
-- =============================================================

alter table public.measurements
  add column if not exists bicep_left_cm     numeric,
  add column if not exists bicep_right_cm    numeric,
  add column if not exists forearm_left_cm   numeric,
  add column if not exists forearm_right_cm  numeric,
  add column if not exists belly_cm          numeric,
  add column if not exists glutes_cm         numeric,
  add column if not exists thigh_left_cm     numeric,
  add column if not exists thigh_right_cm    numeric,
  add column if not exists calf_left_cm      numeric,
  add column if not exists calf_right_cm     numeric;

alter table public.measurements
  drop column if exists body_fat_pct,
  drop column if exists chest_cm,
  drop column if exists shoulder_cm,
  drop column if exists hip_cm,
  drop column if exists arm_cm,
  drop column if exists thigh_cm,
  drop column if exists calf_cm;
