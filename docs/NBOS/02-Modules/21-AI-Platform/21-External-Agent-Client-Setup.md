# External Agent Client Setup

## Status

Operational setup guide for Phase 1 External Agents. Implements section X of
[`10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md`](10-Phase-1-AI-Foundation-and-External-Agent-Implementation.md)
and the client-setup goal in
[`09-External-Agent-API-and-MCP-Contract.md`](09-External-Agent-API-and-MCP-Contract.md) §18.

The REST namespace and the MCP endpoint are two adapters over one authorization path. Whatever an
agent may do over REST it may do over MCP, and nothing more.

---

## 1. What a client needs

Exactly two things:

| Item                 | Example                   |
| -------------------- | ------------------------- |
| NBOS base URL        | `https://app.example.com` |
| External Agent token | `nbosa_<keyId>_<secret>`  |

Nothing else is ever required, and nothing else may be requested:

- **no database credentials** — the agent never speaks to Postgres/Neon;
- **no SSH or VPS access** — the agent never reaches the host;
- **no Employee JWT, session cookie or admin login** — agent routes are a separate authentication
  boundary and an employee token is rejected by them;
- **no OpenAI/Anthropic or other provider API keys** — Phase 1 External Agents bring their own model
  runtime; NBOS provider credentials are a separate, internal concern;
- **no Credentials module, vault or secret access** — there is no capability that exposes one.

If a setup guide, script or client asks for any of the above in order to talk to NBOS, that is a
defect, not a configuration step.

## 2. Getting a token

An administrator creates the External Agent and its capability grants, then issues a credential. The
raw token is shown **once** at issuance or rotation; NBOS stores only its hash.

Treat it like a password:

- keep it in the client's secret store or an environment variable, never in a committed file;
- never place it in a URL — NBOS rejects query-string tokens outright, so a leaked access log cannot
  become a working credential;
- rotate or revoke it from the NBOS side; revocation takes effect immediately on both protocols.

A token grants only the capabilities and scopes the administrator granted. Holding a token is not
authorization for a Work Space or a Task.

---

## 3. Generic REST setup

Base path:

```text
https://<nbos-host>/api/v1/agent
```

Authentication on every request:

```http
Authorization: Bearer <agent-token>
```

Check connectivity and identity:

```bash
curl -sS https://<nbos-host>/api/v1/agent/me \
  -H "Authorization: Bearer $NBOS_AGENT_TOKEN"
```

```json
{
  "data": {
    "agentId": "…",
    "agentName": "Cursor Coding Agent",
    "actorType": "EXTERNAL_AGENT",
    "credentialKeyId": "…",
    "channel": "rest",
    "correlationId": "…"
  }
}
```

`GET /me` reports who you are. It does **not** list your capabilities: discovery is not
authorization, and an effective-permission list would only help an attacker holding a stolen token.

### Endpoints

| Method  | Path                                      | Capability                 |
| ------- | ----------------------------------------- | -------------------------- |
| `GET`   | `/me`                                     | —                          |
| `GET`   | `/workspaces`                             | `workspaces.read`          |
| `GET`   | `/workspaces/{workspaceId}`               | `workspaces.read`          |
| `GET`   | `/workspaces/{workspaceId}/tasks`         | `tasks.list`               |
| `POST`  | `/workspaces/{workspaceId}/tasks`         | `tasks.create`             |
| `GET`   | `/tasks/{taskId}`                         | `tasks.read`               |
| `PATCH` | `/tasks/{taskId}`                         | `tasks.update`             |
| `POST`  | `/tasks/{taskId}/start`                   | `tasks.start`              |
| `POST`  | `/tasks/{taskId}/comments`                | `tasks.comment`            |
| `POST`  | `/tasks/{taskId}/submit-review`           | `tasks.submit_review`      |
| `GET`   | `/tasks/{taskId}/discussion`              | `tasks.read_discussion`    |
| `GET`   | `/tasks/{taskId}/artifacts`               | `drive.read_task_artifact` |
| `GET`   | `/tasks/{taskId}/artifacts/{fileAssetId}` | `drive.read_task_artifact` |
| `POST`  | `/tasks/{taskId}/artifacts`               | `tasks.attach_artifact`    |

There is no delete endpoint, no arbitrary status assignment and no force-completion. Final
acceptance of a task stays a human decision.

The full generated contract is served at `/api/docs` in non-production environments under the
**External Agent** tag.

### Responses

A page:

```json
{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": 0 } }
```

A single record:

```json
{ "data": { "id": "…" } }
```

A failure:

```json
{ "error": { "code": "AGENT_RESOURCE_NOT_AVAILABLE", "message": "…", "requestId": "…" } }
```

`AGENT_RESOURCE_NOT_AVAILABLE` deliberately covers both "does not exist" and "exists but is not
yours". Do not try to distinguish them; the API will not tell you.

### Idempotency

Every mutating call requires a stable key:

```http
Idempotency-Key: <stable-client-operation-id>
```

Reuse the same key when retrying the same operation. NBOS returns the original result instead of
creating a second task, comment, artifact or transition. Reusing a key with a _different_ payload is
rejected with `AGENT_IDEMPOTENCY_CONFLICT`.

### Correlation

Send `X-Correlation-Id` to join your traces to NBOS audit. If you omit it, NBOS mints one. It is
echoed on every response and appears as `requestId` in error bodies.

### Task lifecycle

```text
list/read → (create/update) → start → work → comment → attach artifacts → submit-review → human review
```

`PATCH /tasks/{taskId}` accepts only `title`, `description`, `priority` and `dueDate`, and requires
`expectedUpdatedAt` — the `updatedAt` value you last read. If a human changed the task meanwhile you
get `AGENT_CONFLICT`; re-read and retry rather than overwriting.

### Attaching an artifact

```bash
curl -sS -X POST https://<nbos-host>/api/v1/agent/tasks/$TASK_ID/artifacts \
  -H "Authorization: Bearer $NBOS_AGENT_TOKEN" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"report.md","mimeType":"text/markdown","sizeBytes":128,
       "contentBase64":"'"$(base64 < report.md)"'"}'
```

Content is base64 in `contentBase64`, at most 512 KiB decoded. Larger deliverables should be
summarized or split in Phase 1.

---

## 4. MCP setup

Endpoint (Streamable HTTP, stateless):

```text
https://<nbos-host>/api/v1/agent/mcp
```

Authentication is the same bearer credential, sent as an HTTP header. The server resolves it to the
same actor and the same capabilities as REST.

### Tools

```text
nbos_get_identity          nbos_list_workspaces       nbos_get_workspace
nbos_list_tasks            nbos_get_task              nbos_create_task
nbos_update_task           nbos_start_task            nbos_get_task_discussion
nbos_add_task_comment      nbos_list_task_artifacts   nbos_get_task_artifact
nbos_attach_task_artifact  nbos_submit_task_review
```

Mutating tools take a `clientOperationId` argument — the MCP equivalent of `Idempotency-Key`, with
identical behaviour. `nbos_attach_task_artifact` takes `contentBase64`.

A tool appearing in `tools/list` does not mean it is permitted on a given Work Space or Task. Every
call is authorized server-side, and a denial arrives as a tool result with `isError: true` and the
same stable code REST would have returned.

### Cursor

`.cursor/mcp.json` in the project, or the global `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "nbos": {
      "url": "https://<nbos-host>/api/v1/agent/mcp",
      "headers": {
        "Authorization": "Bearer ${env:NBOS_AGENT_TOKEN}"
      }
    }
  }
}
```

Export `NBOS_AGENT_TOKEN` in your shell profile so the token itself is never committed. Reload the
MCP server from Cursor settings and confirm the NBOS tools are listed.

### Claude Code

```bash
claude mcp add --transport http nbos https://<nbos-host>/api/v1/agent/mcp \
  --header "Authorization: Bearer $NBOS_AGENT_TOKEN"
```

Verify with `/mcp` inside Claude Code. Add `--scope project` to share the server definition with a
repository (keep the token in the environment, not in the committed config).

### Codex

Codex reads `~/.codex/config.toml`:

```toml
[mcp_servers.nbos]
url = "https://<nbos-host>/api/v1/agent/mcp"

[mcp_servers.nbos.http_headers]
Authorization = "Bearer ${NBOS_AGENT_TOKEN}"
```

If your Codex build does not support a remote MCP server, use the REST namespace in section 3
directly — it is the same authorization path and the same capabilities.

### Any other MCP client

The endpoint is a plain Streamable HTTP MCP server. A client needs to POST JSON-RPC 2.0 to the URL
with the `Authorization` header and support `initialize`, `tools/list` and `tools/call`. Phase 1
offers no server-initiated stream, so `GET` on the endpoint answers `405`; this is expected and is
not an error in your configuration.

---

## 5. Troubleshooting

| Symptom                                   | Meaning                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| `401 AGENT_AUTH_INVALID`                  | Missing, malformed or unknown token. Check the `Authorization` header.        |
| `401 AGENT_CREDENTIAL_REVOKED`/`_EXPIRED` | The credential is no longer usable. Ask an administrator to rotate it.        |
| `403 AGENT_DISABLED`                      | The agent itself is disabled, revoked or expired.                             |
| `403 AGENT_CAPABILITY_DENIED`             | The capability is not granted. Ask for the specific grant, not a broader one. |
| `404 AGENT_RESOURCE_NOT_AVAILABLE`        | Missing, out of scope, or above the classification an agent may read.         |
| `400 AGENT_VALIDATION_FAILED`             | Unknown field, bad enum, bad date, or a missing idempotency key.              |
| `409 AGENT_CONFLICT`                      | Stale `expectedUpdatedAt`, or the same operation is already running.          |
| `409 AGENT_IDEMPOTENCY_CONFLICT`          | The key was reused with a different payload. Use a new key.                   |
| `413 AGENT_VALIDATION_FAILED`             | Request body is larger than the agent payload limit (see section 5.1).        |
| `429 AGENT_RATE_LIMITED`                  | Budget exhausted. Wait for `Retry-After` seconds (see section 5.1).           |

Quote the `requestId` from the error body when reporting a problem — it matches the correlation id
recorded in NBOS audit.

### 5.1. Rate limits and payload size

Budgets are charged to your agent identity, not to your IP address, and REST and MCP share the same
counters — moving the same traffic to the other protocol does not buy more capacity.

| Budget                            | Value per 60 s window |
| --------------------------------- | --------------------- |
| Requests per agent                | 600                   |
| Read capabilities                 | 300                   |
| Ordinary write capabilities       | 60                    |
| Sensitive writes (create, attach) | 20                    |
| Concurrent invocations            | 8 in flight           |
| Request body                      | 768 KiB               |
| JSON-RPC messages per MCP request | 20                    |

Every response carries the per-agent request budget:

```text
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 597
X-RateLimit-Reset: 1766142000
```

A `429` additionally carries `Retry-After` in seconds. Treat it as authoritative: retry after that
delay with the same `Idempotency-Key`, and do not retry in a tight loop. An oversized body is
rejected with `413` before any domain action runs, so split large artifacts instead of retrying.

**MCP clients read the back-off from the body, not from the header.** Only a refusal decided before
the JSON-RPC message runs — the pre-auth throttle and the per-agent request budget — reaches you as
HTTP `429` with `Retry-After`. A capability-class budget or a concurrency limit is charged per
`tools/call`, so one HTTP request can carry both admitted and refused messages; those refusals come
back as a JSON-RPC tool error inside HTTP `200`, carrying `AGENT_RATE_LIMITED` and
`retryAfterSeconds` in the error object. Read `retryAfterSeconds` from every tool error and treat it
exactly as you would treat `Retry-After`.

---

## 6. Related documents

- [`08-External-Agent-Protocols-REST-and-MCP.md`](08-External-Agent-Protocols-REST-and-MCP.md) — why both protocols exist.
- [`09-External-Agent-API-and-MCP-Contract.md`](09-External-Agent-API-and-MCP-Contract.md) — canonical transport contract.
- [`03-External-Agent-Access.md`](03-External-Agent-Access.md) — agent identity, credentials and grants.
- [`05-AI-Data-Security-and-Audit.md`](05-AI-Data-Security-and-Audit.md) — what is recorded about each call.
