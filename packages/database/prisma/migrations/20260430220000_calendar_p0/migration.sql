-- Calendar P0: scoped meetings, personal events and delivery deadline projection support.

CREATE TYPE "CalendarMeetingType" AS ENUM (
  'SALES_CALL',
  'OFFER_PRESENTATION',
  'DEMO',
  'KICKOFF',
  'SUPPORT_CALL',
  'MAINTENANCE_CALL',
  'OTHER'
);

CREATE TYPE "CalendarLocationType" AS ENUM ('ONLINE', 'OFFLINE');

CREATE TYPE "CalendarMeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

CREATE TYPE "PersonalCalendarEventStatus" AS ENUM ('ACTIVE', 'CANCELLED');

ALTER TABLE "extensions" ADD COLUMN "deadline" TIMESTAMP(3);

CREATE TABLE "calendar_meetings" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "meeting_type" "CalendarMeetingType" NOT NULL,
  "location_type" "CalendarLocationType" NOT NULL,
  "location_or_link" TEXT,
  "agenda" TEXT,
  "outcome_notes" TEXT,
  "status" "CalendarMeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
  "internal_participant_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "external_participants" JSONB,
  "project_id" TEXT,
  "product_id" TEXT,
  "deal_id" TEXT,
  "contact_id" TEXT,
  "created_by_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "calendar_meetings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "personal_calendar_events" (
  "id" TEXT NOT NULL,
  "owner_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "is_all_day" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "status" "PersonalCalendarEventStatus" NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "personal_calendar_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "extensions_deadline_idx" ON "extensions"("deadline");
CREATE INDEX "calendar_meetings_starts_at_idx" ON "calendar_meetings"("starts_at");
CREATE INDEX "calendar_meetings_ends_at_idx" ON "calendar_meetings"("ends_at");
CREATE INDEX "calendar_meetings_status_idx" ON "calendar_meetings"("status");
CREATE INDEX "calendar_meetings_created_by_id_idx" ON "calendar_meetings"("created_by_id");
CREATE INDEX "calendar_meetings_project_id_idx" ON "calendar_meetings"("project_id");
CREATE INDEX "calendar_meetings_product_id_idx" ON "calendar_meetings"("product_id");
CREATE INDEX "calendar_meetings_deal_id_idx" ON "calendar_meetings"("deal_id");
CREATE INDEX "personal_calendar_events_owner_id_idx" ON "personal_calendar_events"("owner_id");
CREATE INDEX "personal_calendar_events_starts_at_idx" ON "personal_calendar_events"("starts_at");
CREATE INDEX "personal_calendar_events_ends_at_idx" ON "personal_calendar_events"("ends_at");
CREATE INDEX "personal_calendar_events_status_idx" ON "personal_calendar_events"("status");
