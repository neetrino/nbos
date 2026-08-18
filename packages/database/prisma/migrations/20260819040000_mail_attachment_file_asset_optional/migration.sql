-- Slice C: inbound attachments start PENDING without a Drive FileAsset.

ALTER TABLE "email_attachments" ALTER COLUMN "file_asset_id" DROP NOT NULL;
