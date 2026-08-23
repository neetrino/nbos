-- Additive CRM capability: play confidential call recordings.
-- Playback still requires object-level Call access + Drive FileAsset policy.
-- Marketing / Head of Marketing are not granted this permission.

INSERT INTO "permissions" ("id", "module", "action", "description")
VALUES (
  'perm-crm-call-recordings-play',
  'CRM_CALL_RECORDINGS',
  'PLAY',
  'Play confidential CRM call recordings'
)
ON CONFLICT ("module", "action") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-crm-call-recordings-play-' || r."slug",
  r."id",
  p."id",
  'ALL'
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p."module" = 'CRM_CALL_RECORDINGS'
  AND p."action" = 'PLAY'
  AND (
    r."id" IN ('role-owner', 'role-ceo', 'role-seller', 'role-head-sales')
    OR r."slug" IN ('owner', 'ceo', 'seller', 'head-sales')
  )
ON CONFLICT ("role_id", "permission_id") DO UPDATE
SET "scope" = EXCLUDED."scope";
