-- ============================================================================
-- Mescla clientes duplicados (app_clients com o mesmo e-mail) e aponta as
-- compras/assinaturas para o cliente "principal" (o que tem user_id; senão o
-- mais antigo). Necessário quando a pessoa tem mais de um registro e perde o
-- desbloqueio após refazer login.
--
-- RODE UMA VEZ em: Supabase → SQL Editor (seguro rodar novamente)
-- Cada comando abaixo é independente (sem tabelas temporárias).
-- ============================================================================

-- (1) Remove duplicatas de COMPRAS no MESMO cliente (mesmo produto)
DELETE FROM product_purchases a
USING product_purchases b
WHERE a.client_id = b.client_id
  AND a.product_id = b.product_id
  AND a.ctid < b.ctid;

-- (2) Remove duplicatas de ASSINATURAS no MESMO cliente (mesmo produto)
DELETE FROM subscriptions a
USING subscriptions b
WHERE a.client_id = b.client_id
  AND a.product_id = b.product_id
  AND a.ctid < b.ctid;

-- (3) Copia o user_id (cadastro real) para o cliente mantido
UPDATE app_clients k
SET user_id = COALESCE(k.user_id, d.uid)
FROM (
  WITH keepers AS (
    SELECT DISTINCT ON (lower(trim(email)))
           id AS keeper_id, lower(trim(email)) AS email
    FROM app_clients
    WHERE email IS NOT NULL AND trim(email) <> ''
    ORDER BY lower(trim(email)), (user_id IS NOT NULL) DESC, created_at ASC
  )
  SELECT k.keeper_id, (array_agg(c.user_id))[1] AS uid
  FROM keepers k
  JOIN app_clients c ON lower(trim(c.email)) = k.email AND c.id <> k.keeper_id
  WHERE c.user_id IS NOT NULL
  GROUP BY k.keeper_id
) d
WHERE k.id = d.keeper_id AND k.user_id IS NULL;

-- (4) COMPRAS: favor a paga quando o mantido já tem o produto pago
DELETE FROM product_purchases pp
USING (
  WITH keepers AS (
    SELECT DISTINCT ON (lower(trim(email)))
           id AS keeper_id, lower(trim(email)) AS email
    FROM app_clients
    WHERE email IS NOT NULL AND trim(email) <> ''
    ORDER BY lower(trim(email)), (user_id IS NOT NULL) DESC, created_at ASC
  )
  SELECT k.keeper_id AS keeper_id, c.id AS dup_id
  FROM keepers k
  JOIN app_clients c ON lower(trim(c.email)) = k.email AND c.id <> k.keeper_id
) d
WHERE pp.client_id = d.dup_id
  AND pp.status <> 'paid'
  AND EXISTS (SELECT 1 FROM product_purchases p2
              WHERE p2.client_id = d.keeper_id AND p2.product_id = pp.product_id AND p2.status = 'paid');

-- (5) COMPRAS: remove a do duplicado quando o mantido já tem o produto
DELETE FROM product_purchases pp
USING (
  WITH keepers AS (
    SELECT DISTINCT ON (lower(trim(email)))
           id AS keeper_id, lower(trim(email)) AS email
    FROM app_clients
    WHERE email IS NOT NULL AND trim(email) <> ''
    ORDER BY lower(trim(email)), (user_id IS NOT NULL) DESC, created_at ASC
  )
  SELECT k.keeper_id AS keeper_id, c.id AS dup_id
  FROM keepers k
  JOIN app_clients c ON lower(trim(c.email)) = k.email AND c.id <> k.keeper_id
) d
WHERE pp.client_id = d.dup_id
  AND EXISTS (SELECT 1 FROM product_purchases p2
              WHERE p2.client_id = d.keeper_id AND p2.product_id = pp.product_id);

-- (6) COMPRAS: transfere as restantes do duplicado para o mantido
UPDATE product_purchases pp
SET client_id = d.keeper_id
FROM (
  WITH keepers AS (
    SELECT DISTINCT ON (lower(trim(email)))
           id AS keeper_id, lower(trim(email)) AS email
    FROM app_clients
    WHERE email IS NOT NULL AND trim(email) <> ''
    ORDER BY lower(trim(email)), (user_id IS NOT NULL) DESC, created_at ASC
  )
  SELECT k.keeper_id AS keeper_id, c.id AS dup_id
  FROM keepers k
  JOIN app_clients c ON lower(trim(c.email)) = k.email AND c.id <> k.keeper_id
) d
WHERE pp.client_id = d.dup_id;

-- (7) ASSINATURAS: favor a ativa/trial quando o mantido já tem o produto
DELETE FROM subscriptions s
USING (
  WITH keepers AS (
    SELECT DISTINCT ON (lower(trim(email)))
           id AS keeper_id, lower(trim(email)) AS email
    FROM app_clients
    WHERE email IS NOT NULL AND trim(email) <> ''
    ORDER BY lower(trim(email)), (user_id IS NOT NULL) DESC, created_at ASC
  )
  SELECT k.keeper_id AS keeper_id, c.id AS dup_id
  FROM keepers k
  JOIN app_clients c ON lower(trim(c.email)) = k.email AND c.id <> k.keeper_id
) d
WHERE s.client_id = d.dup_id
  AND s.status NOT IN ('active', 'trialing')
  AND EXISTS (SELECT 1 FROM subscriptions s2
              WHERE s2.client_id = d.keeper_id AND s2.product_id = s.product_id
                AND s2.status IN ('active', 'trialing'));

-- (8) ASSINATURAS: remove a do duplicado quando o mantido já tem o produto
DELETE FROM subscriptions s
USING (
  WITH keepers AS (
    SELECT DISTINCT ON (lower(trim(email)))
           id AS keeper_id, lower(trim(email)) AS email
    FROM app_clients
    WHERE email IS NOT NULL AND trim(email) <> ''
    ORDER BY lower(trim(email)), (user_id IS NOT NULL) DESC, created_at ASC
  )
  SELECT k.keeper_id AS keeper_id, c.id AS dup_id
  FROM keepers k
  JOIN app_clients c ON lower(trim(c.email)) = k.email AND c.id <> k.keeper_id
) d
WHERE s.client_id = d.dup_id
  AND EXISTS (SELECT 1 FROM subscriptions s2
              WHERE s2.client_id = d.keeper_id AND s2.product_id = s.product_id);

-- (9) ASSINATURAS: transfere as restantes do duplicado para o mantido
UPDATE subscriptions s
SET client_id = d.keeper_id
FROM (
  WITH keepers AS (
    SELECT DISTINCT ON (lower(trim(email)))
           id AS keeper_id, lower(trim(email)) AS email
    FROM app_clients
    WHERE email IS NOT NULL AND trim(email) <> ''
    ORDER BY lower(trim(email)), (user_id IS NOT NULL) DESC, created_at ASC
  )
  SELECT k.keeper_id AS keeper_id, c.id AS dup_id
  FROM keepers k
  JOIN app_clients c ON lower(trim(c.email)) = k.email AND c.id <> k.keeper_id
) d
WHERE s.client_id = d.dup_id;

-- (10) Remove os clientes duplicados (compras/assinaturas já transferidas)
DELETE FROM app_clients c
USING (
  WITH keepers AS (
    SELECT DISTINCT ON (lower(trim(email)))
           id AS keeper_id, lower(trim(email)) AS email
    FROM app_clients
    WHERE email IS NOT NULL AND trim(email) <> ''
    ORDER BY lower(trim(email)), (user_id IS NOT NULL) DESC, created_at ASC
  )
  SELECT k.keeper_id AS keeper_id, c.id AS dup_id
  FROM keepers k
  JOIN app_clients c ON lower(trim(c.email)) = k.email AND c.id <> k.keeper_id
) d
WHERE c.id = d.dup_id;