ALTER TABLE "dashboard_notes"
  ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

WITH ordered_notes AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "owner_id"
      ORDER BY "created_at" DESC, "id" ASC
    ) - 1 AS "next_sort_order"
  FROM "dashboard_notes"
)
UPDATE "dashboard_notes"
SET "sort_order" = ordered_notes."next_sort_order"
FROM ordered_notes
WHERE "dashboard_notes"."id" = ordered_notes."id";

DROP INDEX IF EXISTS "dashboard_notes_owner_id_created_at_idx";
CREATE INDEX "dashboard_notes_owner_id_sort_order_idx" ON "dashboard_notes"("owner_id", "sort_order");
