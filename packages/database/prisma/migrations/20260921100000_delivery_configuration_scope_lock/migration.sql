-- Delivery Compensation v2: freeze scope and money at the first close of a delivery.
-- Additive column plus a backfill, so a card that was already closed before this migration
-- stays read-only even if it is later reopened for work.

ALTER TABLE "delivery_configurations"
    ADD COLUMN IF NOT EXISTS "scope_locked_at" TIMESTAMP(3);

UPDATE "delivery_configurations" AS c
SET "scope_locked_at" = COALESCE(p."closed_at", p."updated_at", CURRENT_TIMESTAMP)
FROM "products" AS p
WHERE c."product_id" = p."id"
  AND c."scope_locked_at" IS NULL
  AND p."status" IN ('DONE', 'LOST');

UPDATE "delivery_configurations" AS c
SET "scope_locked_at" = COALESCE(e."closed_at", e."updated_at", CURRENT_TIMESTAMP)
FROM "extensions" AS e
WHERE c."extension_id" = e."id"
  AND c."scope_locked_at" IS NULL
  AND e."status" IN ('DONE', 'LOST');
