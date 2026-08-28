# AI Admin and Connections UX

## Purpose

Define one central administration surface for all NBOS AI connections while preserving contextual shortcuts inside Work Spaces and other modules.

## Core separation

The UI must distinguish two connection families:

1. `External Agent Connections`
   - Cursor
   - Codex
   - Claude Code
   - custom trusted machine clients
   - these receive NBOS-issued credentials and access NBOS capabilities/resources.

2. `Internal AI Provider Connections`
   - OpenAI
   - Anthropic
   - future model providers
   - these provide models used by NBOS internal AI runtime.

An external client connection is not the same thing as an internal model provider connection.

## Primary administration surface

Recommended top-level administrative route:

```text
AI & Agents (sidebar module at /ai-agents)
```

Legacy `Settings -> AI & Agents` redirects to the sidebar module. If product navigation later changes again, the same information architecture should remain valid.

Recommended sections:

- Overview
- External Agents
- Providers
- Models
- Internal Agents (future/runtime)
- Model Policies / Routing
- Approvals (future)
- Usage (future)
- Audit / Activity

## Overview

Show operational status, not vanity metrics:

- active external agents;
- connected providers;
- active/internal model policies;
- failed/revoked connections requiring attention;
- recent agent/provider activity;
- pending approvals when implemented.

## External Agents list

List fields:

- name;
- purpose;
- owner;
- status;
- granted resource summary;
- granted capability summary;
- credential status/expiry;
- last used;
- actions.

Actions:

- Create External Agent;
- Disable / Re-enable;
- Revoke;
- Manage access;
- Rotate credential;
- View audit.

## External Agent detail

Recommended tabs/sections:

### General

- name;
- description/purpose;
- owner;
- state;
- actor expiry if configured.

### Access

Show grants as two separate dimensions:

```text
WHAT: capabilities
WHERE: resource scopes
```

Never present a single vague `Full access` toggle for external agents.

Resource selector should support the architecture's scope types. Phase 1 UI emphasizes Work Spaces, but Project/Product/other module scopes can appear when corresponding capabilities exist.

### Capabilities

Phase 1 coding-agent capabilities may include:

- list/read Tasks;
- read task discussion;
- read linked Drive artifacts;
- start Task;
- create Task when explicitly granted;
- update explicitly allowed Task fields when explicitly granted;
- add comment/progress;
- attach generated artifact;
- submit Review.

Task deletion is not available to external coding agents in the initial release.

Completion remains controlled by normal Tasks workflow/review rules and should not be exposed as arbitrary force-complete.

### Credentials

- token prefix;
- created at;
- expires at;
- last used;
- Rotate;
- Revoke;
- Create additional credential if the runtime supports safe multi-credential rotation;
- **Connect client** on the same card: REST API URL, MCP URL, and **Copy MCP config** (always available; the page snippet reads `NBOS_AGENT_TOKEN` from env);
- **Copy .env** only in the one-time Issue/Rotate dialog: two `KEY="value"` lines, URL then token (`NBOS_AGENT_API_URL`, `NBOS_AGENT_TOKEN`), shown in the dialog and copied as a block. The control is not shown when the secret is unavailable.

Raw secret is displayed only once at creation/rotation. MCP is optional: API-only clients copy .env from that dialog and never need the MCP snippet.

The copied API URL is the Nest origin (`NEXT_PUBLIC_BACKEND_URL` / `/api/v1/agent`), never the employee dashboard origin. The web BFF strips `Authorization` and cannot authenticate External Agents.

### Activity

- audit history;
- recent authenticated requests/operations where appropriate;
- policy denials useful for administration without leaking secrets.

## Create External Agent flow

Recommended wizard/flow:

1. Name and purpose.
2. Select capabilities.
3. Select resource scopes (for Phase 1: one or more Work Spaces).
4. Optional expiration/rate policy.
5. Review effective access.
6. Create agent + issue credential.
7. One-time secret modal with the two `.env` lines (URL then token), **Copy**, and **Copy MCP config**.

The administrator must be able to create one agent with multiple Work Space grants.

## Contextual Work Space AI Access

Work Space Settings may expose:

```text
Work Space -> Settings -> AI Access
```

This is a contextual projection of the same central grants, not a separate authorization source.

It should show:

- external agents currently granted access to this Work Space;
- capability summary for each;
- grant existing agent access;
- revoke Work Space grant;
- link to full agent management.

Do not own token rotation/agent identity inside Work Space settings.

## Provider connections UI

`Providers` manages internal AI provider accounts.

List:

- provider (OpenAI, Anthropic, ...);
- connection name;
- status;
- last validated;
- last model sync;
- model count;
- actions.

Connection flow:

1. Choose provider.
2. Enter provider credential/config.
3. Validate connection.
4. Save encrypted secret.
5. Sync model catalog.
6. Display discovered models for review.

Actions:

- Validate;
- Rotate key;
- Disable;
- Sync models;
- View connection audit.

Never show saved raw provider API key.

## Models UI

`Models` is a normalized catalog across providers.

Filters:

- provider;
- status;
- modality/capability;
- suitability tag;
- active/disabled;
- newly discovered.

For each model show/administer:

- provider;
- external model id/display name;
- lifecycle status;
- discovered/last seen;
- relevant technical metadata;
- internal suitability tags;
- admin notes;
- approved for production yes/no.

Newly synced models should be easy to identify but must not automatically become active production routing candidates.

## Internal Agents UI

May be implemented when internal AI runtime starts, but its contract should be designed now.

An internal agent detail should eventually manage:

- name/purpose;
- actor policies/capabilities/scopes;
- system/prompt configuration reference;
- allowed tools/capabilities;
- Model Policy assignment;
- approval policy;
- status;
- audit/usage.

Examples:

- Client Messenger Agent;
- NBOS General Assistant;
- Delivery Assistant;
- Documents Assistant;
- Sales Analytics Agent;
- Marketing Analytics Agent.

## Model Policies / Routing UI

A Model Policy belongs to an internal AI use case/agent and controls execution model selection.

First version UI supports:

### FIXED

Select one active approved model.

### PRIMARY + FALLBACK

- primary model;
- ordered fallback models;
- candidates may come from one provider or multiple providers.

Future adaptive/tiered routing may add FAST/STANDARD/DEEP tiers without changing the agent identity/access model.

Example:

```text
Policy: Client Support
Mode: PRIMARY_FALLBACK
Primary: OpenAI / <approved model>
Fallback 1: Anthropic / <approved model>
```

## Module/use-case assignment

Business surfaces should assign an Internal Agent or Model Policy, not raw provider model IDs directly.

Preferred:

```text
Messenger -> Client Messenger Agent -> Client Support Model Policy
Documents -> Documents Assistant -> Documents Model Policy
Sales Analytics -> Sales Analytics Agent -> Analytics Model Policy
```

This keeps business permissions/prompts stable when models change.

## UX safety

High-impact operations require explicit confirmation:

- revoke agent;
- rotate external credential;
- disable provider used by active policies;
- remove a model used by a routing profile;
- change production model policy for a sensitive agent.

UI must show dependencies before destructive/availability-impacting changes.

## First release recommendation

Implement now:

- central `AI & Agents` shell;
- External Agents CRUD/access/credentials/activity;
- Work Space contextual AI Access projection;
- Providers connections for OpenAI/Anthropic;
- Models catalog + sync/review status;
- Model Policies with FIXED and PRIMARY_FALLBACK configuration.

Internal Agents configuration can initially be visible as foundation/limited management if the internal runtime is not yet enabled, but data contracts should be usable later without redesign.
