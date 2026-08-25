-- Accountant WhatsApp group JID for Official Invoice v1 (Settings, not env).
ALTER TABLE "whatsapp_gateway_connections"
  ADD COLUMN "accounting_group_chat_id" TEXT;
