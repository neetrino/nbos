# 03 — Phases and slices (S00–S07)

**Executable plan for Video Meetings V1.** Canon cleanup register still lists a coarser S00–S05 outline; **this file is authoritative** for implementation order. Map: register S01≈package S01; register S02≈S03; register S03≈S05; register S04≈S06; register S05≈S02 links + S07.

**Rules:** one coherent slice → checks → commit. No production deploy/migration. No secrets in git. Feature-flagged until S07 gate. V2 out of scope.

Status values: `TODO` | `IN_PROGRESS` | `DONE` | `BLOCKED`.

---

## S00 — Audit, ADR, version pin, recording feasibility

| Field                     | Content                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| **Dependencies**          | Module 22 canon on branch; TECH_CARD; Drive/Calendar adjacent code                                 |
| **Exact changes**         | Write `docs/implementation/video-meetings-v1/*`; optional factual cleanup-register pointer         |
| **Migrations / API / UI** | None                                                                                               |
| **Tests**                 | Doc-only; LiveKit local **NOT RUN**                                                                |
| **Done criteria**         | Gap table with paths; ADRs; pins with URLs; recording ADR; slices S01–S07 defined; progress honest |
| **Risks**                 | Pins drift; AutoEgress misread as consent-compatible                                               |
| **Status**                | **DONE** (this commit)                                                                             |

---

## S01 — Schema, permissions, domain tests

| Field                     | Content                                                                                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dependencies**          | S00                                                                                                                                                                                                                                                     |
| **Exact changes**         | Prisma models: meeting, session, participant, invite (digest), consent, recording, recording asset, entity link; optional nullable CalendarMeeting link field; VIDEO_MEETINGS permission rows + seed/upsert script; feature-flag constant (default off) |
| **Migrations / API / UI** | Additive migration only (disposable/dev). No public API yet beyond what tests need. No UI                                                                                                                                                               |
| **Tests**                 | Domain/unit tests for status invariants, invite digest, consent unknown→deny recording; permission negative fixtures                                                                                                                                    |
| **Done criteria**         | `prisma validate` / generate; migration applies on disposable DB; no production migrate; CALLS/Finance untouched                                                                                                                                        |
| **Risks**                 | Over-coupling to CalendarMeeting; reusing CALLS permissions                                                                                                                                                                                             |
| **Status**                | **DONE** (schema + RBAC + domain tests; feature flag default off)                                                                                                                                                                                       |

---

## S02 — NestJS API (create, start, list, card, history, links)

| Field                     | Content                                                                                                                                                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dependencies**          | S01                                                                                                                                                                                                                                                             |
| **Exact changes**         | Nest module: create instant meeting; list/filter accessible; detail/card; history; safe attach/detach Deal/Project/Product/Contact **before and after** meeting with authorization re-check; serializers that never leak recording URLs to unauthorized callers |
| **Migrations / API / UI** | REST under feature flag. No LiveKit yet (or stub room refs only if needed). No full UI                                                                                                                                                                          |
| **Tests**                 | API permission negatives; link validation; guest endpoints absent                                                                                                                                                                                               |
| **Done criteria**         | Authorized employee can create unlinked meeting metadata and manage links without media                                                                                                                                                                         |
| **Risks**                 | Accidental Calendar force-create; mass-assignment of links                                                                                                                                                                                                      |
| **Status**                | **DONE** (flagged Nest metadata API; no LiveKit)                                                                                                                                                                                                                |

---

## S03 — Self-hosted LiveKit local/dev, rooms, tokens, guests

| Field                     | Content                                                                                                                                                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dependencies**          | S01–S02; ADR-VM-001 pins                                                                                                                                                                                                      |
| **Exact changes**         | Local compose/docs for LiveKit Server v1.13.7 + Redis (+ Egress optional stub); Nest room create; AccessToken mint; one-time/revocable invites; prejoin + host admission; reconnect policy with stable opaque participant ids |
| **Migrations / API / UI** | Token/join APIs; minimal room shell allowed if needed for join tests; guest route may start                                                                                                                                   |
| **Tests**                 | Token scope (wrong room rejected); revoke/expire invite; employee vs guest grants                                                                                                                                             |
| **Done criteria**         | Two browsers can join a room on **local** stack; documented env example only                                                                                                                                                  |
| **Risks**                 | Using production Redis for LiveKit; embedding API secrets in web                                                                                                                                                              |
| **Status**                | **DONE** (compose + Nest tokens/invites/admission; two-browser join: see handoff)                                                                                                                                             |

---

## S04 — Adaptive Next.js UI

| Field                     | Content                                                                                                                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dependencies**          | S02–S03                                                                                                                                                                                                                            |
| **Exact changes**         | Sidebar Video Meetings; list active/upcoming/history; detail; room with `@livekit/components-react@2.9.24` + `livekit-client@2.22.3` adapted to NBOS design; guest page without app chrome; loading/error/empty; EN/RU/HY messages |
| **Migrations / API / UI** | UI primary; wire to S02/S03 APIs                                                                                                                                                                                                   |
| **Tests**                 | Component/route permission gates; i18n keys present                                                                                                                                                                                |
| **Done criteria**         | Finished adaptive UI per `05-UI-and-Workflows.md` and UI spec; no V2 AI controls                                                                                                                                                   |
| **Risks**                 | Cards/chrome inconsistent with NBOS; guest shell leaking nav                                                                                                                                                                       |
| **Status**                | **DONE** (Next.js list/detail/room/guest UI; recording controls disabled until S05)                                                                                                                                                |

---

## S05 — Recording: consent, composite + per-participant audio

| Field                     | Content                                                                                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dependencies**          | S03; ADR-VM-003; Egress v1.14.1 available in local/dev                                                                                                                              |
| **Exact changes**         | Explicit start/stop; visible indicator; consent gate; orchestrated RoomComposite + TrackEgress; identity/time segments; late join / withdrawal; dynamic participants; restart rules |
| **Migrations / API / UI** | Recording APIs + UI affordances; asset rows updated with egress ids                                                                                                                 |
| **Tests**                 | Consent unknown deny; late consent; mute/reconnect segment honesty; capacity reject path                                                                                            |
| **Done criteria**         | Local proof: composite MP4 + distinct audio objects appear in R2 (or local S3 stand-in) with mapped participant ids — still may be pre-Drive finalize                               |
| **Risks**                 | CPU starvation; treating AutoEgress as consent start; duplicate egress on retry                                                                                                     |
| **Status**                | **DONE** (API + UI + unit tests; live composite/audio object proof **NOT RUN** — see handoff)                                                                                       |

---

## S06 — Egress → private R2 → Drive durable lifecycle

| Field                     | Content                                                                                                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dependencies**          | S05; Drive artifact-operation services                                                                                                                                                                   |
| **Exact changes**         | Prepare keys; Egress upload; signed webhooks + reconciliation; HeadObject verify; transactional FileAsset/FileVersion/FileLink; purpose `MEETING_RECORDING`; honest READY/PARTIAL/FAILED; gated playback |
| **Migrations / API / UI** | Minimal Drive enum extension only if required; playback UI uses existing player patterns                                                                                                                 |
| **Tests**                 | Idempotent webhook; duplicate finalize; unauthorized playback; partial asset set                                                                                                                         |
| **Done criteria**         | No FileAsset bypass; orphan cleanup follows Drive conservatism                                                                                                                                           |
| **Risks**                 | Race between webhook and finalize; ACL broaden via entity links                                                                                                                                          |
| **Status**                | TODO                                                                                                                                                                                                     |

---

## S07 — Optional Calendar/Notifications, E2E, security, runbook, acceptance

| Field                     | Content                                                                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dependencies**          | S01–S06                                                                                                                                                                                                               |
| **Exact changes**         | Optional CalendarMeeting link; reuse existing reminder path only when linked; cross-module “start video meeting” actions; E2E/security/reliability/load notes; rollback; update IMPLEMENTATION_PROGRESS when verified |
| **Migrations / API / UI** | Calendar nullable FK if not done in S01; no Finance/ATS changes                                                                                                                                                       |
| **Tests**                 | Full acceptance from `04-TEST-AND-ACCEPTANCE.md`; security negatives                                                                                                                                                  |
| **Done criteria**         | V1 gate checklist green on **non-prod** target infra; feature flag still default off for production until explicit owner enable                                                                                       |
| **Risks**                 | Declaring production-ready without legal/capacity gates                                                                                                                                                               |
| **Status**                | TODO                                                                                                                                                                                                                  |

---

## Recommended sequence rationale

Schema/RBAC (S01) before API (S02) before media (S03) before polished UI (S04) before recording (S05) before Drive finalize (S06) before cross-module/E2E (S07). Recording before Drive finalize allows proving egress objects exist before wiring durable finalize. UI before recording so consent/indicator UX is real when S05 lands.
