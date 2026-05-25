-- Simplify CRM offer purposes to OFFER; remove deal response due date.

ALTER TABLE "deals" DROP COLUMN IF EXISTS "response_due_at";

CREATE TYPE "FilePurposeEnum_new" AS ENUM (
  'OFFER',
  'CONTRACT',
  'HANDOFF_DOCUMENT',
  'DESIGN_ASSET',
  'DELIVERY_FILE',
  'INVOICE_REQUEST_PROOF',
  'PAYMENT_PROOF',
  'EXPENSE_PROOF',
  'PARTNER_AGREEMENT',
  'SUPPORT_EVIDENCE',
  'TASK_ATTACHMENT',
  'WORKSPACE_ARTIFACT',
  'SOP_DOCUMENT',
  'TRAINING_MATERIAL',
  'MEETING_RECORDING',
  'CALL_RECORDING',
  'OTHER'
);

CREATE OR REPLACE FUNCTION migrate_file_purpose_to_new(old_val text)
RETURNS "FilePurposeEnum_new" AS $$
BEGIN
  IF old_val IS NULL THEN
    RETURN NULL;
  END IF;
  IF old_val IN ('OFFER_DRAFT', 'OFFER_SENT', 'OFFER_APPROVED', 'MESSENGER_PROOF') THEN
    RETURN 'OFFER'::"FilePurposeEnum_new";
  END IF;
  RETURN old_val::"FilePurposeEnum_new";
END;
$$ LANGUAGE plpgsql IMMUTABLE;

ALTER TABLE "file_assets"
  ALTER COLUMN "purpose" TYPE "FilePurposeEnum_new"
  USING (migrate_file_purpose_to_new("purpose"::text));

ALTER TABLE "file_links"
  ALTER COLUMN "purpose_override" TYPE "FilePurposeEnum_new"
  USING (migrate_file_purpose_to_new("purpose_override"::text));

ALTER TABLE "file_upload_sessions"
  ALTER COLUMN "purpose" TYPE "FilePurposeEnum_new"
  USING (migrate_file_purpose_to_new("purpose"::text));

DROP FUNCTION migrate_file_purpose_to_new(text);

ALTER TYPE "FilePurposeEnum" RENAME TO "FilePurposeEnum_old";
ALTER TYPE "FilePurposeEnum_new" RENAME TO "FilePurposeEnum";
DROP TYPE "FilePurposeEnum_old";
