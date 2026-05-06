-- Speed up ILIKE/substring search on message bodies at volume (Messenger search).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "messenger_channel_messages_content_trgm_idx"
ON "messenger_channel_messages"
USING gin ("content" gin_trgm_ops);

CREATE INDEX "messenger_direct_messages_content_trgm_idx"
ON "messenger_direct_messages"
USING gin ("content" gin_trgm_ops);
