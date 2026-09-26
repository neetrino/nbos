# Video Meetings V1 — implementation package

**Module:** 22 — Video Meetings  
**Scope:** V1 only (working meetings + consented recording). V2 AI is out of scope.  
**Package status (S00):** gap analysis, ADRs, version pins, and slice plan written. No product code, Prisma schema, API, or UI in this commit.  
**Branch:** `feature/video-meetings-v1` (from `sipan` @ `db7191cda`).  
**Date:** 2026-09-26.

## Goal

Ship an executable plan so slices S01–S07 can implement Module 22 V1 without inventing architecture: standalone video meetings, external guests, manual consented composite MP4 **plus** per-participant audio, private R2 via existing Drive, optional business links and Calendar.

## How to start

1. Read product canon (already on `sipan` via PR #344):
   - [`docs/NBOS/02-Modules/22-Video-Meetings/`](../../NBOS/02-Modules/22-Video-Meetings/)
   - [`docs/NBOS/05-UI-Specifications/16-Video-Meetings.md`](../../NBOS/05-UI-Specifications/16-Video-Meetings.md)
   - Technical decisions: Video Meetings section in [`docs/NBOS/00-Technical-Decisions-By-Module.md`](../../NBOS/00-Technical-Decisions-By-Module.md)
2. Read this package in order:
   1. [01-GAP-ANALYSIS.md](01-GAP-ANALYSIS.md)
   2. [02-ARCHITECTURE-AND-ADRS.md](02-ARCHITECTURE-AND-ADRS.md)
   3. [03-PHASES-AND-SLICES.md](03-PHASES-AND-SLICES.md)
   4. [04-TEST-AND-ACCEPTANCE.md](04-TEST-AND-ACCEPTANCE.md)
   5. [05-DEPLOYMENT-AND-RUNBOOK.md](05-DEPLOYMENT-AND-RUNBOOK.md)
   6. [06-PROGRESS-AND-HANDOFF.md](06-PROGRESS-AND-HANDOFF.md)
3. Implement **S01** next. Do not start S01 until S00 commit is on the feature branch.
4. Stack remains NestJS + Next.js + Prisma + pnpm per [`docs/TECH_CARD.md`](../../TECH_CARD.md).

## Package naming note

Active implementation packages live under `docs/implementation/<feature>/`. An archived Delivery Compensation package used slightly different filenames (`01-TECHNICAL-CONTRACT.md`, etc.). For Video Meetings V1 this package uses the names above (gap → ADR → phases → tests → runbook → progress). Do not create a parallel second set.

## Non-negotiable constraints (plan only; implement in later slices)

- Standalone meetings without Calendar / Project / Deal. Guests without NBOS accounts. Optional Deal/Project/Product/Contact links before or after. `CalendarMeeting` is not required for every call.
- Do not mix with ATS Calls / CALLS journal. Do not change Finance/Payroll or unrelated modules.
- Backend mints least-privilege LiveKit tokens. Guests get no NBOS API, Drive, or CRM data.
- Explicit recording start/stop, visible indicator, affirmative consent; unknown consent → recording forbidden. Retention/notice wording need legal approval before production (do not invent binding periods).
- Separate statuses: logical meeting, live session, recording job, each file. Meeting `ENDED` ≠ recording `READY`.
- Private R2; business links do not auto-grant media access. Extend `FileArtifactOperation` minimally; never bypass Drive.
- Feature-flagged until full release gate. No production deploy/migration/data deletion; no secrets in git.
- LiveKit/Egress failure must not break other NBOS modules.

## V2

Deferred. See [`03-V2-AI-Meeting-Intelligence.md`](../../NBOS/02-Modules/22-Video-Meetings/03-V2-AI-Meeting-Intelligence.md). Do not plan V2 implementation here.
