-- Dedicated Call note optimistic version. Independent of AtsCallEvent.updatedAt
-- so webhook, recording workers, and other Call metadata writes do not create
-- false note conflicts. Additive NOT NULL DEFAULT 0 is rolling-deploy safe:
-- existing rows receive 0; older app versions ignore the unused column.

ALTER TABLE "ats_call_events" ADD COLUMN "note_version" INTEGER NOT NULL DEFAULT 0;
