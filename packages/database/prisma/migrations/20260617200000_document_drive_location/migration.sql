-- Document drive location: make sectionId nullable, add libraryKey and driveFolderId.

-- Make section_id nullable (legacy documents keep their section; new sidebar documents use libraryKey or driveFolderId)
ALTER TABLE "documents" ALTER COLUMN "section_id" DROP NOT NULL;

-- Add library_key: Drive library category key (deals, projects, products, etc.)
ALTER TABLE "documents" ADD COLUMN "library_key" TEXT;

-- Add drive_folder_id: real DriveFolder row ID (COMPANY or PERSONAL space)
ALTER TABLE "documents" ADD COLUMN "drive_folder_id" TEXT;

-- Referential integrity: drive_folder_id → drive_folders.id (SET NULL on folder deletion)
ALTER TABLE "documents"
  ADD CONSTRAINT "documents_drive_folder_id_fkey"
  FOREIGN KEY ("drive_folder_id") REFERENCES "drive_folders"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes for sidebar queries
CREATE INDEX "documents_library_key_idx" ON "documents"("library_key");
CREATE INDEX "documents_drive_folder_id_idx" ON "documents"("drive_folder_id");
