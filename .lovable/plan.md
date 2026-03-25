

## Plano: Criar páginas do cliente (Comunidade, Feed, Módulos Salvos, Pesquisar)

### O que será criado

Quatro novas páginas para o VivaBem, acessíveis pelo menu lateral, além de corrigir o warning de `forwardRef` no `ContentCard`.

### Páginas

1. **Comunidade** (`/comunidade`) — Feed social com posts dos membros, campo para criar post (texto), lista de posts com avatar, nome, data e conteúdo. Dados salvos na tabela `community_posts`.

2. **Feed** (`/feed`) — Timeline de novidades do app: novos módulos publicados, novas aulas adicionadas. Puxa dados das tabelas `modules` e `lessons` ordenados por `created_at` desc.

3. **Módulos Salvos** (`/salvos`) — Lista de módulos/aulas favoritados pelo cliente. Requer nova tabela `saved_modules` (client_email, module_id). Cards com capa e título, botão de remover favorito.

4. **Pesquisar** (`/pesquisar`) — Campo de busca que filtra produtos, módulos e aulas por título. Resultados agrupados por tipo com ícones.

### Alterações técnicas

| Arquivo | Alteração |
|---|---|
| `src/pages/CommunityPage.tsx` | Nova página de comunidade |
| `src/pages/FeedPage.tsx` | Nova página de feed/novidades |
| `src/pages/SavedModulesPage.tsx` | Nova página de módulos salvos |
| `src/pages/SearchPage.tsx` | Nova página de pesquisa |
| `src/App.tsx` | Adicionar 4 rotas dentro do `VivaBemLayout` |
| `src/pages/VivaBemHome.tsx` | Fix forwardRef warning no ContentCard |
| **Migração SQL** | Criar tabelas `community_posts` e `saved_modules` com RLS |

### Banco de dados

```text
community_posts
├── id (uuid, PK)
├── client_email (text, NOT NULL)
├── content (text, NOT NULL)
├── created_at (timestamptz)

saved_modules
├── id (uuid, PK)
├── client_email (text, NOT NULL)
├── module_id (uuid, NOT NULL)
├── created_at (timestamptz)
```

RLS: leitura pública para posts da comunidade; insert/delete com base em `client_email` para saved_modules.

