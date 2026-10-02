-- Tax status belongs to revenue documents (invoice, order, subscription), not expenses.
ALTER TABLE "expenses" DROP COLUMN IF EXISTS "tax_status";
