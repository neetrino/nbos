-- Nullable accountant note for deal/order invoices only.
-- Existing Awaiting cards stay without a comment; Paid / send / re-enter Awaiting require one in app.
-- Risk: LOW. Rollback: DROP COLUMN, then DROP TYPE.

CREATE TYPE "InvoiceOrderCommentEnum" AS ENUM (
  'FIRST_PHASE',
  'INTERMEDIATE_PHASE',
  'FINAL_PHASE',
  'EXECUTION',
  'MAINTENANCE'
);

ALTER TABLE "invoices" ADD COLUMN "order_comment" "InvoiceOrderCommentEnum";
