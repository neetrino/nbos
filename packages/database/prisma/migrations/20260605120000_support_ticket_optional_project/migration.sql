-- Allow intake tickets with title only; project linked during triage.
ALTER TABLE "support_tickets" ALTER COLUMN "project_id" DROP NOT NULL;
