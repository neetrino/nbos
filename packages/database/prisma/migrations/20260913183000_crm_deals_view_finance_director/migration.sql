-- Finance Director reads deals.
--
-- `GET /crm/deals/:id` and the deal statistics now require `CRM_DEALS VIEW`. The Finance Director
-- opens the deal card from an invoice or an order, where the amount, payment type and contract are
-- the invoice's own context, so without this grant the finance handoff would break.
--
-- Read only: creating the deposit order stays on `FINANCE_INVOICES ADD`, and every deal write
-- stays with sales. Delivery and technical roles deliberately receive nothing here; their screens
-- hide the "Deal" button instead.

INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT
  'rp-' || p."id" || '-' || r."slug",
  r."id",
  p."id",
  'ALL'
FROM "roles" r
CROSS JOIN "permissions" p
WHERE p."module" = 'CRM_DEALS'
  AND p."action" = 'VIEW'
  AND (r."id" = 'role-finance-director' OR r."slug" = 'finance-director')
ON CONFLICT ("role_id", "permission_id") DO UPDATE
SET "scope" = EXCLUDED."scope";
