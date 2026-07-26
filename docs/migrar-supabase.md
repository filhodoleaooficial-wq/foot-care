# Migração do Banco Lovable → Supabase Próprio

## Visão Geral

Substituir o banco gerenciado pelo Lovable (`umjjypotbicoxephhvpy`) pelo seu próprio projeto Supabase, mantendo todos os dados, tabelas, edge functions e configurações.

---

## Passo 1 — Exportar o Banco Atual

No **SQL Editor** do Supabase atual (Lovable), execute para gerar o dump:

```sql
-- Gera os comandos CREATE TABLE completos
SELECT 'CREATE TABLE IF NOT EXISTS ' || tablename || ' (' || string_agg(column_def, ', ') || ');'
FROM (
  SELECT
    t.tablename,
    c.column_name || ' ' || c.data_type ||
      CASE WHEN c.character_maximum_length IS NOT NULL THEN '(' || c.character_maximum_length || ')' ELSE '' END ||
      CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
      CASE WHEN c.column_default IS NOT NULL THEN ' DEFAULT ' || c.column_default ELSE '' END
    AS column_def
  FROM pg_tables t
  JOIN information_schema.columns c ON c.table_name = t.tablename
  WHERE t.schemaname = 'public'
    AND t.tablename NOT IN ('schema_migrations', 'migrations')
  GROUP BY t.tablename, c.column_name, c.data_type, c.character_maximum_length, c.is_nullable, c.column_default
  ORDER BY t.tablename, c.ordinal_position
) sub
GROUP BY tablename;
```

Mas o mais prático é usar a **CLI do Supabase** para fazer dump completo:

```bash
# Login no projeto atual (Lovable)
supabase login
supabase link --project-ref umjjypotbicoxephhvpy

# Exportar tudo
supabase db dump --file supabase/dump_lovable.sql
```

Se não conseguir usar a CLI, faça manualmente:

1. **SQL Editor**: Copie e execute todos os migrations da pasta `C:\meu-p\supabase\migrations\` na **ordem** em que foram criados
2. **Dados**: No dashboard do Supabase, vá em **Table Editor**, entre em cada tabela, clique em **"Export"** ou **"Download as CSV"**
3. **Storage**: Vá em **Storage**, bucket por bucket, e baixe os arquivos manualmente

---

## Passo 2 — Configurar o Novo Projeto Supabase

### 2.1 Criar o projeto (se já não existe)

Acesse [supabase.com](https://supabase.com) e crie um novo projeto. Anote:

- **Project ID** (ex: `seunovoapp`)
- **URL do projeto**: `https://seunovoapp.supabase.co`
- **Anon Key**: Pegue em **Settings → API → Project API keys → anon public**
- **Service Role Key**: Pegue em **Settings → API → Project API keys → service_role** (guarde com segurança)

### 2.2 Configurar o Supabase CLI local

```bash
supabase login
supabase link --project-ref SEU_NOVO_PROJECT_ID
```

### 2.3 Executar as Migrations

```bash
supabase db push
```

Isso vai executar todos os arquivos da pasta `supabase/migrations/` no novo banco.

### 2.4 Importar os Dados (opcional)

Se você tem dados no banco atual (clientes, compras, etc), use o `pg_dump`/`pg_restore` ou importe os CSVs manualmente.

---

## Passo 3 — Configurar Variáveis no Novo Supabase

Cada Edge Function precisa de algumas variáveis de ambiente no novo projeto:

### 3.1 Configurar secrets do Stripe

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3.2 Verificar secrets atuais

Para não perder nenhuma, veja as secrets do projeto atual:

```bash
supabase secrets list --project-ref umjjypotbicoxephhvpy
```

E recrie todas no novo projeto:

```bash
supabase secrets set STRIPE_SECRET_KEY=<valor>
supabase secrets set STRIPE_WEBHOOK_SECRET=<valor>
# repita para qualquer outra secret que aparecer no list
```

---

## Passo 4 — Atualizar o Frontend (.env)

Edite o arquivo `C:\meu-p\.env`:

```env
VITE_SUPABASE_PROJECT_ID="seunovoapp"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon_key_do_novo_projeto>"
VITE_SUPABASE_URL="https://seunovoapp.supabase.co"
```

---

## Passo 5 — Deploy das Edge Functions

No terminal, dentro da pasta do projeto (já linkado ao novo Supabase):

```bash
supabase functions deploy client-login
supabase functions deploy create-checkout
supabase functions deploy verify-purchase
supabase functions deploy stripe-webhook
supabase functions deploy check-subscription
supabase functions deploy list-purchases
supabase functions deploy integration-settings
supabase functions deploy get-signed-url
supabase functions deploy send-whatsapp
supabase functions deploy customer-portal
```

> **Importante**: O deploy precisa ser feito para cada função. Você pode criar um script `deploy-all.ps1` para facilitar.

---

## Passo 6 — Configurar Autenticação (Google OAuth)

Se o admin usa login com Google, configure no novo projeto:

1. **Supabase Dashboard → Authentication → Providers → Google**
2. Ative e cole o **Client ID** e **Client Secret** (mesmos do projeto Lovable, ou crie novos no [Google Cloud Console](https://console.cloud.google.com))
3. Em **Redirect URLs** no Google Cloud, adicione: `https://seunovoapp.supabase.co/auth/v1/callback`

---

## Passo 7 — Configurar Storage

Crie os buckets manualmente:

1. **Supabase Dashboard → Storage → Create bucket**
2. Nome: `app-assets` — **público** ou **privado** (conforme sua preferência)
3. Aplique as políticas de segurança do `deploy/fix_security.sql`

---

## Passo 8 — Fazer Deploy do Frontend (Vercel)

No Vercel, atualize as **Environment Variables** do projeto:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_PROJECT_ID` | `seunovoapp` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key do novo projeto |
| `VITE_SUPABASE_URL` | `https://seunovoapp.supabase.co` |

Depois faça um novo deploy.

---

## Passo 9 — Atualizar Webhook no Stripe

No **Dashboard do Stripe → Developers → Webhooks**, edite o endpoint existente:

- **URL**: Troque para `https://seunovoapp.supabase.co/functions/v1/stripe-webhook`

---

## Passo 10 — Testar Tudo

1. Acesse o app e faça login como admin
2. Verifique se os produtos, módulos e aulas aparecem
3. Faça login como cliente (email)
4. Teste uma compra/assinatura do início ao fim
5. Verifique o webhook no Stripe (test event)

---

## Rollback (se algo der errado)

Para voltar ao Lovable, basta reverter o `.env` com as credenciais antigas e fazer deploy novamente. Os dados no Lovable continuam intactos.

---

## Checklist Resumido

- [ ] `supabase db push` — migrations executadas no novo banco
- [ ] `.env` atualizado com URL e anon key do novo projeto
- [ ] Secrets das Edge Functions recriadas (Stripe, etc)
- [ ] Edge Functions deployed no novo projeto
- [ ] Google OAuth configurado
- [ ] Buckets de storage criados
- [ ] Vercel com novas env vars
- [ ] Webhook do Stripe apontando pra nova URL
- [ ] Testes de ponta a ponta
