-- AlterTable
ALTER TABLE "messenger_conversations" ADD COLUMN "pinned_message_id" TEXT;

-- AddForeignKey
ALTER TABLE "messenger_conversations" ADD CONSTRAINT "messenger_conversations_pinned_message_id_fkey" FOREIGN KEY ("pinned_message_id") REFERENCES "messenger_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "messenger_conversations_pinned_message_id_idx" ON "messenger_conversations"("pinned_message_id");
