-- Contact ↔ Product: Product.contactId + product_additional_contacts
-- Backfill from Project.contactId (required on projects).

ALTER TABLE "products" ADD COLUMN "contact_id" TEXT;

UPDATE "products" AS p
SET "contact_id" = pr."contact_id"
FROM "projects" pr
WHERE p."project_id" = pr."id";

ALTER TABLE "products" ALTER COLUMN "contact_id" SET NOT NULL;

ALTER TABLE "products"
  ADD CONSTRAINT "products_contact_id_fkey"
  FOREIGN KEY ("contact_id") REFERENCES "contacts"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "products_contact_id_idx" ON "products"("contact_id");

CREATE TABLE "product_additional_contacts" (
  "product_id" TEXT NOT NULL,
  "contact_id" TEXT NOT NULL,
  CONSTRAINT "product_additional_contacts_pkey" PRIMARY KEY ("product_id", "contact_id"),
  CONSTRAINT "product_additional_contacts_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "product_additional_contacts_contact_id_fkey"
    FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
