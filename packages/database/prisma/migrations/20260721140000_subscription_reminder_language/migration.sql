-- Subscription client WhatsApp payment reminder language (HY / RU / EN, default HY)

CREATE TYPE "SubscriptionReminderLanguage" AS ENUM ('HY', 'RU', 'EN');

ALTER TABLE "subscriptions"
  ADD COLUMN "reminder_language" "SubscriptionReminderLanguage" NOT NULL DEFAULT 'HY';
