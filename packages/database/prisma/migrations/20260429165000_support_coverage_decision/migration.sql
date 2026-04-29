CREATE TYPE "SupportCoverageEnum" AS ENUM (
  'COVERED_BY_MAINTENANCE',
  'FREE_GOODWILL',
  'BILLABLE_SMALL_WORK',
  'EXTENSION_REQUIRED',
  'NOT_COVERED_REJECTED'
);

ALTER TABLE "support_tickets"
  ADD COLUMN "coverage_decision" "SupportCoverageEnum";
