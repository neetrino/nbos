-- Separate vault-wide row bypass from CREDENTIALS_VIEW=ALL.
-- VIEW/EDIT/ADD/DELETE ALL must not skip credential accessLevel / grant filters.
-- Only Owner/CEO receive CREDENTIALS BYPASS_ROW_VISIBILITY.

INSERT INTO "permissions" ("id", "module", "action", "description")
VALUES (
  'perm-credentials-bypass-row-visibility',
  'CREDENTIALS',
  'BYPASS_ROW_VISIBILITY',
  'Administrative bypass of credential row-level visibility (Owner/CEO only)'
)
ON CONFLICT ("module", "action") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-credentials-bypass-' || r."slug",
  r."id",
  p."id",
  'ALL'
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p."module" = 'CREDENTIALS'
  AND p."action" = 'BYPASS_ROW_VISIBILITY'
  AND (
    r."id" IN ('role-owner', 'role-ceo')
    OR r."slug" IN ('owner', 'ceo')
  )
ON CONFLICT ("role_id", "permission_id") DO UPDATE
SET "scope" = EXCLUDED."scope";

-- Revoke bypass from every non-owner/non-ceo role (live DB safety).
DELETE FROM "role_permissions" rp
USING "roles" r, "permissions" p
WHERE rp."role_id" = r."id"
  AND rp."permission_id" = p."id"
  AND p."module" = 'CREDENTIALS'
  AND p."action" = 'BYPASS_ROW_VISIBILITY'
  AND r."id" NOT IN ('role-owner', 'role-ceo')
  AND r."slug" NOT IN ('owner', 'ceo');

-- Align delivery roles: CREDENTIALS VIEW no longer means vault-wide access.
UPDATE "role_permissions" rp
SET "scope" = 'OWN'
FROM "roles" r, "permissions" p
WHERE rp."role_id" = r."id"
  AND rp."permission_id" = p."id"
  AND p."module" = 'CREDENTIALS'
  AND p."action" = 'VIEW'
  AND rp."scope" = 'ALL'
  AND (
    r."id" IN ('role-pm', 'role-tech-specialist', 'role-head-delivery')
    OR r."slug" IN ('pm', 'tech-specialist', 'head-delivery')
  );
