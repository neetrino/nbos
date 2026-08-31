-- Slice 6: additive queryable mentions + reference sort order.
-- Does not remove Channel/DM, Unified, Meta, TaskDiscussionEntry, or Task.chatId.

ALTER TABLE "messenger_message_references" ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "messenger_message_references_target_conversation_id_idx"
  ON "messenger_message_references" ("target_conversation_id");

CREATE TABLE IF NOT EXISTS "messenger_message_mentions" (
  "id" TEXT NOT NULL,
  "message_id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messenger_message_mentions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "messenger_message_mentions_message_id_employee_id_key"
  ON "messenger_message_mentions" ("message_id", "employee_id");

CREATE INDEX IF NOT EXISTS "messenger_message_mentions_employee_id_idx"
  ON "messenger_message_mentions" ("employee_id");

ALTER TABLE "messenger_message_mentions"
  ADD CONSTRAINT "messenger_message_mentions_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "messenger_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_message_mentions"
  ADD CONSTRAINT "messenger_message_mentions_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
