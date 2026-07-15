# PéSaúde — Guia Completo do App

> Este documento descreve, de forma detalhada, como funciona o aplicativo PéSaúde tanto na visão do **administrador** (quem cria e gerencia o conteúdo) quanto na visão do **cliente** (quem usa o app para aprender sobre saúde dos pés).

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Fluxo do Cliente](#2-fluxo-do-cliente)
   - 2.1 Quiz de Entrada
   - 2.2 Login com OTP
   - 2.3 Tela Inicial (Home)
   - 2.4 Produtos e Conteúdo
   - 2.5 Comunidade
   - 2.6 Blog
   - 2.7 Loja
   - 2.8 Busca e Conteúdo Salvo
   - 2.9 Feed de Novidades
   - 2.10 Instalação do App (PWA)
   - 2.11 Pagamento e Desbloqueio
3. [Visão do Administrador](#3-visão-do-administrador)
   - 3.1 Login do Admin
   - 3.2 Painel de Controle (Dashboard)
   - 3.3 Criar um Novo App
   - 3.4 Gerenciar Produtos
   - 3.5 Gerenciar Módulos e Aulas
   - 3.6 Gerenciar Seções
   - 3.7 Blog
   - 3.8 Comunidade
   - 3.9 WhatsApp
   - 3.10 Publicar o App
4. [Estrutura de Dados](#4-estrutura-de-dados)
5. [Integração com Stripe (Pagamentos)](#5-integração-com-stripe-pagamentos)
6. [Perguntas Frequentes](#6-perguntas-frequentes)

---

## 1. Visão Geral

O PéSaúde é um aplicativo educacional focado em **saúde dos pés**. Ele permite que profissionais da área (podólogos, etc.) criem um app personalizado para compartilhar conteúdo educativo com seus clientes.

**Dois perfis de usuário:**

| Perfil | Acesso | O que faz |
|--------|--------|-----------|
| **Administrador** | `/admin/login` | Cria apps, cadastra produtos, módulos, aulas, gerencia blog, comunidade e WhatsApp |
| **Cliente** | `/login` | Consome o conteúdo, participa da comunidade, compra módulos pagos |

**Tecnologias utilizadas:** React, TypeScript, Supabase (banco de dados, autenticação, armazenamento), Stripe (pagamentos), Tailwind CSS.

---

## 2. Fluxo do Cliente

### 2.1 Quiz de Entrada (`/`)

Quando o cliente acessa o app pela primeira vez, ele encontra um **quiz interativo** com 4 perguntas sobre saúde dos pés. O quiz serve como porta de entrada educativa.

- Cada pergunta tem 4 alternativas
- O cliente seleciona uma resposta e clica "Próxima"
- Ao final, aparece uma tela de conclusão com o resultado
- Um botão **"Criar minha conta"** leva para a tela de login

> **Nota:** As respostas do quiz são salvas localmente no navegador e podem ser usadas para personalizar a experiência futura.

---

### 2.2 Login com OTP (`/login`)

O login utiliza **código de verificação por e-mail** (OTP — One Time Password), sem necessidade de senha.

**Passo 1 — Informar o e-mail:**
- O cliente digita seu e-mail
- Clica em **"Enviar código"**
- Um código de 6 dígitos é enviado para o e-mail informado

**Passo 2 — Inserir o código:**
- O cliente recebe o código no e-mail
- Digita o código de 6 dígitos na tela
- Clica em **"Entrar"**
- Se o código estiver correto, o cliente é redirecionado para a tela inicial

**O que acontece por trás:**
- O sistema cria uma conta automaticamente no Supabase (se for o primeiro acesso)
- Um registro de cliente é criado no banco de dados vinculado ao e-mail
- A sessão é salva no navegador para manter o cliente conectado

> **Dica:** Se o cliente não receber o código, pode clicar em "Reenviar código".

---

### 2.3 Tela Inicial (Home) (`/home`)

Após o login, o cliente vê a **tela inicial** com todo o conteúdo disponível.

**Elementos da tela:**

- **Cabeçalho:** Logo do app, nome e mensagem de boas-vindas
- **Seções de produtos:** Os produtos são organizados em seções horizontais com rolagem lateral
- **Cards de produto:** Cada card mostra a imagem de capa e o nome do produto

**Estados de um produto:**

| Estado | Visual | Ação ao clicar |
|--------|--------|----------------|
| **Desbloqueado** (gratuito) | Card normal | Abre o conteúdo do produto |
| **Bloqueado** (precisa pagar) | Card com cadeado + preço | Exibe popup com botão "Comprar agora" |

**O que torna um produto bloqueado:**
- O produto tem um **preço maior que zero** (R$), OU
- O produto está em uma **seção premium**
- E o cliente **ainda não comprou** esse produto

---

### 2.4 Produtos e Conteúdo (`/produto/:id`)

Quando o cliente clica em um produto desbloqueado, ele entra na página de conteúdo.

**Estrutura interna do produto:**

```
Produto
  └── Módulos (acordeão expansível)
        └── Aulas (lista dentro de cada módulo)
```

**Como funciona:**

1. O cliente vê uma **imagem de capa** do produto no topo
2. Abaixo, uma lista de **módulos** em formato de acordeão
3. Ao expandir um módulo, aparecem as **aulas** daquele módulo
4. Ao clicar em uma aula, o **reprodutor de conteúdo** é ativado no topo da página

**Tipos de conteúdo suportados:**

| Tipo | Como é exibido |
|------|----------------|
| Vídeo (YouTube, Vimeo, Vturb) | Player de vídeo embutido |
| PDF / DOC / PPT | Visualizador de documento inline |
| Áudio | Player de áudio |
| Texto (rico) | Conteúdo formatado em HTML |
| Download | Link para baixar arquivo |
| Link externo | Abre em nova aba |
| iFrame | Conteúdo embutido de sites externos |
| Google Drive | Visualizador de PDF do Google Drive |

**Módulos com "Abrir diretamente":** Alguns módulos podem ser configurados para mostrar o conteúdo imediatamente, sem precisar clicar em uma aula.

---

### 2.5 Comunidade (`/comunidade`)

A comunidade é um **fórum aberto** onde clientes podem:

- **Ver todas as publicações** de outros clientes
- **Criar novas publicações** escrevendo uma mensagem
- **Ver o nome e data** de cada publicação

As publicações são exibidas em ordem cronológica (mais recentes primeiro).

> **Nota:** O administrador também pode postar na comunidade, e seu nome aparece com um selo "Admin".

---

### 2.6 Blog (`/blog`)

O blog lista **artigos educativos** publicados pelo administrador.

- Cada artigo tem título, descrição e data
- Ao clicar em um artigo, ele se expande mostrando o conteúdo completo (HTML)
- Os artigos podem incluir imagens, formatação e links

---

### 2.7 Loja (`/loja`)

A loja mostra todos os **produtos pagos** disponíveis para compra.

- Cada produto exibe: imagem de capa, nome, descrição e preço
- Botão **"Comprar"** abre a página de pagamento (Stripe Checkout)
- Produtos sem página de pagamento configurada mostram **"Em breve"**

---

### 2.8 Busca e Conteúdo Salvo

**Busca (`/pesquisar`):**
- Campo de busca que pesquisa em **produtos, módulos e aulas**
- Mínimo de 2 caracteres para iniciar a busca
- Resultados mostram o tipo (produto, módulo ou aula) e o título

**Conteúdo Salvo (`/salvos`):**
- Lista de módulos que o cliente salvou/bookmarcou
- Exibidos em grade de 2 colunas com imagem e título
- Botão para remover do salvos

---

### 2.9 Feed de Novidades (`/feed`)

O feed mostra uma **cronologia** de todos os módulos e aulas publicados recentemente, permitindo ao cliente acompanhar novos conteúdos.

---

### 2.10 Instalação do App (PWA) (`/instalar`)

O app funciona como um **Progressive Web App (PWA)**, ou seja, pode ser instalado no celular como se fosse um app nativo.

**No iPhone (Safari):**
1. Abra o app no Safari
2. Toque no ícone de compartilhar
3. Selecione "Adicionar à Tela de Início"

**No Android (Chrome):**
1. Abra o app no Chrome
2. Toque nos três pontos (menu)
3. Selecione "Adicionar à tela inicial"

---

### 2.11 Pagamento e Desbloqueio

**Fluxo de compra:**

1. O cliente clica em um produto bloqueado na Home
2. Um popup mostra o preço e um botão **"Comprar agora"**
3. Ao clicar, o cliente é redirecionado para o **Stripe Checkout** (página segura de pagamento)
4. O cliente insere os dados do cartão de crédito e confirma o pagamento
5. Após o pagamento, o cliente é redirecionado para a tela de **confirmação**
6. O produto é desbloqueado automaticamente
7. O cliente pode acessar o conteúdo normalmente

**O que acontece por trás:**
- Uma sessão de pagamento é criada no Stripe com o preço do produto
- Um registro de compra é criado no banco de dados com status "pendente"
- Após confirmação do pagamento, o status é atualizado para "pago"
- A verificação é feita automaticamente pelo sistema

> **Nota:** Se o cliente cancelar o pagamento, ele volta para a tela anterior sem nenhum cobrança.

---

## 3. Visão do Administrador

### 3.1 Login do Admin (`/admin/login`)

O administrador acessa a área de gestão pelo endereço `/admin/login`.

- **Login:** E-mail + senha (autenticação Supabase)
- **Criar conta:** O administrador pode se cadastrar clicando em "Criar conta" e preenchendo nome completo, e-mail e senha
- Após o login, é redirecionado para o painel de controle

---

### 3.2 Painel de Controle (Dashboard) (`/admin/dashboard`)

O dashboard mostra todos os apps criados pelo administrador.

**Para cada app, estão disponíveis:**

| Ação | O que faz |
|------|-----------|
| **Publicar** | Abre o diálogo de publicação com link compartilhável e QR Code |
| **Produtos** | Gerencia os produtos do app |
| **Seções** | Gerencia as seções de agrupamento |
| **Link** | Copia o link do app para compartilhar |
| **Editar** | Edita as configurações do app |
| **Excluir** | Remove o app (com confirmação) |

**Botão "Criar Novo App":** Inicia o assistente de criação de um novo app.

---

### 3.3 Criar um Novo App (`/admin/create-app`)

O assistente de criação possui **6 passos**:

#### Passo 0 — Visual do Login
- Fazer upload do **logo** do app
- Escrever a **mensagem de boas-vindas**
- Escolher a **cor principal** (8 cores predefinidas)
- Fazer upload da **imagem de fundo** da tela de login

#### Passo 1 — Visual da Home
- Escolher o **estilo visual**: Grade Original (2 colunas) ou Estilo Netflix (lista com cards grandes)
- Ativar ou desativar a **barra de progresso**

#### Passo 2 — Dados Gerais
- **Nome do app** (ex: "PéSaúde")
- **Tipo de login:** Completo (e-mail + senha), Fácil (só e-mail) ou Direto (sem login)
- **Descrição** do app
- **E-mail de suporte**

#### Passo 3 — Produtos
- Criar, editar e excluir produtos diretamente nesta tela
- Cada produto pode ter: nome, preço, tipo de oferta, seção, imagem de capa
- Arrastar e soltar para reordenar

#### Passo 4 — Módulos
- Selecionar um produto
- Criar, editar e excluir módulos para ese produto
- Cada módulo pode ter: título, tipo de conteúdo, URL/arquivo, imagem de capa
- Arrastar e soltar para reordenar

#### Passo 5 — Integrações
- Visualização das plataformas de pagamento integradas
- (Estas integrações são apenas informativas neste momento)

> **Dica:** O app é publicado automaticamente ao finalizar o assistente.

---

### 3.4 Gerenciar Produtos (`/admin/app/:appId/products`)

Esta página permite gerenciar todos os produtos de um app específico.

**Para cada produto:**

| Campo | Descrição |
|-------|-----------|
| **Nome** | Nome do produto que aparece para o cliente |
| **Preço** | Valor em R$ (0 = gratuito) |
| **Tipo de Oferta** | Principal, Order Bump, Upsell/Downsell ou Bônus |
| **Seção** | Em qual seção da home o produto aparece |
| **Tipo de Lançamento** | Imediato, Dias após compra ou Data específica |
| **Colunas** | Quantas colunas o card ocupa na home (1, 2 ou 3) |
| **Imagem de Capa** | Foto principal do produto |
| **Logos** | Imagens para estados desbloqueado e bloqueado |
| **ID Externo** | Identificador para integração com plataformas de pagamento |
| **Redirecionar** | Link para página de venda (quando produto está bloqueado) |

**Ações disponíveis:**
- **Ativar/Desativar** publicação do produto
- **Editar** todas as informações
- **Excluir** o produto (com confirmação)
- **Gerenciar Módulos** — navega para a página de módulos do produto
- **Reordenar** — arrastar e soltar os cards

---

### 3.5 Gerenciar Módulos e Aulas (`/admin/product/:productId/modules`)

Esta página permite criar o conteúdo educativo do produto.

#### Módulos

**Campos de um módulo:**

| Campo | Descrição |
|-------|-----------|
| **Título** | Nome do módulo |
| **Imagem de Capa** | Foto do módulo |
| **Tipo de Conteúdo** | 10 opções (veja abaixo) |
| **URL / Código** | Endereço do conteúdo ou código de incorporação |
| **Abrir Diretamente** | Se ativado, mostra o conteúdo sem precisar clicar em aula |
| **Tipo de Lançamento** | Imediato, Dias após compra ou Data específica |
| **Ordem** | Posição na lista |

**Tipos de conteúdo suportados:**
1. YouTube / Vimeo (URL do vídeo)
2. Vturb / Panda / VSL Play (código de incorporação)
3. PDF / DOC / PPT (arquivo ou URL)
4. Download (arquivo para baixar)
5. Áudio (arquivo de áudio)
6. Texto Rich Text (editor de texto formatado)
7. HTML Embed (código HTML personalizado)
8. Link Externo (URL para abrir em nova aba)
9. iFrame (URL para embutir)
10. Google Drive PDF (URL do PDF no Google Drive)

#### Aulas

Cada módulo pode conter várias aulas.

**Campos de uma aula:**

| Campo | Descrição |
|-------|-----------|
| **Título** | Nome da aula |
| **Tipo de Conteúdo** | 9 opções (mesmas do módulo, exceto Google Drive) |
| **URL / Arquivo** | Endereço ou arquivo do conteúdo |
| **Duração** | Tempo estimado em minutos |
| **Ordem** | Posição na lista |

**Visualização ao vivo:** Ao editar uma aula, é possível visualizar como o conteúdo ficará para o cliente (player de vídeo, visualizador de PDF, player de áudio, etc.).

---

### 3.6 Gerenciar Seções (`/admin/app/:appId/sections`)

As seções são **containers** que agrupam produtos na tela inicial do cliente.

**Para cada seção:**

| Campo | Descrição |
|-------|-----------|
| **Título** | Nome da seção (ex: "Curso Básico", "Conteúdo Premium") |
| **Premium** | Se ativado, todos os produtos desta seção exigem pagamento |
| **Ativo** | Se ativado, a seção aparece na home do cliente |

**Ações:**
- Criar novas seções
- Editar o título inline
- Ativar/Desativar seção
- Marcar como premium (ícone de coroa)
- Reordenar com setas para cima/baixo
- Excluir seção
- **Salvar Todas** as alterações de uma vez

---

### 3.7 Blog (`/admin/blog`)

O blog permite criar artigos educativos para os clientes.

**Para cada artigo:**

| Campo | Descrição |
|-------|-----------|
| **Título** | Nome do artigo |
| **Descrição** | Resumo curto |
| **Conteúdo** | Texto em HTML (suporta formatação, imagens, links) |
| **Imagem de Capa** | Foto do artigo |

**Ações:**
- Criar novo artigo
- Editar artigo existente
- Ativar/Desativar publicação
- Excluir artigo

> **Nota interna:** Os artigos do blog são armazenados como registros de módulos com tipo de conteúdo "texto".

---

### 3.8 Comunidade (`/admin/community`)

O administrador pode:

- **Ver todas as publicações** dos clientes
- **Postar como administrador** (aparece com selo "Admin")
- **Excluir publicações** indevidas (com confirmação)

---

### 3.9 WhatsApp (`/admin/whatsapp`)

O administrador pode enviar mensagens de WhatsApp diretamente pelo painel.

**Funcionalidades:**

1. **Verificar conexão:** O sistema verifica se a integração com WhatsApp está ativa
2. **Enviar mensagem:**
   - Inserir o número de telefone (com código do país e DDD)
   - Digitar a mensagem
   - Clicar em "Enviar"

**Formatação do telefone:** Exemplo: `5511999999999` (código do país + DDD + número, sem espaços ou traços)

> **Nota:** A integração utiliza a Evolution API (API self-hosted do WhatsApp Business).

---

### 3.10 Publicar o App

Para tornar o app disponível para os clientes:

1. No Dashboard, clique no botão **"Publicar"** no card do app
2. Escolha **"Publicar"** para tornar o app visível ou **"Despublicar"** para ocultá-lo
3. Copie o **link compartilhável** ou escaneie o **QR Code**
4. Compartilhe com os clientes

**Onde o cliente acessa:**
- Link direto: `https://seu-dominio.com/app/{id-do-app}`
- Link principal: `https://seu-dominio.com/` (app publicado padrão)

---

## 4. Estrutura de Dados

### Hierarquia de Conteúdo

```
App (aplicativo)
  ├── Seções (agrupadores na home)
  │     └── Produtos (cursos/conteúdos)
  │           └── Módulos (unidades de conteúdo)
  │                 └── Aulas (itens individuais)
  ├── Blog (artigos)
  └── Comunidade (publicações dos clientes)
```

### Principais Tabelas

| Tabela | O que armazena |
|--------|----------------|
| `apps` | Configurações de cada app (nome, cores, logo, etc.) |
| `products` | Produtos de cada app (nome, preço, tipo, etc.) |
| `sections` | Seções agrupadoras (título, premium, ordem) |
| `modules` | Módulos de conteúdo (título, tipo, URL, etc.) |
| `lessons` | Aulas dentro dos módulos (título, duração, etc.) |
| `app_clients` | Registros de clientes (e-mail, telefone) |
| `product_purchases` | Registros de compra (status, valor, sessão Stripe) |
| `community_posts` | Publicações da comunidade |
| `saved_modules` | Módulos salvos/bookmarcados pelos clientes |
| `banners` | Banners promocionais da home |

---

## 5. Integração com Stripe (Pagamentos)

### Como funciona o pagamento:

1. **Criação da sessão:** Quando o cliente clica "Comprar", o sistema cria uma sessão de pagamento no Stripe com o preço do produto
2. **Checkout seguro:** O cliente é redirecionado para a página segura do Stripe para inserir os dados do cartão
3. **Confirmação:** Após o pagamento, o sistema verifica automaticamente se a transação foi aprovada
4. **Desbloqueio:** O produto é desbloqueado imediatamente para o cliente

### Detalhes técnicos:
- Moeda: **BRL** (Real Brasileiro)
- Tipo: **Pagamento único** (não recorrente)
- Preço padrão: **R$ 27,90** (caso não seja definido pelo admin)
- Sucesso: Redireciona para `/payment-success`
- Cancelamento: Redireciona para `/payment-canceled`

---

## 6. Perguntas Frequentes

### Para o Cliente

**Q: Esqueci meu e-mail, como faço?**
R: Use o mesmo e-mail que você usou para se cadastrar. Se não lembrar, entre em contato com o suporte do app.

**Q: O conteúdo que eu comprei pode ser acessado em outro dispositivo?**
R: Sim! Basta acessar o app pelo navegador do novo dispositivo e fazer login com o mesmo e-mail.

**Q: Como instalo o app no celular?**
R: Acesse a página "Instalar App" pelo menu lateral e siga as instruções para iPhone ou Android.

**Q: Posso baixar o conteúdo para offline?**
R: Alguns módulos permitem download de arquivos (PDF, áudio). Consulte cada módulo para verificar se há opção de download.

**Q: Como participo da comunidade?**
R: Acesse "Comunidade" pelo menu lateral. Você pode ver as publicações de outros participantes e criar as suas próprias.

---

### Para o Administrador

**Q: Como adiciono um novo produto?**
R: Acesse Dashboard > Produtos > Clique no botão "+" e preencha as informações. Depois, crie módulos e aulas para o produto.

**Q: Como defino o preço de um produto?**
R: Ao criar ou editar um produto, preencha o campo "Preço" com o valor em R$. Se deixar em branco ou zero, o produto será gratuito.

**Q: Como torno um produto acessível apenas para quem pagou?**
R: Defina um preço maior que zero OU coloque o produto em uma seção marcada como "Premium".

**Q: Como publico o app para meus clientes?**
R: No Dashboard, clique em "Publicar" no card do app. Copie o link ou QR Code e compartilhe com seus clientes.

**Q: Posso criar mais de um app?**
R: Sim! Clique em "Criar Novo App" no Dashboard para criar quantos apps precisar.

**Q: Como envio mensagens de WhatsApp?**
R: Acesse WhatsApp no menu lateral. Verifique a conexão e insira o número + mensagem para enviar.

**Q: Os artigos do blog ficam visíveis para os clientes?**
R: Sim, quando publicados. Acesse Blog no menu lateral, crie o artigo e ative a publicação.

---

*Documento atualizado em julho de 2026.*
