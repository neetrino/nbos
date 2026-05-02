CREATE TABLE "dashboard_notes" (
  "id" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dashboard_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "dashboard_notes_owner_id_created_at_idx" ON "dashboard_notes"("owner_id", "created_at");

ALTER TABLE "dashboard_notes"
  ADD CONSTRAINT "dashboard_notes_owner_id_fkey"
  FOREIGN KEY ("owner_id")
  REFERENCES "employees"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
