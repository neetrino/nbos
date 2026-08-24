# AI Product Entry Gate — Production post-cutover reconciliation

**Workstream:** 1 of `37-AI-Product-Entry-Gate.md`  
**Date:** 2026-08-24  
**Verdict: PASS WITH DEBTS**

No production data-integrity mismatch was found that requires repair. Counters
match numeric table maxima. Artifact-operation rows that exist are consistent
with FileAsset/FileLink targets. Mixed-version FileAssets without an operation
row after the artifact-operation migration finished were not found.

Do **not** repair, advance counters, delete R2 objects, or start Workstream 2
from this file. Remaining items are evidence bounds, not confirmed corruption.

---

## 1. Scope and prohibitions

Read-only production inspection of the 2026-08-23 cutover for:

- `20260823000000_entity_code_counters`
- `20260823120000_seed_sibling_entity_code_counters`
- `20260823140000_file_artifact_operations`

Not done in this pass:

- `UPDATE` / `INSERT` / `DELETE`
- `prisma migrate deploy` / `migrate resolve` / `migrate dev` / `db push`
- Coolify start/stop/PATCH (GET only)
- R2 delete
- commit / push / deploy
- Workstream 2 or 3

Local/dev Neon `ep-restless-tooth` was classified and **not** queried as
production. Production SQL used `DIRECT_URL_PROD` classified as
`ep-sweet-dew`, inside `BEGIN READ ONLY` (`transaction_read_only=on`).

Handoffs and `MIGRATION-GATE-ROLLOUT.md` were treated as claims until Coolify
or SQL contradicted or confirmed them.

---

## 2. Git / release snapshot

Inspected from repository `sipan` at audit time (clean worktree):

| Fact                  | Value                                                                             |
| --------------------- | --------------------------------------------------------------------------------- |
| Branch                | `sipan` (tracks `origin/sipan`)                                                   |
| Local HEAD            | `5a937851` `chore: update .env.example to include COOLIFY UUIDs…`                 |
| `origin/main`         | `8160b0d4` `Merge pull request #225 from neetrino/sipan` (2026-08-24 16:07 +0400) |
| HEAD vs `origin/main` | sipan **2 ahead / 0 behind**                                                      |
| Worktree              | clean                                                                             |

Those two sipan-only commits are **not** the live production release. Live
Coolify binaries match `origin/main` `8160b0d4` (see §3).

Migrations exist in git on `origin/main` (repo history, not `_prisma_migrations`):

| Migration                                          | First commit on `origin/main` |
| -------------------------------------------------- | ----------------------------- |
| `20260823000000_entity_code_counters`              | `2e226dfd`                    |
| `20260823120000_seed_sibling_entity_code_counters` | `95382be3`                    |
| `20260823140000_file_artifact_operations`          | `b7761a88`                    |

SHA `da27ead` (PR #209) contains all three SQL folders. SHA `03b93f1` (19 Aug)
does not. SHA `d741415e` (scheduler still serving at cutover) does not contain
the artifact-operation migration.

---

## 3. Production target proof

| Check                               | Result                                                                                                         |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Local `DATABASE_URL` / `DIRECT_URL` | Non-prod `ep-restless-tooth` — **not used**                                                                    |
| SQL connection                      | `DIRECT_URL_PROD` classified **PRODUCTION_KNOWN** `ep-sweet-dew` (direct, not pooler)                          |
| Database name                       | `neondb`                                                                                                       |
| Transaction                         | `BEGIN READ ONLY`; `SHOW transaction_read_only` = `on`                                                         |
| Coolify                             | GET `/applications/{uuid}` and GET `/deployments/applications/{uuid}` for migrate, api, worker, scheduler, web |
| Evidence sources                    | Coolify live app + deployment list; read-only SQL; git for SHA contents                                        |

Credentials, tokens, and connection strings are not recorded here.

### Live Coolify application SHA (GET, first snapshot)

All five apps reported `git_branch=main` and
`git_commit_sha=8160b0d4ab7b225b359b9440587a331edc49f6e4`.

| App              | Status (first GET)                                 |
| ---------------- | -------------------------------------------------- |
| `nbos-migrate`   | `exited:unhealthy` (one-shot hold/stop — expected) |
| `nbos-api`       | `running:healthy`                                  |
| `nbos-worker`    | `running:healthy`                                  |
| `nbos-scheduler` | `running:healthy`                                  |
| `nbos-web`       | `running:healthy`                                  |

A follow-up GET minutes later showed `nbos-web` `in_progress` on the **same**
SHA `8160b0d4`. That is a live deploy snapshot, not a schema finding. Api /
worker / scheduler remained on `8160b0d4`.

`NBOS_MIGRATE_DONE exit=0` was **not** used as proof of a write pause.

---

## 4. Migration evidence (`_prisma_migrations`)

Production table query, read-only. Missing-name list was empty.

| migration_name                                     | finished | rolled back | finished_at (UTC)       | applied_steps_count |
| -------------------------------------------------- | -------- | ----------- | ----------------------- | ------------------- |
| `20260823000000_entity_code_counters`              | yes      | no          | 2026-08-23 12:26:25.791 | 1                   |
| `20260823120000_seed_sibling_entity_code_counters` | yes      | no          | 2026-08-23 12:26:26.020 | 1                   |
| `20260823140000_file_artifact_operations`          | yes      | no          | 2026-08-23 12:26:26.171 | 1                   |

Apply window: **same second-range on 2026-08-23 12:26:25–26 UTC**, during the
Phase 2 `nbos-migrate` reconcile+deploy recorded against SHA `da27ead`. Coolify
`finished` on the migrator container is not the Prisma timestamp; `_prisma_migrations.finished_at`
is the SQL evidence.

---

## 5. Entity code reconciliation (numeric)

Contract: `next_value >= numeric MAX(canonical suffix)`. Allocator returns
`next_value + 1` on conflict, so seed `next_value = MAX` is correct. Comparison
used `CAST(suffix AS INTEGER)`, not text/`order by code desc`.

Canonical shape: `{PREFIX}-{year}-{digits}`. Malformed rows are ignored by seed
and by this MAX.

| Scope          | Prefix | Year | Conforming rows           | Numeric MAX | `next_value` | Missing counter | `next_value < MAX` | Dupes | 10+ digit suffix | Suffix `> INTEGER` max |
| -------------- | ------ | ---- | ------------------------- | ----------- | ------------ | --------------- | ------------------ | ----- | ---------------- | ---------------------- |
| TASK           | `T-`   | 2024 | 40                        | 40          | 40           | no              | no                 | 0     | 0                | 0                      |
| TASK           | `T-`   | 2025 | 15                        | 15          | 15           | no              | no                 | 0     | 0                | 0                      |
| TASK           | `T-`   | 2026 | 320                       | 320         | 320          | no              | no                 | 0     | 0                | 0                      |
| INVOICE        | `INV-` | 2026 | 71                        | 71          | 71           | no              | no                 | 0     | 0                | 0                      |
| SUPPORT_TICKET | `TKT-` | —    | 0 tickets, 0 counter rows | —           | —            | n/a (empty)     | no                 | 0     | 0                | 0                      |
| DEAL           | `D-`   | 2024 | 77                        | 77          | 77           | no              | no                 | 0     | 0                | 0                      |
| DEAL           | `D-`   | 2025 | 112                       | 112         | 112          | no              | no                 | 0     | 0                | 0                      |
| DEAL           | `D-`   | 2026 | 136                       | 136         | 136          | no              | no                 | 0     | 0                | 0                      |
| LEAD           | `L-`   | 2024 | 57                        | 57          | 57           | no              | no                 | 0     | 0                | 0                      |
| LEAD           | `L-`   | 2025 | 61                        | 61          | 61           | no              | no                 | 0     | 0                | 0                      |
| LEAD           | `L-`   | 2026 | 219                       | 219         | 219          | no              | no                 | 0     | 0                | 0                      |
| ORDER          | `ORD-` | 2026 | 175                       | 175         | 175          | no              | no                 | 0     | 0                | 0                      |
| SUBSCRIPTION   | `SUB-` | 2026 | 121                       | 121         | 121          | no              | no                 | 0     | 0                | 0                      |
| PROJECT        | `P-`   | 2026 | 6                         | 6           | 6            | no              | no                 | 0     | 0                | 0                      |

Empty `SUPPORT_TICKET` is the designed first-insert path (`VALUES (…, 1)`).
Do not seed a dummy counter.

**PROJECT non-canonical:** 219 rows such as `BX-P-…` (samples only; Bitrix-era
ids). Seed SQL ignores them. Canonical `P-2026-*` max is 6 and matches the
counter. This is historical shape, not counter lag, and is **not** a repair
trigger.

No duplicate `code` values on any of the eight tables.

---

## 6. Drive Artifact Operation evidence

| Check                                                                                   | Result                                                                                     |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Table `file_artifact_operations`                                                        | present                                                                                    |
| Partial unique index `file_artifact_operations_source_actor_idempotency_uidx`           | present: `UNIQUE (source, actor_id, idempotency_key) WHERE idempotency_key IS NOT NULL`    |
| Operation count                                                                         | 9                                                                                          |
| By source/status                                                                        | HUMAN/COMPLETED = 5; SYSTEM/COMPLETED = 4                                                  |
| Breakdown                                                                               | HUMAN PRESIGNED CREATE_ASSET TASK × 5; SYSTEM MACHINE_PUT CREATE_ASSET `email_message` × 4 |
| Aged non-terminal (>1h or >24h)                                                         | 0                                                                                          |
| Duplicate idempotency identities                                                        | 0                                                                                          |
| Duplicate `storage_key`                                                                 | 0                                                                                          |
| COMPLETED without existing FileAsset                                                    | 0                                                                                          |
| Operation FileLink/FileAsset pointing at another target                                 | 0                                                                                          |
| Operation `storage_key` ≠ FileAsset `storage_key`                                       | 0                                                                                          |
| Terminal orphan candidates (FAILED/CANCELLED/EXPIRED key with no FileAsset/FileVersion) | 0                                                                                          |

**COMPLETED TASK without an active FileLink:** 1 row. Follow-up (no ids
printed): HUMAN PRESIGNED CREATE_ASSET TASK, FileAsset + FileVersion present,
FileLink row exists, **same Task**, `unlinked_at` set. Created 2026-08-24
06:23 UTC — after cutover. This is a later unlink, not a crash-before-link.
Not a repair item.

**FileUploadSession vs operation:** 8 sessions. 5 share id with a COMPLETED
operation (status strings match). 3 COMPLETED sessions have **no** operation
row: DEAL × 2 and DRIVE_FOLDER × 1, created **2026-08-18 / 2026-08-19** (before
the 12:26 UTC migration). Expected leftover from old Human complete. Dual-write
removal remains an expand-and-contract debt (Workstream 3), not cutover
corruption.

**FileAssets without a matching operation:** 205 with `deleted_at IS NULL`.
Split vs artifact-migration `finished_at`:

| Bucket                                                  | Count |
| ------------------------------------------------------- | ----- |
| created before migration finished                       | 205   |
| created after migration finished                        | 8     |
| created after migration finished, no matching operation | **0** |

The 205 are pre-table history. Database evidence does **not** show mixed-window
FileAssets created after the table existed without an operation row.

R2: not listed/headed. No terminal-orphan keys to reconcile. Full bucket
inventory remains a limitation, not a detected leak.

---

## 7. Mixed-version window

### When the three migrations finished

2026-08-23 **12:26:25–12:26:26 UTC** (`_prisma_migrations.finished_at`).

### Old application SHA still serving then

Rollout record: four apps still `running:healthy` on `03b93f1` (19 Aug) when
`da27ead` migrate applied. Coolify **scheduler** history confirms the previous
finished deploy `d741415e` (22 Aug 19:40 UTC) — that SHA **does not** contain
the artifact-operation migration. **Web** next finished deploy is `da27ead` at
12:40:18 UTC (started 12:30:32, after SQL apply).

**Api** Coolify history retained in this GET does **not** include the
`03b93f1` / `da27ead` pair (oldest retained api finished deploy in the list is
later the same afternoon). Worker history starts at `698c6ba9` (13:31 UTC),
which **does** contain the artifact code.

### When new binaries took over

| App       | First retained finished deploy **after** 12:26 UTC that contains the new writers | Finished (UTC)                   |
| --------- | -------------------------------------------------------------------------------- | -------------------------------- |
| web       | `da27ead`                                                                        | 12:40:18                         |
| scheduler | `da27ead`                                                                        | 12:49:50                         |
| worker    | `698c6ba9` (earlier worker deploys not in this list)                             | 13:36:38                         |
| api       | not in retained window; later healthy `c2df8f09` 16:54:22                        | unknown exact first new-SHA time |

Lower bound of mixed writers: **12:26:26 UTC**. Upper bound for web/scheduler:
**~12:40–12:50 UTC**. Api/worker exact first new-SHA times are incompletely
retained.

### Write pause

**Not proven.** `NBOS_MIGRATE_DONE` / migrate job success is not a pause.
Rollout text does not record stopping api/worker/scheduler before SQL.

What SQL **does** show:

- No series with `next_value < numeric MAX`. A successful old `MAX(table)+1`
  insert after seed would leave the counter behind. That residue is absent.
- Absence of lag does not prove a pause; it also fits “no sibling-code creates
  in the window” or “new allocators only”.
- Zero FileAssets created after artifact-migration finish without an operation
  row. Old machine `createGeneratedFileAsset` would have left such rows if it
  wrote in that window.

---

## 8. Confirmed findings

1. Production `_prisma_migrations` shows all three named migrations finished,
   not rolled back, at 2026-08-23 12:26:25–26 UTC.
2. Live api/worker/scheduler/web/migrate git SHA is `8160b0d4` (`origin/main`).
3. All eight code series: no counter lag, no duplicate codes, no INTEGER-overflow
   suffixes. PROJECT `BX-P-*` are non-canonical historical rows; canonical `P-`
   series is in sync.
4. Artifact table + partial unique idempotency index exist. Nine operations,
   all COMPLETED, no aged non-terminal, no duplicate identities/keys, no
   COMPLETED-without-FileAsset, no wrong-target links.
5. One COMPLETED TASK operation has an unlinked FileLink (user unlink after
   success). Not mixed-window residue.
6. Three pre-migration COMPLETED upload sessions lack an operation row (18–19
   Aug). Expected old Human path.
7. Write pause is **not** evidenced. Post-cutover SQL does **not** show the
   counter-lag or post-table FileAsset-without-operation signatures that pause
   exists to prevent.

---

## 9. Evidence limitations

- Coolify api deployment list does not retain the 12:26 UTC cutover pair;
  worker list starts after `da27ead`.
- R2 list/head not run (no DB orphan candidates; bucket-wide inventory absent).
- GitHub Actions CD logs not used (`gh auth` invalid). Coolify GET was enough
  for live SHA.
- `NBOS_MIGRATE_DONE` logs of the original apply were not re-fetched (migrator
  is stopped; runtime logs disappear after Stop).
- One extra operation vs eight FileAssets created after migration is
  unexplained at count level (possible pre-existing asset reuse or deleted
  asset). No wrong-target or missing-asset COMPLETED row was found.
- Live `nbos-web` flipped to `in_progress` on the same SHA during the second
  GET.

---

## 10. Repair

**Not required.** Do not advance counters, backfill operations, delete R2
objects, or rewrite unlinked FileLinks.

If a later pass finds `next_value < MAX` or post-migration FileAssets without
operations, stop and plan a write-pause repair with backup/PITR, verification,
and rollback. That situation was **not** observed.

Workstream 3 (session/operation cancel consistency, leftover PENDING dual-write
removal) remains a product debt. It is not justified as an emergency production
data repair from this evidence.

---

## 11. Verdict

**PASS WITH DEBTS**

No confirmed integrity mismatch. Debts are incomplete pause proof, incomplete
Coolify api history at 12:26 UTC, no R2 inventory, and known pre-cutover
session/FileAsset leftovers that the new table was never meant to backfill.

Workstream 2 was not started.
