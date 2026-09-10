# Manual de Uso da Plataforma

A plataforma tem **dois perfis de acesso**:

| Perfil | Quem é | Onde acessa | O que faz |
|---|---|---|---|
| **Administrador** (dono do negócio) | Você | `/admin/login` | Cria apps, produtos, aulas, publica, vê vendas e clientes |
| **Aluno** (cliente final) | Seu público | site principal `/` e `/login` | Faz o quiz, cria conta, compra e assiste as aulas |

---

# PARTE A — ADMINISTRADOR

## A.1 Criar sua conta e entrar no painel

1. Abra: `https://SEU-SITE/app` ou `https://SEU-SITE/admin/login`
2. Clique em **"Criar conta"**
3. Informe **nome, e-mail e senha (mín. 6 caracteres)** e clique em **"Criar Conta"**
4. **Verifique seu e-mail**: abra o e-mail de confirmação e clique no link
5. Volte para `/admin/login`, digite **e-mail e senha** e entre
6. Você cai no **Painel (Dashboard)**

> Dica: depois de confirmar, o e-mail e senha servem para sempre. Use a opção "Não tem conta?" / "Fazer login" na tela para alternar.

## A.2 O Painel (Dashboard)

Na lateral (menu) você tem:

- **Meus Apps** — lista e cria aplicativos (onde ficam produtos/aulas)
- **Produtos** — quantidade de produtos no topo
- **Banners** — imagens de divulgação na home
- **Blog**, **Comunidade**, **Quiz**, **WhatsApp** — conteúdos e atendimento
- **Vendas** — acompanhe vendas/assinaturas
- **Integrações** — chaves do Stripe, etc.
- **Meus Clientes** — alunos cadastrados
- **Suporte** e **Configurações**

## A.3 Criar um aplicativo (o "app" do seu público)

1. No painel, clique em **"Criar Novo App"**
2. O wizard tem **6 etapas**:
   1. **Visual Login** — logo, cor e fundo da tela de login
   2. **Visual Home** — visual da página inicial
   3. **Dados Gerais** — nome do app e opções de login:
      - **Completo** → E-mail + Senha (recomendado: mais seguro)
      - **Facilitado** → Apenas e-mail
      - **Direto** → Sem login
   4. **Produtos** — o que será vendido (ver A.4)
   5. **Módulos** — o conteúdo das aulas (ver A.5)
   6. **Integrações** — Stripe e outros
3. Salve. O app aparece no painel com status **Rascunho**
4. Clique em **"Deploy"** para alternar entre **Rascunho** e **Publicado**
   - Só os apps **publicados** aparecem para os alunos
5. Clique em **"Link"** para copiar o link do app e divulgar

## A.4 Criar produto (curso/assinatura) + preço (Stripe)

1. No card do app, clique em **"Produtos"**
2. Clique em **"Novo produto"** e preencha:
   - Nome, descrição, imagem de capa e valor
   - Marque se é **assinatura mensal** (recorrente) ou **compra única**
3. **Importante:** vincule ao Stripe um **ID de preço** (`price_...`):
   - O campo **não aceita ID de produto** (`prod_...`) → erro: *"no such price 'prod_...'"*
   - Para **assinatura mensal**, o preço do Stripe deve ser **recorrente** → senão dá erro: *"You must provide at least one recurring price in subscription mode"*
   - Depois de criado, o botão do aluno mostrará "Assinar por R$ X/mês" ou "Comprar por R$ X"

> **Produto gratuito/bônus:** deixe o campo **Valor vazio ou 0** → o produto fica **sem cadeado para todos** (não precisa de compra nem do Stripe). Ex.: o bônus *Cuidados Especiais* está assim, com `offer_type = bonus` e preço 0.

### Configurando o Stripe (uma vez)
1. Crie uma conta em [stripe.com](https://stripe.com)
2. **Em modo de teste**, as chaves começam com `sk_test_` / `pk_test_`; para cobrar de verdade, **ativo** o modo live e as chaves começam com `sk_live_` / `pk_live_`
3. As chaves ficam assim (o sistema usa a **Secret no ambiente do Supabase** com prioridade):
   - No projeto Supabase: `supabase secrets set STRIPE_SECRET_KEY=sk_...`
   - A chave **Publicável** e o **Webhook Secret** também podem ser salvos em **Integrações → Stripe** no painel
4. **Webhook** (avisos de pagamento) — **já configurado em modo teste**:
   - Endpoint: `https://ygimcsqxykbyrtnpygss.supabase.co/functions/v1/stripe-webhook`
   - Eventos: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Segredo salvo como `STRIPE_WEBHOOK_SECRET` no ambiente do Supabase (ver em Gramado Desenvolvedores → Webhooks → "Enviar teste" para conferir as entregas)
   - Para testar o envio, no dashboard do Stripe: **Desenvolvedores → Webhooks → seu endpoint → "Enviar teste de evento"**

> **Atenção (go-live):** para começar a vender de verdade, troque a `STRIPE_SECRET_KEY` de `sk_test_...` para `sk_live_...`, use **preços ao vivo** (`price_live_...`) e crie um **novo endpoint de webhook no modo Live**, atualizando `STRIPE_WEBHOOK_SECRET` com o segredo novo (ex.: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_live_...`). Cartões de teste (`4242 4242 4242 4242`) só funcionam em modo teste.

## A.5 Criar módulos e aulas (o conteúdo)

1. Em **Produtos**, clique no produto e depois em **"Módulos"**
2. Crie um **módulo** (ex.: "Módulo 1 — Introdução")
3. O conteúdo pode ficar **no módulo** (ex.: PDF direto) ou **dentro das aulas**:
   - **Vídeo** (MP4 ou HLS `.m3u8`) → o aluno assiste **e pode baixar** no player
   - **Vídeo hospedado** com tipo `vturb` (ex.: link do Gumlet, `.m3u8`) → também toca e baixa no player
   - **Áudio** → o aluno ouve **e pode baixar**. Também aceita **URL externa** (ex.: `https://audio.jukehost.co.uk/...` ou MP3 da sua VPS) — basta colar o link no campo "Ou cole a URL do áudio"
   - **PDF / arquivo** → o aluno abre **e pode baixar** (botão "Baixar PDF")
4. Organize a ordem de exibição; quando o aluno comprar o produto, as aulas são liberadas com **download habilitado**
5. **Importante — arquivos no servidor:** ao salvar, o conteúdo é enviado ao storage do Supabase e o link é gravado. Se depois o arquivo for apagado/estiver quebrado, o aluno vê "Não foi possível renderizar o PDF" e o download dá `Object not found (NoSuchKey)`. Nesse caso **reenvie o arquivo** (editar módulo/aula → anexar de novo → salvar) para gerar um novo link válido.

## A.6 Seções e Banners

- **Seções** (`/admin/app/{appId}/sections`): organizam como os produtos aparecem na home (agrupa ítens em "vitrines")
- **Banners** (Dashboard): crie imagem + link de destino, escolha o app e ative. Aparecem no topo da home; ative/desative quando quiser

## A.7 Blog, Comunidade, Quiz, WhatsApp

- **Blog** (`/admin/blog`): publique artigos que aparecem na área do aluno
- **Comunidade** (`/admin/community`): gerencie publicações da comunidade
- **Quiz** (`/admin/quiz`): edite as perguntas do questionário inicial (o aluno responde antes de entrar)
- **WhatsApp** (`/admin/whatsapp`): configure o número para atendimento (formato: código do país + DDD + número, sem espaços)

## A.8 Vendas, Clientes, Suporte, Configurações

- **Vendas** (`/admin/sales`): acompanhe pagamentos e assinaturas
- **Meus Clientes** (`/admin/clients`): lista de alunos cadastrados
  - Para o painel listar os clientes corretamente, um ajuste de permissões (migration RLS) precisa ser aplicado uma vez: ver **A.10 item 2**
- **Suporte** (`/admin/support`): mensagens/ajuda recebidas
- **Configurações** (`/admin/settings`): ajustes gerais da conta

## A.9 Publicar e divulgar

1. Termine de criar app, produtos, módulos e banners
2. No Dashboard, clique em **"Deploy"** no app → status **Publicado**
3. Copie o **"Link"** do app e compartilhe (WhatsApp, Instagram, etc.)
4. Quando alguém abrir o link, verá: **quiz → criar conta → comprar → acessar as aulas**

## A.10 Configuração técnica (fazer UMA vez)

1. **E-mail de verificação (Supabase)** — painel do projeto → **Authentication**:
   - "Confirm email" deve estar **ATIVADO** (default)
   - Em **URL Configuration**, preencha **Site URL** e **Redirect URLs** com o endereço do seu site publicado (ex.: `https://seusite.lovable.app`) — senão o link de confirmação do e-mail pode falhar
2. **Permissão para listar clientes (RLS)** — painel → **SQL Editor**:
   - Copie todo o conteúdo do arquivo `supabase/migrations/20260728180620_allow_app_owners_view_all_clients.sql` e rode o SQL
3. **Mesclar clientes duplicados (importante!)** — painel → **SQL Editor**:
   - Se um aluno comprar e depois, ao refazer login, perder o acesso (cadeado fechado), é porque existem **dois registros de cliente com o mesmo e-mail**. Rode o arquivo `supabase/migrations/20260908090000_merge_duplicate_clients.sql` para unir os duplicados (as compras são transferidas para o registro principal)
4. **ReCAPTCHA** (opcional): exige chaves próprias do Google e configurá-las na seção **Auth** do Supabase

## A.11 Problemas comuns (administrador)

| Problema | Causa | Solução |
|---|---|---|
| O produto / aula aparece **"Este conteúdo será disponibilizado em breve"** | Módulos (e aulas) com `is_published = false` (Rascunho) | Abra o produto → **Módulos** → clique no **ícone de olho** para publicar módulos e aulas |
| Produto sem cadeado para o aluno, mas manda de volta para a Home | Antigo: leitura da compra direto pelo navegador (bloqueado por RLS) | Já corrigido: a verificação usa a função `list-purchases` (chave de serviço). Se ainda ocorrer, **republicar o site** (Lovable) para o app pegar o código novo |
| Download de PDF → `"Object not found" / NoSuchKey (404)` | O arquivo não existe mais no storage | **Reenviar o arquivo** no módulo/aula (editar → anexar → salvar) para gerar novo link |
| PDF não renderiza (aluno vê "Não foi possível renderizar o PDF") | Arquivo quebrado/faltando no storage | Mesma solução: reenviar o arquivo |
| Vídeo não toca | Aula criada com tipo não reconhecido (ex.: `vturb`) ou link quebrado | Tipos `vturb`/`.m3u8` já são reconhecidos (republicar o site). Confirme o link do vídeo e, se preciso, reinsira-o |

---

# PARTE B — ALUNO (usuário final)

## B.1 Chegada (quiz)

1. O aluno abre o link do app → cai no **questionário** ("O que você espera do app?")
2. Responde as perguntas (botão **Próxima / Ver resultado**)
3. Se já tiver sessão, vai direto para a **Home**; se não, vai para a tela de **login**

## B.2 Criar conta

1. Na tela "Acesse o app", clique em **"Criar conta"**
2. **Passo 1 — Dados** (igual ao formulário do print):
   - **Nome completo**, **Sexo**, **E-mail**, **Data de nascimento**, **WhatsApp** (+55 + DDD + número)
   - Clique em **Continuar**
3. **Passo 2 — Conta**:
   - **Senha** (mín. 6 caracteres) e **Confirmar senha**
   - Clique em **"Criar conta"**

## B.3 Verificar o e-mail

1. O app mostra a tela **"Verifique seu e-mail"**
2. O aluno abre a caixa de entrada (e o **spam/promoções**) e clica no **link de confirmação**
3. Volta ao app e clica em **"Já verifiquei — fazer login"**
4. Esqueceu / não recebeu? Use **"Reenviar e-mail de verificação"**

## B.4 Entrar

1. Na tela de login, escolha a aba:
   - **"E-mail + senha"** (recomendada) → informa e-mail e senha criados no cadastro
   - **"E-mail simples"** (acesso antigo / rápido) → basta o e-mail, telefone opcional
2. Clique em **Entrar** → vai para a **Home**

> Se o aluno digitar a senha errada, aparece "E-mail ou senha incorretos. Verifique seus dados ou crie uma conta."

## B.11 Trocar ou recuperar a senha

- **Trocar senha**: no menu lateral do app, **"Alterar senha"** → informe a nova senha (mín. 6) e salve. Funciona para quem usa **e-mail + senha** (quem entrar só por "e-mail simples" precisa logar com senha antes)
- **Esqueci a senha**: no login, aba "E-mail + senha" → **"Esqueci minha senha"** → informe o e-mail. Chegará um link de recuperação; ao abrir, o app pede a nova senha
- Se o e-mail de recuperação não chegar, confira spam/promoções

## B.5 Home e Loja

- No topo, **banners** de divulgação
- **Seções** com os produtos (cursos/assinaturas), organizados em vitrines
- Toque num produto para ver a página dele (descrição, preço e botão de compra)

## B.6 Comprar / Assinar

1. Na página do produto ou na home, clique em **"Comprar por R$ X"** ou **"Assinar por R$ X/mês"**
2. Abre uma **janela (bottom sheet)** com o resumo e o botão grande de pagamento
3. O aluno é levado ao **Stripe Checkout**: preenche e-mail e dados do cartão
   - **Cartão de teste:** `4242 4242 4242 4242`, validade futura, CVC qualquer
4. Após pagar → página **"Pagamento aprovado"**
5. O acesso é **liberado automaticamente** (o sistema confirma o pagamento e registra no app)

## B.7 Acessar as aulas e baixar conteúdo

1. Na Home, toque no produto comprado para abrir a página do curso
2. Veja a lista de **módulos e aulas**
3. Ao abrir uma aula:
   - **Vídeo (MP4)** → player com botão de **download**
   - **Vídeo (HLS .m3u8 / vturb)** → player com **download** do arquivo de mídia
   - **Áudio** → player com **download**
   - **PDF** → visualiza na tela, com botão **"Baixar PDF"** (e ícone de download no canto)

> Se um arquivo não abrir logo após desbloquear, **recarregue a página** uma vez antes de reportar.

## B.8 Navegação (menu inferior)

Pela barra inferior o aluno acessa:

- **Loja** — produtos à venda
- **Comunidade** — publicações da comunidade
- **Feed** — novidades e conteúdos
- **Salvos** — aulas/módulos salvos
- **Pesquisar** — busca por produto, módulo e aula
- **Blog** — artigos
- **Profissionais** — diretório (e cadastro de profissional, se integrante premium)
- **IMC** — calculadora de IMC com classificação
- **Instalar o app** — instala como aplicativo no celular (PWA)

## B.9 Instalar o app no celular

1. Entre no app pelo navegador do celular
2. Abra a página **/instalar**
3. Siga o passo a passo para **Adicionar à tela inicial** (Android) ou **Compartilhar → Adicionar à tela de início** (iPhone)
4. Pronto: o app abre como um aplicativo de verdade

## B.10 Problemas comuns (aluno)

| Problema | Solução |
|---|---|
| Não recebeu o e-mail de verificação | Cheque spam/promoções; use "Reenviar e-mail de verificação" |
| Link do e-mail não funciona / volta para a home | Peça ao admin para conferir **URL Configuration** no Supabase (item A.10) |
| Erro ao pagar | Confirme os dados do cartão; em teste, o site precisa estar em **modo teste** |
| Comprei, o produto deixou de ter cadeado, mas ao abrir vai de volta para a Home | Antes corrigido, pode ser cache/republicação pendente — **atualize a página**; se persistir, peça ao admin para republicar o site (item A.11) |
| Cadeado fechado na home mesmo depois de comprar (após refazer login) | Registros duplicados do mesmo e-mail no cadastro — o admin deve rodar a migration `20260908090000_merge_duplicate_clients.sql` (item A.10.3) |
| Aula/PDF não abre depois do pagamento | Recarregue a página; se persistir, reporte o texto do erro (F12 → Console) ao admin |
| PDF dá "Não foi possível renderizar o PDF" ou download com `NoSuchKey` (404) | O arquivo não existe mais no servidor — o admin deve **reenviar o arquivo** no módulo/aula (item A.11) |
| Vídeo não toca | Confirme que o produto foi comprado e atualize a página; se persistir, o admin verifica o link/tipo do vídeo (`vturb`/`.m3u8`) |
| Não consigo baixar uma aula | Verifique se o produto foi comprado (download é liberado após compra) |

---

# Checklist de lançamento (go-live)

- [ ] Painel do admin funcionando (`/admin/login`)
- [ ] App criado, **publicado** (Deploy) e com **link** copiado
- [ ] Produto criado com **preço do Stripe** correto (`price_...`)
- [ ] Módulos e aulas com conteúdo (vídeo/áudio/PDF)
- [ ] Stripe em **modo live** com chave `sk_live_...` + **webhook** configurado
- [ ] Supabase: **Confirm email** ativado + **URL Configuration** preenchida
- [ ] Migration RLS aplicada no **SQL Editor** (clientes no painel)
- [ ] Migration de clientes duplicados aplicada no **SQL Editor** (acesso estável pós-login)
- [ ] Teste E2E: criar conta → verificar e-mail → **comprar com cartão de teste** → abrir e baixar uma aula → sair e **entrar de novo (cadeado deve continuar aberto)**