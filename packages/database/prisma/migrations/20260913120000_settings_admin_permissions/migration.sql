-- Settings / Admin RBAC split from COMPANY.
--
-- COMPANY stays with My Company (departments, employees, seats, KPI/bonus/compensation).
-- Platform administration moves to dedicated modules so it can be granted per role in
-- Settings -> Permissions / RBAC instead of riding along with business-structure access.
--
-- Default grant: Platform Owner / Founder (legacy `owner`) and CEO only.
-- Every other role starts at NONE and is granted explicitly from the matrix UI.

INSERT INTO "permissions" ("id", "module", "action", "description")
VALUES
  ('perm-settings-view', 'SETTINGS', 'VIEW', 'Open Settings / Admin and read platform configuration'),
  ('perm-settings-edit', 'SETTINGS', 'EDIT', 'Change platform configuration, system lists, integrations and safe module settings'),
  ('perm-settings-add', 'SETTINGS', 'ADD', 'Create platform configuration entries such as system list options'),
  ('perm-settings-delete', 'SETTINGS', 'DELETE', 'Run destructive platform admin actions such as retention purge'),
  ('perm-settings-rbac-view', 'SETTINGS_RBAC', 'VIEW', 'Read permission roles, the permission matrix and access levels'),
  ('perm-settings-rbac-edit', 'SETTINGS_RBAC', 'EDIT', 'Change role permissions, scopes and platform access levels'),
  ('perm-settings-rbac-add', 'SETTINGS_RBAC', 'ADD', 'Create permission roles'),
  ('perm-settings-rbac-delete', 'SETTINGS_RBAC', 'DELETE', 'Delete non-system permission roles'),
  ('perm-settings-scheduler-view', 'SETTINGS_SCHEDULER', 'VIEW', 'Read the platform scheduler job catalog and run history'),
  ('perm-settings-scheduler-edit', 'SETTINGS_SCHEDULER', 'EDIT', 'Enable, disable or run platform scheduler jobs'),
  ('perm-settings-scheduler-add', 'SETTINGS_SCHEDULER', 'ADD', 'Reserved: scheduler jobs are defined in code, not in the UI'),
  ('perm-settings-scheduler-delete', 'SETTINGS_SCHEDULER', 'DELETE', 'Reserved: scheduler jobs are defined in code, not in the UI')
ON CONFLICT ("module", "action") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-' || p."id" || '-' || r."slug",
  r."id",
  p."id",
  'ALL'
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p."module" IN ('SETTINGS', 'SETTINGS_RBAC', 'SETTINGS_SCHEDULER')
  AND (
    r."id" IN ('role-owner', 'role-ceo')
    OR r."slug" IN ('owner', 'ceo')
  )
ON CONFLICT ("role_id", "permission_id") DO UPDATE
SET "scope" = EXCLUDED."scope";
