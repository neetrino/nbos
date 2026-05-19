-- Remap deprecated deal stages before shrinking DealStatusEnum
UPDATE "deals" SET "status" = 'DISCUSS_NEEDS' WHERE "status" = 'MEETING';
UPDATE "deals" SET "status" = 'SEND_OFFER' WHERE "status" = 'CAN_WE_DO_IT';

ALTER TYPE "DealStatusEnum" RENAME TO "DealStatusEnum_old";
CREATE TYPE "DealStatusEnum" AS ENUM (
  'START_CONVERSATION',
  'DISCUSS_NEEDS',
  'SEND_OFFER',
  'GET_ANSWER',
  'DEPOSIT_AND_CONTRACT',
  'FAILED',
  'WON'
);
ALTER TABLE "deals" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "deals" ALTER COLUMN "status" TYPE "DealStatusEnum" USING ("status"::text::"DealStatusEnum");
ALTER TABLE "deals" ALTER COLUMN "status" SET DEFAULT 'START_CONVERSATION';
DROP TYPE "DealStatusEnum_old";
