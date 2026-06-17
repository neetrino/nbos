-- Drive folder library key: associate DriveFolder records with a Documents Library category.
-- Used by the Documents sidebar to show and create organisational folders inside library views.

ALTER TABLE "drive_folders" ADD COLUMN "library_key" TEXT;

CREATE INDEX "drive_folders_library_key_idx" ON "drive_folders"("library_key");
