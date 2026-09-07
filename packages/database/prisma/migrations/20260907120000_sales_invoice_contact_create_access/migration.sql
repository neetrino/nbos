-- Seller and Seller Assistant can create deal invoices and contacts.
-- Limited invoice access includes ADD OWN (canon: sales seat creates invoice from deal).

INSERT INTO "roles" (
  "id",
  "name",
  "slug",
  "level",
  "is_system",
  "assignable",
  "description"
)
SELECT
  'role-seller-assistant',
  'Seller Assistant',
  'seller-assistant',
  4,
  true,
  true,
  'Sales assistant: same CRM / clients / deal-invoice create access as Seller'
WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "id" = 'role-seller-assistant');

INSERT INTO "permissions" ("id", "module", "action")
VALUES
  ('perm-finance-invoices-add', 'FINANCE_INVOICES', 'ADD'),
  ('perm-clients-view', 'CLIENTS', 'VIEW'),
  ('perm-clients-add', 'CLIENTS', 'ADD')
ON CONFLICT ("module", "action") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-finance-invoices-add-' || r."slug",
  r."id",
  p."id",
  'OWN'
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."id" IN ('role-seller', 'role-head-sales')
  AND p."module" = 'FINANCE_INVOICES'
  AND p."action" = 'ADD'
ON CONFLICT ("role_id", "permission_id") DO UPDATE
SET "scope" = EXCLUDED."scope";

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-clients-view-' || r."slug",
  r."id",
  p."id",
  'ALL'
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."id" IN ('role-seller', 'role-head-sales')
  AND p."module" = 'CLIENTS'
  AND p."action" = 'VIEW'
ON CONFLICT ("role_id", "permission_id") DO UPDATE
SET "scope" = EXCLUDED."scope";

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-clients-add-' || r."slug",
  r."id",
  p."id",
  'ALL'
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."id" IN ('role-seller', 'role-head-sales')
  AND p."module" = 'CLIENTS'
  AND p."action" = 'ADD'
ON CONFLICT ("role_id", "permission_id") DO UPDATE
SET "scope" = EXCLUDED."scope";

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-sa-' || rp."permission_id",
  'role-seller-assistant',
  rp."permission_id",
  rp."scope"
FROM "role_permissions" rp
WHERE rp."role_id" = 'role-seller'
ON CONFLICT ("role_id", "permission_id") DO UPDATE
SET "scope" = EXCLUDED."scope";
