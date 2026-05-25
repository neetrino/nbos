-- Drop unique (product_id, slot_key) to allow multiple credentials per slot.
DROP INDEX IF EXISTS "product_access_slot_bindings_product_id_slot_key_key";

-- Support listing bindings per product + slot.
CREATE INDEX "product_access_slot_bindings_product_id_slot_key_idx" ON "product_access_slot_bindings"("product_id", "slot_key");
