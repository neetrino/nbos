# Phase 5 Minimal Product Closure Proposal

> Approved by owner on 2026-04-30.
>
> Goal: close Phase 5 as a practical, usable collaboration / knowledge layer without building every advanced future feature.

## 1. Decision framing

Phase 5 should not mean "all collaboration modules are complete forever".

For this project, Phase 5 can be considered closed when every module in the phase has:

- a usable production-grade MVP surface;
- database-backed source of truth where the module owns data;
- permissions and audit for sensitive actions;
- clear boundaries with adjacent modules;
- honest incomplete states instead of fake integrations;
- documented deferrals for advanced or external-provider depth.

The proposed closure target is:

```text
Phase 5 = usable internal product foundation
Phase 6 = control / reporting layer on top of it
Phase 7 = deeper external integrations and migration
```

## 2. Phase 5 closure gate

| Area                     | Closure target                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| Documents                | Daily create/read/edit/search/access workflow is usable. Google/AI/collab cursors are deferred.   |
| Drive                    | File Assets are the business truth; modules can attach and preview linked files.                  |
| Credentials              | Secrets are secure, reveal/copy is audited, access is understandable.                             |
| Messenger                | Internal messenger is usable; external boundary is represented honestly without fake providers.   |
| Mail                     | Inbox/reply/send lifecycle is usable with clear provider strategy; stubs are not presented real.  |
| Notifications            | Persisted in-app center and basic rule/job/delivery log exist; external adapters can be deferred. |
| Calendar                 | Main Calendar has only Meetings, Delivery Deadlines, Personal, backed by API, not mock data.      |
| Technical Infrastructure | Product technical assets/environments are tracked at minimum usable level.                        |

## 3. Priority levels

- `P0 Closure` - required before saying Phase 5 is done.
- `P1 Useful next` - should be done soon, but does not block Phase 6 start.
- `P2 Later` - explicit deferral to Phase 6/7 or future product depth.

## 4. Module proposals

### 4.1 Documents

Current state: mostly usable. Prisma, REST, web routes, TipTap editor, Drive-backed images/files, search vectors, access scopes and activity pagination are already shipped.

`P0 Closure`

- Add small UI polish pass for daily use: empty states, save/error clarity, attachment UX, loading states.
- Add favorites / recently used if cheap and already supported by existing data patterns; otherwise defer.
- Confirm that Documents search and access scope still pass after latest Drive/ACL changes.

`P1 Useful next`

- Better paste handling for images/links.
- Document templates for common company docs.
- Export to PDF/HTML through Drive export job once Drive export exists.

`P2 Later`

- Google Docs/Sheets sync.
- AI writing assistant.
- Live collaboration, revision diff, heavy approval workflow.

Owner decisions needed:

- Confirm that first-release Documents is "native NBOS docs", not Google replacement.
- Confirm no approval workflow in Phase 5 closure.

### 4.2 Drive

Current state: FileAsset/FileVersion/FileLink foundation and upload sessions exist; deeper Drive library UX, versions, permissions, export and cleanup remain incomplete.

`P0 Closure`

- Provide a reusable attachment component for modules that already need files: Documents, Mail, Tasks/Support if available.
- Add a file detail drawer/page showing metadata, linked entities, current version and audit summary.
- Add version upload for an existing FileAsset.
- Add safer archive/unarchive/delete lifecycle in UI around existing backend behavior.
- Add entity-aware access resolver enough for linked modules to avoid leaking restricted files.

`P1 Useful next`

- Logical Drive libraries: Project, Product, Client, Finance, Support.
- Purpose selector and filters by type/purpose/entity/uploader/date.
- Preview polish for common file types.

`P2 Later`

- Export jobs and ZIP manifests.
- Cleanup dashboard and storage admin.
- Full FilePermission grant matrix.

Owner decisions needed:

- Which file libraries must be visible in first closure: Project/Product only, or also Client/Finance/Support?
- Whether Finance restricted files need explicit Drive-level permissions now or can inherit Finance access for MVP.

### 4.3 Credentials

Current state: CRUD, archive/restore/permanent delete, encrypted core secret fields, reveal/copy/open-url audit and row-level access exist. Flexible credential types, grants, rotation and emergency access are missing.

`P0 Closure`

- Split notes into public notes and encrypted secure notes.
- Add credential type field with minimal required-field rules: login/password, API key, SSH key, OAuth token reference, environment secret.
- Add product/domain/service context links beyond Project/Department/Owner where needed by Phase 5 modules.
- Add "rotation due" metadata: last rotated, next rotation, owner, overdue indicator.
- Add high-risk reveal/copy notifications or at least an audit-visible risk flag.

`P1 Useful next`

- Access request / approve / reject flow.
- Temporary access grants with expiry.
- Saved views, favorites, recently used, stronger search facets.

`P2 Later`

- Emergency break-glass flow.
- Encrypted export/backup policy.
- Offboarding automation.
- Bulk rotation workflows.

Owner decisions needed:

- Default rotation periods by credential type.
- Whether reveal/copy needs step-up auth in this release or only audit + notification.
- Who can grant temporary access.

### 4.4 Messenger

Current state: internal MVP is live with Prisma, Socket.IO, typing, presence, unread, read receipts and audit. Full canonical Conversation/Message/Participant/ReadState model, External Messenger, CRM Inbox, WhatsApp adapter and Drive attachments are not complete.

`P0 Closure`

- Make the UI explicitly split Internal and External zones, even if External shows "not connected yet" / "coming via adapter".
- Add product/task context entry points where most useful: Product Chat and Task discussion panel or clear link into existing channel/DM model.
- Add Drive attachment support for internal messages.
- Add search over internal messages.
- Add mute/archive/lock basics for conversations/channels.
- Ensure audit exists for create/send/archive/lock and does not store message body in audit changes.

`P1 Useful next`

- Canonical Conversation / Participant / ReadState migration if it can be done without blocking Phase 6.
- CRM Inbox shell with manual external conversation records.
- Project WhatsApp Group placeholders linked to Project/Product, without WAHA send/sync yet.

`P2 Later`

- WAHA adapter and QR session management.
- External channel delivery queue.
- Full WhatsApp group sync, participants and attachments.
- Export/cleanup support.

Owner decisions needed:

- Is Phase 5 closure allowed to defer real WAHA runtime to Phase 7?
- Which internal entry points matter most first: Product Chat, Task Chat, Deal Chat?
- Should old current channel model be migrated now or wrapped as Internal MVP until external work starts?

### 4.5 Mail

Current state: Mail MVP has inbox/thread UI, drafts, queue/cancel/finalize-stub, delivery log UI, health summary and in-app notifications. Real SMTP/IMAP/Gmail sync/send, provider jobs, attachments and Credentials boundary are not complete.

`P0 Closure`

- Replace visible "stub" semantics with an honest provider state: Not connected / Test mode / Connected.
- Add MailProviderConnection model enough to store provider type, status, last error, last sync and secure credential reference.
- Add Credentials boundary for mailbox secrets/tokens; no raw password/token in Mail tables.
- Add EmailAttachment linked to Drive FileAsset.
- Add minimal job records for sync/send attempts and delivery log continuity.
- Implement one real provider path for closure, preferably corporate IMAP/SMTP if credentials are available, or explicitly defer provider runtime and mark Mail as Test Mode only.

`P1 Useful next`

- Gmail OAuth adapter after scopes and consent are approved.
- Shared mailbox assignment rules.
- Provider read-state sync decision and implementation.
- Admin mailbox health screen.

`P2 Later`

- Advanced labels/folders/rules.
- Full mailbox mirror.
- Calendar invite processing.
- Email campaigns and mass mailing.

Owner decisions needed:

- Which provider is first: Gmail OAuth or corporate IMAP/SMTP?
- Historical import limit.
- Sync frequency.
- Whether read/unread writes back to provider.
- Email retention period.
- Credential policy: app passwords vs mailbox passwords vs provider-specific setup.

### 4.6 Notifications

Current state: documentation is aligned; in-app notifications exist in some flows. Cleanup register still says old service uses in-memory Map and lacks Event/Rule/Job/Delivery/Log model, adapters, preferences and live count.

`P0 Closure`

- Replace in-memory notification store with Prisma-backed notifications for the topbar and Notification Center.
- Use current authenticated user; remove `userId` query trust.
- Add minimal NotificationEvent, NotificationRule, NotificationJob, NotificationDelivery or simplified equivalent models.
- Add idempotency/dedupe key for repeated business events.
- Add mark read/archive, entity links and category filters.
- Add delivery log for in-app channel.
- Add code/config rules for existing high-value events only: task overdue, finance overdue, mail health/send failure, document access change.

`P1 Useful next`

- Scheduler integration and retry/backoff.
- Telegram adapter for internal team notifications.
- Channel health alerts.
- Live unread count through WebSocket/SSE.

`P2 Later`

- WhatsApp delivery through WAHA.
- Email adapter for transactional system email.
- Messenger outbound external copy.
- Escalation policies and failed delivery admin tools.

Owner decisions needed:

- Which events are Phase 5 required, not "all possible events"?
- Should Telegram be part of closure or Phase 7?
- Retention period for notification delivery logs.

### 4.7 Calendar

Current state: cleanup register says current Calendar UI is mock-only, has noisy old event types and no API/source projection model.

`P0 Closure`

- Add Meeting entity for client-facing meetings.
- Add Personal Calendar Event entity for minimal user-owned personal items.
- Add Calendar Projection API returning only: Meetings, Delivery Deadlines, Personal.
- Replace mock UI with API-backed data.
- Add filters/tabs: All, Meetings, Delivery Deadlines, Personal.
- Add source badges and click-through to source entity.
- Remove Finance/Billing/Task/Support dates from the main Calendar surface.

`P1 Useful next`

- User default layer.
- Reminder handoff to Notifications.
- Basic meeting create/edit flow from CRM/Calendar.

`P2 Later`

- Google Calendar sync.
- Free/busy check.
- Team vacation/availability views unless scheduling requires them.

Owner decisions needed:

- Are meetings only client-facing in MVP? Current canon says yes.
- Should personal events be private to the owner only?
- Which delivery deadline sources are required: Product and Extension only, or more?

### 4.8 Technical Infrastructure

Current state: canon docs exist, but runtime models are missing. Roadmap exit criterion says technical assets are tracked.

`P0 Closure`

- Add Product Technical Profile model linked to Product/Project.
- Add Technical Asset model with minimum types: domain, hosting, repository, database, storage, monitoring.
- Add Environment model: Production, Staging, Development.
- Add Product Technical / Operations tab in Project/Product UI.
- Link sensitive fields to Credentials; do not store secrets.
- Link non-secret docs to Drive.
- Add basic readiness status for Transfer: missing environment, missing credentials link, missing backup/monitoring note.

`P1 Useful next`

- Deployment Record model for deploy/failure/rollback.
- Monitoring Check model with status summary.
- Backup Policy model and restore-test due date.
- Support incident link to asset/environment/deploy.

`P2 Later`

- Automated monitoring integrations.
- Deployment automation.
- Full incident/RCA workflow.
- Technical export/backup dashboards.

Owner decisions needed:

- Which asset types are required in the first real release?
- What fields are required before Product Transfer?
- Who owns Technical Profile completion: PM, Tech Lead, Ops?

## 5. Recommended implementation order

This order closes user value before advanced integrations:

1. Calendar P0 - replace mock calendar with agreed three-layer API/UI.
2. Technical Infrastructure P0 - track Product technical profile/assets/environments.
3. Notifications P0 - persisted notification center + dedupe/actionable rules.
4. Drive P0 - file detail/version/entity access polish for modules.
5. Credentials P0 - secure notes/types/rotation metadata/context links.
6. Messenger P0 - internal polish + attachments/search + honest external shell.
7. Mail P0 - provider boundary, attachments and one agreed real/test provider path.
8. Documents P0 polish - final daily-use cleanup.

Reasoning:

- Calendar and Technical Infrastructure are the clearest remaining roadmap exit gaps.
- Notifications is needed by Mail, Calendar, Technical and operational warnings.
- Drive/Credentials are shared foundations; improve them before deeper Mail/Messenger provider work.
- WAHA, Telegram, Gmail OAuth and Google Calendar are integration-heavy and can move to Phase 7 if explicitly approved.

## 6. Decisions to approve before coding

| Topic                     | Recommended default                                                                       | Needs owner confirmation |
| ------------------------- | ----------------------------------------------------------------------------------------- | ------------------------ |
| WAHA runtime              | Defer to Phase 7; Phase 5 keeps documented adapter path + external placeholders.          | Yes                      |
| Mail provider             | Choose one first provider, or mark Mail as Test Mode until credentials/scopes are ready.  | Yes                      |
| Gmail OAuth scopes        | Do not pick silently; approve after security review.                                      | Yes                      |
| IMAP/SMTP credential use  | Store only secure references through Credentials.                                         | Yes                      |
| Calendar scope            | Meetings + Delivery Deadlines + Personal only.                                            | Yes                      |
| Technical required fields | Minimum Transfer readiness fields must be approved.                                       | Yes                      |
| Notification events       | Start with a short allowlist, not every possible event.                                   | Yes                      |
| Step-up auth              | If not available now, ship reveal/copy audit + risk notification, then add step-up later. | Yes                      |

## 7. Proposed acceptance definition

Phase 5 can be marked `Done` when:

- all `P0 Closure` items above are either implemented or explicitly marked `Deferred` with owner approval;
- `docs/IMPLEMENTATION_PROGRESS.md` lists Phase 5 as done and names deferrals;
- cleanup registers for Phase 5 modules reflect `OK`, `PARTIAL accepted for closure`, or `Deferred`;
- typecheck/lint pass for touched code areas;
- no module uses mock data while presenting it as real operational state;
- Phase 6 can safely build dashboards/reports on top of real persisted data and honest gaps.

## 8. Suggested approval outcome

If approved, implementation should happen in small reviewable slices:

1. `calendar-p0-api-ui`
2. `technical-p0-assets`
3. `notifications-p0-persistence`
4. `drive-p0-file-detail-version`
5. `credentials-p0-secure-notes-types`
6. `messenger-p0-internal-polish`
7. `mail-p0-provider-boundary-attachments`
8. `documents-p0-polish`

Each slice should update its cleanup register and progress tracker after implementation.

## 9. Implementation status

| Slice                          | Status              | Notes                                                                                                                            |
| ------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `calendar-p0-api-ui`           | `DONE` (2026-04-30) | `CalendarMeeting`, `PersonalCalendarEvent`, `GET /api/calendar/events`, Product/Extension deadline projections and API-backed UI |
| `technical-p0-assets`          | `DONE` (2026-04-30) | Product technical profile/assets/environments, Product Technical tab and readiness blockers                                      |
| `notifications-p0-persistence` | `DONE` (2026-04-30) | Event/rule/job/delivery tables, idempotent in-app delivery, Notification Center filters and read/archive actions                 |
| `drive-p0-files`               | `DONE` (2026-04-30) | DB-backed Drive center, file detail drawer, versions, active links, audit, visibility/confidentiality badges and archive action  |
| `credentials-p0-hardening`     | `DONE` (2026-04-30) | Credential type, criticality, environment/context fields, encrypted secure notes, public notes and rotation metadata             |
| `messenger-p0-polish`          | `DONE` (2026-04-30) | Internal Drive FileAsset attachments, internal search, Internal/External split and honest external adapter placeholder           |
| `mail-p0-provider-boundary`    | `DONE` (2026-04-30) | Provider connection boundary, mailbox credential references, Drive-backed EmailAttachment records and attachment-aware draft UI  |
| `documents-p0-polish`          | `NEXT`              | Daily-use UI polish and confirm search/access after latest Drive changes                                                         |
