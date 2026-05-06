# Phase 7 Integrations And Migration Work Plan

> Draft for owner review.
>
> Goal: define the full Phase 7 integration and migration scope before choosing the next implementation slice.

## 1. Decision framing

Phase 7 should not mean "connect every external service immediately".

For this project, Phase 7 should be treated as several separate tracks:

- migration from Bitrix into NBOS;
- external communication channels for Messenger / Notifications;
- finance and payment verification integrations;
- Google ecosystem links and later sync;
- external lead/message sources;
- developer / technical integrations;
- integration governance, health, audit and secrets boundaries.

The proposed Phase 7 target is:

```text
Phase 7 = safe migration + adapter-ready integration foundation
Later = real provider depth where credentials, runtime and product need are clear
```

## 2. Phase 7 closure gate

| Area                        | Closure target                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| Integration foundation      | Registry, provider status, health, audit and adapter contracts exist.                                 |
| Bitrix migration            | Mapping, runbooks, dry-run validation and import scope are explicit before any production import.     |
| Messenger external channels | WhatsApp/Telegram contracts are clear; no business code depends directly on WAHA/Telegram APIs.       |
| WhatsApp / WAHA             | Adapter path and setup flow are ready; real runtime requires explicit WAHA/account approval.          |
| Telegram                    | Internal notification channel can be added safely; bot token and employee binding are explicit gates. |
| Finance integrations        | Manual finance flow remains safe; bank statement import/matching can be added before bank API.        |
| Google ecosystem            | Links are MVP; sync is later unless credentials/scopes are approved.                                  |
| External lead sources       | Meta/Instagram/Facebook stay later unless business app credentials and webhook scope are ready.       |
| Technical integrations      | Repository/external system links are first-class before API/webhook depth.                            |
| Runbooks                    | Each integration has fallback, retry, failure visibility and credential owner documented.             |

## 3. Priority levels

- `P0 Foundation` - required before calling Phase 7 usable and safe.
- `P1 Practical next` - useful after foundation, but can wait for credentials/runtime.
- `P2 Later` - explicit deferral until product value and provider access are clear.

## 4. Work tracks

### 4.1 Integration foundation

Current state: modules have their own partial boundaries, but there is no central integration registry or shared provider health model.

`P0 Foundation`

- Add `IntegrationProvider` registry: key, label, owner module, category, status, enabled flag, setup state.
- Add integration status vocabulary: `not_configured`, `configured`, `connected`, `degraded`, `disconnected`, `disabled`.
- Add integration audit events for setup changes and external delivery attempts.
- Add adapter contract pattern for external providers: health check, send/sync, webhook receive, reconnect where relevant.
- Ensure provider secrets are referenced through env/Credentials and never stored as plain settings.

`P1 Practical next`

- Admin integrations page showing provider status and required setup.
- Provider health scheduler / last check result.
- Integration incident/alert handoff to Notifications.

`P2 Later`

- Full marketplace-style integration management.
- Per-tenant provider overrides.
- Automated provider provisioning.

Owner decisions needed:

- Which integrations must be visible in the first admin registry: Bitrix, WAHA, Telegram, Bank, Google, Meta, GitHub.
- Whether disabled providers should be hidden from normal users or shown as "coming later".

### 4.2 Bitrix migration

Current state: roadmap defines phased migration, scope and entity order. No runtime import foundation exists yet.

`P0 Foundation`

- Create Bitrix -> NBOS mapping register for Contacts, Companies, Projects, Deals, Orders, Subscriptions, Invoices, Tasks, Credentials and Domains.
- Define import scope per entity: migrate, skip, archive-only, later.
- Add dry-run import run model or at least validation output shape: counts, errors, warnings, skipped rows.
- Define duplicate detection rules for contacts/companies.
- Define required-field validation before import.
- Define dependency order and unresolved-link handling.
- Add migration runbook/checklist for staging import, production import and spot-check.

`P1 Practical next`

- CSV import parser for Contacts + Companies first.
- Dry-run UI/API that reports validation without writing data.
- Import run logs with row-level errors.
- Staging import rehearsal.

`P2 Later`

- Direct Bitrix API importer.
- Credentials migration with encrypted handoff.
- Incremental sync during parallel-work period.
- Full archive export storage.

Owner decisions needed:

- Confirm first import source: CSV exports or Bitrix API.
- Confirm active data cutoffs: closed projects, invoices, tasks, old deals.
- Confirm who validates migrated records after dry-run.

### 4.3 Messenger external channel foundation

Current state: Internal Messenger exists; External zone is intentionally not deeply connected yet.

`P0 Foundation`

- Define `ExternalChannelAdapter` contract for send, receive webhook, sync conversation, health check and attachment download.
- Define external channel types: WhatsApp group, WhatsApp 1:1, Telegram internal, Meta DM, email handoff.
- Add external conversation mapping concept: source provider id -> NBOS context (Project, Deal, Ticket, Invoice).
- Ensure all external outbound messages go through queue/delivery log, not direct UI calls.
- Show clear UI safety boundary: external/client-visible channel.

`P1 Practical next`

- External conversation placeholder records.
- Manual link of Project to WhatsApp group id / invite reference.
- Delivery log view shared with Notifications/Messenger.

`P2 Later`

- Full inbound sync.
- Participants sync.
- Reply from NBOS into external channels.
- External attachments and message edits/deletes.

Owner decisions needed:

- Which context should be first for external conversations: Project WhatsApp Groups, Support, Finance reminders, CRM 1:1.

### 4.4 WhatsApp / WAHA

Current state: WAHA is the canonical MVP candidate, but real runtime needs WAHA instance and QR-connected account.

**Production target (agreed):** `WhatsAppWebAdapter` is implemented as a **standalone WhatsApp Gateway** (NestJS) on the same Hetzner VPS as WAHA; NBOS calls Gateway over HTTPS; Gateway calls WAHA over internal Docker (e.g. `http://waha:3000`). Gateway uses **Neon PostgreSQL** for its own data. Canon: `docs/NBOS/06-Integrations/06-WhatsApp-Gateway-NBOS-Boundary.md` and `docs/archive/waha-server-deployment-brief.md`.

`P0 Foundation`

- Keep WAHA behind **Gateway**; NBOS business modules depend on **Gateway API**, not WAHA REST.
- Gateway: WAHA session states: connected, qr_required, disconnected, degraded.
- Define **Gateway↔NBOS** contract: outbound payload for group and 1:1, inbound normalized message shape, auth (Bearer).
- Gateway: webhook receive from WAHA, verify secret, persist raw/normalized events in Gateway DB.
- Define Drive handoff: Gateway obtains media from WAHA; NBOS Drive remains source of truth for `File Asset` (server-to-server contract).

`P1 Practical next`

- Gateway: WAHA health/session integration; QR admin endpoints exposed only through Gateway.
- NBOS: admin/status UI calling Gateway (not WAHA).
- Send message to a test WhatsApp group via Gateway.
- Receive WAHA webhook on Gateway; NBOS receives normalized copy per contract.
- Attachment path: Gateway → NBOS Drive in test flow.

`P2 Later`

- Multi-session support.
- Participant sync and group management.
- Production delivery rules for finance/support/project flows.
- Provider fallback evaluation: Whapi, Wazzup, Wappi, Evolution API.

Owner decisions needed:

- Provide/approve WAHA runtime.
- Approve test WhatsApp account and test group.
- Decide who owns QR re-connect operations.

### 4.5 Telegram

Current state: Telegram is documented as internal notification channel. No bot token or account binding flow is implemented.

`P0 Foundation`

- Add employee Telegram binding fields or separate binding model: chat id, username, linked at, enabled.
- Define Telegram notification adapter contract.
- Define bot linking flow with start code / deep link.
- Keep Telegram as internal channel, not client communication.

`P1 Practical next`

- Bot token configuration through env/Credentials.
- Employee self-link flow.
- Send test notification to linked employee.
- Delivery log and retry.
- Use existing Notifications for a small allowlist: task assigned, task overdue, SLA warning.

`P2 Later`

- Department channels.
- Project group sync.
- Two-way Telegram group mirroring.
- Rich commands from Telegram.

Owner decisions needed:

- Provide Telegram bot token.
- Confirm bot username.
- Confirm first notification event allowlist.

### 4.6 Finance integrations: bank and payments

Current state: manual finance flows are the source of truth. Bank API is future; statement import is the safer bridge.

`P0 Foundation`

- Keep manual payment confirmation reliable.
- Define bank transaction normalized shape: date, amount, currency, sender, reference, bank document id.
- Define matching confidence levels: exact, high, medium, low/manual.
- Define review queue behavior for ambiguous transactions.
- Audit all import/matching/payment confirmation actions.

`P1 Practical next`

- Bank statement CSV/XLSX upload.
- Parser configuration per bank/export format.
- Dry-run matching against open invoices.
- Manual review and confirm/reject.
- Payment source marker: manual, bank_import, bank_api.

`P2 Later`

- Direct bank API.
- Webhooks if bank supports them.
- Automated matching and auto-paid transition.
- Refund/overpayment workflows beyond current manual process.

Owner decisions needed:

- Which bank statement format is first.
- Which roles may upload statements.
- Whether high-confidence matches can auto-confirm or must remain manual first.

### 4.7 Government invoice system

Current state: official invoice creation remains manual.

`P0 Foundation`

- Keep manual accountant workflow.
- Ensure invoices can store external official invoice reference when created manually.
- Audit manual confirmation.

`P1 Practical next`

- UI checklist for accountant request/created/confirmed state.
- Attach generated official invoice files through Drive.

`P2 Later`

- Government API adapter if an API and credentials become available.
- Certificate/token management.
- Auto-create official invoices.

Owner decisions needed:

- Whether official invoice reference is required now.
- Which government system/API is actually available.

### 4.8 Google ecosystem

Current state: Google sync is v2/later for Documents/Drive/Calendar. MVP can support links without sync.

`P0 Foundation`

- Project / Product Google Drive folder link fields or external link records.
- Calendar remains NBOS-native; Google Calendar sync deferred.
- Documents remain NBOS-native; Google Docs/Sheets sync deferred.
- Google OAuth scopes are not chosen silently.

`P1 Practical next`

- Project Google Drive folder link UI.
- Google Calendar one-way export proposal after scopes are approved.
- Gmail/Mail provider path only if provider decision is made.

`P2 Later`

- Drive file sync.
- Calendar two-way sync / free-busy.
- Google Docs/Sheets integration.
- Domain-wide OAuth and service accounts.

Owner decisions needed:

- Which Google integration is actually needed first: Drive links, Calendar, Gmail, Docs.
- OAuth/service account security review.

### 4.9 Meta / Instagram / Facebook

Current state: Marketing/CRM can work manually. Meta integration requires external app credentials and approvals.

`P0 Foundation`

- Keep manual lead creation and attribution.
- Define external lead source payload shape.
- Define mapping from incoming sender to Contact/Lead candidate.

`P1 Practical next`

- Meta webhook receiver shell.
- Store inbound message lead candidates.
- Manual review/create Lead from candidate.

`P2 Later`

- Reply from NBOS to Instagram/Facebook.
- Media attachments through Drive.
- Automated lead creation rules.

Owner decisions needed:

- Meta Business app/page credentials.
- Which pages/accounts are in scope.
- Whether NBOS should auto-create leads or only suggest.

### 4.10 GitHub and technical integrations

Current state: Technical Infrastructure can store assets. API/webhook depth is later.

`P0 Foundation`

- Store repository links as Technical Assets or Project links.
- Mark owner, environment and related Product/Project.
- Do not require GitHub app credentials for first release.

`P1 Practical next`

- GitHub App/OAuth setup plan.
- Pull recent repository metadata.
- Show linked repositories in Technical/Product context.

`P2 Later`

- PR/status/deployment webhooks.
- Commit/task linking.
- CI/CD health dashboard.

Owner decisions needed:

- Which GitHub organization/repositories are in scope.
- Whether GitHub App is approved.

### 4.11 External services and automation governance

Current state: automation scenarios are documented, but not every scenario should be automated immediately.

`P0 Foundation`

- Maintain allowlist of active automations.
- Every automation has trigger, conditions, action, recipient, owner module and failure behavior.
- Critical automations use queued jobs and audit where needed.

`P1 Practical next`

- Admin view of enabled automation scenarios.
- Failed automation delivery visibility.
- Manual retry where safe.

`P2 Later`

- No-code automation builder.
- Cross-module arbitrary workflows.
- Complex approval chains.

Owner decisions needed:

- Which automation scenarios are Phase 7 P0, not "all possible automations".

## 5. Recommended implementation order

This order reduces migration and external-provider risk before real integrations:

1. `integration-registry-foundation` - shared provider registry, status, audit and adapter contracts.
2. `bitrix-migration-mapping` - mapping/runbook/dry-run validation shape without writing production data.
3. `external-channel-contracts` - Messenger/Notifications external channel contracts and safety boundary.
4. `whatsapp-waha-foundation` - WhatsApp Gateway + WAHA on VPS; Gateway↔NBOS contract; health/session/webhook on Gateway after runtime decision.
5. `telegram-notification-binding` - employee binding and internal notification adapter after bot token.
6. `bank-statement-import-foundation` - import/matching dry-run before any bank API.
7. `google-drive-folder-links` - low-risk project folder links without sync.
8. `meta-lead-candidate-shell` - only after Meta credentials and accounts are clear.
9. `github-technical-links` - repository links before API/webhook depth.

Reasoning:

- Bitrix migration and integration registry do not require external credentials.
- WAHA/Telegram/Google/Meta/GitHub should not be built deeply without real provider access.
- Bank API should not be first; statement import is safer and useful with manual fallback.
- Google sync and Meta messaging are high-friction; links/candidates should come before automation.

## 6. Decisions to approve before coding

| Topic               | Recommended default                                                                    | Needs owner confirmation |
| ------------------- | -------------------------------------------------------------------------------------- | ------------------------ |
| Phase 7 first slice | Integration registry + Bitrix mapping foundation.                                      | Yes                      |
| Bitrix source       | Start with CSV/export mapping; API importer later.                                     | Yes                      |
| WAHA runtime        | Do not build real send/sync until WAHA instance and test account are approved.         | Yes                      |
| Telegram bot        | Do not implement runtime delivery until bot token and username are provided.           | Yes                      |
| Bank integration    | Start with statement import/matching, not bank API.                                    | Yes                      |
| Google integrations | Start with links; OAuth/sync later after scope/security decision.                      | Yes                      |
| Meta integrations   | Keep manual lead creation until Meta app/page credentials and webhook scope are ready. | Yes                      |
| GitHub integrations | Start with repository links; GitHub App later.                                         | Yes                      |
| Automation scope    | Use an allowlist of real P0 automations, not every documented scenario.                | Yes                      |

## 7. Proposed acceptance definition

Phase 7 can be marked P0 usable when:

- integration registry and health/status vocabulary exist;
- Bitrix migration mapping/runbook/dry-run validation foundation exists;
- external provider adapter contracts exist for WhatsApp/Telegram without direct business coupling;
- at least one real external provider path is tested only after credentials/runtime are approved;
- finance import path has a safe manual fallback;
- all external sends/imports are audited where sensitive;
- no provider credentials are stored in plain application tables;
- docs clearly distinguish implemented integrations from planned providers.

## 8. Suggested approval outcome

If approved, implementation should happen in small reviewable slices:

1. `integration-registry-foundation`
2. `bitrix-migration-mapping`
3. `external-channel-contracts`
4. `whatsapp-waha-foundation`
5. `telegram-notification-binding`
6. `bank-statement-import-foundation`
7. `google-drive-folder-links`
8. `meta-lead-candidate-shell`
9. `github-technical-links`

Each slice should update this plan, the relevant integration docs and `docs/IMPLEMENTATION_PROGRESS.md`.

## 9. Implementation status

| Slice                              | Status        | Notes                                                          |
| ---------------------------------- | ------------- | -------------------------------------------------------------- |
| `integration-registry-foundation`  | `NOT STARTED` |                                                                |
| `bitrix-migration-mapping`         | `NOT STARTED` |                                                                |
| `external-channel-contracts`       | `NOT STARTED` |                                                                |
| `whatsapp-waha-foundation`         | `BLOCKED`     | Needs WAHA runtime / test account decision for real send/sync. |
| `telegram-notification-binding`    | `BLOCKED`     | Needs bot token / username decision for runtime delivery.      |
| `bank-statement-import-foundation` | `NOT STARTED` |                                                                |
| `google-drive-folder-links`        | `NOT STARTED` |                                                                |
| `meta-lead-candidate-shell`        | `BLOCKED`     | Needs Meta app/page credentials for runtime webhook.           |
| `github-technical-links`           | `NOT STARTED` |                                                                |
