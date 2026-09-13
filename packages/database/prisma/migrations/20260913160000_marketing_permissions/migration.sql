-- Marketing RBAC split from CRM_LEADS.
--
-- The Marketing controller had no permission guard at all, so any authenticated employee
-- could read and mutate marketing accounts, activities and the CRM Where dictionary.
--
-- Marketing is not a CRM sub-permission: launching an activity proposes a finance expense.
-- Gating it on CRM_LEADS EDIT would hand campaign budgets to every Seller while leaving the
-- Marketing Specialist read-only, so it gets its own module.
--
-- Default grant: Platform Owner / Founder (legacy `owner`), CEO and Head of Marketing.
-- Every other role starts at NONE and is granted explicitly from the matrix UI.

INSERT INTO "permissions" ("id", "module", "action", "description")
VALUES
  ('perm-marketing-view', 'MARKETING', 'VIEW', 'Read marketing board, accounts, activities, attribution review and dashboard'),
  ('perm-marketing-edit', 'MARKETING', 'EDIT', 'Change marketing accounts, activities, launches and the CRM Where dictionary'),
  ('perm-marketing-add', 'MARKETING', 'ADD', 'Create marketing accounts and activities'),
  ('perm-marketing-delete', 'MARKETING', 'DELETE', 'Reserved: marketing records are archived, not deleted')
ON CONFLICT ("module", "action") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-' || p."id" || '-' || r."slug",
  r."id",
  p."id",
  'ALL'
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p."module" = 'MARKETING'
  AND (
    r."id" IN ('role-owner', 'role-ceo', 'role-head-marketing')
    OR r."slug" IN ('owner', 'ceo', 'head-marketing')
  )
ON CONFLICT ("role_id", "permission_id") DO UPDATE
SET "scope" = EXCLUDED."scope";
