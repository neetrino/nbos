CREATE TYPE "ReportScheduleFrequencyEnum" AS ENUM (
  'DAILY',
  'WEEKLY',
  'MONTHLY'
);

ALTER TABLE "report_schedules"
  ADD COLUMN "frequency" "ReportScheduleFrequencyEnum" NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Yerevan',
  ADD COLUMN "time_of_day" TEXT NOT NULL DEFAULT '09:00',
  ADD COLUMN "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "day_of_week" INTEGER,
  ADD COLUMN "day_of_month" INTEGER;
