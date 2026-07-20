# Setup Storage de vídeos dos exercícios

Guia rápido pra habilitar o upload de vídeo por exercício no Fitlog. Executa uma vez só.

---

## Passo 1 — Criar o bucket no Dashboard

1. Dashboard do Supabase → menu lateral → **Storage**.
2. Botão **New bucket**.
3. Preenche:
   - **Name:** `exercise-videos` (exatamente assim, minúsculo, hífen)
   - **Public bucket:** ✅ **ativado** (marca o toggle) — necessário pro `<video src>` funcionar sem token.
   - **File size limit:** 10 MB (opcional; o app já valida no cliente)
   - **Allowed MIME types:** `video/mp4, video/webm, video/quicktime` (opcional)
4. **Save**.

---

## Passo 2 — Criar as policies (SQL)

Dashboard → **SQL Editor** → **New query**. Cole e roda:

```sql
-- Só o próprio usuário pode escrever seus arquivos.
-- Path esperado: {user_id}/{exercise_id}.{ext}
-- Ex.: 8092112a-.../abc-def.mp4

drop policy if exists "exercise_videos_write_own"
  on storage.objects;

create policy "exercise_videos_write_own"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'exercise-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'exercise-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Leitura pública (o bucket já é público, mas garantimos aqui também).
drop policy if exists "exercise_videos_read_public"
  on storage.objects;

create policy "exercise_videos_read_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'exercise-videos');
```

Deve dar "Success. No rows returned".

---

## Pronto

Agora abra o app → **Treinos → Criar novo treino** (ou **Editar** um existente). Cada exercício tem um botão "Adicionar vídeo". Formatos: MP4, WebM, MOV. Limite: 10 MB por vídeo.

O vídeo aparece em loop mudo no card do exercício durante a sessão.
