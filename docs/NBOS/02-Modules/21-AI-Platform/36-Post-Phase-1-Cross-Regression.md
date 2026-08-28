# Post-Phase-1 Cross-Regression — after Chats 1–3

> Claims here are executor evidence from 2026-08-23. They are not a new independent
> verifier pass. Production migrations were not applied during this regression run;
> they were applied later during the production rollout described below.

## Why this file exists

The now-archived root `ai-modul-steps.md` § «После трёх этапов» required, after all three
independent PASS / PASS WITH DEBTS verdicts:

1. confirm Tasks C9, AI C25, and K209/C24 are honestly updated in source registers;
2. run a short cross-regression: Tasks + Drive + Support + Automation + External Agent REST/MCP;
3. only then start the next AI Platform functional stage.

This file records (1) and (2). Item (3) is **not** started.

Do **not** start Messenger AI, employee AI chat, production RAG, or Phase 2 from here.

## Register honesty

| Item                      | Source register                                                 | Status            | Note                                                                                                                                                                                                                                                                     |
| ------------------------- | --------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tasks C9 domain ownership | `docs/NBOS/02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md`    | closed 2026-08-23 | Production insert is `createTask` / `TaskCreationService`. Support and Automation no longer call `prisma.task.create`. Client Services goes through `TasksService.create`. Seed `upsert` remains fixture-only. Header C9 (allocator) is separately `SHIPPED`.            |
| Tasks C9 allocator        | same file § C9                                                  | `SHIPPED`         | One allocator for `T-`. Unrelated to domain-ownership subsection.                                                                                                                                                                                                        |
| AI C25                    | `docs/NBOS/02-Modules/21-AI-Platform/99-AI-Cleanup-Register.md` | FIXED             | Chat 2 verifier snapshot said designated Neon seed was **not** applied. Chat 3 later applied it on Neon **dev**. The production rollout subsequently applied it, but its record does not evidence the required old-writer pause; reconciliation remains operations work. |
| K209 / C24                | same AI register + item 209 in `10-Phase-1-…Implementation.md`  | FIXED / `[x]`     | Drive-owned `FileArtifactOperation`. First gateway short-circuit was verifier F1 and was removed.                                                                                                                                                                        |
| Drive artifact row        | `docs/NBOS/02-Modules/11-Drive/07-Drive-Cleanup-Register.md`    | `DONE`            | `FileArtifactOperation` Human / Internal AI / External AI / SYSTEM.                                                                                                                                                                                                      |

Plan workstreams 1–3 remain **PASS WITH DEBTS** in
`32-Post-Phase-1-Technical-Debt-Plan.md`.

## Static ownership check (this pass)

`apps/api/src` production `task.create` write: only
`apps/api/src/modules/tasks/create-task.op.ts`.

No leftover `findFirst({ orderBy: { code: 'desc' } })` allocators under `apps/api/src`.

## Targeted Vitest (2026-08-23, this tree)

Not a full monorepo suite. Vitest 4.1.8 from repo root.

| Surface                                        | Command                                                                                                                                                                                                                                                                                                   | Result                                                  |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Tasks                                          | `pnpm exec vitest run apps/api/src/modules/tasks`                                                                                                                                                                                                                                                         | 23 files passed, 1 skipped; 116 tests passed, 1 skipped |
| Drive                                          | `pnpm exec vitest run apps/api/src/modules/drive`                                                                                                                                                                                                                                                         | 31 files passed, 1 skipped; 173 tests passed, 3 skipped |
| Support + Automation                           | `pnpm exec vitest run apps/api/src/modules/support apps/api/src/modules/automation/auto-tasks.service.test.ts`                                                                                                                                                                                            | 4 files / 45 tests passed                               |
| External Agent gateway + protocol + REST + MCP | `pnpm exec vitest run apps/api/src/modules/ai-platform/gateway apps/api/src/modules/ai-platform/protocol apps/api/src/modules/ai-platform/rest/agent-rest.controllers.test.ts apps/api/src/modules/ai-platform/mcp/agent-mcp.server.test.ts apps/api/src/modules/ai-platform/mcp/agent-mcp.tools.test.ts` | 26 files passed, 2 skipped; 239 tests passed, 3 skipped |
| Entity-code unit + Support/Task create         | `pnpm exec vitest run apps/api/src/common/utils/entity-code-series.test.ts apps/api/src/common/utils/entity-code-seed.test.ts apps/api/src/modules/tasks/task-creation.service.test.ts apps/api/src/modules/support/support.service.test.ts`                                                              | 4 files / 39 tests passed                               |

Gateway/protocol output included an expected ERROR log from
`agent-protocol.http.transport.int.test.ts` (`ECONNREFUSED 10.0.0.1:5432` as a
negative case). The file passed.

## Live REST/MCP (not re-run here)

Reused Chat 3 live attach on Neon **dev** (API `:4100`, then stopped):

- REST `201` `fileAssetId=3a08eb27-2055-44c7-aae7-d301a89d38b5`, exact retry same ids;
- MCP `200` distinct `fileAssetId=13de1d40-1bbf-4330-9cd6-e2f8bde590a7`;
- two `file_artifact_operations` rows: `EXTERNAL_AI` / `MACHINE_PUT` / `COMPLETED` / `TASK`.

Details: `35-Post-Phase-1-Chat-3-Drive-Artifact-Lifecycle-Handoff.md`.
This pass did not restart the API and did not create more Neon rows.

## Not run

- Full monorepo `pnpm test` / lint / typecheck / production build
- Opt-in real-DB `*.int.test.ts` suites (already evidenced in Chat 2 / Chat 3)
- Production Neon / `DIRECT_URL_PROD`
- Browser UI
- New live External Agent smoke

## Remaining operations debts

- Production post-cutover reconciliation: the sibling seed and
  `file_artifact_operations` were applied later, but the rollout record does not
  evidence the required old-writer pause
- `FileUploadSession` dual-write
- No scheduled Drive artifact recovery worker (intentional)
- Tasks C8 (blueprints vs automation rules) still open

## Next

Registers are honest. Short cross-regression is green on the listed surfaces.
A later current-state audit found production cutover and Internal AI entrypoint
residuals. Complete `37-AI-Product-Entry-Gate.md` before starting the next AI
Platform **functional** stage. Do not fold that gate into the three completed
remediation chats.
