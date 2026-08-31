-- Slice 4: additive WORKSPACE conversation type for standalone Work Spaces (M-WORK-02).
-- Does not drop Channel/DM, Unified, Meta, or Task discussion.
-- Does not add a global unique on ConversationLink (entityType, entityId).

ALTER TYPE "MessengerConversationType" ADD VALUE IF NOT EXISTS 'WORKSPACE';

ALTER TABLE "messenger_conversations"
  DROP CONSTRAINT "messenger_conversations_zone_kind_type_chk";

ALTER TABLE "messenger_conversations"
  ADD CONSTRAINT "messenger_conversations_zone_kind_type_chk" CHECK (
    (
      "zone" = 'INTERNAL'
      AND "type" IN (
        'PROJECT_GENERAL',
        'PRODUCT',
        'DEAL',
        'TASK',
        'WORKSPACE',
        'DIRECT',
        'INTERNAL_GROUP'
      )
      AND (
        ("type" = 'DIRECT' AND "kind" = 'DIRECT')
        OR ("type" = 'INTERNAL_GROUP' AND "kind" = 'GROUP')
        OR (
          "type" IN ('PROJECT_GENERAL', 'PRODUCT', 'DEAL', 'TASK', 'WORKSPACE')
          AND "kind" = 'ENTITY'
        )
      )
    )
    OR (
      "zone" = 'CLIENT'
      AND "kind" = 'EXTERNAL'
    )
  );
