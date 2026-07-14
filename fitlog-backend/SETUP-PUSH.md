# Setup Web Push — passo a passo

Guia pra habilitar a notificação de fim de descanso. Todos os passos são feitos uma vez só. Depois disso, o toggle em Ajustes vira funcional.

Ordem obrigatória. Não pule nenhum passo — o próximo depende do anterior.

---

## Passo 1 — Gerar as chaves VAPID

VAPID é o par de chaves que autentica o Fitlog pros servidores de push do Google/Apple. Public vai no frontend, private fica no Supabase.

No PowerShell, na pasta do frontend:

```powershell
cd "C:\Users\Wilma Santos\Desktop\Projetos Pessoais\RepositóriosPP\fitlog\fitlog-frontend"
npx web-push generate-vapid-keys
```

Vai pedir confirmação pra instalar `web-push` — digite `y` e Enter. A saída tem esse formato:

```
=======================================
Public Key:
BEl62iUYgUivxIkv...(uma string grande)

Private Key:
UUxI4O8-FbRouAe...(outra string menor)
=======================================
```

**Copie as duas strings e guarde num bloco de notas por enquanto.** Vamos usar nos próximos passos.

---

## Passo 2 — Gerar o DISPATCH_TOKEN

Esse token é o "senha" que o pg_cron do Supabase manda pra Edge Function `dispatch-notifications` pra provar que a chamada vem de dentro do próprio Supabase, não de um estranho.

No mesmo PowerShell:

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object {[char]$_})
```

Isso imprime uma string aleatória de 48 caracteres. Copia essa string e guarda junto com as VAPID keys.

---

## Passo 3 — Colar a VAPID public key em `.env.local`

Abre o arquivo `fitlog-frontend/.env.local` num editor. Ele já tem:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Adiciona uma terceira linha:

```
VITE_VAPID_PUBLIC_KEY=<cola aqui a Public Key do Passo 1>
```

Salva. Isso é só pro frontend — a private key **nunca** vai aqui.

---

## Passo 4 — Configurar os 4 secrets no Supabase

Vai no dashboard: https://supabase.com/dashboard → seu projeto Fitlog → menu lateral esquerdo → **Project Settings** (a engrenagem embaixo) → **Edge Functions**.

Rola pra baixo até a seção **Secrets**. Vai ter um botão "Add new secret". Adiciona um por vez, os 4 abaixo:

| Nome | Valor |
|------|-------|
| `VAPID_PUBLIC_KEY` | (Public Key do Passo 1) |
| `VAPID_PRIVATE_KEY` | (Private Key do Passo 1) |
| `VAPID_SUBJECT` | `mailto:wilma@waao.com.br` |
| `DISPATCH_TOKEN` | (string do Passo 2) |

Depois de cada um, clica em "Save".

---

## Passo 5 — Aplicar a migration

No dashboard: menu lateral → **SQL Editor** → botão **New query**.

Abre o arquivo `fitlog-backend/supabase/migrations/003_web_push.sql` no editor, copia **todo** o conteúdo, cola na query, clica em **Run**.

Vai aparecer algo como "Success. No rows returned" ou um resultado com uma linha (o `cron.schedule`).

**Se der erro dizendo que `pg_cron` ou `pg_net` não é permitido**, precisa habilitar antes: menu → **Database** → **Extensions** → busca `pg_cron` → toggle ligado. Mesma coisa pra `pg_net`. Depois volta e re-roda a migration.

---

## Passo 6 — Popular `app_config` com URL e token

Supabase gerenciado não permite `ALTER DATABASE ... SET`, então guardamos a URL da Edge Function e o `DISPATCH_TOKEN` em uma tabela `public.app_config` (a migration cria essa tabela com RLS bloqueada — cliente não lê, mas o pg_cron sim).

No **SQL Editor** → **New query**, cole (substituindo `SEU-PROJECT-REF` e `SEU-DISPATCH-TOKEN`):

```sql
insert into public.app_config (key, value) values
  ('dispatch_url', 'https://SEU-PROJECT-REF.supabase.co/functions/v1/dispatch-notifications'),
  ('dispatch_token', 'SEU-DISPATCH-TOKEN')
on conflict (key) do update set value = excluded.value;
```

Aparece "Success. No rows returned". Pra conferir:

```sql
select * from public.app_config;
```

Deve mostrar as 2 linhas.

---

## Passo 7 — Deploy das 2 Edge Functions

Aqui você tem duas opções.

### Opção A — Via CLI (mais rápido se já tem o Supabase CLI)

Testa se tem CLI:

```powershell
supabase --version
```

Se responder um número (ex: `1.226.0`), você tem. Continua:

```powershell
cd "C:\Users\Wilma Santos\Desktop\Projetos Pessoais\RepositóriosPP\fitlog\fitlog-backend"
supabase link --project-ref SEU-PROJECT-REF
supabase functions deploy schedule-rest-notification
supabase functions deploy dispatch-notifications
```

Se aparecer erro de login, roda `supabase login` antes.

### Opção B — Sem CLI (via dashboard)

Não recomendado (chato de repetir), mas funciona:

1. Dashboard → menu → **Edge Functions** → **Deploy a new function**
2. Nome: `schedule-rest-notification`
3. Cola o conteúdo de `fitlog-backend/supabase/functions/schedule-rest-notification/index.ts`
4. Deploy.
5. Repete pra `dispatch-notifications` colando o conteúdo de `fitlog-backend/supabase/functions/dispatch-notifications/index.ts`.

O dashboard não suporta arquivos compartilhados (`_shared/cors.ts`), então na Opção B você vai precisar copiar o conteúdo de `cors.ts` inline em cada function. A Opção A resolve isso automaticamente.

---

## Passo 8 — Testar no localhost primeiro

No dev server (`npm run dev` na pasta `fitlog-frontend`), abre no Chrome/Edge:

1. Vai em **Ajustes**. Vai ter um card novo "Notificações → Fim de descanso".
2. Liga o toggle. O browser pede permissão de notificação — clica **Permitir**.
3. No dashboard do Supabase, tabela `push_subscriptions` deve ter 1 linha nova.
4. Inicia uma sessão de treino, marca o check numa série com descanso >30s.
5. Na tabela `pending_notifications` do Supabase deve aparecer 1 linha com `status='pending'`.
6. Minimiza a janela do browser e espera. Em até 15s depois do descanso zerar, uma notificação nativa do sistema aparece.
7. Vai na tabela e confirma que `status='sent'`.

Se algo não sair certo, os primeiros lugares pra olhar são:
- Aba **Console** do DevTools do browser (erros do `push.ts`)
- Dashboard → **Edge Functions** → clicar em cada function → **Logs** (erros da schedule ou dispatch)
- Tabela `pending_notifications` → coluna `last_error` mostra o motivo se `status='failed'`

---

## Passo 9 — Testar no iPhone

Só funciona com PWA instalada no home screen no iOS 16.4+.

1. Deploy do frontend (Netlify) com o `.env.local` atualizado (a `VITE_VAPID_PUBLIC_KEY` precisa entrar no build).
2. Abre o site no Safari do iPhone → botão Compartilhar → **Adicionar à Tela de Início**.
3. Abre o Fitlog pelo ícone (não pelo Safari — tem que ser a instância PWA).
4. Ajustes → liga o toggle → aceita permissão do iOS.
5. Repete o teste: sessão de treino, marca série, **bloqueia o iPhone**, espera.
6. Notificação chega com o som padrão do sistema + vibração, em até ~5s do momento esperado.

Pronto.
