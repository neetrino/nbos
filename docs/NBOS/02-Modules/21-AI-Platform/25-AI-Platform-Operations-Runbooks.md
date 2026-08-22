# AI Platform Operations Runbooks

Operational procedures for a live NBOS AI Platform: External Agent credentials, provider keys,
policy denials and model catalog synchronization. Product behaviour lives in the canon documents;
this file is what an operator follows during a rotation, an incident or a support question.

Audience: CEO / Admin / Security and whoever holds `COMPANY` + `EDIT`.

Entry point in the product: `Settings → AI & Agents` (`/settings/ai-agents`). Every action below is
also an `/api/ai-admin` endpoint, so it can be executed without the UI if needed.

Ground rules for every procedure here:

- raw tokens and provider keys are shown once, at creation, and are never redisplayed;
- no procedure requires reading a secret back out of NBOS — if a value is lost, rotate it;
- every step below writes an `AuditLog` row with the acting employee;
- `REVOKED` is terminal for agents and credentials. It is not an "off" switch, it is a one-way door.

---

## 1. External Agent token rotation and revocation (checklist 652)

### 1.1. Planned rotation

Use for scheduled hygiene, staff change on the consuming side, or a token that is simply old.

1. `Settings → AI & Agents → External Agents → <agent> → Credentials`.
2. Rotate the active credential
   (`POST /api/ai-admin/external-agents/:id/credentials/:credentialId/rotate`).
3. Copy the new token once and hand it to the agent owner over an approved channel.
4. Have the consumer replace the token and confirm one successful call.

Rotation issues a new credential linked to the previous one; it never extends the old secret.

**Cutover is immediate by default.** Rotating from the UI revokes the previous credential in the
same transaction, so plan the swap for a moment when the consumer can update its configuration. If
the consumer needs a grace window, call the endpoint directly with `previousValidUntil` — the old
credential then keeps authenticating until that timestamp, capped at 24 hours and never beyond its
own expiry:

```json
{ "previousValidUntil": "2026-08-23T09:00:00.000Z" }
```

When you use a grace window, revoke the old credential
(`POST /api/ai-admin/external-agents/:id/credentials/:credentialId/revoke`) as soon as the consumer
confirms the new token works, instead of waiting for the window to lapse.

### 1.2. Immediate revocation of one credential

`POST /api/ai-admin/external-agents/:id/credentials/:credentialId/revoke`.

The next REST request and the next MCP invocation with that token fail with
`AGENT_CREDENTIAL_REVOKED`. There is no cache to wait out.

### 1.3. Stopping an agent completely

| Goal                                        | Action          | Reversible                   |
| ------------------------------------------- | --------------- | ---------------------------- |
| Pause an agent, keep its grants and history | Disable         | Yes, via Enable              |
| Permanently retire an agent                 | Revoke          | No — terminal                |
| Time-box an agent                           | Set `expiresAt` | Yes, by extending the expiry |

Disable blocks every credential of that agent at once, including credentials issued later.

Expiry behaves differently depending on how the agent stopped:

- An agent that only **timed out** — status `EXPIRED`, or still `ACTIVE` with an elapsed `expiresAt`
  — becomes live again as soon as you extend `expiresAt`. No separate Enable is needed, because it
  was never disabled by a human decision.
- An agent that an administrator **disabled** cannot be enabled while its expiry has passed. Extend
  the expiry first, then Enable. This stops a disabled-and-expired agent from becoming live again as
  a side effect of an unrelated edit.

Before extending expiry, confirm which of the two states you are in: extending the expiry of a
timed-out agent restores traffic immediately.

---

## 2. Leaked External Agent token (checklist 653)

Treat any token that appeared in a chat, ticket, screenshot, log, CI output or public repository as
compromised, even without evidence of use.

### 2.1. Contain (minutes, not hours)

1. Revoke the leaked credential
   (`POST /api/ai-admin/external-agents/:id/credentials/:credentialId/revoke`).
2. If you cannot identify which credential leaked, disable the agent
   (`POST /api/ai-admin/external-agents/:id/disable`) — this blocks all of its credentials.
3. Only then start investigating. Containment does not wait for analysis.

Identify the credential from the token prefix: credential lists show `tokenPrefix`, and the full
secret is never stored, so prefix matching is the intended lookup.

### 2.2. Assess exposure

Open `Settings → AI & Agents → <agent> → Activity`
(`GET /api/ai-admin/external-agents/:id/activity`) and the Audit log filtered by that agent.

Answer three questions:

- **What could it have done?** The agent's capability grants, not what it usually does.
- **Where could it have done it?** Its active resource scopes.
- **What did it actually do?** `AGENT_CAPABILITY_INVOKED` rows, with protocol and correlation id.

Because scope is per agent, a leaked token cannot reach a Work Space that was never granted. That
bounds the blast radius without further investigation.

### 2.3. Recover

1. Issue a fresh credential and deliver it over an approved channel.
2. Narrow the grants if the incident showed the agent held more than it needed.
3. Record the incident: what leaked, where it leaked, when it was revoked, what it touched.
4. If the leak was in a repository or CI, purge the source as well — revoking in NBOS does not
   remove the string from the other system's history.

The vault boundary holds throughout: an agent token never had access to Credentials secrets, client
passwords or Employee APIs, so a leak here is not a vault incident.

---

## 3. Provider key rotation (checklist 654)

Applies to OpenAI and Anthropic connections under `Settings → AI & Agents → Providers`.

### 3.1. Planned rotation

1. Create the replacement key in the provider console.
2. `Providers → <connection> → Replace key`, paste the new key and validate it
   (`POST /api/ai-admin/providers/:id/validate-replacement`).
3. Only after a successful preflight, confirm the rotation
   (`POST /api/ai-admin/providers/:id/rotate`).
4. Revoke the old key in the provider console.

Preflight validates the candidate key against the live provider before anything is stored, so a
typo cannot replace a working key with a broken one. Both the successful and the failed preflight
write `PROVIDER_KEY_PREFLIGHT_VALIDATED`, so a burst of failures is visible in Audit.

### 3.2. Compromised provider key

1. Disable the connection (`POST /api/ai-admin/providers/:id/disable`) — this stops NBOS from using
   it while you work. The disable-impact dialog names the Model Policies and Internal Agents that
   depend on it, so you know what stops.
2. Revoke the key in the provider console. NBOS disabling it does not revoke it upstream.
3. Rotate to a new key as in 3.1 and re-enable the connection.
4. Review provider-side usage for the exposure window.

### 3.3. What NBOS guarantees

- The key is stored encrypted (AES-256-GCM v2, same key material as the Credentials vault) in
  `ai_provider_secrets`, never on the connection view.
- No endpoint returns a stored key. `keyPrefix` is the only visible fragment.
- The key never enters an AI prompt or an Internal Agent execution context.
- `lastValidatedAt` is only stamped while the connection is still `ACTIVE`, so a connection disabled
  during validation cannot end up looking freshly validated.

---

## 4. Policy denial and scope troubleshooting (checklist 655)

An agent reports an error. The external code is deliberately coarse; the internal reason is in the
Audit `AGENT_POLICY_DENIED` row for the same correlation id.

Ask the agent operator for the `requestId` from the error body. It is the audit correlation id.

| External code                           | Internal reasons behind it                                                                             | Usual fix                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `401 AGENT_AUTH_INVALID`                | `CREDENTIAL_INVALID`                                                                                   | Token is wrong or unknown. Re-deliver it.          |
| `401 AGENT_CREDENTIAL_REVOKED/_EXPIRED` | `CREDENTIAL_REVOKED`, `CREDENTIAL_EXPIRED`                                                             | Rotate (section 1.1).                              |
| `403 AGENT_DISABLED`                    | `AGENT_DISABLED`, `AGENT_REVOKED`, `AGENT_EXPIRED`                                                     | Enable, or extend expiry then enable.              |
| `403 AGENT_CAPABILITY_DENIED`           | `CAPABILITY_NOT_GRANTED`, `CAPABILITY_GRANT_EXPIRED`, `CAPABILITY_GRANT_REVOKED`, `CAPABILITY_UNKNOWN` | Grant the one capability that is missing.          |
| `404 AGENT_RESOURCE_NOT_AVAILABLE`      | `RESOURCE_OUT_OF_SCOPE`, `SCOPE_TYPE_NOT_ALLOWED`, `MODULE_RESTRICTED`, `DATA_CLASSIFICATION_*`        | Grant the Work Space scope, or accept the refusal. |
| `429 AGENT_RATE_LIMITED`                | `RATE_LIMITED`                                                                                         | Client backs off; see section 4.2.                 |

### 4.1. "The agent says the task does not exist, but I can see it"

That is the designed answer. Out-of-scope and non-existent resources return the identical error, so
an agent cannot probe for the existence of records it may not read. Check the agent's scopes rather
than the task.

Grant the narrowest scope that covers the work — normally the Work Space, from
`Settings → AI & Agents → <agent> → Scopes` or the contextual `Work Space → Settings → AI Access`.
Both write the same grant table; there is no second permission system to check.

Content never changes a decision. A task description, comment or attached file asking for more
access has no effect: the policy input carries no free text.

### 4.2. "The agent is being throttled"

Check which budget was hit before raising anything:

| Symptom                                     | Budget                                           |
| ------------------------------------------- | ------------------------------------------------ |
| 429 after a burst of reads                  | 300 read invocations/minute                      |
| 429 on writes while reads still work        | 60 ordinary writes or 20 sensitive writes/minute |
| 429 across everything                       | 600 requests/minute for that agent               |
| 429 under heavy parallelism, low total rate | 8 concurrent invocations                         |
| `413`                                       | 768 KiB body — split the artifact, do not retry  |

The correct client behaviour is to honour `Retry-After` and reuse the same `Idempotency-Key`.
Budgets are per agent, so a throttled agent never reduces employee API capacity, and moving traffic
from REST to MCP does not raise the ceiling.

MCP is the one exception to "look for a 429". A capability or concurrency refusal is decided per
`tools/call`, so it is returned as a JSON-RPC tool error inside HTTP `200` with `AGENT_RATE_LIMITED`
and `retryAfterSeconds` in the body; only the pre-auth throttle and the per-agent request budget,
which refuse the whole HTTP request, produce `429` with `Retry-After`. If an MCP client reports "no
throttling but everything fails", read the tool error body before assuming a platform fault.

Raising a limit is a code change to `agent-rate-limit.constants.ts`, not a runtime setting. Treat a
repeated ceiling as a signal to check for a client retry loop first.

---

## 5. Model sync and availability troubleshooting (checklist 656)

### 5.1. How the catalog moves

```text
provider list → DISCOVERED (new) → ACTIVE (explicit admin action)
             → metadata refresh only for known models
             → UNAVAILABLE when the provider stops listing it
```

Sync never activates anything, never deletes a row, and never promotes a returning model straight
back to `ACTIVE` — it comes back as `DISCOVERED` and needs an explicit activation.

### 5.2. "The new model is not in the list"

1. Run a sync: `Providers → <connection> → Sync models`
   (`POST /api/ai-admin/providers/:id/sync-models`), or `POST /api/ai-admin/models/sync-all`.
2. Look under `DISCOVERED`, not `ACTIVE`. The Models page groups them separately on purpose.
3. If it is still absent, the provider account does not list it. That is a provider-side entitlement
   question, not an NBOS one.

### 5.3. "The model disappeared / became UNAVAILABLE"

The provider stopped listing it. The row is kept with its history. Move the affected Model Policy to
another `ACTIVE` model; a `PRIMARY_FALLBACK` policy already survives this if its fallback is healthy.

### 5.4. "Scheduled sync is not running"

The scheduled catalog sync is a Nest cron on the **scheduler** process only:

| Fact           | Value                                                            |
| -------------- | ---------------------------------------------------------------- |
| Job name       | `ai-model-catalog-sync`                                          |
| Schedule       | `0 */6 * * *` (override: `SCHEDULER_AI_MODEL_CATALOG_SYNC_CRON`) |
| Runtime switch | `SchedulerJobPolicy` row for the job                             |
| Seed flag      | `SCHEDULER_AI_MODEL_CATALOG_SYNC_ENABLED`                        |
| Roster intent  | `off` — the job is opt-in, so the seeded default is disabled     |

The authoritative switch is the `SchedulerJobPolicy` row, not the environment variable. The env flag
only supplies the seeded default the first time a database has no row for this job; after that,
`Platform → Scheduler` (`PATCH /api/platform/scheduler/jobs/ai-model-catalog-sync`, `COMPANY` +
`EDIT`) is what turns it on or off.

Checklist when it does not run:

1. The process is `PROCESS_ROLE=scheduler` and `SCHEDULER_ENABLED` is on — otherwise every cron
   registers as paused, which the boot log states explicitly.
2. The `SchedulerJobPolicy` row for `ai-model-catalog-sync` is enabled. Because roster intent is
   `off`, a fresh environment seeds it disabled and it stays that way until someone enables it.
3. Only one scheduler holds the lease. A second instance skips the run instead of double-syncing.
4. To verify without waiting for the cron, trigger it manually from
   `POST /api/platform/scheduler/jobs/ai-model-catalog-sync/run`.

A failing connection is logged and reported per connection; it does not abort the sync for the
others. Manual sync from the Providers page always remains available.

A run that loses its lease — a stalled process, a heartbeat that could not reach the database —
stops instead of writing beside its successor. The connection is reported with `LEASE_LOST`, and the
run itself ends as `TIMED_OUT` whenever the heartbeat already noticed the loss. This is enforced in
the database, not only by the in-process signal: the
sync locks its `scheduler_leases` row for its own owner and fencing token as the first statement of
the write transaction, so a takeover either waits for that transaction to finish or has already
happened, in which case the older run commits nothing. A `LEASE_LOST` outcome therefore never leaves
a partially written catalog; the next scheduled or manual run re-syncs from the provider.

---

## 6. Related documents

- [`03-External-Agent-Access.md`](03-External-Agent-Access.md) — agent identity, credentials, grants.
- [`05-AI-Data-Security-and-Audit.md`](05-AI-Data-Security-and-Audit.md) — what is recorded.
- [`06-AI-Providers-Models-and-Routing.md`](06-AI-Providers-Models-and-Routing.md) — catalog and routing canon.
- [`21-External-Agent-Client-Setup.md`](21-External-Agent-Client-Setup.md) — the consumer-side setup and limits.
- [`10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md`](10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md) — implementation checklist.
