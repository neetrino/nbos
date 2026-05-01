CREATE TYPE "MarketingChannelEnum" AS ENUM (
  'SMM',
  'WEBSITE',
  'LIST_AM',
  'GOOGLE_ADS',
  'META_ADS',
  'CONTENT',
  'SEO',
  'OFFLINE',
  'OTHER'
);

CREATE TYPE "MarketingAccountStatusEnum" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

CREATE TYPE "MarketingActivityStatusEnum" AS ENUM (
  'IDEA',
  'PREPARING',
  'READY',
  'LAUNCHED',
  'FINISHED',
  'ARCHIVED'
);

CREATE TYPE "MarketingActivityTypeEnum" AS ENUM (
  'AD_CAMPAIGN',
  'SMM_POST',
  'STORY_REEL',
  'LIST_AM_PROMOTION',
  'WEBSITE_LANDING',
  'SEO_WORK',
  'OFFLINE_ACTIVITY',
  'OTHER'
);

CREATE TABLE "marketing_accounts" (
  "id" TEXT NOT NULL,
  "channel" "MarketingChannelEnum" NOT NULL,
  "name" TEXT NOT NULL,
  "identifier" TEXT,
  "phone" TEXT,
  "status" "MarketingAccountStatusEnum" NOT NULL DEFAULT 'ACTIVE',
  "finance_expense_plan_id" TEXT,
  "default_cost" DECIMAL(12, 2),
  "owner_id" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "marketing_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketing_activities" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "channel" "MarketingChannelEnum" NOT NULL,
  "type" "MarketingActivityTypeEnum" NOT NULL,
  "status" "MarketingActivityStatusEnum" NOT NULL DEFAULT 'IDEA',
  "account_id" TEXT,
  "owner_id" TEXT,
  "description" TEXT,
  "budget" DECIMAL(12, 2),
  "currency" TEXT NOT NULL DEFAULT 'AMD',
  "start_date" TIMESTAMP(3),
  "end_date" TIMESTAMP(3),
  "expected_pay_at" TIMESTAMP(3),
  "expense_card_id" TEXT,
  "expense_plan_id" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "marketing_activities_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "leads"
  ADD COLUMN "marketing_account_id" TEXT,
  ADD COLUMN "marketing_activity_id" TEXT;

ALTER TABLE "deals"
  ADD COLUMN "marketing_account_id" TEXT,
  ADD COLUMN "marketing_activity_id" TEXT;

ALTER TABLE "marketing_accounts"
  ADD CONSTRAINT "marketing_accounts_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "marketing_activities"
  ADD CONSTRAINT "marketing_activities_account_id_fkey"
  FOREIGN KEY ("account_id") REFERENCES "marketing_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "marketing_activities"
  ADD CONSTRAINT "marketing_activities_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_marketing_account_id_fkey"
  FOREIGN KEY ("marketing_account_id") REFERENCES "marketing_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_marketing_activity_id_fkey"
  FOREIGN KEY ("marketing_activity_id") REFERENCES "marketing_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "deals"
  ADD CONSTRAINT "deals_marketing_account_id_fkey"
  FOREIGN KEY ("marketing_account_id") REFERENCES "marketing_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "deals"
  ADD CONSTRAINT "deals_marketing_activity_id_fkey"
  FOREIGN KEY ("marketing_activity_id") REFERENCES "marketing_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "marketing_accounts_channel_status_idx" ON "marketing_accounts"("channel", "status");
CREATE INDEX "marketing_activities_channel_status_idx" ON "marketing_activities"("channel", "status");
CREATE INDEX "leads_marketing_account_id_idx" ON "leads"("marketing_account_id");
CREATE INDEX "leads_marketing_activity_id_idx" ON "leads"("marketing_activity_id");
CREATE INDEX "deals_marketing_account_id_idx" ON "deals"("marketing_account_id");
CREATE INDEX "deals_marketing_activity_id_idx" ON "deals"("marketing_activity_id");
