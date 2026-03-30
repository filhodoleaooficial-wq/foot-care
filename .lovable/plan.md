

## Plano: Proteger dados pessoais da tabela `app_clients`

### Problema

A tabela `app_clients` contém dados sensíveis (email, idade, gênero) e as políticas RLS atuais usam `USING(true)` para SELECT e UPDATE, permitindo que qualquer pessoa leia ou altere qualquer registro.

### Desafio fundamental

O login do cliente VivaBem usa localStorage (email) sem Supabase Auth. Sem `auth.uid()`, não é possível criar políticas RLS baseadas em identidade real. A solução requer migrar o login do cliente para Supabase Auth.

### Solução em 3 partes

**1. Migrar login do cliente para Supabase Auth (email/password)**

- Alterar `VivaBemLogin.tsx` para usar `supabase.auth.signUp()` e `supabase.auth.signInWithPassword()` em vez de inserir diretamente na `app_clients`
- Adicionar campo de senha ao formulário de login
- Adicionar coluna `user_id` (uuid, nullable inicialmente) à tabela `app_clients` para linkar ao `auth.users`
- Criar trigger para auto-popular `app_clients` no signup (ou inserir no código após signup)
- Remover uso de `localStorage` para identidade (`vivabem_client_id`, `vivabem_email`)

**2. Atualizar RLS policies da `app_clients`**

```sql
-- Drop old permissive policies
DROP POLICY "Clients can view own data" ON app_clients;
DROP POLICY "Clients can update own data" ON app_clients;

-- New restricted policies
CREATE POLICY "Clients can view own data" ON app_clients
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Clients can update own data" ON app_clients
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Keep INSERT for signup flow
DROP POLICY "Anyone can insert app_clients" ON app_clients;
CREATE POLICY "Authenticated can insert own client" ON app_clients
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
```

**3. Atualizar páginas que usam localStorage**

| Arquivo | Mudança |
|---|---|
| `VivaBemLogin.tsx` | Usar Supabase Auth signup/login, adicionar campo senha |
| `CommunityPage.tsx` | Trocar `localStorage.getItem("vivabem_client_email")` por `auth.uid()` ou email da sessão |
| `SavedModulesPage.tsx` | Idem |
| `saved_modules` e `community_posts` | Atualizar RLS para usar `auth.uid()` em vez de `client_email` |

### Impacto

- Resolve o finding de segurança `app_clients_public_readable`
- Também resolve o finding anterior `saved_modules_unrestricted_delete`
- Clientes existentes precisarão criar senha no primeiro acesso (ou implementar migração gradual)

### Migração SQL

```sql
-- Add user_id column to app_clients
ALTER TABLE app_clients ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to community_posts and saved_modules
ALTER TABLE community_posts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE saved_modules ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update all RLS policies to use auth.uid()
```

