# Stripe Webhook — Integração de Assinaturas

## Visão Geral

O webhook do Stripe gerencia o ciclo de vida das assinaturas. Ele é acionado por eventos do Stripe e mantém a tabela `subscriptions` no banco de dados sincronizada.

**Endpoint:** `https://[PROJETO].supabase.co/functions/v1/stripe-webhook`

---

## Eventos Tratados

| Evento | Ação |
|--------|------|
| `checkout.session.completed` | Cria registro em `subscriptions` e marca `product_purchases` como `paid` |
| `invoice.payment_succeeded` | Atualiza `current_period_end` e status da assinatura (renovação) |
| `customer.subscription.updated` | Sincroniza mudanças de status/período |
| `customer.subscription.deleted` | Marca subscription como `canceled` |

---

## Fluxo Completo

```
Cliente clica em "Assinar"
  → create-checkout (mode: "subscription")
  → Stripe Checkout Session
  → Cliente paga no Stripe
  → Stripe envia checkout.session.completed
  → stripe-webhook cria subscription + marca purchase como paid
  → Cliente redirecionado ao app com acesso liberado

Mensalmente:
  → Stripe cobra o cliente
  → Stripe envia invoice.payment_succeeded
  → stripe-webhook atualiza current_period_end
  → Acesso continua ativo

Se cancelar:
  → Stripe envia customer.subscription.deleted
  → stripe-webhook marca status = "canceled"
  → Acesso é removido
```

---

## Configuração

### 1. Stripe Dashboard

Acesse **Developers → Webhooks → Add endpoint**:

- **URL**: `https://[SEU_PROJETO].supabase.co/functions/v1/stripe-webhook`
- **Eventos**: marque os 4 eventos listados acima
- Após criar, copie o **Signing Secret** (`whsec_...`)

### 2. Salvar Secret no Banco

```sql
UPDATE integration_settings
SET credentials = credentials || '{"stripe_webhook_secret": "whsec_..."}'
WHERE integration_name = 'stripe';
```

Isso permite que a Edge Function verifique a autenticidade dos eventos via `stripe.webhooks.constructEvent()`.

### 3. Deploy da Function

```bash
supabase functions deploy stripe-webhook
```

---

## Estrutura da Tabela `subscriptions`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID (PK) | ID interno |
| `client_id` | UUID (FK → app_clients) | Cliente assinante |
| `product_id` | UUID (FK → products) | Produto assinado |
| `stripe_subscription_id` | TEXT (UNIQUE) | ID da subscription no Stripe |
| `stripe_customer_id` | TEXT | ID do customer no Stripe |
| `status` | TEXT | active / trialing / past_due / canceled / incomplete |
| `current_period_end` | TIMESTAMPTZ | Fim do período atual (usado para expirar acesso) |

## Verificação de Acesso

No `VivaBemProduct.tsx`, a verificação segue esta ordem:

1. Cliente tem `product_purchases` com `status = 'paid'`? → **liberado**
2. Produto é recorrente E cliente tem `subscriptions` com status `active` ou `trialing`? → **liberado**
3. Caso contrário → redireciona para `/home`
