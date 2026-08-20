# AI Actors, Identity and Access

## 1. Actor model

AI authorization must operate on a first-class actor identity.

Recommended conceptual model:

```text
Actor
- id
- type
- displayName
- status
- organizationId
- createdBy
- metadata
```

Actor types are defined by the platform architecture canon.

The exact Prisma shape may use separate subtype records, but all policy and audit APIs must consume one normalized ActorContext.

## 2. External Agent

External Agent represents Cursor, Codex, Claude, a custom integration, or another trusted machine client.

Minimum properties:

- stable id;
- name;
- description/purpose;
- owner employee;
- enabled/disabled/revoked status;
- created/updated timestamps;
- optional expiry;
- credential records;
- capability grants;
- resource scopes;
- last used timestamp;
- last used IP/client metadata where appropriate.

## 3. Credentials

Agent credentials are independent from human JWT/session credentials.

Rules:

- generate high-entropy opaque secrets;
- show the full token only at creation/rotation time;
- store a secure hash, not plaintext;
- support prefix/id for lookup;
- support rotation without changing agent identity;
- allow multiple credentials temporarily during controlled rotation;
- support immediate revoke;
- never log raw token values;
- never store token in Audit `changes`.

## 4. Capability grants

Capability grant answers: `what may this actor do?`

Examples:

- tasks.read
- tasks.update
- tasks.submit_review
- drive.read_linked_file

A capability grant alone does not grant access to all matching resources.

## 5. Resource scopes

Resource scope answers: `where may this actor do it?`

Phase 1 scopes should support at minimum:

- organization;
- project;
- product;
- workspace;
- explicit resource when needed.

Prefer narrow grants. For development agents, `workspace` is the default scope.

## 6. Policy evaluation

Every protected operation evaluates:

- actor status;
- credential validity;
- capability grant;
- resource scope;
- module-level restrictions;
- data classification;
- requested action risk;
- approval requirement;
- rate limit / usage limits.

Default outcome is DENY.

## 7. Delegation

If a human explicitly starts an AI operation, runtime may include:

```text
actor = INTERNAL_AI / EXTERNAL_AGENT
onBehalfOf = USER:<employeeId>
```

Delegation never gives the AI broader rights than its own policy allows.

## 8. Existing Platform Access Foundation

Do not replace `RoleAccessPolicy`, `EmployeeAccessOverride`, `ProjectTeamMember`, `ProductTeamMember` or `ResourceAccessGrant` for humans.

AI Platform should reuse participation/resource resolution logic where appropriate, but machine principals must not be forced into `employeeId` columns.

Where a shared generic grant model is later introduced, migration must preserve existing human behavior.

## 9. Authentication errors

External API must distinguish safe machine-readable failures such as:

- invalid credential;
- revoked credential;
- expired credential;
- missing capability;
- out-of-scope resource;
- approval required;
- rate limited;
- resource unavailable.

Do not leak existence of unauthorized records through detailed errors.
