ALTER TABLE "deals"
ADD COLUMN "offer_sent_at" TIMESTAMP(3),
ADD COLUMN "offer_link" TEXT,
ADD COLUMN "offer_file_url" TEXT,
ADD COLUMN "offer_screenshot_url" TEXT,
ADD COLUMN "response_due_at" TIMESTAMP(3),
ADD COLUMN "contract_signed_at" TIMESTAMP(3),
ADD COLUMN "contract_file_url" TEXT;
