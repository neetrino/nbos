-- Messenger P0: internal Drive FileAsset attachment references and search support.

CREATE TABLE "messenger_channel_message_attachments" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "file_asset_id" TEXT NOT NULL,
  "attached_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messenger_channel_message_attachments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "messenger_direct_message_attachments" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "file_asset_id" TEXT NOT NULL,
  "attached_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messenger_direct_message_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messenger_channel_message_attachments_message_id_idx"
  ON "messenger_channel_message_attachments"("message_id");
CREATE INDEX "messenger_channel_message_attachments_file_asset_id_idx"
  ON "messenger_channel_message_attachments"("file_asset_id");
CREATE INDEX "messenger_direct_message_attachments_message_id_idx"
  ON "messenger_direct_message_attachments"("message_id");
CREATE INDEX "messenger_direct_message_attachments_file_asset_id_idx"
  ON "messenger_direct_message_attachments"("file_asset_id");

ALTER TABLE "messenger_channel_message_attachments"
  ADD CONSTRAINT "messenger_channel_message_attachments_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "messenger_channel_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_channel_message_attachments"
  ADD CONSTRAINT "messenger_channel_message_attachments_file_asset_id_fkey"
  FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messenger_channel_message_attachments"
  ADD CONSTRAINT "messenger_channel_message_attachments_attached_by_id_fkey"
  FOREIGN KEY ("attached_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messenger_direct_message_attachments"
  ADD CONSTRAINT "messenger_direct_message_attachments_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "messenger_direct_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_direct_message_attachments"
  ADD CONSTRAINT "messenger_direct_message_attachments_file_asset_id_fkey"
  FOREIGN KEY ("file_asset_id") REFERENCES "file_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "messenger_direct_message_attachments"
  ADD CONSTRAINT "messenger_direct_message_attachments_attached_by_id_fkey"
  FOREIGN KEY ("attached_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
