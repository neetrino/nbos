-- Video Meetings V1 (Module 22) — additive schema + VIDEO_MEETINGS RBAC.
-- Risk: LOW (new independent tables/enums + permission rows). No DROP/ALTER of existing tables.
-- Default role grants: Owner/CEO only. Wider default matrix is a DECISION open for Product+Security.
-- Do not reuse CALLS permissions. Entity links do not imply media ACL.

-- CreateEnum
CREATE TYPE "VideoMeetingStatus" AS ENUM ('CREATED', 'WAITING', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VideoMeetingParticipantKind" AS ENUM ('EMPLOYEE', 'GUEST');

-- CreateEnum
CREATE TYPE "VideoMeetingConsentDecision" AS ENUM ('UNKNOWN', 'GRANTED', 'DECLINED', 'REVOKED');

-- CreateEnum
CREATE TYPE "VideoMeetingRecordingStatus" AS ENUM ('PENDING', 'RECORDING', 'FINALIZING', 'READY', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "VideoMeetingRecordingAssetStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'MISSING');

-- CreateEnum
CREATE TYPE "VideoMeetingRecordingAssetKind" AS ENUM ('ROOM_COMPOSITE', 'PARTICIPANT_AUDIO');

-- CreateEnum
CREATE TYPE "VideoMeetingEntityLinkType" AS ENUM ('DEAL', 'PROJECT', 'PRODUCT', 'CONTACT');

-- CreateTable
CREATE TABLE "video_meetings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "VideoMeetingStatus" NOT NULL DEFAULT 'CREATED',
    "host_employee_id" TEXT NOT NULL,
    "owner_employee_id" TEXT NOT NULL,
    "scheduled_starts_at" TIMESTAMP(3),
    "scheduled_ends_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "calendar_meeting_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_meeting_sessions" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "livekit_room_name" TEXT NOT NULL,
    "livekit_room_sid" TEXT,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_meeting_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_meeting_participants" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "session_id" TEXT,
    "kind" "VideoMeetingParticipantKind" NOT NULL,
    "employee_id" TEXT,
    "display_name" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3),
    "left_at" TIMESTAMP(3),
    "track_timeline" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_meeting_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_meeting_invites" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "token_digest" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_by_employee_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_meeting_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_meeting_consents" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "session_id" TEXT,
    "notice_version" TEXT NOT NULL,
    "decision" "VideoMeetingConsentDecision" NOT NULL DEFAULT 'UNKNOWN',
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_meeting_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_meeting_recordings" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "session_id" TEXT,
    "status" "VideoMeetingRecordingStatus" NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "stopped_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_meeting_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_meeting_recording_assets" (
    "id" TEXT NOT NULL,
    "recording_id" TEXT NOT NULL,
    "kind" "VideoMeetingRecordingAssetKind" NOT NULL,
    "status" "VideoMeetingRecordingAssetStatus" NOT NULL DEFAULT 'PENDING',
    "participant_id" TEXT,
    "livekit_track_id" TEXT,
    "egress_id" TEXT,
    "file_asset_id" TEXT,
    "range_starts_at" TIMESTAMP(3),
    "range_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_meeting_recording_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_meeting_entity_links" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "entity_type" "VideoMeetingEntityLinkType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_meeting_entity_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "video_meetings_status_idx" ON "video_meetings"("status");

-- CreateIndex
CREATE INDEX "video_meetings_host_employee_id_idx" ON "video_meetings"("host_employee_id");

-- CreateIndex
CREATE INDEX "video_meetings_owner_employee_id_idx" ON "video_meetings"("owner_employee_id");

-- CreateIndex
CREATE INDEX "video_meetings_calendar_meeting_id_idx" ON "video_meetings"("calendar_meeting_id");

-- CreateIndex
CREATE INDEX "video_meetings_created_at_idx" ON "video_meetings"("created_at");

-- CreateIndex
CREATE INDEX "video_meeting_sessions_meeting_id_idx" ON "video_meeting_sessions"("meeting_id");

-- CreateIndex
CREATE INDEX "video_meeting_sessions_livekit_room_name_idx" ON "video_meeting_sessions"("livekit_room_name");

-- CreateIndex
CREATE INDEX "video_meeting_participants_meeting_id_idx" ON "video_meeting_participants"("meeting_id");

-- CreateIndex
CREATE INDEX "video_meeting_participants_session_id_idx" ON "video_meeting_participants"("session_id");

-- CreateIndex
CREATE INDEX "video_meeting_participants_employee_id_idx" ON "video_meeting_participants"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_meeting_invites_token_digest_key" ON "video_meeting_invites"("token_digest");

-- CreateIndex
CREATE INDEX "video_meeting_invites_meeting_id_idx" ON "video_meeting_invites"("meeting_id");

-- CreateIndex
CREATE INDEX "video_meeting_invites_expires_at_idx" ON "video_meeting_invites"("expires_at");

-- CreateIndex
CREATE INDEX "video_meeting_consents_meeting_id_idx" ON "video_meeting_consents"("meeting_id");

-- CreateIndex
CREATE INDEX "video_meeting_consents_participant_id_idx" ON "video_meeting_consents"("participant_id");

-- CreateIndex
CREATE INDEX "video_meeting_consents_session_id_idx" ON "video_meeting_consents"("session_id");

-- CreateIndex
CREATE INDEX "video_meeting_consents_decision_idx" ON "video_meeting_consents"("decision");

-- CreateIndex
CREATE INDEX "video_meeting_recordings_meeting_id_idx" ON "video_meeting_recordings"("meeting_id");

-- CreateIndex
CREATE INDEX "video_meeting_recordings_session_id_idx" ON "video_meeting_recordings"("session_id");

-- CreateIndex
CREATE INDEX "video_meeting_recordings_status_idx" ON "video_meeting_recordings"("status");

-- CreateIndex
CREATE INDEX "video_meeting_recording_assets_recording_id_idx" ON "video_meeting_recording_assets"("recording_id");

-- CreateIndex
CREATE INDEX "video_meeting_recording_assets_participant_id_idx" ON "video_meeting_recording_assets"("participant_id");

-- CreateIndex
CREATE INDEX "video_meeting_recording_assets_egress_id_idx" ON "video_meeting_recording_assets"("egress_id");

-- CreateIndex
CREATE INDEX "video_meeting_recording_assets_file_asset_id_idx" ON "video_meeting_recording_assets"("file_asset_id");

-- CreateIndex
CREATE INDEX "video_meeting_recording_assets_status_idx" ON "video_meeting_recording_assets"("status");

-- CreateIndex
CREATE INDEX "video_meeting_entity_links_entity_type_entity_id_idx" ON "video_meeting_entity_links"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_meeting_entity_links_meeting_id_entity_type_entity_id_key" ON "video_meeting_entity_links"("meeting_id", "entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "video_meeting_sessions" ADD CONSTRAINT "video_meeting_sessions_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "video_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_meeting_participants" ADD CONSTRAINT "video_meeting_participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "video_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_meeting_participants" ADD CONSTRAINT "video_meeting_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "video_meeting_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_meeting_invites" ADD CONSTRAINT "video_meeting_invites_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "video_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_meeting_consents" ADD CONSTRAINT "video_meeting_consents_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "video_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_meeting_consents" ADD CONSTRAINT "video_meeting_consents_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "video_meeting_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_meeting_consents" ADD CONSTRAINT "video_meeting_consents_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "video_meeting_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_meeting_recordings" ADD CONSTRAINT "video_meeting_recordings_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "video_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_meeting_recordings" ADD CONSTRAINT "video_meeting_recordings_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "video_meeting_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_meeting_recording_assets" ADD CONSTRAINT "video_meeting_recording_assets_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "video_meeting_recordings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_meeting_recording_assets" ADD CONSTRAINT "video_meeting_recording_assets_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "video_meeting_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_meeting_entity_links" ADD CONSTRAINT "video_meeting_entity_links_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "video_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- VIDEO_MEETINGS permission catalog (VIEW/EDIT/ADD/DELETE). Never CALLS.
INSERT INTO "permissions" ("id", "module", "action", "description")
VALUES
    ('perm-video-meetings-view', 'VIDEO_MEETINGS', 'VIEW',
     'View Video Meetings list, cards, and history metadata'),
    ('perm-video-meetings-edit', 'VIDEO_MEETINGS', 'EDIT',
     'Edit Video Meetings metadata, links, and host actions'),
    ('perm-video-meetings-add', 'VIDEO_MEETINGS', 'ADD',
     'Create Video Meetings and invites'),
    ('perm-video-meetings-delete', 'VIDEO_MEETINGS', 'DELETE',
     'Cancel or delete Video Meetings where allowed')
ON CONFLICT ("module", "action") DO NOTHING;

-- Interim default: Owner and CEO only (ALL). Broader matrix is an open Product+Security DECISION.
INSERT INTO "role_permissions" ("id", "role_id", "permission_id", "scope")
SELECT 'rp-' || p."id" || '-' || r."slug", r."id", p."id", 'ALL'
FROM "roles" AS r
CROSS JOIN "permissions" AS p
WHERE p."module" = 'VIDEO_MEETINGS'
  AND (r."id" IN ('role-owner', 'role-ceo') OR r."slug" IN ('owner', 'ceo'))
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
