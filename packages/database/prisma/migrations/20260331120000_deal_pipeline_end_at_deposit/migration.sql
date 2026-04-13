-- Deal pipeline: remove CRM stages CREATING, GET_FINAL_PAY, MAINTENANCE_OFFER.
-- Last active stage is DEPOSIT_AND_CONTRACT; then WON or FAILED.
-- Former statuses map to WON (deal exits CRM into Order / Projects / Finance).

UPDATE "deals"
SET "status" = 'WON'
WHERE "status"::text IN ('CREATING', 'GET_FINAL_PAY', 'MAINTENANCE_OFFER');

ALTER TABLE "deals" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "deals" ALTER COLUMN "status" SET DATA TYPE TEXT;

DROP TYPE "DealStatusEnum";

CREATE TYPE "DealStatusEnum" AS ENUM (
  'START_CONVERSATION',
  'DISCUSS_NEEDS',
  'MEETING',
  'CAN_WE_DO_IT',
  'SEND_OFFER',
  'GET_ANSWER',
  'DEPOSIT_AND_CONTRACT',
  'FAILED',
  'WON'
);

ALTER TABLE "deals"
ALTER COLUMN "status" TYPE "DealStatusEnum" USING ("status"::"DealStatusEnum");

ALTER TABLE "deals" ALTER COLUMN "status" SET DEFAULT 'START_CONVERSATION'::"DealStatusEnum";
