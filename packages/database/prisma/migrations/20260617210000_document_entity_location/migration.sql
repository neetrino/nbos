-- Document entity location: add entity_type and entity_id for linking native documents
-- to CRM business records (DEAL, LEAD, PROJECT, etc.) within a Drive library category.

ALTER TABLE "documents" ADD COLUMN "entity_type" TEXT;
ALTER TABLE "documents" ADD COLUMN "entity_id" TEXT;

CREATE INDEX "documents_entity_type_entity_id_idx" ON "documents"("entity_type", "entity_id");
