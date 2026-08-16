# ATS.am Active Call — NBOS Integration (MVP)

## Purpose

Receive **Active Call** webhooks from [ATS.am](https://ats.am/hy/api_document) and:

1. Create CRM **Leads** for new inbound callers.
2. Return optional **`redirect_call`** (SIP ID) so ATS routes known callers to the responsible employee.

**Out of scope (this MVP):** click-to-call callback API, call history / recording download, seller realtime pop-up, MarketingAccount mapping by DID (`input`).

## Endpoint

| Item    | Value                                                        |
| ------- | ------------------------------------------------------------ |
| Method  | `POST`                                                       |
| Path    | `/api/integrations/ats/webhook`                              |
| Auth    | Query `key` must equal env `ATS_API_KEY`                     |
| Body    | `application/x-www-form-urlencoded` or `multipart/form-data` |
| Success | HTTP `200` + JSON body (see Response)                        |

Production example:

`https://nbos.neetrino.com/api/integrations/ats/webhook?key=…`

### Response

`redirect_call` is a **field on our webhook response** (not a separate request to `account.ats.am`). ATS waits for this JSON and uses it for call routing.

| Case                                                   | Body                                                |
| ------------------------------------------------------ | --------------------------------------------------- |
| Unknown caller / no usable SIP / finish·end / outbound | `{ "status": "success" }`                           |
| Inbound `state=start` + known Contact or Lead with SIP | `{ "status": "success", "redirect_call": "<sip>" }` |

Example SIP value: `"3126107"` — taken from `Employee.sipId`, never hardcoded.

## Environment

| Variable      | Required             | Notes                                                                     |
| ------------- | -------------------- | ------------------------------------------------------------------------- |
| `ATS_API_KEY` | When webhook is used | Optional at API boot. Unset → webhook `503`. Wrong/missing `key` → `401`. |

Do not commit secrets. Configure in deployment env / local `.env` only.

## ATS payload fields (contract)

`state`, `uid`, `input`, `clid`, `op`, `rate`, `billsec`, `calldirect`, `disposition`, `channel`, `record_link`

| Field         | Semantics                                                    |
| ------------- | ------------------------------------------------------------ |
| `state`       | `start` \| `status` (answered) \| `finish` \| `end`          |
| `calldirect`  | `"0"` inbound, `"1"` outbound                                |
| `disposition` | `ANSWERED` \| `NO ANSWER`                                    |
| `uid`         | Unique call id (idempotency key)                             |
| `clid`        | Caller number                                                |
| `input`       | DID / number called (future MarketingAccount mapping — TODO) |

## NBOS behavior

| Case                                                                            | Behavior                                                                                                       |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Inbound (`calldirect=0`) + `state=start` (or first non-terminal sight of `uid`) | Normalize `clid` (AM defaults via shared phone helper) → reuse open Lead with same phone, else **create Lead** |
| Same `uid` again                                                                | Update `AtsCallEvent` only; **never** second Lead for that call                                                |
| Finish / end                                                                    | Update `AtsCallEvent` only; **no** `redirect_call`                                                             |
| Outbound (`calldirect=1`)                                                       | Store event; **no Lead**; **no** `redirect_call`                                                               |
| Wrong key                                                                       | `401`, no Lead                                                                                                 |
| `ATS_API_KEY` unset                                                             | `503`                                                                                                          |

### `redirect_call` (inbound `state=start` only)

1. Normalize `clid` with the same helper as Lead ingest (`ats-phone.util` / AM WhatsApp defaults).
2. Lookup by phone variants:
   - **Contact first** (`Contact.phone`, non-trashed). Schema has a single phone per Contact (no additional-phone array).
   - Else **Lead** (`Lead.phone`, non-trashed).
3. Resolve responsible **Employee** SIP:
   - **Lead:** `Lead.assignedTo` → `Employee.sipId`.
   - **Contact:** Contact has **no** `ownerId` / `assignedTo` in CRM schema. Decision: use most recently updated non-trashed **Deal** linked by `Deal.contactId` or `DealAdditionalContact` → `Deal.sellerId` → `Employee.sipId`. Fallback: most recent non-trashed **Lead** with `contactId` = Contact and `assignedTo` set.
4. If entity found but no assignee / empty `sipId` → respond without `redirect_call` and log (`ats_redirect_skipped`).
5. New / unmatched number → `{ "status": "success" }` only; Lead create path unchanged.

### Employee SIP profile

| Field            | Storage                        | Editable                                                           |
| ---------------- | ------------------------------ | ------------------------------------------------------------------ |
| `Employee.sipId` | `employees.sip_id` (`String?`) | HR employee sheet; also `PUT /me/profile` and `PUT /employees/:id` |

### Lead fields (create)

| Field                  | Value                                           |
| ---------------------- | ----------------------------------------------- |
| `source`               | `MARKETING`                                     |
| `sourceDetail`         | `ATS`                                           |
| `phone`                | E.164-style `+{digits}` after normalization     |
| `contactName` / `name` | `Incoming call {phone}`                         |
| `code`                 | Same `L-{year}-{nnnn}` generator as Meta ingest |

### Explicit non-goals

- **Contact is not created on call.** Contact appears later on SQL / Clients canon (same stance as Meta DM MVP).
- Full call-tracking / Marketing attribution by DID is future (Marketing docs); leave DID → MarketingAccount as TODO in code.
- ATS callback / history / call-record APIs are out of scope.

## Persistence

`AtsCallEvent` — unique `uid`; tracks latest `state`, `disposition`, `billsec`, `record_link`, `clid`, `input`, `calldirect`, optional `leadId`.

## Related

- Meta DM Lead ingest pattern: `08-Meta-Messaging-Identity-and-Lead-Dedup.md`
- External services overview: `04-External-Services.md`
- Lead pipeline: `../02-Modules/01-CRM/02-Lead-Pipeline.md`
