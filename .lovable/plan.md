
## Objetivo

Garantir que o banco de dados (Lovable Cloud) reflita todas as migrations presentes em `supabase/migrations/` e que o código local esteja coerente com o schema resultante.

## Contexto atual (verificado)

- Repositório sincronizado — último commit: `2e7ebbe Enabled Lovable Payments`.
- `supabase/migrations/` contém 25 arquivos, do timestamp `20260309...` até `20260722230731...`.
- O Lovable espelha o GitHub automaticamente, então o código-fonte local já reflete o que está no repo. O ponto de divergência provável é o **schema do banco vs. arquivos SQL**.

## Passos

1. **Inventariar migrations aplicadas**
   - Consultar `supabase_migrations.schema_migrations` via `supabase--read_query` para obter a lista de versões já executadas.
   - Cruzar com os arquivos em `supabase/migrations/` e identificar as que faltam rodar.

2. **Comparar schema real vs. esperado**
   - Consultar `information_schema` para tabelas, colunas, políticas RLS e grants das tabelas em `public`.
   - Comparar com o que as migrations declaram (foco nas tabelas: `app_clients`, `product_purchases`, `integration_settings`, `quiz_questions`, `subscriptions`, `sections`, `banners`, `saved_modules`, buckets de storage).
   - Listar divergências (colunas faltando, policies ausentes, grants faltando).

3. **Aplicar migrations pendentes**
   - Para cada migration não aplicada, executar via `supabase--migration` (uma por vez, com aprovação do usuário).
   - Se houver divergências não cobertas por nenhuma migration, criar uma nova migration de reconciliação.

4. **Revalidar o código local**
   - Após regenerar `src/integrations/supabase/types.ts` (automático pós-migration), rodar typecheck para detectar quebras.
   - Corrigir referências obsoletas se algum campo/tabela mudou.

5. **Redeployar Edge Functions afetadas** (se alguma migration alterou tabelas usadas por functions como `client-login`, `create-checkout`, `verify-purchase`, `integration-settings`, `send-whatsapp`, `list-purchases`, `get-signed-url`).

## O que NÃO faz parte deste plano

- Adicionar novas features.
- Mudar código de frontend além de correções de tipo/schema.
- Alterar configuração de Payments/Stripe/Paddle.

## Detalhes técnicos

- Fonte de verdade das versões aplicadas: tabela `supabase_migrations.schema_migrations` (coluna `version` = timestamp do arquivo).
- Toda nova migration de reconciliação seguirá o padrão obrigatório: `CREATE TABLE` → `GRANT` → `ENABLE RLS` → `CREATE POLICY`.
- Nenhuma alteração em `auth`, `storage`, `realtime` ou nos arquivos auto-gerados (`client.ts`, `types.ts`, `.env`).

Confirma que posso seguir com a investigação (passos 1–2) e trazer as divergências antes de aplicar qualquer migration?
