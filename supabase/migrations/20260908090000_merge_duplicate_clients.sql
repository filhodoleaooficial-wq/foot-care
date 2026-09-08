-- ============================================================================
-- Mescla clientes duplicados (app_clients com o mesmo e-mail) e aponta as
-- compras/assinaturas para o cliente "principal" (o que tem user_id; senão o
-- mais antigo). Necessário quando a pessoa tem mais de um registro e perde o
-- desbloqueio após refazer login.
--
-- RODE UMA VEZ em: Supabase → SQL Editor (seguro rodar novamente)
-- ============================================================================

-- 1) Cliente mantido por e-mail: prefere o que tem user_id; senão o mais antigo
CREATE TEMP TABLE _keep AS
SELECT DISTINCT ON (lower(trim(email)))
       id AS keeper_id, lower(trim(email)) AS email, user_id
FROM app_clients
WHERE email IS NOT NULL AND trim(email) <> ''
ORDER BY lower(trim(email)), (user_id IS NOT NULL) DESC, created_at ASC;

-- 2) Clientes duplicados (mesmo e-mail, diferente do mantido)
CREATE TEMP TABLE _dupe AS
SELECT c.id AS dup_id, k.keeper_id
FROM app_clients c
JOIN _keep k ON lower(trim(c.email)) = k.email
WHERE c.id <> k.keeper_id;

-- 3) Copia o user_id para o cliente mantido (se algum duplicado tinha cadastro real)
UPDATE app_clients k
SET user_id = COALESCE(k.user_id, d.uid)
FROM (
  SELECT x.keeper_id, max(c.user_id) AS uid
  FROM _dupe x JOIN app_clients c ON c.id = x.dup_id
  WHERE c.user_id IS NOT NULL
  GROUP BY x.keeper_id
) d
WHERE k.id = d.keeper_id;

-- 4) Reponta COMPRAS dos duplicados para o mantido (dando preferência às pagas)
DELETE FROM product_purchases pp
USING _dupe d
WHERE pp.client_id = d.dup_id
  AND pp.status <> 'paid'
  AND EXISTS (SELECT 1 FROM product_purchases p2
              WHERE p2.client_id = d.keeper_id AND p2.product_id = pp.product_id AND p2.status = 'paid');

DELETE FROM product_purchases pp
USING _dupe d
WHERE pp.client_id = d.dup_id
  AND EXISTS (SELECT 1 FROM product_purchases p2
              WHERE p2.client_id = d.keeper_id AND p2.product_id = pp.product_id);

UPDATE product_purchases pp
SET client_id = d.keeper_id
FROM _dupe d
WHERE pp.client_id = d.dup_id;

-- 5) Reponta ASSINATURAS (preferência para as ativas/trial)
DELETE FROM subscriptions s
USING _dupe d
WHERE s.client_id = d.dup_id
  AND s.status NOT IN ('active', 'trialing')
  AND EXISTS (SELECT 1 FROM subscriptions s2
              WHERE s2.client_id = d.keeper_id AND s2.product_id = s.product_id
                AND s2.status IN ('active', 'trialing'));

DELETE FROM subscriptions s
USING _dupe d
WHERE s.client_id = d.dup_id
  AND EXISTS (SELECT 1 FROM subscriptions s2
              WHERE s2.client_id = d.keeper_id AND s2.product_id = s.product_id);

UPDATE subscriptions s
SET client_id = d.keeper_id
FROM _dupe d
WHERE s.client_id = d.dup_id;

-- 6) Remove os duplicados (as compras já foram transferidas)
DELETE FROM app_clients c
USING _dupe d
WHERE c.id = d.dup_id;

DROP TABLE _dupe;
DROP TABLE _keep;