-- Calls Center journal RBAC (`CALLS`), independent of CRM_LEADS / CRM_DEALS.
--
-- Existing databases only had seed/upsert paths, so `/calls` stayed hidden:
-- the sidebar and ModuleAccessGate require CALLS.VIEW.
--
-- Default grant matches seed-rbac + upsert-calls-permissions:
--   Owner / CEO — VIEW/EDIT/ADD/DELETE ALL + PLAY ALL
--   Head of Sales — VIEW ALL + PLAY ALL
--   Seller — VIEW OWN + PLAY ALL
-- Delivery / Marketing / HR stay NONE until granted in Settings → Roles.
-- Playback still accepts legacy CRM_CALL_RECORDINGS_PLAY.

INSERT INTO "permissions" ("id", "module", "action", "description")
VALUES
  ('perm-calls-view', 'CALLS', 'VIEW', 'Open the company Calls journal and read call metadata'),
  ('perm-calls-edit', 'CALLS', 'EDIT', 'Reserved: call notes use CRM_*_EDIT, not this action'),
  ('perm-calls-add', 'CALLS', 'ADD', 'Reserved: calls are created by ATS / click-to-call, not this action'),
  ('perm-calls-delete', 'CALLS', 'DELETE', 'Reserved: calls are not deleted from the journal'),
  ('perm-calls-play', 'CALLS', 'PLAY', 'Play a confidential call recording')
ON CONFLICT ("module", "action") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-' || p."id" || '-' || r."slug",
  r."id",
  p."id",
  CASE
    WHEN p."action" = 'VIEW' AND (r."id" = 'role-seller' OR r."slug" = 'seller') THEN 'OWN'
    ELSE 'ALL'
  END
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p."module" = 'CALLS'
  AND (
    (
      p."action" IN ('VIEW', 'EDIT', 'ADD', 'DELETE')
      AND (r."id" IN ('role-owner', 'role-ceo') OR r."slug" IN ('owner', 'ceo'))
    )
    OR (
      p."action" = 'VIEW'
      AND (r."id" IN ('role-seller', 'role-head-sales') OR r."slug" IN ('seller', 'head-sales'))
    )
    OR (
      p."action" = 'PLAY'
      AND (
        r."id" IN ('role-owner', 'role-ceo', 'role-seller', 'role-head-sales')
        OR r."slug" IN ('owner', 'ceo', 'seller', 'head-sales')
      )
    )
  )
ON CONFLICT ("role_id", "permission_id") DO UPDATE
SET "scope" = EXCLUDED."scope";
