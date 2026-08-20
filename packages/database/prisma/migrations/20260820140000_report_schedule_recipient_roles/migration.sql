ALTER TABLE "report_schedules"
  ADD COLUMN "recipient_roles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
