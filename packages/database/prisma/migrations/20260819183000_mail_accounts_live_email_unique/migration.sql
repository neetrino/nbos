-- One live MailAccount per mailbox address (case-insensitive).
-- Shared mailbox is MailAccountAccess on that row, not a second Connect.
-- DISABLED leftovers may coexist until cleanup.

UPDATE "mail_accounts"
SET "email_address" = lower(btrim("email_address"))
WHERE "email_address" <> lower(btrim("email_address"));

WITH ranked AS (
  SELECT
    a.id,
    row_number() OVER (
      PARTITION BY lower(a.email_address)
      ORDER BY
        CASE WHEN s.id IS NOT NULL THEN 0 ELSE 1 END,
        a.last_sync_at DESC NULLS LAST,
        a.created_at DESC
    ) AS rn
  FROM "mail_accounts" a
  LEFT JOIN "mail_provider_secrets" s ON s.mail_account_id = a.id
  WHERE a.status <> 'DISABLED'
)
UPDATE "mail_accounts" AS target
SET status = 'DISABLED'
FROM ranked
WHERE target.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX "mail_accounts_live_email_lower_uidx"
ON "mail_accounts" (lower("email_address"))
WHERE "status" <> 'DISABLED';
