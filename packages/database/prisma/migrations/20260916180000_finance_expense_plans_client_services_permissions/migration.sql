-- Expense planning (`FINANCE_EXPENSE_PLANS`) and client services (`FINANCE_CLIENT_SERVICES`)
-- are independent Finance modules. They previously rode on FINANCE_EXPENSES and
-- FINANCE_INVOICES, so `/finance/expenses/plans` and `/finance/client-services` could not
-- be granted separately in Settings → Roles.
--
-- Default grant matches seed-rbac + upsert-finance-expense-plans-client-services-permissions:
--   FINANCE_EXPENSE_PLANS mirrors each role's existing FINANCE_EXPENSES level
--     Owner / CEO / Finance Director / Accountant — VIEW/EDIT/ADD/DELETE ALL
--     Tech Specialist / Operations Manager — VIEW/EDIT OWN
--   FINANCE_CLIENT_SERVICES is a deliberate narrowing (not copied from FINANCE_INVOICES):
--     Owner / CEO / Finance Director — VIEW/EDIT/ADD/DELETE ALL
-- Head of Sales and every other role stay NONE until granted in Settings → Roles.

INSERT INTO "permissions" ("id", "module", "action", "description")
VALUES
  ('perm-finance-expense-plans-view', 'FINANCE_EXPENSE_PLANS', 'VIEW', 'Open expense planning and read expense plans'),
  ('perm-finance-expense-plans-edit', 'FINANCE_EXPENSE_PLANS', 'EDIT', 'Edit expense plans'),
  ('perm-finance-expense-plans-add', 'FINANCE_EXPENSE_PLANS', 'ADD', 'Create expense plans'),
  ('perm-finance-expense-plans-delete', 'FINANCE_EXPENSE_PLANS', 'DELETE', 'Delete expense plans'),
  ('perm-finance-client-services-view', 'FINANCE_CLIENT_SERVICES', 'VIEW', 'Open the client services registry and read client services'),
  ('perm-finance-client-services-edit', 'FINANCE_CLIENT_SERVICES', 'EDIT', 'Edit client services'),
  ('perm-finance-client-services-add', 'FINANCE_CLIENT_SERVICES', 'ADD', 'Create client services'),
  ('perm-finance-client-services-delete', 'FINANCE_CLIENT_SERVICES', 'DELETE', 'Delete client services')
ON CONFLICT ("module", "action") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-' || p."id" || '-' || r."slug",
  r."id",
  p."id",
  CASE
    WHEN r."id" IN ('role-tech-specialist', 'role-operations-manager')
      OR r."slug" IN ('tech-specialist', 'operations-manager')
    THEN 'OWN'
    ELSE 'ALL'
  END
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p."module" = 'FINANCE_EXPENSE_PLANS'
  AND (
    (
      p."action" IN ('VIEW', 'EDIT', 'ADD', 'DELETE')
      AND (
        r."id" IN ('role-owner', 'role-ceo', 'role-finance-director', 'role-accountant')
        OR r."slug" IN ('owner', 'ceo', 'finance-director', 'accountant')
      )
    )
    OR (
      p."action" IN ('VIEW', 'EDIT')
      AND (
        r."id" IN ('role-tech-specialist', 'role-operations-manager')
        OR r."slug" IN ('tech-specialist', 'operations-manager')
      )
    )
  )
-- Re-running this migration must never overwrite a scope an administrator has already configured.
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-' || p."id" || '-' || r."slug",
  r."id",
  p."id",
  'ALL'
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p."module" = 'FINANCE_CLIENT_SERVICES'
  AND p."action" IN ('VIEW', 'EDIT', 'ADD', 'DELETE')
  AND (
    r."id" IN ('role-owner', 'role-ceo', 'role-finance-director')
    OR r."slug" IN ('owner', 'ceo', 'finance-director')
  )
-- Re-running this migration must never overwrite a scope an administrator has already configured.
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
