# Phase 1 Chat 8 Acceptance — Final Verification

> Acceptance report, not an implementation handoff. Every `[x]` claimed below is backed by a
> first-hand run in this chat: a live HTTP walk, a passing test, or a structural check against the
> repository. Chat 7's handoff was treated as a claim to verify, not as evidence.

## Milestone

Chat 8 of `16-Phase-1-Execution-Strategy.md`. Branch `sipan`, product HEAD at start `f10862b4`.
Chat 7 closed PASS WITH DEBTS. This chat did **not** commit.

Verdict: **Phase 1 accepted for the External Agent, provider/model and Internal Agent foundation.**
An External Agent really can connect over REST and MCP and work safely inside one authorized Work
Space. Phase 1 is **not** complete against its own exit criterion 9 — sections AD, AE, AF, AG, AH
and AI (prompt versions, context/memory, approval persistence, customer-facing policy, usage and
evaluation) were never implemented and are recorded as a business decision, not as a defect.

## Method

The walk was not a re-reading of Chat 7's summary. Four independent passes:

1. **Whole-repository verification** — `pnpm test`, `pnpm lint`, `pnpm typecheck` run in this chat.
2. **Live acceptance** — AO and AP executed against a booted API on dev Neon, with every result
   recorded per item.
3. **Structural review** — AQ checked by reading the code paths it makes claims about, not by
   trusting the section notes.
4. **Browser walk** — Employee login, Tasks UI and the AI administration UI.

Honest limit: the 558 items already marked `[x]` before this chat were **not** re-derived one by
one. They are covered transitively — the full suite passes, AO/AP exercise the same code paths end
to end at runtime, and AQ re-checks the architectural claims those sections rest on. Where a section
note contradicted what the code does, the note was corrected (AM 627/631/636) or the item was pushed
back down (nothing needed pushing down this chat).

## Verification evidence

| Check            | Result                                                                |
| ---------------- | --------------------------------------------------------------------- |
| `pnpm test`      | 844 files passed, 3 skipped; 4291 tests passed, 6 skipped; exit 0     |
| `pnpm lint`      | exit 0                                                                |
| `pnpm typecheck` | exit 0                                                                |
| API boot         | `PROCESS_ROLE=api` on `:4100`, `/api/health` 200, dev Neon            |
| Worker boot      | `/ready` → `{"ready":true,"workers":[...4 queues...]}` on local Redis |
| Scheduler boot   | running, `ai-model-catalog-sync` registered, cron leases advancing    |
| Browser walk     | Employee sign-in → `/dashboard`, `/tasks`, `/ai-agents` all render    |

Worker readiness: `drive.zip-export-jobs`, `mail`, `reports.export-jobs`,
`whatsapp.product-groups`.

## Checklist walk A–AQ

| Sections | `[x]` | `[~]` | open | Note                                                     |
| -------- | ----- | ----- | ---- | -------------------------------------------------------- |
| A–AC     | 400   | 5     | 0    | foundation; unchanged this chat except AM cross-checks   |
| AD–AI    | 9     | 7     | 72   | deferred foundations — see the business decision below   |
| AJ–AN    | 95    | 4     | 0    | admin UI, security suite, regression, docs               |
| AO       | 29    | 0     | 0    | live External Agent acceptance, this chat                |
| AP       | 15    | 5     | 0    | live provider/model/Internal Agent acceptance, this chat |
| AQ       | 15    | 1     | 0    | architecture review, this chat                           |

Changed in Chat 8: AO 657–685 `[ ]` → `[x]`; AP 686–705 `[ ]` → `[x]`/`[~]`; AQ 706–721 `[ ]` →
`[x]`/`[~]`; AM 627, 631, 636 `[~]` → `[x]`; AD/AE/AF/AG/AH/AI given per-item verdicts instead of a
blank section. No item was raised from `[~]` to `[x]` without new evidence produced in this chat.

## AO. External Agent live acceptance — 29/29 PASS

One test External Agent (`Chat8 Acceptance Agent`), one `WORKSPACE` scope on the non-production Work
Space `Sales Cold`, two credentials. Driver: `apps/api/.chat8/ao/`. Transcript: `.chat8/ao-run.log`.
Created rows: `.chat8/ao-artifacts.json`.

| Item | Result | Evidence                                                                                                                                                                                                                                                                                                            |
| ---- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 657  | PASS   | agentId=1f148011-a913-461b-a106-0b24594e84a6; WORKSPACE scope=76c86e36-ebea-46f1-adbf-5bda13f88b22 (Sales Cold); credential prefix=nbos_agt_e53e4d036…; token returned once at issuance                                                                                                                             |
| 658  | PASS   | HTTP 200; ids=["76c86e36-ebea-46f1-adbf-5bda13f88b22"]                                                                                                                                                                                                                                                              |
| 659  | PASS   | isError=false; ids=["76c86e36-ebea-46f1-adbf-5bda13f88b22"]                                                                                                                                                                                                                                                         |
| 660  | PASS   | A=200 count=3; B=404 AGENT_RESOURCE_NOT_AVAILABLE                                                                                                                                                                                                                                                                   |
| 661  | PASS   | A.isError=false count=3; B.isError=true AGENT_RESOURCE_NOT_AVAILABLE                                                                                                                                                                                                                                                |
| 662  | PASS   | taskInB=bed01aac-c96a-410a-a9ed-c08f2d367aa1 → HTTP 404 AGENT_RESOURCE_NOT_AVAILABLE                                                                                                                                                                                                                                |
| 663  | PASS   | isError=true AGENT_RESOURCE_NOT_AVAILABLE                                                                                                                                                                                                                                                                           |
| 664  | PASS   | list HTTP 200 count=1; get HTTP 200 id=db1760fc… name=chat8-acceptance.md, short-lived view URL present                                                                                                                                                                                                             |
| 665  | PASS   | guessed id → 404; real unlinked asset 4ffbaaf3… → 404; own artifact via out-of-scope task → 404; MCP isError=true                                                                                                                                                                                                   |
| 666  | PASS   | REST HTTP 201 id=2a9ffa1b… code=T-2026-0313; MCP isError=false id=0e60cae4…                                                                                                                                                                                                                                         |
| 667  | PASS   | HTTP 403 AGENT_CAPABILITY_DENIED (before the grant)                                                                                                                                                                                                                                                                 |
| 668  | PASS   | HTTP 200, title changed, status stayed OPEN                                                                                                                                                                                                                                                                         |
| 669  | PASS   | before grant 400 AGENT_VALIDATION_FAILED; after grant 400 AGENT_VALIDATION_FAILED; MCP isError=true; status stayed OPEN                                                                                                                                                                                             |
| 670  | PASS   | REST DELETE → 404; 14 tools published, none matching delete/force/set_status; `nbos_delete_task` → isError=true                                                                                                                                                                                                     |
| 671  | PASS   | HTTP 201 status=IN_PROGRESS                                                                                                                                                                                                                                                                                         |
| 672  | PASS   | REST 201 + MCP ok; 2 discussion entries, both `EXTERNAL_AGENT` / "Chat8 Acceptance Agent"                                                                                                                                                                                                                           |
| 673  | PASS   | HTTP 201 fileAssetId=db1760fc… linkId=e0d647cb…                                                                                                                                                                                                                                                                     |
| 674  | PASS   | HTTP 201 status=REVIEW                                                                                                                                                                                                                                                                                              |
| 675  | PASS   | agent left the task in REVIEW with no completion capability (0 force-complete rows); employee approve-review only set `reviewApprovedAt`, a second explicit employee `complete` moved it to COMPLETED                                                                                                               |
| 676  | PASS   | same Idempotency-Key twice → identical id; workspace task count 5 → 6                                                                                                                                                                                                                                               |
| 677  | PASS   | same key twice → identical comment id; discussion count 2 → 3                                                                                                                                                                                                                                                       |
| 678  | PASS   | start replayed → IN_PROGRESS / IN_PROGRESS, no duplicate effect                                                                                                                                                                                                                                                     |
| 679  | PASS   | before revoke 200; after revoke 401 AGENT_CREDENTIAL_REVOKED                                                                                                                                                                                                                                                        |
| 680  | PASS   | MCP 401 AGENT_CREDENTIAL_REVOKED                                                                                                                                                                                                                                                                                    |
| 681  | PASS   | second credential worked before disable; after disable REST 403 and MCP 403 AGENT_DISABLED                                                                                                                                                                                                                          |
| 682  | PASS   | 23 agent audit rows, 13 `AGENT_CAPABILITY_INVOKED` fully attributed; protocols `["rest","mcp"]`; 7 distinct capabilities; `userId` null on every machine row                                                                                                                                                        |
| 683  | PASS   | 23 audit rows, 2 credential rows, 3 discussion rows and 1 518 939 bytes of API log searched for 4 token fragments — 0 hits. Negative control: planting a token into the same text makes the search find it, so the clean result is not vacuous. Credential rows persist only `keyId` / `tokenPrefix` / `secretHash` |
| 684  | PASS   | 660–663, 665 plus `agent-scope-isolation.security.test.ts`, `agent-boundary.security.http.int.test.ts`                                                                                                                                                                                                              |
| 685  | PASS   | authorized get: REST 200 / MCP ok; out-of-scope task: REST 404 / MCP isError; out-of-scope workspace: REST 404 / MCP isError                                                                                                                                                                                        |

Admin actions during the walk (create agent, grant capability, issue/revoke credential, disable)
followed `25-AI-Platform-Operations-Runbooks.md` and went through the `ai-admin` HTTP surface, never
through direct SQL.

## AP. Provider / model / Internal Agent live acceptance

Real OpenAI key supplied by the developer. Driver: `apps/api/.chat8/ap/`. Records:
`.chat8/ap-artifacts.json`.

| Item    | Result  | Evidence                                                                                                                                                                                                                                                                                                                                                        |
| ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 686–688 | PASS    | draft validation accepted the real key and rejected a bogus one (`PROVIDER_AUTH_FAILED`) before save; live validate ok; sync created 124 models                                                                                                                                                                                                                 |
| 689–691 | PARTIAL | **no Anthropic test key was supplied** — adapter, secret storage and sync rules covered by unit tests only                                                                                                                                                                                                                                                      |
| 692     | PASS    | 124/124 `DISCOVERED`, 0 `ACTIVE` immediately after a first sync                                                                                                                                                                                                                                                                                                 |
| 693     | PASS    | gpt-4o + gpt-4o-mini → ACTIVE; gpt-4o-mini → DISABLED → ACTIVE                                                                                                                                                                                                                                                                                                  |
| 694     | PASS    | key not returned by `/providers`, `/providers/:id`, `/overview`, `/activity` or `/models`; not present in any of the 16 configuration audit rows (searched full key and last 16 chars)                                                                                                                                                                          |
| 695–696 | PASS    | FIXED policy with one ACTIVE candidate; PRIMARY_FALLBACK with ordered PRIMARY/FALLBACK candidates                                                                                                                                                                                                                                                               |
| 697     | PARTIAL | rule layer accepts cross-provider candidates and is unit-tested, but only one live provider key existed                                                                                                                                                                                                                                                         |
| 698–703 | PASS    | Internal Agent created DRAFT with `modelPolicyId=null`; capabilities/scopes granted from the same shared registry the External Agent uses; policy assigned and revalidated as production-eligible; activation without a Model Policy refused with HTTP 400; ACTIVE → PAUSED → DISABLED → ACTIVE, both blocked states refused by `assertInternalAgentCanExecute` |
| 704     | PASS    | 16 audit rows over 10 distinct actions across provider, model and Internal Agent changes; admin activity feed returns them without any key material                                                                                                                                                                                                             |
| 705     | PARTIAL | section AH has no execution/usage record, so there is nothing to attribute yet                                                                                                                                                                                                                                                                                  |

### The one code fix this chat needed

AP 688 could not pass without it. A first OpenAI sync discovers 124 models, and
`AiModelSyncService` issued one round trip per model inside the interactive transaction that holds
the scheduler lease, so the transaction exceeded its window before it could commit. The fix is
batching, not new behaviour:

- `insertDiscovered` uses one `createMany` instead of N `create` calls;
- `refreshSeen` splits the plan with a new pure predicate `isUnchangedOnRefresh` and updates all
  touch-only rows with a single `updateMany`, keeping per-row updates for rows that actually changed;
- `markDisappeared` groups by target status and issues one `updateMany` per status.

Status transitions, audit output and the sync plan are unchanged. `ai-model-sync.service.test.ts`
was extended to cover the batching split and the unchanged-row predicate.

## AQ. Architecture review

Checked against the code, not against the section notes.

- **706 / 707 `[x]`** — `apps/api/src/modules/ai-platform/rest/` and `mcp/` contain no
  `PrismaService` import and no `prisma.` call.
- **708 `[x]`** — both adapters call `AgentProtocolInvoker`, which applies the rate-limit budget and
  then `AgentCapabilityGateway`. The gateway's only Prisma writes are to
  `ExternalAgentIdempotencyRecord`; domain mutations go through `TasksService`,
  `TaskDiscussionService` and the Drive handler.
- **709 `[x]`** — one actor vocabulary in `packages/shared/src/actor/` (`USER`, `EXTERNAL_AGENT`,
  `INTERNAL_AI`, `SYSTEM`, `AUTOMATION`), one capability registry, one policy evaluator, shared by
  both agent kinds.
- **710 / 711 `[x]`** — an agent references a Model Policy; permissions live in capability grants and
  resource scopes. Changing the policy touches neither. Proven live in AP 700 and by
  `internal-agent-grant.service.test.ts`.
- **712 `[x]`** — `promptPolicyId` is an opaque column that no policy, capability or scope path reads.
- **713 `[~]`** — safety is enforced outside prompt text (risk class, data classification,
  `REQUIRE_APPROVAL`, grants), but section AG's customer-facing classification has no runtime, so
  the customer-specific modes are undefined.
- **714 `[x]`** — AO 683 (no raw agent token anywhere) and AP 694 (no provider key in any read path
  or audit row). Credentials are never projected into an AI context.
- **715 `[x]`** — human RBAC untouched: `ai-admin` reuses `COMPANY:EDIT`, AI principals never enter
  `ResourceAccessGrant`, and the full suite plus the browser walk show Employee login, Tasks and
  Drive behaving as before.
- **716 `[x]`** — `99-AI-Cleanup-Register.md` extended with C15–C22 this chat.
- **717 `[x]`** — searched for embedding / vector store / pgvector / RAG / auto-send / auto-reply:
  none exist. `TIERED` and `ADAPTIVE` remain enum-only and are rejected at the service boundary.
- **718 `[x]`** — deny-by-default confirmed live: no grant → `AGENT_CAPABILITY_DENIED`; no scope →
  `AGENT_RESOURCE_NOT_AVAILABLE` (404, never a leak of existence); revoked credential → 401;
  disabled agent → 403.
- **719–721 `[x]`** — a future employee AI chat, Messenger AI or Documents/CRM/Analytics AI adds a
  channel and capabilities to the existing actor/policy/capability/audit path. `messenger` is
  already an `ActorChannelSource`, `onBehalfOf` is already modelled, and Internal Agent surfaces map
  onto the same context. No second identity or authorization system is required.

## Exit criterion — honest status

| #   | Criterion                                                        | Status                                                                |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | REST **and** MCP against authorized Work Spaces/Tasks            | **Met** — AO 658–685 over both protocols                              |
| 2   | Task create/update separately grantable and constrained          | **Met** — AO 666–669                                                  |
| 3   | Task delete and force-completion unavailable                     | **Met** — AO 670, 675                                                 |
| 4   | Isolation and provenance proven by negative tests                | **Met** — AO 662–665, 684 plus the committed security suites          |
| 5   | Provider connections and catalogs managed centrally and securely | **Met for OpenAI**, unproven live for Anthropic (no key) — AP 686–694 |
| 6   | Discovered models never auto-activate                            | **Met** — AP 692, 124 `DISCOVERED` / 0 `ACTIVE`                       |
| 7   | FIXED and PRIMARY_FALLBACK configurable, incl. cross-provider    | **Partly** — both modes live; cross-provider is unit-tested only      |
| 8   | Internal Agent foundation independent of provider/model choice   | **Met** — AP 698–703, AQ 710/711                                      |
| 9   | Prompt / approval / customer-facing / usage foundations          | **Not met** — AD, AE, AF, AG, AH, AI; 72 open items                   |
| 10  | Human NBOS workflows intact                                      | **Met** — full suite, browser walk, AQ 715                            |
| 11  | Extensible without a second identity/authorization system        | **Met** — AQ 719–721                                                  |

Nine met, one partly met (7), one not met (9).

## Remaining gaps

Ordered by what would block a production rollout first.

| Gap                    | Status | What is actually missing                                                                                                                                                                                                                  |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AD/AE/AF/AG/AH/AI      | open   | 72 items. Prompt versions, context/memory contracts, approval persistence, customer-facing modes, usage/cost records, evaluation entities. Additive, but this is exit criterion 9. See C22 — decision required.                           |
| Rate-limit store       | `[~]`  | Counters are in process memory. With more than one API instance the ceiling multiplies by instance count and a restart clears the windows. Move the window store to Redis; only the guard/service boundary changes.                       |
| J 186                  | `[~]`  | The limiter refuses before policy runs, so `AgentPolicyService` never receives a live `rateLimitExceeded` verdict. The evaluator branch is unit-tested; no production caller reaches it.                                                  |
| AM 638 audit migration | `[~]`  | `20260821150000_audit_actor_aware` does a full-table `UPDATE` on `audit_logs` and builds two non-`CONCURRENTLY` indexes. Needs an approved production window per the migration standard. Not applied to production in this chat.          |
| K 209                  | `[~]`  | Domain commit and idempotency `complete()` are not one transaction. A crash between them leaves an `IN_PROGRESS` row that is never reclaimed.                                                                                             |
| K 205 / W 368          | `[~]`  | Output projections are hand-built, not validated against a declared response schema at the boundary.                                                                                                                                      |
| AL 626                 | `[~]`  | Revalidation of a queued sensitive action before its own commit. Phase 1 executes every capability inline, so there is nothing queued. Replay re-authorization is a different lifecycle point. Opens only when deferred execution exists. |
| D 91                   | `[~]`  | Approval lifecycle audit events — blocked on the approval entity (C17).                                                                                                                                                                   |
| AJ 584/585             | `[~]`  | Model Policy create/edit UI: policies are creatable through the API and readable in the UI, but candidate ordering is not editable on screen.                                                                                             |
| Anthropic live path    | `[~]`  | No test key was supplied. One key closes AP 689–691 and AP 697.                                                                                                                                                                           |
| Worker TLS Redis       | open   | Verified on plain local Redis only. A `rediss://` production endpoint has not been exercised from the worker in any chat.                                                                                                                 |
| Browser E2E            | open   | The browser walk was manual and observational. There is no automated end-to-end browser suite for the AI admin module.                                                                                                                    |

No open `[!] BUSINESS DECISION` inside the checklist. One decision is required at phase level: C22.

## Cleanup register delta

Added this chat: **C15** prompt policy/version domain MISSING, **C16** context/memory/knowledge
contracts MISSING, **C17** approval request persistence MISSING, **C18** customer-facing AI policy
contracts MISSING, **C19** usage/cost/evaluation entities MISSING, **C20** Anthropic never exercised
live PARTIAL, **C21** AI & Agents navigation promotion OK, **C22** Phase 1 exit criterion 9 BUSINESS
DECISION. Added **F8** Chat 8 evidence. No previously closed item was reopened.

## Navigation change

AI & Agents was a sub-page of Platform Admin; it is now a first-class sidebar module.

- `packages/shared/src/constants/sidebar-navigation.ts` — new `ai-agents` module key.
- `apps/web/src/lib/navigation/nav-config.ts` — top-level module at `/ai-agents` with the nine
  section children; removed from the Platform Admin submenu.
- `apps/web/src/components/layout/sidebar-module-visual.ts` — `Bot` icon, teal hue.
- `apps/web/src/app/(app)/settings/ai-agents/` → `apps/web/src/app/(app)/ai-agents/`;
  `AI_ADMIN_BASE_PATH` updated.
- `apps/web/next.config.ts` — `/settings/ai-agents/:path*` redirects to the new path, so existing
  links and the runbooks stay valid.
- Settings landing page no longer lists AI & Agents as a card.

RBAC is unchanged: the module and every `ai-admin` controller still require `COMPANY:EDIT`.

## Test data created on dev Neon (`ep-late-frost-ag5aixzw`)

All rows are in the non-production Work Space `Sales Cold` (`76c86e36-ebea-46f1-adbf-5bda13f88b22`)
except the AI configuration rows, which are tenant-level.

| What                | Id / value                                                                      |
| ------------------- | ------------------------------------------------------------------------------- |
| External Agent      | `1f148011-a913-461b-a106-0b24594e84a6` (`Chat8 Acceptance Agent`, now DISABLED) |
| Agent credentials   | `715a0a82-…` (revoked), `964469d9-…`                                            |
| Resource scope      | `0fceaafb-9d3a-4129-8d67-8dbef53f80e0`                                          |
| Tasks               | `2a9ffa1b-…`, `0e60cae4-…`, `25857a66-…` (titles start with `Chat8 acceptance`) |
| Drive asset         | `db1760fc-c50c-4180-a4d1-aa0638a8201f` (`chat8-acceptance.md`)                  |
| Provider connection | `4f6846c9-831d-495a-a413-acf6075a3344` (OpenAI, 124 models)                     |
| Model policies      | `5dd1c6d7-…` (FIXED), `9e9798e5-…` (PRIMARY_FALLBACK)                           |
| Internal Agent      | `058fb28b-48ef-4998-9331-f105af072c86`                                          |

Removal is scripted and scoped: `apps/api/.chat8/ao/cleanup.ts` and `apps/api/.chat8/ap/cleanup.ts`
delete exactly these rows and nothing else. Audit rows are deliberately retained — deleting an audit
trail is not a cleanup action. The rows were left in place so the acceptance evidence stays
inspectable in the UI; run the two scripts to remove them.

`apps/api/.chat8/` and `.chat8/` are acceptance tooling and transcripts, not shipped code. They are
untracked and should either be dropped or kept out of the commit.
