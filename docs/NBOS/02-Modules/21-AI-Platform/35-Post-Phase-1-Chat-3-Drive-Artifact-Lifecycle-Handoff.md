# Post-Phase-1 Chat 3 Handoff — Unified Durable Drive Artifact Lifecycle

> Next chat must verify this evidence against the repository. Do not trust the summary blindly.
> This chat did **not** commit.

## Milestone

NEW CHAT 3 of root `ai-modul-steps.md` / Workstream 1 of
`32-Post-Phase-1-Technical-Debt-Plan.md`. Branch `sipan`.

Goal: close AI Platform K209 / Cleanup C24 for `tasks.attach_artifact` by
building one Drive-owned durable Artifact Operation used by Human UI, Internal
AI, External AI, and trusted SYSTEM producers.

Prerequisites:

- NEW CHAT 1 committed as `2aae557d`, independently verified **PASS WITH DEBTS**.
- NEW CHAT 2 committed as `95382be3`, independently verified **PASS WITH DEBTS**.
- Working tree was clean at start of this chat.

Do **not** start Messenger AI, employee AI chat, production RAG, or other
Phase 2 product features from this handoff.

## Runtime inventory (before)

| Path                             | Identity before upload                  | Crash after object / before DB                                                                  | Exact retry                  |
| -------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------- |
| Human `FileUploadSession`        | Yes (session + storage key)             | User can re-complete; complete was not idempotent if FileAsset wrote and session stayed PENDING | PENDING-only complete        |
| Human version staging            | No durable row                          | `completeFileVersion` could add another version                                                 | Not idempotent               |
| `createGeneratedFileAsset`       | No                                      | Orphan R2 object; next call used a new key                                                      | Duplicate object / FileAsset |
| External `tasks.attach_artifact` | No (random storage key, then PutObject) | FileAsset may exist while gateway `IN_PROGRESS` has no checkpoint → key pinned                  | Fail-closed, no second link  |
| Internal AI attach               | No runtime yet                          | —                                                                                               | —                            |

`createGeneratedFileAsset` callers: `DriveTaskArtifactService`,
`ReportsService.processExportJob`, `storeInboundAttachmentFileAsset`,
`DriveZipExportService`.

## Architecture decision

One Drive-owned table and one finalization engine. Source-specific ingress
only.

```text
Human UI (presigned) ────┐
Internal AI (machine) ───┼──> FileArtifactOperation
External AI (machine) ───┤          │
SYSTEM generate ─────────┘          ├─ R2 via DriveArtifactStorage
                                    └─ PostgreSQL FileAsset / FileVersion / FileLink
```

`SYSTEM` is not a fourth lifecycle. Reports / mail / zip are trusted backend
producers over the same operation (the plan named three AI/Human sources;
existing generate callers are not AI).

R2 + PostgreSQL are never treated as one ACID transaction.

Persisted states:

```text
PREPARED
→ UPLOAD_PENDING
→ OBJECT_UPLOADED
→ OBJECT_VERIFIED   ← durable "DB finalization pending"
→ COMPLETED         ← FileAsset/version/link + operation row in one TX
```

plus `FAILED_RETRYABLE` / `FAILED` / `CANCELLED` / `EXPIRED`.

`FINALIZING` is not a persisted state. The operation row is locked
`FOR UPDATE` inside the finalization transaction so concurrent finalize cannot
create a second FileAsset.

Human `FileUploadSession` is a compatibility projection with the **same id**.
New Human creates write the operation first, then the session. Complete prefers
the operation engine and falls back to the previous session path for leftover
PENDING rows from old writers.

Authorization is not shared:

| Source      | Prepare / deferred finalize                                              |
| ----------- | ------------------------------------------------------------------------ |
| HUMAN       | Employee + Drive entity/folder access, re-checked on complete            |
| EXTERNAL_AI | `AgentDriveHandler.requireAuthorizedTask` on prepare and finalize        |
| INTERNAL_AI | `canStartInternalAgentExecution` (PAUSED/DISABLED/DRAFT/ARCHIVED refuse) |
| SYSTEM      | Actor id must match the producing backend caller                         |

Object existence is never an authorization bypass.

Orphan delete (`deleteOwnedOrphanObject`) only runs when the operation is
already `FAILED` / `CANCELLED` / `EXPIRED`, still owns `storageKey`, and no
FileAsset or FileVersion references that key.

No generic distributed-transaction framework. No new BullMQ queue: recovery is
request-driven (`recover` / exact retry / gateway resume). ZIP export keeps its
existing queue.

## Gateway / K209

`tasks.attach_artifact` stays sequential (R2 cannot join the Tasks
checkpoint transaction). Recovery is the Drive operation, **through the live
attach path** — not a completed-Drive short-circuit:

1. `reserve(..., { allowInProgressResume: true })` so an `IN_PROGRESS` row
   without a checkpoint can resume. Changed fingerprint (bytes or `taskId`)
   still conflicts here.
2. Live `attachArtifact` re-authorizes the request task, then Drive `prepare`
   / `executeMachineUpload` resume the durable operation. Changed fingerprint
   or cross-Task target still conflicts. Exact retry returns the same
   FileAsset/link ids.
3. Default Tasks `reserve()` still does **not** reclaim stale `IN_PROGRESS`.

Independent verifier FAIL **F1** (2026-08-23): the previous completed-Drive
short-circuit skipped fingerprint and original-target checks. That path is
removed and independently confirmed closed. K209 / C24 stay `[~]`. Milestone
is not PASS.

## Files

Added:

- `packages/database/prisma/migrations/20260823140000_file_artifact_operations/migration.sql`
- `apps/api/src/modules/drive/artifact-operation/**`
- this handoff

Changed (product):

- `packages/database/prisma/schema/drive.prisma`
- `drive-task-artifact.service.ts`, `drive-upload-session.service.ts`,
  `drive.service.ts`, `drive.module.ts`
- `agent-capability.gateway.ts`, `agent-drive.handler.ts`,
  `agent-idempotency.service.ts`, `agent-capability.helpers.ts`
- `apps/api/src/test-utils/mock-prisma.ts`

Docs: Drive `04` §2.1, `06` status, `07` register; AI `10` K209; `99` C8/C24;
`32` Workstream 1 status.

Human web upload client was **not** changed. Presigned session API shape is
unchanged (`sessionId`, `uploadUrl`, `storageKey`).

## Migration / rollout

**Change:** additive enums + `file_artifact_operations`.
**Framework:** Prisma / PostgreSQL.
**Risk:** LOW schema, MEDIUM rollout.

Partial unique index
`file_artifact_operations_source_actor_idempotency_uidx`
applies only where `idempotency_key IS NOT NULL`.

`storage_key` is unique.

**Production: do not apply from this chat.**

Rolling deploy of mixed old/new **machine** writers is **not safe**:

- Old `createGeneratedFileAsset` can PutObject without an operation row.
- After cutover, “no operation row” is treated as crash-before-prepare and
  retry is allowed. Mixed with an old in-flight PutObject+FileAsset that has
  no row, that reclaim could duplicate.

**Write-pause strategy:**

1. Apply the additive migration (owner / `DIRECT_URL`).
2. Pause External Agent attach, report/mail/zip generate, and Drive version
   upload (or stop all API + worker processes).
3. Deploy every API and worker process on the new code.
4. Resume writes.

Human upload is safer to mix: old PENDING `FileUploadSession` rows still
complete through the legacy path; new creates write both rows. Still deploy
API nodes together if possible so complete always sees the operation.

In-flight old attach that crashed after FileAsset and before a Drive row
remain fail-closed (accepted residual of the mixed window only).

## Tests / evidence

Run in this chat:

| Check                                                                    | Result                                                                                                                                                                                                           |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Artifact state machine unit                                              | passed                                                                                                                                                                                                           |
| Crash/retry matrix (in-memory storage + fake DB)                         | passed: before upload, object-before-DB, DB-before-op-complete, exact retry, changed payload, cross-Task key, missing object, size mismatch, duplicate finalize, concurrent finalize, TTL+object still finalizes |
| Auth ports (human / paused Internal / revoked External)                  | passed                                                                                                                                                                                                           |
| Conservative orphan delete                                               | passed                                                                                                                                                                                                           |
| Internal AI adapter contract                                             | passed                                                                                                                                                                                                           |
| Human upload session regression                                          | passed                                                                                                                                                                                                           |
| Drive service regression                                                 | passed                                                                                                                                                                                                           |
| Gateway attach + idempotency resume / completed replay                   | passed                                                                                                                                                                                                           |
| Attach replay supplies INTERNAL classification                           | follow-up after explore: without this, completed Drive attach replay denied `DATA_CLASSIFICATION_UNKNOWN`                                                                                                        |
| Cleanup / reports / mail attach callers                                  | passed (zip service test file not present)                                                                                                                                                                       |
| `@nbos/api` `tsc --noEmit` with `NODE_OPTIONS=--max-old-space-size=8192` | passed                                                                                                                                                                                                           |
| eslint on changed API files                                              | passed                                                                                                                                                                                                           |
| Prisma generate                                                          | passed                                                                                                                                                                                                           |

Not run:

| Check                                                | Reason                                                 |
| ---------------------------------------------------- | ------------------------------------------------------ |
| `drive-artifact-operation.int.test.ts` real Postgres | opt-in `AI_PLATFORM_DB_TEST_URL`; skipped              |
| Live External Agent REST + MCP attach                | no live agent credentials / running agent in this chat |
| Human UI browser upload                              | API contract unchanged; no browser session             |
| Full monorepo test / build                           | targeted suite + API typecheck only                    |
| Production migrate                                   | forbidden                                              |

## Remaining debts

- Apply migration on designated non-prod, then production under the write-pause.
- Independent verifier must reproduce the crash matrix and, if credentials
  exist, live REST+MCP attach.
- Real-DB int test should be executed with `AI_PLATFORM_DB_TEST_URL` when a
  disposable database is available (and after the migration is applied there).
- `FileUploadSession` dual-write can be removed in a later expand-and-contract
  once old PENDING rows expire.
- No scheduled recovery worker. Stuck `OBJECT_VERIFIED` rows wait for the next
  authorized retry. That is intentional (no finalize without revalidation).
- SYSTEM generate still keys resume by `storageKey` (reports/zip keys are
  stable per job). Callers that mint a new random key on every retry still
  create a new operation — same as before, but each attempt is now recoverable
  on that key.

## Verifier scope

Confirm there is **one** Drive finalization engine, not three hidden
lifecycles; Human still presigns to R2; machine/AI do not own FileAsset rules;
crash windows in the matrix are actually recoverable; revoked actors cannot
finalize; K209/C24 may stay closed only if that holds.

---

## Verification

Independent verifier chat (NEW CHAT 3). Product code was **not** modified.
Handoff claims were treated as claims only.

**Verdict: FAIL**

K209 / C24 must stay open. Do not commit on this evidence. Docs that already
mark item 209 / C24 closed are premature.

### Scope that was actually inspected

- Branch `sipan`, HEAD `95382be3` (NEW CHAT 2). Worktree is the uncommitted
  Chat 3 implementation plus this handoff. Production migrations were not applied.
- Runtime: `DriveArtifactOperationService` / finalizer / state / auth ports /
  Human upload session / Human version / `createGeneratedFileAsset` /
  `DriveTaskArtifactService` / `DriveInternalArtifactService` /
  `AgentCapabilityGateway` / `AgentDriveHandler` / idempotency / replay auth /
  schema + `20260823140000_file_artifact_operations`.
- Drive canon `04` §2.1, `06`, `07`; AI `10` item 209; `99` C8/C24; plan Workstream 1.

### Checklist

| #   | Check                                             | Result                                                                                                                                                                                   |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | branch / HEAD / full diff                         | Confirmed. Uncommitted Chat 3 on `sipan` @ `95382be3`.                                                                                                                                   |
| 2   | One Drive-owned lifecycle                         | **Mostly.** New writes converge on `FileArtifactOperation`. Legacy Human session/version complete paths remain as expand-and-contract fallbacks, not a second AI lifecycle.              |
| 3   | Human / Internal / External share one engine      | **Yes** for finalization (`verifyAndFinalize` / `finalizeArtifactOperationInTx`).                                                                                                        |
| 4   | Ingress/auth differ only where correct            | **Mostly.** Source ports exist. See F1 and Internal onBehalfOf gap.                                                                                                                      |
| 5   | Human still presigns direct to R2                 | **Yes.** `createUploadSession` still returns `uploadUrl` + `storageKey`. Browser client unchanged.                                                                                       |
| 6   | Machine upload does not own FileAsset rules       | **Yes.** External/Internal/SYSTEM call Drive prepare + `executeMachineUpload`. Gateway does not `fileAsset.create`.                                                                      |
| 7   | Identity persisted before irreversible upload     | **Yes** on new writes (`prepare` before PutObject / before returning the presigned URL).                                                                                                 |
| 8   | Object-before-DB recoverable                      | **Yes at Drive engine** (in-memory matrix).                                                                                                                                              |
| 9   | DB-link-before-completion recoverable             | **Yes for new writers:** FileAsset + operation `COMPLETED` share one Postgres TX. The leftover `completeFromExistingAsset` path is for mixed/legacy rows.                                |
| 10  | Exact retry does not duplicate                    | **Yes at Drive engine** under fake DB. **No at the K209 gateway recovery path** — see F1 (wrong success, not a second row).                                                              |
| 11  | Changed payload / reused key fail-safe            | **FAIL.** See F1.                                                                                                                                                                        |
| 12  | Concurrent finalize                               | **Claimed** via `FOR UPDATE` + `updateMany(status=…)`. Only proven with a serialized in-memory `$transaction`, not real Postgres.                                                        |
| 13  | Recovery uses durable + live R2/DB                | **Yes** in `recover` / `verifyAndFinalize` (`headObject` + FileAsset lookup).                                                                                                            |
| 14  | Orphan delete conservative                        | **Yes** in `deleteOwnedOrphanObject`. Function is **not wired** to any production job.                                                                                                   |
| 15  | External revoke revalidated before resume         | **Partial.** Live attach / incomplete resume re-calls `requireAuthorizedTask`. Completed-Drive short-circuit authorizes the _request_ `taskId`, not the stored operation target. See F1. |
| 16  | Internal paused/disabled                          | **Yes** on `assertCanFinalize` via `canStartInternalAgentExecution`. No task / onBehalfOf grant check.                                                                                   |
| 17  | Human permission recheck                          | **Yes** on HTTP complete: session owner + `assertDriveEntityContextAccessible` / folder / `UPLOAD_VERSION`. Operation existence alone is not enough.                                     |
| 18  | Cross-Task / cross-Workspace substitution         | **Write substitution blocked** on prepare (`assertSameArtifactTarget`) and External finalize (`context.entityId === task.id`). **Replay substitution of the result is possible** — F1.   |
| 19  | REST / MCP parity                                 | **Preserved in code.** Both still enter `AgentCapabilityGateway.invoke`. Parity test passed. Live attach not run.                                                                        |
| 20  | No storage-key / secret leak on agent attach      | **Yes** for attach output (`fileAssetId` / `linkId`). Human session still returns `storageKey` + presigned URL (pre-existing, required).                                                 |
| 21  | Human upload/version regression                   | **No confirmed product regression** in code. Session/version _tests_ still force the legacy complete path (`findById` / `findByStorageKey` → `null`). New complete path is untested.     |
| 22  | `createGeneratedFileAsset` old parallel lifecycle | **Removed.** Old `PutObject` then `createFileAsset` is gone; it now `prepare` + `executeMachineUpload`. Function remains as SYSTEM ingress.                                              |
| 23  | Close K209 / C24                                  | **No.** The crash-window recovery the gateway added is not fail-safe.                                                                                                                    |
| 24  | Not a generic distributed-TX framework            | **Yes.** Drive-specific table and finalizer only. No new queue.                                                                                                                          |
| 25  | Migration / mixed-writer plan                     | **Additive and honestly documented** (write-pause for machine writers). Not applied. Prisma schema is missing the partial unique index that the SQL migration creates.                   |

### Crash / retry matrix (independently reproduced)

Re-ran `drive-artifact-operation.service.test.ts` + `drive-artifact-operation.state.test.ts`
against the in-memory storage + fake Prisma. Results below are **Drive-engine**
behavior. The K209 attach recovery path is a separate row.

| Case                                                                                    | Drive engine                                                                                 | `tasks.attach_artifact` gateway                             |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Before upload                                                                           | PASS — `prepare` persists id + key; retry reuses row                                         | PASS if dispatch runs — prepare is idempotent               |
| Upload failure                                                                          | PASS — missing object → fail-closed / `FAILED_RETRYABLE`                                     | PASS — reservation aborted when dispatch throws             |
| Object uploaded, DB not finalized                                                       | PASS — `recover` / exact retry finalizes one FileAsset                                       | PASS if dispatch runs                                       |
| DB finalized, operation not COMPLETED                                                   | PASS for new writers (same TX). Leftover FileAsset completed via `completeFromExistingAsset` | N/A                                                         |
| Exact retry of each state                                                               | PASS at engine (no second object / asset)                                                    | PASS for incomplete ops                                     |
| Duplicate / concurrent finalize                                                         | PASS on fake serialized TX (one FileAsset)                                                   | Concurrent IN_PROGRESS both dispatch; engine must serialize |
| Missing object                                                                          | PASS                                                                                         | PASS                                                        |
| Size mismatch                                                                           | PASS                                                                                         | PASS (verify fails)                                         |
| Revoked auth before resume of _incomplete_ op                                           | PASS — finalize auth port runs first                                                         | PASS — `requireAuthorizedTask` on attach                    |
| Changed payload / changed `taskId` after Drive COMPLETED and gateway checkpoint missing | PASS at `prepare` _if dispatch runs_                                                         | **FAIL — F1 short-circuit never reaches prepare**           |
| Revoked original task + replay with a different authorized `taskId`                     | N/A                                                                                          | **FAIL — F1**                                               |

Real-Postgres `drive-artifact-operation.int.test.ts`: **skipped**
(`AI_PLATFORM_DB_TEST_URL` unset in this chat). Concurrent `FOR UPDATE`
behavior is therefore **not** independently proven.

Live External Agent REST + MCP attach: **not run** (no agent credentials /
running agent). Human browser upload: **not run** (API contract still
presigned; no browser session). Full monorepo build: **not run**.

### Confirmed defect (blocks PASS)

**F1 — High.** `AgentCapabilityGateway.reserveIfRequired` replays a completed
Drive attach by `(EXTERNAL_AI, actorId, operationKey)` before idempotency
fingerprint or original target are compared.

```266:278:apps/api/src/modules/ai-platform/gateway/agent-capability.gateway.ts
    if (capability.key === 'tasks.attach_artifact') {
      const completed = await this.drive.findCompletedAttach(key.agentId, key.operationKey);
      if (completed?.fileAssetId) {
        return {
          key,
          replay: {
            capabilityKey: capability.key,
            data: projectCapabilityOutput(capability, {
              fileAssetId: completed.fileAssetId,
              linkId: completed.linkId ?? completed.fileAssetId,
            }),
          },
        };
      }
```

`findCompletedByIdempotency` returns only `{ fileAssetId, fileVersionId, fileLinkId }`.
It does not return `entityId` or `payloadFingerprint`.

This is exactly the K209 window the milestone exists to close: Drive
`COMPLETED`, gateway checkpoint missing. The new short-circuit is the recovery
path, and it is not fail-safe.

Reproduced from source + the existing gateway test
`replays a completed Drive attach without a second mutation`, which never
varies bytes or `taskId`. Applying a different `taskId` or different payload
to that branch still returns the stored ids and only calls
`replayAuthorization.assertStillAuthorized` with the _new_ input.

Impact:

- Changed payload + reused operation key returns the old artifact as success.
- Cross-task replay of the result is possible; no second FileLink is written,
  but the agent is told the attach to B succeeded with A's ids.
- Original-task grant revocation can be skipped if the agent still has another
  authorized task and sends that `taskId` (C11 requires the _original_ target).

Required fix (smallest complete):

1. Do **not** short-circuit on Drive completed unless `input.taskId` equals the
   stored operation `entityId` **and** `key.requestFingerprint` equals the
   stored `payloadFingerprint` (attach already persists the gateway fingerprint
   as `payloadFingerprint`). Then authorize that original task.
2. Simpler and safer: **delete the short-circuit**.
   `allowInProgressResume` + `prepare` / `executeMachineUpload` already resume a
   completed operation and already conflict on changed fingerprint / target.
   Live attach auth then runs on the original entity.

Add a gateway test: completed Drive attach + different bytes and completed
Drive attach + different `taskId` must `idempotencyConflict` / fail closed;
revoked original task must deny even if another task is still granted.

Until that exists, item 209 and C24 stay `[~]`.

### Additional findings (do not close the milestone even after F1)

- **Medium.** Migration creates
  `file_artifact_operations_source_actor_idempotency_uidx`, but
  `drive.prisma` only declares a non-unique `@@index`. A later `migrate dev`
  can drop the unique constraint. Without it, concurrent `prepare` with the
  same key can create two operations / two objects.
- **Medium.** Human complete/version regression tests mock `findById` /
  `findByStorageKey` as `null`, so they only exercise the legacy complete
  path. Production new writes always `prepare` first. The new complete path
  has no Human regression test.
- **Medium.** `recoverPrepareConflict` and prepare-by-`storageKey` do not call
  `assertSameArtifactTarget`. Fingerprint check no-ops if either side is
  missing (`assertSameArtifactFingerprint`).
- **Medium / debt.** `createGeneratedFileAsset` reuses `findByStorageKey`
  without a fingerprint/target assert. SYSTEM callers with a new body on a
  stable key can attach to the old operation.
- **Low.** `createAndLinkTaskArtifact` defaults to `allowArtifactAuth()` if the
  caller omits `auth`. Production External/Internal pass a port; the default is
  a footgun.
- **Low.** `deleteOwnedOrphanObject` is test-only. Conservative, but unused.
- **Low.** Internal AI adapter checks agent status only, not task /
  onBehalfOf Drive grants. Service is not an HTTP/MCP entrypoint yet.
- **Low.** External attach stores the gateway request fingerprint as
  `checksum` / `payloadFingerprint`, not a content digest of the object.
- **Low.** `failUploadSession` does not cancel the matching
  `FileArtifactOperation`.

### Checks run

| Check                                                                 | Result                                               |
| --------------------------------------------------------------------- | ---------------------------------------------------- |
| Artifact state machine unit                                           | passed                                               |
| Drive crash/retry matrix (in-memory + fake Prisma)                    | passed                                               |
| Auth ports (human / paused Internal / revoked External helper)        | passed                                               |
| Conservative orphan unit                                              | passed                                               |
| Internal AI adapter contract                                          | passed                                               |
| Drive task artifact / upload session / Drive service                  | passed (legacy complete still the tested Human path) |
| Gateway attach + completed replay + idempotency resume                | passed; **does not cover F1**                        |
| Replay attach classification `INTERNAL`                               | passed                                               |
| Reports + mail generate callers                                       | passed                                               |
| REST/MCP protocol parity                                              | passed                                               |
| Real-Postgres artifact int                                            | **skipped** — no `AI_PLATFORM_DB_TEST_URL`           |
| eslint on changed API production files                                | passed                                               |
| `@nbos/api` `tsc --noEmit` (`NODE_OPTIONS=--max-old-space-size=8192`) | passed                                               |
| Live REST + MCP attach                                                | **not run**                                          |
| Human browser upload                                                  | **not run**                                          |
| Full monorepo test / build                                            | **not run**                                          |
| Production migrate                                                    | **not applied**                                      |

### Return to executor

Fix F1 before any re-verification. Keep K209 / C24 open. Do not treat the
in-memory engine matrix as sufficient for the attach crash window: the defect
is in the gateway recovery the executor added for that window. After F1, add
the negative gateway tests and, if a disposable DB is available, run
`drive-artifact-operation.int.test.ts`. Do not apply production migrations
from the next executor chat either.

### Executor remediations after F1 (2026-08-23)

Product code **was** modified in this follow-up. Verdict stays with the
independent verifier. K209 / C24 remain open.

| Change                                                                                     | Why                                                                                                   |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Removed `findCompletedAttach` short-circuit from `reserveIfRequired`                       | Recovery now always goes `reserve` → live `attachArtifact` → Drive `prepare` / `executeMachineUpload` |
| `recoverPrepareConflict` and prepare-by-`storageKey` now assert target **and** fingerprint | Empty-side fingerprint no longer no-ops; unique-constraint recovery cannot swap tasks                 |
| Prisma schema comments the SQL partial unique index                                        | `migrate dev` must not drop `file_artifact_operations_source_actor_idempotency_uidx`                  |
| Gateway tests: different bytes, different `taskId`, revoked original task                  | Negative coverage the verifier required                                                               |

Do **not** mark item 209 / C24 `[x]` from this executor note. Independent
re-verification after F1 confirmed F1 closed and kept K209 / C24 open.

### Re-verification after F1 (independent verifier)

Product code was **not** modified in this re-check. The original FAIL section
above is left in place.

**F1: CLOSED.**  
**K209 / C24: remain `[~]` / PARTIAL.**  
**Milestone: not PASS and not PASS WITH DEBTS.**

F1 is gone from product code:

- `reserveIfRequired` for `tasks.attach_artifact` only calls
  `idempotency.reserve(key, { allowInProgressResume: true })`. No
  `findCompletedAttach` short-circuit. That helper is deleted from `apps/api`.
- Exact resume of `IN_PROGRESS` without a checkpoint re-enters live
  `attachArtifact` with the request `taskId` and bytes. Drive `prepare` /
  `executeMachineUpload` then resume the durable row.
- Changed bytes or `taskId` on an existing gateway row fail at reserve
  (`AGENT_IDEMPOTENCY_CONFLICT`) before attach. Independently reproduced.
- Exact resume + mocked revoked grant returns `AGENT_CAPABILITY_DENIED` and
  still called attach with `task-1`, not a substitute task.
- `prepare` / `recoverPrepareConflict` now assert target and treat a
  one-sided fingerprint as conflict. Independently reproduced.
- Prisma schema comments the SQL partial unique index; it does not express it
  (Prisma cannot). Migration still owns the constraint.

Independently keeping K209 / C24 open — not because the executor asked, but
because required close evidence is still missing:

- real-Postgres `drive-artifact-operation.int.test.ts` still skipped;
- live External Agent REST + MCP attach still not run;
- Human new complete path still untested (session/version tests still force
  the legacy fallback);
- `createGeneratedFileAsset` still reuses `findByStorageKey` without a
  fingerprint/target assert (SYSTEM ingress, not F1, still a hole in the
  unified lifecycle).

| Check                                                | Result          |
| ---------------------------------------------------- | --------------- |
| Targeted gateway / Drive / helpers / attach-recovery | 67 passed       |
| eslint on F1 remediation files                       | passed          |
| Real-Postgres artifact int                           | **not run**     |
| Live REST + MCP attach                               | **not run**     |
| Full typecheck / build                               | **not run**     |
| Production migrate                                   | **not applied** |

Item 209 and C24 stay `[~]`. Do not commit from this verifier chat.

### Executor evidence after F1 close (2026-08-23)

Product code **was** modified. K209 / C24 stay `[~]` for the independent verifier.

| Gap                       | What landed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Human new complete path   | `DriveUploadSessionService` test completes via `finalizeAfterObjectPresent` when the operation row exists; `$transaction` is not used. Legacy HeadObject complete test remains.                                                                                                                                                                                                                                                                                                                                    |
| Human version complete    | `drive-artifact-ingress.service.test.ts` completes a version through `finalizeAfterObjectPresent`, not the legacy path.                                                                                                                                                                                                                                                                                                                                                                                            |
| SYSTEM `storageKey` reuse | `createGeneratedFileAsset` always `prepare`s (fingerprint + target). `findByStorageKey` skip removed. Conflict on changed body is tested.                                                                                                                                                                                                                                                                                                                                                                          |
| Real Postgres int         | Disposable Docker `postgres:16` on `:54334` (`nbos-artifact-op-verify`). Schema via `prisma db push` (full `migrate deploy` fails on historical enum `NEW`). 3/3 passed: FileAsset+COMPLETED same TX; crash-before-finalize rolls back; concurrent finalize → one FileAsset.                                                                                                                                                                                                                                       |
| Live REST + MCP attach    | API on `:4100` against Neon **dev** (`ep-restless-tooth`). Additive migrations applied there: Chat 2 seed `20260823120000` + `20260823140000_file_artifact_operations`. Temporary External Agent (disabled after). REST `201` `fileAssetId=3a08eb27-…` / `linkId=c1aac0e3-…`; exact retry `201` same ids; MCP `200` distinct `fileAssetId=13de1d40-…`. Two `file_artifact_operations` rows: `EXTERNAL_AI` / `MACHINE_PUT` / `COMPLETED` / `TASK` with asset+link. Script: `apps/api/.chat12/chat3-live-attach.ts`. |

**Not closed here:** item 209 / C24. Production migrate not applied. Docker int DB is disposable, not Neon. Full monorepo build not run.

### Re-verification of close evidence (independent verifier)

Product code was **not** modified in this re-check. Earlier FAIL / F1-closed
sections stay above.

**Verdict: PASS WITH DEBTS**

K209 / C24 are closed. Remaining debts are outside the attach crash-window
milestone.

Independently confirmed:

1. Human complete with an operation row calls `finalizeAfterObjectPresent`
   (`drive-upload-session.service.test.ts`). Legacy HeadObject complete remains
   for leftover PENDING sessions without a row. Version complete with a matching
   operation calls `finalizeAfterObjectPresent`
   (`drive-artifact-ingress.service.test.ts`); `$transaction` is not used.
2. `createGeneratedFileAsset` always `prepare`s (fingerprint + target). The
   `findByStorageKey` skip is gone. Changed-body conflict is tested.
3. F1 remains closed: no `findCompletedAttach` short-circuit.
4. Real Postgres, reproduced here: fresh `postgres:16`, `prisma db push` (full
   `migrate deploy` still fails on historical enum `NEW` even on an empty DB —
   executor claim is true). Int suite 3/3: FileAsset+COMPLETED same TX; rollback
   after aborted finalize then retry → one FileAsset; concurrent finalize → one
   FileAsset.
5. Live Neon **dev** (`ep-restless-tooth`), read-only: two
   `file_artifact_operations` rows for
   `fileAssetId` `3a08eb27-2055-44c7-aae7-d301a89d38b5` and
   `13de1d40-1bbf-4330-9cd6-e2f8bde590a7`. Both `EXTERNAL_AI` / `MACHINE_PUT` /
   `COMPLETED` / `TASK` / task `246ebb5e-…`, matching `file_link_id`s. Partial
   unique index `file_artifact_operations_source_actor_idempotency_uidx` is
   present. Matches the succeeded live script log (REST `201` + exact retry
   same ids; MCP distinct asset). Temporary agent was disabled after the walk.

Debts left outside this close:

- Production apply of `20260823140000_file_artifact_operations` under the
  documented write-pause.
- `FileUploadSession` dual-write until old PENDING rows expire.
- No scheduled recovery worker (retry-driven by design).
- Full monorepo test/build not run in this verifier chat.
- Historical `migrate deploy` cannot apply on empty PostgreSQL because of
  enum `NEW`; Neon received the additive SQL migrations, local int used
  `db push`.

| Check                                            | Result                                                       |
| ------------------------------------------------ | ------------------------------------------------------------ |
| Human complete/version + SYSTEM prepare tests    | 41 passed (with F1/engine files)                             |
| Real-Postgres artifact int (this chat, `:54335`) | 3 passed                                                     |
| Neon read-only live attach rows + unique index   | confirmed                                                    |
| Live script re-run                               | **not re-run** (agent already disabled; terminal + DB match) |
| Production migrate                               | **not applied**                                              |

Item 209 is `[x]`. C24 is FIXED. Do not commit from this verifier chat.

## Independent re-verification — GPT-5.6 Sol (2026-08-23)

Product code was not modified. Commit `b7761a88` was reviewed against current runtime at `HEAD` `7de964f6`; unrelated concurrent deployment work was excluded.

**Verdict: PASS WITH DEBTS.** K209 / C24 remain closed: no crash window, duplicate mutation, authorization bypass, hidden parallel AI lifecycle, or Human upload regression was reproduced. One concrete metadata defect and several inactive/operational debts remain outside the K209 attach-recovery closure.

### Independently confirmed

- New Human create/complete and version complete, Internal AI, External AI, and SYSTEM generated bytes converge on `DriveArtifactOperationService` and `finalizeArtifactOperationInTx`. Human browser upload remains direct-to-R2 presigned ingress.
- Operation/storage identity is durable before upload. FileAsset/FileVersion/FileLink plus operation `COMPLETED` commit in one PostgreSQL transaction; R2 is never represented as part of that transaction.
- Current-tree crash/retry matrix passed, including changed payload, cross-Task substitution, missing object, size mismatch, duplicate/concurrent finalize, and revoked/paused actor tests.
- Real Neon dev PostgreSQL integration: **3/3 passed** (transaction rollback/retry and concurrent finalize produce one FileAsset).
- Live External Agent smoke was rerun through the current API on `:4100`: REST `201`, exact retry `201` with the same FileAsset/link ids, MCP `200` with a distinct FileAsset. The temporary agent was disabled. Read-only DB verification found both rows `EXTERNAL_AI / MACHINE_PUT / COMPLETED / TASK`, linked to the requested Task, and confirmed the partial unique index.
- External Agent gateway/REST/MCP suite: **26 files passed, 2 skipped; 239 tests passed, 3 skipped**. Initial sandbox run could not bind ephemeral ports; the identical approved rerun passed.
- Targeted Chat 3 suite: **14 files / 125 tests passed**. Cross-regression: **22 files / 285 tests passed**. Scoped eslint, API typecheck, and API SWC production build passed.

### Confirmed non-blocking defect

**Medium — External Agent content checksum is not a content checksum.**

`AgentDriveHandler` passes the gateway request fingerprint (hash of normalized input plus bytes) as `payloadFingerprint`; `DriveTaskArtifactService` then writes that same value to `checksum`. The value reaches `FileArtifactOperation.checksum`, `FileAsset.checksum`, and the first FileVersion checksum. Drive canon defines checksum as the file-content hash used for integrity and duplicate detection.

Live proof: both newly attached External Agent rows stored `checksum === payload_fingerprint`, while each value differed from the independently calculated SHA-256 of its uploaded bytes. This causes false negatives in Drive duplicate-checksum grouping and mislabels request identity as content integrity metadata. It does not weaken idempotency or reopen K209/C24.

Required fix: keep the gateway request fingerprint only in `payloadFingerprint`; compute `fingerprintBytes(input.content)` separately for `checksum` (or leave checksum null until a verified content digest is available). Add a regression asserting two equal byte payloads with different request metadata share the same content checksum while retaining different request fingerprints where appropriate.

### Remaining lower-risk debts

- Internal AI ingress is not exposed yet and checks agent state/identity, but does not yet validate Task/onBehalfOf employee Drive grants. Those checks are required before enabling a product entrypoint.
- `createAndLinkTaskArtifact` still defaults to `allowArtifactAuth()` when an internal caller omits an auth port. Current External/Internal production callers pass explicit ports, but the default remains a future misuse footgun.
- `failUploadSession` does not cancel its matching artifact operation, and conservative artifact-object orphan deletion remains unwired. Existing cleanup deletes failed session rows but not the R2 object. This is a storage-leak/operations debt, not an attach duplication or authorization defect.
- Production migrations remain unapplied and require the documented write pause. The live smoke created a temporary Task and two Drive artifacts on Neon dev; they were not deleted because repository policy forbids data deletion during this verifier pass.

Item 209 may stay `[x]`; C24 may stay FIXED. Return the checksum finding to a Drive executor as a scoped follow-up rather than reopening the crash-window milestone.

---

## Executor follow-up — External Agent content checksum (2026-08-23)

Scoped fix for the GPT-5.6 Sol metadata defect. Product code **was** modified. This chat did **not** commit. K209 / C24 stay closed. Remaining Chat 3 debts below stay open.

### Semantics

| Field                | Meaning after this fix                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `payloadFingerprint` | Gateway request fingerprint (normalized input + bytes). Unchanged. Still binds the idempotency key to bytes, filename, MIME, `sizeBytes`, and `taskId`. |
| `checksum`           | SHA-256 of uploaded bytes only (`fingerprintBytes(content)`). Same bytes with different filename/request metadata share the same content checksum.      |

No second Drive lifecycle. No change to operation key, gateway fingerprint, or replay authorization. No Human checksum expansion. No production migration: the columns already exist; only the value written for machine attach is corrected. Historical External Agent rows are not backfilled and may keep `checksum === payload_fingerprint`; an exact retry returns the already completed artifact, while new attach operations use the corrected content checksum.

### Changed files

- `apps/api/src/modules/drive/drive-task-artifact.service.ts` — External/Internal attach: `checksum` is always content SHA-256; `payloadFingerprint` stays the caller/gateway fingerprint when provided.
- `apps/api/src/modules/drive/drive.service.ts` — SYSTEM generate: if the caller omits `checksum` and bytes are present, persist `fingerprintBytes(body)` instead of null. Callers that already pass a content digest are unchanged.
- Tests: `drive-task-artifact.service.test.ts`, `drive-artifact-ingress.service.test.ts`, `agent-idempotency.rules.test.ts`, `agent-capability.gateway.attach-recovery.test.ts`, `agent-drive.handler.test.ts`.
- This handoff.

Not touched: `Dockerfile.api`, `package.json`, deployment configuration, Tasks ownership, code allocators, Artifact Operation architecture.

### Tests / evidence

| Check                                                                                                        | Result                                                                                   |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Drive task-artifact checksum split + SYSTEM generate fallback                                                | passed (`drive-task-artifact.service.test.ts`, `drive-artifact-ingress.service.test.ts`) |
| Gateway fingerprint still changes on filename/MIME/bytes; request fingerprint ≠ content SHA-256              | passed (`agent-idempotency.rules.test.ts`)                                               |
| Same idempotency key + changed filename/bytes/taskId → conflict; exact retry returns same FileAsset/link ids | passed (`agent-capability.gateway.attach-recovery.test.ts`)                              |
| Handler still forwards gateway fingerprint as `payloadFingerprint` only                                      | passed (`agent-drive.handler.test.ts`)                                                   |
| REST/MCP parity                                                                                              | passed (`agent-protocol.parity.test.ts`)                                                 |
| Targeted Drive + gateway regression (17 files)                                                               | **177 passed**                                                                           |
| eslint on changed API files                                                                                  | passed                                                                                   |
| `@nbos/api` `tsc --noEmit` (`NODE_OPTIONS=--max-old-space-size=8192`)                                        | passed                                                                                   |
| `@nbos/api` SWC production build                                                                             | passed                                                                                   |

Not run: live External Agent REST/MCP attach, production migrate, full monorepo test.

### Remaining debts (still open)

- Internal AI still does not validate Task / onBehalfOf employee Drive grants. Required before a product entrypoint.
- `createAndLinkTaskArtifact` still defaults to `allowArtifactAuth()` when an internal caller omits an auth port.
- `failUploadSession` does not cancel its matching artifact operation; conservative orphan object deletion remains unwired.
- Production migrations remain unapplied and still require the documented write pause.

---

## Independent re-verification — Codex (2026-08-23)

**Verdict: PASS WITH DEBTS.** The scoped checksum defect is closed. No actionable correctness or security findings were found in the follow-up diff. K209 / C24 remain closed, and the executor's explicitly listed lower-priority debts remain open.

Independent source tracing confirmed:

- External Agent attach still sends the gateway request fingerprint only as `payloadFingerprint`; Drive computes `checksum` separately from the uploaded bytes.
- Artifact-operation replay and conflict checks still compare `payloadFingerprint`, so changed filename, MIME, task or bytes cannot reuse the External Agent operation key.
- Finalization propagates the operation content checksum into `FileArtifactOperation`, `FileAsset`, and the initial `FileVersion` without replacing it with the request fingerprint.
- SYSTEM generate computes a content checksum when the caller omits one and preserves an explicitly supplied checksum.
- No schema, migration, public REST/MCP contract, Human upload flow, or authorization boundary changed.

Checks rerun independently on the current worktree:

| Check                                                  | Result                               |
| ------------------------------------------------------ | ------------------------------------ |
| Targeted Drive artifact / gateway / protocol suite     | **12 files / 92 tests passed**       |
| Cross-regression suite (`vitest.regression.config.ts`) | **22 files / 285 tests passed**      |
| Scoped eslint on all changed API files                 | passed                               |
| `@nbos/api` TypeScript (`tsc --noEmit`, 8 GB heap)     | passed                               |
| `@nbos/api` SWC production build                       | passed (**1901 files**)              |
| Prettier check on the scoped diff                      | passed after formatting this handoff |

Not rerun in this verification: live External Agent REST/MCP attach, real-Postgres artifact integration, full monorepo tests, production migration/deployment. They are not required to establish this no-schema metadata correction; the prior Chat 3 verification already covered the durable operation against Neon dev and live REST/MCP routing.
