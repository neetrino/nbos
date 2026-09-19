-- Delivery Compensation v2 permission modules.
-- FUNCTION_CATALOG: operational catalog/instructions.
-- DELIVERY_COMPENSATION_RULES: Owner/CEO units, profiles, rates only.
-- Finance / HR / PM do not receive RULES. Re-run must not overwrite admin scopes.

INSERT INTO "permissions" ("id", "module", "action", "description")
VALUES
  ('perm-function-catalog-view', 'FUNCTION_CATALOG', 'VIEW', 'Read the delivery function catalog and instructions'),
  ('perm-function-catalog-edit', 'FUNCTION_CATALOG', 'EDIT', 'Edit delivery function instructions and catalog content'),
  ('perm-function-catalog-add', 'FUNCTION_CATALOG', 'ADD', 'Create delivery function drafts'),
  ('perm-function-catalog-delete', 'FUNCTION_CATALOG', 'DELETE', 'Archive delivery functions that are not in use'),
  ('perm-delivery-compensation-rules-view', 'DELIVERY_COMPENSATION_RULES', 'VIEW', 'Read delivery units, base profiles and role rates'),
  ('perm-delivery-compensation-rules-edit', 'DELIVERY_COMPENSATION_RULES', 'EDIT', 'Edit draft delivery compensation rules'),
  ('perm-delivery-compensation-rules-add', 'DELIVERY_COMPENSATION_RULES', 'ADD', 'Create delivery compensation rule versions'),
  ('perm-delivery-compensation-rules-delete', 'DELIVERY_COMPENSATION_RULES', 'DELETE', 'Archive delivery compensation rule versions')
ON CONFLICT ("module", "action") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-' || p."id" || '-' || r."slug",
  r."id",
  p."id",
  'ALL'
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p."module" = 'FUNCTION_CATALOG'
  AND p."action" = 'VIEW'
  AND (
    r."id" IN (
      'role-owner', 'role-ceo', 'role-pm', 'role-head-delivery',
      'role-developer', 'role-developer-frontend', 'role-junior-developer',
      'role-designer', 'role-qa', 'role-tech-specialist',
      'role-seller', 'role-head-sales', 'role-operations-manager'
    )
    OR r."slug" IN (
      'owner', 'ceo', 'pm', 'head-delivery',
      'developer', 'developer-frontend', 'junior-developer',
      'designer', 'qa', 'tech-specialist',
      'seller', 'head-sales', 'operations-manager'
    )
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-' || p."id" || '-' || r."slug",
  r."id",
  p."id",
  'ALL'
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p."module" = 'FUNCTION_CATALOG'
  AND p."action" IN ('EDIT', 'ADD')
  AND (
    r."id" IN ('role-owner', 'role-ceo', 'role-pm', 'role-head-delivery')
    OR r."slug" IN ('owner', 'ceo', 'pm', 'head-delivery')
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-' || p."id" || '-' || r."slug",
  r."id",
  p."id",
  'ALL'
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p."module" = 'FUNCTION_CATALOG'
  AND p."action" = 'DELETE'
  AND (
    r."id" IN ('role-owner', 'role-ceo')
    OR r."slug" IN ('owner', 'ceo')
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-' || p."id" || '-' || r."slug",
  r."id",
  p."id",
  'ALL'
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p."module" = 'DELIVERY_COMPENSATION_RULES'
  AND p."action" IN ('VIEW', 'EDIT', 'ADD', 'DELETE')
  AND (
    r."id" IN ('role-owner', 'role-ceo')
    OR r."slug" IN ('owner', 'ceo')
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
