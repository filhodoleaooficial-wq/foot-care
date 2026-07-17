# Guia Simples — O Que Foi Feito (e Por Que)

> Este documento explica, de forma didática, tudo o que foi feito nas sessões anteriores.
> Não é preciso saber programação para entender.

---

## Sumário

1. [O que é o projeto](#1-o-que-é-o-projeto)
2. [As ferramentas que usamos](#2-as-ferramentas-que-usamos)
3. [O que foi feito — passo a passo](#3-o-que-foi-feito)
4. [Comandos explicados](#4-comandos-explicados)
5. [Deploy das edge functions (pelo Lovable)](#5-deploy-das-edge-functions)
6. [Como rodar o app localmente](#6-como-rodar-o-app-localmente)
7. [Dúvidas comuns](#7-dúvidas-comuns)

---

## 1. O que é o projeto

O **PéSaúde** é um aplicativo web para educar pessoas sobre saúde dos pés. Ele foi criado originalmente na plataforma **Lovable** e depois exportado para o **GitHub** para podermos editar o código diretamente.

O app tem dois lados:
- **Admin** — onde você (o dono) gerencia tudo: produtos, módulos, blog, comunidade, WhatsApp, integrações
- **Cliente** — onde o usuário final acessa o conteúdo, faz quiz, compra módulos, participa da comunidade

---

## 2. As ferramentas que usamos

| Ferramenta | O que é | Para que serve |
|------------|---------|----------------|
| **opencode** | Assistente de código (como eu) | Edita arquivos, cria páginas, ajusta bugs |
| **GitHub** | Repositório online | Armazena o código-fonte do projeto |
| **Lovable** | Plataforma que criou o app | Gerencia o deploy e o banco de dados |
| **Supabase** | Banco de dados + autenticação | Onde ficam os dados dos clientes, produtos, etc. |
| **Stripe** | Pagamentos online | Processa compras de módulos pagos |
| **TypeScript** | Linguagem de programação | A linguagem que o app é escrito |
| **Node.js** | Runtime JavaScript | Roda os comandos de build e desenvolvimento |

---

## 3. O que foi feito

### 3.1 — Login do cliente com OTP

**Antes:** O cliente entrava com e-mail + telefone (sem segurança real).

**Agora:** O cliente entra com e-mail e recebe um **código de 6 dígitos** no e-mail. Sem senha.

**Arquivos modificados:**
- `src/pages/VivaBemLogin.tsx` — Tela de login reescrita com fluxo OTP
- `supabase/functions/client-login/index.ts` — Função que cria/recupera o registro do cliente no banco
- `src/components/ClientProtectedRoute.tsx` — Verificação de autenticação atualizada
- `src/components/VivaBemSidebar.tsx` — Logout agora também desconecta do Supabase

### 3.2 — Páginas novas no admin

**Antes:** Os itens "Integrações" e "Meus Clientes" na sidebar não faziam nada.

**Agora:** Cada um tem sua própria página funcional.

**Arquivos criados:**
- `src/pages/IntegrationsPage.tsx` — Página de integrações com campos para colocar credenciais
- `src/pages/ClientsPage.tsx` — Lista de todos os clientes que usam o app

**Arquivos modificados:**
- `src/App.tsx` — Rotas novas adicionadas
- `src/pages/Dashboard.tsx` — Links da sidebar atualizados

### 3.3 — Integrações com credenciais via painel

**Antes:** Para configurar o Stripe, era preciso rodar comandos no terminal.

**Agora:** Tem uma página bonita no admin onde você cola as chaves de API e clica "Salvar".

**Arquivos criados:**
- `supabase/functions/integration-settings/index.ts` — Função que salva/lê credenciais no banco
- `supabase/migrations/20260714120000_create_integration_settings.sql` — Tabela para armazenar credenciais

**Arquivos modificados:**
- `supabase/functions/create-checkout/index.ts` — Agora lê a chave Stripe do banco
- `supabase/functions/verify-purchase/index.ts` — Idem
- `supabase/functions/send-whatsapp/index.ts` — Agora lê URL, API Key e instância do banco
- `src/integrations/supabase/types.ts` — Tipos TypeScript da tabela nova

### 3.4 — Documentação

**Arquivo criado:**
- `docs/guia-completo-app.md` — Documento detalhado de como o app funciona (admin + cliente)

### 3.5 — Conflito de git resolvido

Havia um conflito no arquivo `src/pages/VivaBemProduct.tsx` (duas versões do mesmo código). Foi resolvido mantendo a versão correta.

---

## 4. Comandos explicados

### `npx tsc --noEmit`
**O que faz:** Verifica se o código TypeScript está sem erros.
**Por que rodo:** Para garantir que nenhuma edição quebrou o código antes de prosseguir.
**Saída vazia** = tudo certo.

### `npx vite build`
**O que faz:** Compila o app inteiro e gera os arquivos finais para produção (na pasta `dist/`).
**Por que rodo:** Para confirmar que o app compila corretamente para ser hospedado.

### `git status`
**O que faz:** Mostra quais arquivos foram alterados, criados ou deletados.
**Exemplo de saída:**
```
modified:   src/pages/VivaBemLogin.tsx
new file:   src/pages/IntegrationsPage.tsx
```

### `git add <arquivo>`
**O que faz:** "Seleciona" um arquivo para ser incluído no próximo commit.
**Analogia:** É como colocar um arquivo na pilha de coisas que você quer levar.

### `git commit -m "mensagem"`
**O que faz:** Salva as alterações localmente com uma mensagem descritiva.
**Analogia:** É como dar "Ctrl+S" e escrever uma nota sobre o que você mudou.

### `git push origin main`
**O que faz:** Envia o commit local para o GitHub (remoto).
**`origin`** = o nome do repositório remoto (GitHub).
**`main`** = o nome da branch (linha do tempo do código).

### `git pull origin main --rebase`
**O que faz:** Baixa as alterações que estão no GitHub e reorganiza os commits locais em cima delas.
**Por que:** Se você editou algo aqui e o Lovable também mudou algo lá, precisa juntar.

### `git rebase --continue`
**O que faz:** Depois de resolver um conflito de merge, continua o processo de rebase.

### `git rebase --abort`
**O que faz:** Cancela o rebase e volta ao estado anterior (se algo der errado).

### `GIT_EDITOR=true git rebase --continue`
**O que faz:** Continua o rebase sem abrir editor de texto para escrever mensagem de commit (usa a mensagem padrão).

---

## 5. Deploy das edge functions

### O que são edge functions?
São pequenos programas que rodam no servidor do Supabase (não no navegador). Eles processam coisas como:
- Criar sessão de pagamento no Stripe
- Verificar se o pagamento foi aprovado
- Enviar mensagens de WhatsApp
- Salvar/carregar credenciais de integrações

### Como o Lovable fez o deploy
O Lovable tem acesso direto ao Supabase. Quando você pede para ele "fazer deploy das edge functions", ele:
1. Envia o código de cada função para o Supabase
2. O Supabase compila e hospeda essas funções
3. Elas ficam acessíveis via URL pública

### A tabela `integration_settings`
É onde ficam salvas as credenciais (chaves de API) de cada integração. O Lovable confirmou que ela já existe no banco com as políticas de segurança corretas.

---

## 6. Como rodar o app localmente

Para ver o app rodando na sua máquina:

```bash
cd c:\meu-p
npm install
npm run dev
```

O app vai abrir em `http://localhost:5173` (ou similar).

Para acessar o admin: `http://localhost:5173/admin/login`

---

## 7. Dúvidas comuns

### "Preciso fazer git pull toda vez que o Lovable muda algo?"
Sim. Se o Lovable edita arquivos pelo painel dele, essas alterações vão para o GitHub. Para baixar para sua máquina:
```bash
git pull origin main
```

### "Preciso fazer git push toda vez que eu mudo algo?"
Sim. Depois de editar código aqui, envie para o GitHub:
```bash
git add .
git commit -m "Minha mensagem"
git push origin main
```

### "O que acontece se eu esquecer de fazer push?"
O GitHub fica desatualizado. Na próxima vez que fizer pull, pode dar conflito.

### "Como sei se o Lovable já deployou as edge functions?"
Pergunte ao Lovable. Ele vai confirmar quando fizer o deploy.

### "Preciso rodar a migration manualmente?"
O Lovable confirmou que a tabela já existe. Não precisa rodar nada.

### "Como acesso a página de Integrações?"
Depois de fazer login no admin (`/admin/login`), clique em "Integrações" na sidebar.

---

*Documento criado em julho de 2026.*
