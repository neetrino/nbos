-- Client Service WhatsApp payment reminder language (HY / RU / EN, default HY)

ALTER TABLE "client_service_records"
  ADD COLUMN "reminder_language" "SubscriptionReminderLanguage" NOT NULL DEFAULT 'HY';
