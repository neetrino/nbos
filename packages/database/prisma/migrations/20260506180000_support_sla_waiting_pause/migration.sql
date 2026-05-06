-- SLA waiting overlay + pause accounting (NBOS Support canon)

CREATE TYPE "TicketWaitingStateEnum" AS ENUM ('NONE', 'WAITING_FOR_CLIENT', 'WAITING_FOR_THIRD_PARTY', 'ESCALATED');

ALTER TABLE "support_tickets" ADD COLUMN "waiting_state" "TicketWaitingStateEnum" NOT NULL DEFAULT 'NONE';
ALTER TABLE "support_tickets" ADD COLUMN "waiting_reason" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN "sla_paused_total_seconds" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "support_tickets" ADD COLUMN "sla_pause_started_at" TIMESTAMP(3);
