-- Support ticket resolution summary and canonical close reason (NBOS lifecycle).

CREATE TYPE "SupportTicketCloseReasonEnum" AS ENUM (
  'CLIENT_CONFIRMED',
  'AUTO_TIMED_OUT',
  'EXTENSION_DELIVERED',
  'MANUAL',
  'DUPLICATE'
);

ALTER TABLE "support_tickets"
  ADD COLUMN "resolution_summary" TEXT,
  ADD COLUMN "close_reason" "SupportTicketCloseReasonEnum";
