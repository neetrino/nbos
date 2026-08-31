-- Slice 7: additive Meta Sales mapping kinds + Lead conversation link.
-- Does not DROP Meta / Channel / DM / TaskDiscussionEntry / Task.chatId.
-- Does not apply Mail’s exemption to Meta. Empty Meta rows remain MIGRATE.

ALTER TYPE "MessengerLegacyIdentityKind" ADD VALUE IF NOT EXISTS 'META_CONVERSATION';
ALTER TYPE "MessengerLegacyIdentityKind" ADD VALUE IF NOT EXISTS 'META_MESSAGE';

ALTER TYPE "MessengerLinkEntityType" ADD VALUE IF NOT EXISTS 'LEAD';
