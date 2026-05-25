-- Scoped folder trees for System Library entities (DEAL, PROJECT, …)

ALTER TABLE "drive_folders" ADD COLUMN "scope_entity_type" TEXT;
ALTER TABLE "drive_folders" ADD COLUMN "scope_entity_id" TEXT;

CREATE INDEX "drive_folders_scope_entity_type_scope_entity_id_idx"
  ON "drive_folders"("scope_entity_type", "scope_entity_id");
