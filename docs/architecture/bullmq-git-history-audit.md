# BullMQ Git History Audit

**Repository:** `neetrino/nbos`  
**Audit branch / HEAD:** `dev-Karo` @ `f05e04bc147265c6995833986a3e130bd9c1f26a`  
**Audit date:** 2026-07-28  
**Method:** `git log` / `-S` / `-G` / `git show` / `git diff` / `git rev-list` / branch containment / GitHub REST API (PR ↔ commit mapping). `gh` CLI was not available locally; PR metadata was fetched via `api.github.com`.  
**Scope note:** Git author/committer metadata records who Git attributes the change to. Several feature commits include `Made-with: Cursor` or `Co-authored-by: Cursor <cursoragent@cursor.com>`. That does **not** prove who physically wrote the code.

---

## 1. Executive summary

| Question                                                       | Finding                                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| First BullMQ **dependency** commit                             | `6cfce59d985eb8b5c4a519455a1ae733b09d96e7`                                                                    |
| First **working** BullMQ commit (Queue + Worker + `queue.add`) | **Same commit** `6cfce59d`                                                                                    |
| Author                                                         | SipanBabajanyan `<91829503+SipanBabajanyan@users.noreply.github.com>`                                         |
| Committer                                                      | SipanBabajanyan (same identity; AuthorDate = CommitDate)                                                      |
| Dates                                                          | AuthorDate / CommitDate: **2026-04-30 15:29:21 +0400**                                                        |
| Initial business purpose                                       | **Report export jobs** (`reports.export-jobs`)                                                                |
| Path into `main`                                               | Branch `development` → **PR #11** merge commit `e1fc9b51` (merged 2026-05-01T14:35:01Z)                       |
| Docs-only mention earlier                                      | `7b2376e6` (2026-03-05) names BullMQ in architecture/tech-card docs only — **no dependency, no Queue/Worker** |

**Verdict (short):** Based on reachable Git history, BullMQ first appeared in commit `6cfce59d`, authored and committed by SipanBabajanyan on 2026-04-30, initially for asynchronous report exports. Phase 3 (`25ef5633`, `838e5fb5`, `1482c3de`) did **not** introduce BullMQ; it reworked an already multi-queue setup into process roles + dedicated worker runtime.

---

## 2. Evidence

### 2.1 Repository state at audit

```text
Branch:        dev-Karo (tracks origin/dev-Karo, clean)
HEAD:          f05e04bc147265c6995833986a3e130bd9c1f26a
Remote:        https://github.com/neetrino/nbos
Shallow:       false (~2118 commits reachable)
Fetch:         git fetch --all --tags --prune (origin/development deleted remotely; main/Liana/sipan/dev-Karo present)
```

### 2.2 Current inventory (HEAD)

| Компонент               | Queue name                | Producer                            | Worker                        | Файл(ы)                                                                                                            |
| ----------------------- | ------------------------- | ----------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Mail                    | `mail`                    | `MailQueueService`                  | `MailWorker`                  | `apps/api/src/modules/mail/mail-queue.service.ts`, `mail.worker.ts`, `mail-queue.constants.ts`                     |
| WhatsApp product groups | `whatsapp.product-groups` | `WhatsAppProductGroupsQueueService` | `WhatsAppProductGroupsWorker` | `…/whatsapp-product-groups-queue.service.ts`, `whatsapp-product-groups.worker.ts`, `whatsapp-gateway.constants.ts` |
| Reports export          | `reports.export-jobs`     | `ReportsQueueService`               | `ReportsExportWorker`         | `…/reports-queue.service.ts`, `reports-export.worker.ts`, `reports-queue.constants.ts`                             |
| Drive ZIP export        | `drive.zip-export-jobs`   | `DriveExportZipQueueService`        | `DriveExportZipWorker`        | `…/drive-export-zip-queue.service.ts`, `drive-export-zip.worker.ts`, `drive-export-zip-queue.constants.ts`         |

**Shared runtime (Phase 3+):** `apps/api/src/runtime/queue-redis.ts`, `bullmq-job-options.ts`, `bullmq-concurrency.ts`, `bullmq-worker-registry.ts`, `queue-workers.module.ts`, `worker.ts`, `process-role.ts`.

**Dependency:** `apps/api/package.json` → `"bullmq": "^5.76.4"`; lockfile `pnpm-lock.yaml` → `bullmq@5.76.4`. Version string has not changed in reachable history after the introduction commit.

**Not used in production code:** `QueueScheduler` (no code usage). `QueueEvents` class not instantiated; only a helper `createQueueEventsConnection` exists in `queue-redis.ts` (added in Phase 3). Optional `REDIS_QUEUE_URL` / `BULLMQ_*_CONCURRENCY` are Phase 3 additions.

### 2.3 First dependency + first working usage (same commit)

```text
commit SHA:     6cfce59d985eb8b5c4a519455a1ae733b09d96e7
commit message: feat(reports): process exports with BullMQ
author:         SipanBabajanyan <91829503+SipanBabajanyan@users.noreply.github.com>
committer:      SipanBabajanyan <91829503+SipanBabajanyan@users.noreply.github.com>
author date:    2026-04-30T15:29:21+04:00
commit date:    2026-04-30T15:29:21+04:00
parents:        39d0fb7afc0097a682e536f49ff49d9b751228a4
trailer:        Made-with: Cursor
```

**Changed files (relevant):**

- `apps/api/package.json` — **adds** `bullmq` `^5.76.4` and `ioredis` `^5.10.1`
- `pnpm-lock.yaml` — lock entries for bullmq/ioredis
- **Creates** `reports-queue.constants.ts` (`reports.export-jobs`)
- **Creates** `reports-queue.service.ts` (`new Queue`, `queue.add`)
- **Creates** `reports-export.worker.ts` (`new Worker`)
- Wires module + service/tests/docs

**Diff summary:** Before this commit, `apps/api/package.json` had neither `bullmq` nor `ioredis`. Parent tree has no `from 'bullmq'` / `new Queue` / `new Worker` in TS. This commit simultaneously adds dependency, Redis connection inline via `new Redis(REDIS_URL)`, producer, worker, and first enqueue.

**Search corroboration:**

- `git log --all --reverse -S'"bullmq"' -- '**/package.json'` → only `6cfce59d` as first (and version introduction)
- `git log --all --reverse -Sbullmq -- pnpm-lock.yaml` → same
- `git log --all --reverse -S"from 'bullmq'" -- '*.ts'` → `6cfce59d` first
- `git log --all --before=<that timestamp> -Sbullmq` on code/lock → empty for real dependency

**Docs-only precursor (not code):**

```text
commit:  7b2376e62eba02e5e6d9210f089d6201737a1300
date:    2026-03-05
author:  SipanBabajanyan
message: docs: add technical architecture, tech card, and project brief
```

Mentions BullMQ as planned stack (billing/SLA/etc.). **No package dependency, no Queue/Worker.**

### 2.4 Redis connection factory (post-introduction hardening)

```text
commit:  f98b027656b3b6179027b84b67543b86b5e20582
date:    2026-06-01T18:41:29+04:00
author / committer: SipanBabajanyan
message: feat(security): P1 upload + redis hardening
```

Adds `apps/api/src/common/redis/redis-connection.ts` (`createRedisConnection`, TLS `rediss://` in production) and migrates **reports + drive** queue/worker connections. Not a new queue.

### 2.5 Subsequent BullMQ-related commits (non–Phase 3)

| Commit     | Author          | Date       | Change                                                               |
| ---------- | --------------- | ---------- | -------------------------------------------------------------------- |
| `dd7904d7` | SipanBabajanyan | 2026-05-06 | Reports: gate dispatch on Redis / sync fallback (`isQueueAvailable`) |
| `f98b0276` | SipanBabajanyan | 2026-06-01 | Central Redis/TLS for existing BullMQ producers/workers              |
| `b619c814` | Karo Gabrielyan | 2026-07-16 | WhatsApp: release PROCESSING lock so BullMQ retries work             |
| `20663a0e` | Karo Gabrielyan | 2026-07-16 | WhatsApp: fix typed `getState()` (remove invalid `'paused'`)         |

---

## 3. Queue timeline

### Chronology table

| Дата       | Commit                  | Author          | Committer       | Изменение                                                                            | Queue                     | Попало через                                                     |
| ---------- | ----------------------- | --------------- | --------------- | ------------------------------------------------------------------------------------ | ------------------------- | ---------------------------------------------------------------- |
| 2026-03-05 | `7b2376e6`              | SipanBabajanyan | SipanBabajanyan | Docs mention BullMQ only                                                             | —                         | later merges / docs path                                         |
| 2026-04-30 | `6cfce59d`              | SipanBabajanyan | SipanBabajanyan | **First dependency + Queue + Worker + queue.add**                                    | `reports.export-jobs`     | **PR #11** `development`→`main` (`e1fc9b51`, 2026-05-01)         |
| 2026-05-06 | `dd7904d7`              | SipanBabajanyan | SipanBabajanyan | Availability gating / sync fallback                                                  | reports                   | PR path via `development` (ancestry to main includes PR #14 era) |
| 2026-05-14 | `78aad126`              | SipanBabajanyan | SipanBabajanyan | New queue + producer + worker                                                        | `drive.zip-export-jobs`   | **PR #19** `development`→`main` (`d4de4fdc`, 2026-05-25)         |
| 2026-06-01 | `f98b0276`              | SipanBabajanyan | SipanBabajanyan | Shared Redis factory + TLS                                                           | reports, drive            | via `development` merges to main                                 |
| 2026-06-04 | `a9086995`              | Karo Gabrielyan | Karo Gabrielyan | New queue + producer + worker                                                        | `mail`                    | **PR #54** `dev-Karo`→`main` (`c88df5c1`, 2026-06-09)            |
| 2026-07-13 | `3c7a5809`              | Karo Gabrielyan | Karo Gabrielyan | New queue + producer + worker; first per-queue retries/retention defaults            | `whatsapp.product-groups` | **PR #98** `dev-Karo`→`main` (`b1282b83`, 2026-07-14)            |
| 2026-07-16 | `b619c814` / `20663a0e` | Karo Gabrielyan | Karo Gabrielyan | WhatsApp retry/lock + getState typing                                                | whatsapp                  | **PR #104** `dev-Karo`→`main`                                    |
| 2026-07-27 | `25ef5633`              | Karo Gabrielyan | Karo Gabrielyan | PROCESS_ROLE + QueueWorkersModule; workers gated by role                             | all (infra)               | **PR #108** `dev-Karo`→`main` (`f5bd0b2f`)                       |
| 2026-07-27 | `838e5fb5`              | Karo Gabrielyan | Karo Gabrielyan | Dedicated worker wiring, `queue-redis`, concurrency, centralized job options         | all (refactor)            | **PR #108**                                                      |
| 2026-07-27 | `1482c3de`              | Karo Gabrielyan | Karo Gabrielyan | Docs/deploy/.env for retention/retries/roles (**code options landed in `838e5fb5`**) | docs                      | **PR #108**                                                      |

### Per-queue key commits

#### `reports.export-jobs`

| Event                                                  | Commit                  | Author / Committer                |
| ------------------------------------------------------ | ----------------------- | --------------------------------- |
| Name + producer + worker + first `queue.add`           | `6cfce59d`              | SipanBabajanyan / SipanBabajanyan |
| Availability / sync fallback                           | `dd7904d7`              | SipanBabajanyan                   |
| Redis factory                                          | `f98b0276`              | SipanBabajanyan                   |
| Worker moved behind process role / registry            | `25ef5633` + `838e5fb5` | Karo Gabrielyan                   |
| Shared retention/retries (`BULLMQ_EXPORT_JOB_OPTIONS`) | `838e5fb5`              | Karo Gabrielyan                   |
| Concurrency env                                        | `838e5fb5`              | Karo Gabrielyan                   |

Original producer had **no** `attempts` / `removeOnComplete` defaults (BullMQ library defaults only).

#### `drive.zip-export-jobs`

| Event                                        | Commit                  | Author / Committer                |
| -------------------------------------------- | ----------------------- | --------------------------------- |
| Name + producer + worker + first `queue.add` | `78aad126`              | SipanBabajanyan / SipanBabajanyan |
| Redis factory                                | `f98b0276`              | SipanBabajanyan                   |
| Role split / shared options / concurrency    | `25ef5633` + `838e5fb5` | Karo Gabrielyan                   |

#### `mail`

| Event                                                              | Commit                  | Author / Committer                |
| ------------------------------------------------------------------ | ----------------------- | --------------------------------- |
| Name + producer + worker + `queue.add` (`mail.sync` / `mail.send`) | `a9086995`              | Karo Gabrielyan / Karo Gabrielyan |
| Role split / shared critical options / concurrency                 | `25ef5633` + `838e5fb5` | Karo Gabrielyan                   |

**PR note:** GitHub lists PR #54 **user** as `SipanBabajanyan`, but the introducing commit author is **Karo Gabrielyan**. Merge commit author is `kargabrielyan`; committer is `GitHub`. Do not conflate PR opener with commit author.

#### `whatsapp.product-groups`

| Event                                                                     | Commit                  | Author / Committer                |
| ------------------------------------------------------------------------- | ----------------------- | --------------------------------- |
| Name + producer + worker + `queue.add` + first explicit retries/retention | `3c7a5809`              | Karo Gabrielyan / Karo Gabrielyan |
| Retry lock / getState fixes                                               | `b619c814`, `20663a0e`  | Karo Gabrielyan                   |
| Role split / centralized options                                          | `25ef5633` + `838e5fb5` | Karo Gabrielyan                   |

At introduction, WhatsApp already set `attempts: 5`, exponential backoff, `removeOnComplete: 100`, `removeOnFail: 200`. Phase 3 later replaced these with shared `BULLMQ_CRITICAL_JOB_OPTIONS` (age/count based).

---

## 4. Phase 3 comparison

Target commits (all Author=Committer Karo Gabrielyan, 2026-07-27; co-authored-by Cursor):

| Commit     | Title                                                        | What it actually did                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `25ef5633` | refactor(runtime): add explicit API and worker process roles | **Did not add BullMQ or new queues.** Added `PROCESS_ROLE`, `worker.ts`, `QueueWorkersModule`, `BullmqWorkerRegistry`; moved worker **registration** out of feature modules into role-gated boot.                                  |
| `838e5fb5` | refactor(queues): move BullMQ consumers to dedicated worker  | **Did not add BullMQ or new queues.** Added `queue-redis` (incl. `REDIS_QUEUE_URL`), concurrency validation, job logging, worker health/shutdown, **centralized** `BULLMQ_*_JOB_OPTIONS`; rewired existing four producers/workers. |
| `1482c3de` | chore(queues): add job retention retries and deployment docs | **Docs / `.env.example` / deploy ADR only** (stat: 8 files, mostly markdown). Retention/retry **code** is in `838e5fb5`, not this commit.                                                                                          |

**Existed before Phase 3:**

- Dependency `bullmq@^5.76.4`
- All four queues: reports, drive ZIP, mail, WhatsApp
- Producers + Workers for all four (Workers previously started inside API Nest process `OnModuleInit` when Redis set)
- Shared `createRedisConnection` (from `f98b0276`) for at least reports/drive/mail/whatsapp paths
- WhatsApp-local retry/retention defaults

**Phase 3 did not:**

- Introduce BullMQ for the first time
- Add a fifth business queue name
- Change bullmq package major/minor version string

---

## 5. Merge / PR history

| Introduced work                            | Source branch | PR                                                | Merged into | Merged at (UTC)      | PR user (GitHub) | Merged by       |
| ------------------------------------------ | ------------- | ------------------------------------------------- | ----------- | -------------------- | ---------------- | --------------- |
| First BullMQ (`6cfce59d`)                  | `development` | [#11](https://github.com/neetrino/nbos/pull/11)   | `main`      | 2026-05-01T14:35:01Z | SipanBabajanyan  | SipanBabajanyan |
| Drive ZIP (`78aad126`)                     | `development` | [#19](https://github.com/neetrino/nbos/pull/19)   | `main`      | 2026-05-25T18:51:15Z | SipanBabajanyan  | SipanBabajanyan |
| Mail (`a9086995`)                          | `dev-Karo`    | [#54](https://github.com/neetrino/nbos/pull/54)   | `main`      | 2026-06-09T17:21:52Z | SipanBabajanyan  | kargabrielyan   |
| WhatsApp (`3c7a5809`)                      | `dev-Karo`    | [#98](https://github.com/neetrino/nbos/pull/98)   | `main`      | 2026-07-14T15:12:10Z | kargabrielyan    | kargabrielyan   |
| WhatsApp retry fixes                       | `dev-Karo`    | [#104](https://github.com/neetrino/nbos/pull/104) | `main`      | 2026-07-16T18:14:26Z | kargabrielyan    | SipanBabajanyan |
| Phase 3 (`25ef5633`/`838e5fb5`/`1482c3de`) | `dev-Karo`    | [#108](https://github.com/neetrino/nbos/pull/108) | `main`      | 2026-07-27T14:42:56Z | kargabrielyan    | kargabrielyan   |

**Merge commit pattern:** GitHub merge commits show Author = merger GitHub user identity, Committer = `GitHub <noreply@github.com>` — typical of non-squash GitHub merges. Feature commits themselves remain in history (not squash-erased for these PRs).

**Branch containment:** `6cfce59d` is reachable from `main`, `dev-Karo`, `development` (local), `Liana`, `origin/sipan`, etc.

**Tags:** No tags currently contain / label these commits (`git tag --contains 6cfce59d` empty).

---

## 6. Removed or renamed queues

Within reachable history:

- Exactly **four** BullMQ queue name constants were ever added: `reports.export-jobs`, `drive.zip-export-jobs`, `mail`, `whatsapp.product-groups`.
- No evidence of a deleted fifth BullMQ queue name or deleted BullMQ worker file that previously existed under another name.
- No rename of those four string literals detected via `-S` / `-G` on queue name strings (names stable from introduction).
- `origin/development` was **deleted on remote** after fetch prune; local `development` still exists. History of commits remains reachable via `main` / merge ancestry — introduction commits are **not** missing solely because of that branch deletion.
- Local reflog confirms Phase 3 / mail / whatsapp commits as normal local commits on this machine; reflog is supplementary only and does not contradict object history.

`mail-outbound-queue*.ops.ts` and `notification-enqueue-reconcile*` are **not** BullMQ `new Queue` producers; they are domain/ops helpers around mail outbound / notification enqueue reconciliation.

---

## 7. Limitations

1. **Author ≠ physical author:** Commits tagged `Made-with: Cursor` / `Co-authored-by: Cursor` mean AI assistance may have contributed; Git cannot prove who typed the code.
2. **`gh` CLI unavailable:** PR metadata came from public GitHub REST API; private review comments / check runs not fully audited.
3. **Placeholder-looking author email** on Karo commits: `kargabrielyan@example.com` vs merge identity `karogabrielyan@neetrino.com` — identities are related by name/login but emails differ.
4. **PR #54 opener ≠ commit author:** GitHub PR user SipanBabajanyan; commit author Karo Gabrielyan.
5. **Remote `origin/development` deleted:** does not remove objects already merged to `main`, but any **unmerged** development-only experiments would be invisible if never fetched.
6. **No tags** for release pinning of BullMQ introduction.
7. **Force-push / rewrite:** no proof of force-push from reachable objects; cannot assert none ever happened on deleted branches.
8. **`git blame` not used as primary authorship proof** (lines later reformatted in Phase 3).
9. **Shallow clone:** not applicable (`is-shallow-repository=false`).

---

## 8. Final verdict

```text
Based on reachable Git history, BullMQ first appeared in commit
6cfce59d985eb8b5c4a519455a1ae733b09d96e7,
authored by SipanBabajanyan, committed by SipanBabajanyan,
on 2026-04-30T15:29:21+04:00,
initially for report export processing (queue reports.export-jobs),
and entered main via PR #11 (neetrino/development → main) on 2026-05-01.

The same commit added the npm dependency, the first Queue producer,
the first Worker consumer, and the first queue.add enqueue path.

Phase 3 commits 25ef5633 / 838e5fb5 / 1482c3de (Karo Gabrielyan, PR #108)
only reworked existing BullMQ usage (process roles, dedicated worker,
connection/concurrency/retention configuration and docs); they did not
introduce BullMQ.
```

)
