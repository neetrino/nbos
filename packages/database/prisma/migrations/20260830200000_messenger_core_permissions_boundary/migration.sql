-- Slice 2: zone-scoped Collections + DB enforcement that items cannot cross Internal/Client.
-- Additive only. Does not drop Channel/DM, Unified, Meta, Task discussion, or edit Slice 1 SQL.

CREATE TYPE "MessengerCollectionVisibility" AS ENUM ('PERSONAL', 'SHARED');

CREATE TABLE "messenger_conversation_collections" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "visibility" "MessengerCollectionVisibility" NOT NULL,
  "zone" "MessengerConversationZone" NOT NULL,
  "owner_employee_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "messenger_conversation_collections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messenger_conversation_collections_owner_employee_id_zone_idx"
  ON "messenger_conversation_collections"("owner_employee_id", "zone");

CREATE INDEX "messenger_conversation_collections_zone_visibility_idx"
  ON "messenger_conversation_collections"("zone", "visibility");

ALTER TABLE "messenger_conversation_collections"
  ADD CONSTRAINT "messenger_conversation_collections_owner_employee_id_fkey"
  FOREIGN KEY ("owner_employee_id")
  REFERENCES "employees"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "messenger_conversation_collection_items" (
  "id" TEXT NOT NULL,
  "collection_id" TEXT NOT NULL,
  "conversation_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messenger_conversation_collection_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "messenger_collection_items_pair_key"
  ON "messenger_conversation_collection_items"("collection_id", "conversation_id");

CREATE INDEX "messenger_conversation_collection_items_conversation_id_idx"
  ON "messenger_conversation_collection_items"("conversation_id");

ALTER TABLE "messenger_conversation_collection_items"
  ADD CONSTRAINT "messenger_conversation_collection_items_collection_id_fkey"
  FOREIGN KEY ("collection_id")
  REFERENCES "messenger_conversation_collections"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_conversation_collection_items"
  ADD CONSTRAINT "messenger_conversation_collection_items_conversation_id_fkey"
  FOREIGN KEY ("conversation_id")
  REFERENCES "messenger_conversations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "messenger_conversation_collection_members" (
  "id" TEXT NOT NULL,
  "collection_id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messenger_conversation_collection_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "messenger_collection_members_pair_key"
  ON "messenger_conversation_collection_members"("collection_id", "employee_id");

CREATE INDEX "messenger_conversation_collection_members_employee_id_idx"
  ON "messenger_conversation_collection_members"("employee_id");

ALTER TABLE "messenger_conversation_collection_members"
  ADD CONSTRAINT "messenger_conversation_collection_members_collection_id_fkey"
  FOREIGN KEY ("collection_id")
  REFERENCES "messenger_conversation_collections"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messenger_conversation_collection_members"
  ADD CONSTRAINT "messenger_conversation_collection_members_employee_id_fkey"
  FOREIGN KEY ("employee_id")
  REFERENCES "employees"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION public.messenger_collection_zone_immutable()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.zone IS DISTINCT FROM OLD.zone THEN
    RAISE EXCEPTION 'Collection.zone is immutable';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER messenger_collection_zone_immutable
  BEFORE UPDATE ON "messenger_conversation_collections"
  FOR EACH ROW
  EXECUTE FUNCTION public.messenger_collection_zone_immutable();

CREATE OR REPLACE FUNCTION public.messenger_collection_item_zone_match()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  collection_zone "MessengerConversationZone";
  conversation_zone "MessengerConversationZone";
BEGIN
  SELECT zone INTO collection_zone
  FROM "messenger_conversation_collections"
  WHERE id = NEW.collection_id;
  SELECT zone INTO conversation_zone
  FROM "messenger_conversations"
  WHERE id = NEW.conversation_id;
  IF collection_zone IS DISTINCT FROM conversation_zone THEN
    RAISE EXCEPTION 'Collection zone must match conversation zone';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER messenger_collection_item_zone_match
  BEFORE INSERT OR UPDATE ON "messenger_conversation_collection_items"
  FOR EACH ROW
  EXECUTE FUNCTION public.messenger_collection_item_zone_match();
