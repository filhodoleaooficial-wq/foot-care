## Objetivo

Transformar o app de um SaaS multi-tenant com assinatura para **um único app** com:
- Login simples (e-mail + celular, sem autenticação real) → redireciona direto para a Home
- Home igual para todos os usuários
- Módulos **free** e módulos **pagos** (R$ 27,90 cada, pagamento único)
- Após pagar, o módulo fica liberado só para aquele usuário
- Admin (só você) para criar módulos, subir aulas (pdf/vídeo/texto/áudio), modelar o app (cores, logo) e enviar mensagens via Evolution

## O que já existe e será aproveitado

- ✅ Menu lateral completo: Início, Comunidade, Feed, Loja, Blog, Módulos salvos, Instalar App, Pesquisar
- ✅ Home com seções e cards de módulos (free/premium), com cadeado nos bloqueados
- ✅ Admin: gestão de apps, produtos/módulos, aulas (com preview ao vivo), seções, botões de habilitar/desabilitar (`is_published`, `is_active`)
- ✅ Integração Evolution (WhatsApp) para enviar mensagens
- ✅ Página "Instalar App" (PWA)
- ✅ Modelagem visual do app (cores, logo, background) no admin

## Mudanças necessárias

### 1. Login simples sem autenticação
- Nova tela de entrada: campos **e-mail** e **celular**, botão "Entrar"
- Ao entrar: salvar/atualizar registro na tabela `app_clients` (e-mail + telefone) e guardar o id do cliente no `localStorage`
- Redirecionar para `/home` (mesma home para todos)
- Trocar o `ClientProtectedRoute` para checar apenas se existe cliente no `localStorage` (sem sessão do Supabase)

### 2. Modelo de pagamento: assinatura → compra avulsa por módulo
- Nova tabela `module_purchases` (cliente, módulo, status, valor) para registrar quem comprou o quê
- Edge function `create-checkout`: criar sessão Stripe **`mode: "payment"`** (pagamento único de R$ 27,90) em vez de `subscription`, referenciando o módulo comprado
- Edge function `verify-purchase` (nova): confirmar pagamento e gravar a compra liberada para aquele cliente
- Remover a lógica de assinatura (`check-subscription`, `STRIPE_PRICES`, `customer-portal`) do fluxo do cliente
- Home/Módulo: desbloquear conteúdo verificando `module_purchases` daquele cliente em vez de `subscription.subscribed`

### 3. Cada módulo pago com seu próprio espaço
- Página de curso do módulo já existe (`VivaBemProduct`/aulas); ajustar para liberar só se for free ou comprado

### 4. Admin
- Adicionar campo de **preço/flag pago** por módulo (já existe `price` e `offer_type` em products)
- Manter Evolution para mensagens aos clientes do banco
- Manter modelagem visual

## Detalhes técnicos

- **Stripe**: continuar com a integração Stripe já configurada, mudando `create-checkout` para `mode: "payment"` com `line_items` de preço fixo (R$ 27,90) ou price avulso por módulo. Resolve também o erro atual de "price test/live" pois deixaremos de depender do price de assinatura fixo.
- **Sem auth real**: `app_clients` já tem `email`, adicionar coluna `phone`. RLS terá que permitir insert/select público (anon) já que não há login autenticado — dados não sensíveis.
- **Liberação**: `module_purchases` com `client_id`, `module_id`, `status`, verificada no carregamento da Home e da página do módulo.

## Ordem de execução sugerida

1. Migration: adicionar `phone` em `app_clients`; criar `module_purchases` + grants/RLS
2. Login simples + guarda de rota por localStorage
3. Ajustar `create-checkout` para pagamento único + `verify-purchase`
4. Ajustar Home e página do módulo para liberar por compra
5. Ajustes finais no admin (preço por módulo)

## Pergunta antes de começar

Antes de finalizar preciso confirmar 2 pontos que mudam bastante a implementação (na próxima mensagem).