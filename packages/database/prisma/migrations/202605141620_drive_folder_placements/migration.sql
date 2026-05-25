-- Drive user folder system: Company/Personal folders and file placements.

CREATE TYPE "DriveSpaceEnum" AS ENUM ('COMPANY', 'PERSONAL');
CREATE TYPE "DriveFolderItemTypeEnum" AS ENUM ('FILE', 'FOLDER');

CREATE TABLE "drive_folders" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "space" "DriveSpaceEnum" NOT NULL,
  "owner_id" TEXT,
  "created_by_id" TEXT,
  "parent_id" TEXT,
  "archived_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "drive_folders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "drive_folder_items" (
  "id" TEXT NOT NULL,
  "folder_id" TEXT NOT NULL,
  "item_type" "DriveFolderItemTypeEnum" NOT NULL,
  "file_asset_id" TEXT,
  "child_folder_id" TEXT,
  "placed_by_id" TEXT,
  "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "removed_at" TIMESTAMP(3),

  CONSTRAINT "drive_folder_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "file_upload_sessions" ADD COLUMN "folder_id" TEXT;

CREATE INDEX "drive_folders_space_owner_id_idx" ON "drive_folders"("space", "owner_id");
CREATE INDEX "drive_folders_parent_id_idx" ON "drive_folders"("parent_id");
CREATE INDEX "drive_folders_deleted_at_idx" ON "drive_folders"("deleted_at");
CREATE INDEX "drive_folder_items_folder_id_removed_at_idx" ON "drive_folder_items"("folder_id", "removed_at");
CREATE INDEX "drive_folder_items_file_asset_id_idx" ON "drive_folder_items"("file_asset_id");
CREATE INDEX "drive_folder_items_child_folder_id_idx" ON "drive_folder_items"("child_folder_id");
CREATE INDEX "file_upload_sessions_folder_id_idx" ON "file_upload_sessions"("folder_id");

ALTER TABLE "drive_folders"
  ADD CONSTRAINT "drive_folders_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "drive_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "drive_folder_items"
  ADD CONSTRAINT "drive_folder_items_folder_id_fkey"
  FOREIGN KEY ("folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "drive_folder_items"
  ADD CONSTRAINT "drive_folder_items_file_asset_id_fkey"
  FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "drive_folder_items"
  ADD CONSTRAINT "drive_folder_items_child_folder_id_fkey"
  FOREIGN KEY ("child_folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
