-- Heads and specialists for the L1 departments that had no permission role yet.
-- Support, HR and Operations existed as departments since 20260315000000 but their work could
-- only be done by CEO / Owner. Accountant splits execution from Finance Director's budgeting.
--
-- Ids are literal because default grants are keyed by role id, not by slug
-- (see CRM_CALL_RECORDINGS_PLAY_DEFAULT_ROLE_IDS, MESSENGER_CLIENT_CAPABILITY_ALL_ROLE_IDS).
-- Permissions themselves are owned by seed-rbac.ts; run `seed:rbac` after this migration.

-- An admin may already have created one of these in Settings -> Permissions / RBAC, where the
-- id is a generated uuid. Adopt that row instead of skipping it, otherwise the canonical id
-- would never exist and every id-keyed default grant would silently miss the role.
-- Every foreign key into "roles" is ON UPDATE CASCADE, so assignments and grants follow.
UPDATE "roles" AS r
SET "id" = canonical."id", "is_system" = true
FROM (VALUES
  ('role-head-support',       'head-support'),
  ('role-operations-manager', 'operations-manager'),
  ('role-hr-manager',         'hr-manager'),
  ('role-accountant',         'accountant')
) AS canonical("id", "slug")
WHERE r."slug" = canonical."slug"
  AND r."id" <> canonical."id"
  AND NOT EXISTS (SELECT 1 FROM "roles" taken WHERE taken."id" = canonical."id");

INSERT INTO "roles" ("id", "name", "slug", "level", "is_system")
SELECT * FROM (VALUES
  ('role-head-support',       'Head of Support',    'head-support',       3, true),
  ('role-operations-manager', 'Operations Manager', 'operations-manager', 3, true),
  ('role-hr-manager',         'HR Manager',         'hr-manager',         4, true),
  ('role-accountant',         'Accountant',         'accountant',         4, true)
) AS new_roles("id", "name", "slug", "level", "is_system")
WHERE NOT EXISTS (
  SELECT 1 FROM "roles" r WHERE r."id" = new_roles."id" OR r."slug" = new_roles."slug"
);
