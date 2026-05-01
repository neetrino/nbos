CREATE TABLE "personal_links" (
  "id" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "placement" TEXT[] NOT NULL DEFAULT ARRAY['SIDEBAR']::TEXT[],
  "open_in_new_tab" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "personal_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "personal_links_owner_id_sort_order_idx" ON "personal_links"("owner_id", "sort_order");

ALTER TABLE "personal_links"
  ADD CONSTRAINT "personal_links_owner_id_fkey"
  FOREIGN KEY ("owner_id")
  REFERENCES "employees"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
