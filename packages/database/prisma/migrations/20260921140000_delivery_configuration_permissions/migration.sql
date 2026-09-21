-- Delivery Compensation v2: give the configurator a permission of its own.
--
-- Until now it rode on PROJECTS_EDIT, which delivery specialists hold at OWN scope because they
-- need it for domains, technical data and the WhatsApp integration. That meant a developer or a
-- designer could change the scope of a delivery, name role holders and replace assignees — the
-- commands that decide who gets paid. Canon §12 speaks of "the configuration right" apart from
-- being a PM, so it becomes a module.
--
-- All four actions are created, as every other module does; only VIEW and EDIT gate an endpoint
-- today. VIEW mirrors the PROJECTS_VIEW scope each role already had, so nobody loses a read.

INSERT INTO "permissions" ("id", "module", "action", "description")
VALUES
    ('perm-delivery-configuration-view', 'DELIVERY_CONFIGURATION', 'VIEW',
     'Read the delivery configuration of a product or extension. No units, no rates.'),
    ('perm-delivery-configuration-edit', 'DELIVERY_CONFIGURATION', 'EDIT',
     'Change scope, parameters and role holders of a delivery.'),
    ('perm-delivery-configuration-add', 'DELIVERY_CONFIGURATION', 'ADD',
     'Reserved. No endpoint requires it today.'),
    ('perm-delivery-configuration-delete', 'DELIVERY_CONFIGURATION', 'DELETE',
     'Reserved. A delivery configuration is never destroyed.')
ON CONFLICT ("module", "action") DO NOTHING;

-- Owner and CEO: everything, as they hold on every module.
INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT 'rp-' || p."id" || '-' || r."slug", r."id", p."id", 'ALL'
FROM "roles" AS r
CROSS JOIN "permissions" AS p
WHERE p."module" = 'DELIVERY_CONFIGURATION'
  AND (r."id" IN ('role-owner', 'role-ceo') OR r."slug" IN ('owner', 'ceo'))
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- PM and Head of Delivery run the configurator. ADD comes along the way the catalog grants it to
-- the same two roles; no endpoint consumes it.
INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT 'rp-' || p."id" || '-' || r."slug", r."id", p."id", 'ALL'
FROM "roles" AS r
CROSS JOIN "permissions" AS p
WHERE p."module" = 'DELIVERY_CONFIGURATION'
  AND p."action" IN ('VIEW', 'EDIT', 'ADD')
  AND (r."id" IN ('role-pm', 'role-head-delivery') OR r."slug" IN ('pm', 'head-delivery'))
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- Company-wide readers: they already saw every product through PROJECTS_VIEW = ALL.
INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT 'rp-' || p."id" || '-' || r."slug", r."id", p."id", 'ALL'
FROM "roles" AS r
CROSS JOIN "permissions" AS p
WHERE p."module" = 'DELIVERY_CONFIGURATION'
  AND p."action" = 'VIEW'
  AND (
    r."id" IN ('role-finance-director', 'role-head-support', 'role-operations-manager')
    OR r."slug" IN ('finance-director', 'head-support', 'operations-manager')
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- Delivery specialists keep the read they had at OWN scope and lose only the edit.
INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT 'rp-' || p."id" || '-' || r."slug", r."id", p."id", 'OWN'
FROM "roles" AS r
CROSS JOIN "permissions" AS p
WHERE p."module" = 'DELIVERY_CONFIGURATION'
  AND p."action" = 'VIEW'
  AND (
    r."id" IN (
      'role-developer', 'role-developer-frontend', 'role-junior-developer',
      'role-designer', 'role-qa', 'role-tech-specialist'
    )
    OR r."slug" IN (
      'developer', 'developer-frontend', 'junior-developer',
      'designer', 'qa', 'tech-specialist'
    )
  )
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
