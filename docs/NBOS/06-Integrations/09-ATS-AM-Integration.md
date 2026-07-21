# ATS.am Active Call — NBOS Integration (MVP)

## Purpose

Receive **Active Call** webhooks from [ATS.am](https://ats.am/hy/api_document) and create CRM **Leads** for new inbound callers.

**Out of scope (this MVP):** click-to-call callback API, call history / recording download, seller realtime pop-up, MarketingAccount mapping by DID (`input`).

## Endpoint

| Item    | Value                                                        |
| ------- | ------------------------------------------------------------ |
| Method  | `POST`                                                       |
| Path    | `/api/integrations/ats/webhook`                              |
| Auth    | Query `key` must equal env `ATS_API_KEY`                     |
| Body    | `application/x-www-form-urlencoded` or `multipart/form-data` |
| Success | HTTP `200` + `{ "status": "success" }`                       |

Production example:

`https://nbos.neetrino.com/api/integrations/ats/webhook?key=…`

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
| Finish / end                                                                    | Update `AtsCallEvent` only                                                                                     |
| Outbound (`calldirect=1`)                                                       | Store event; **no Lead**                                                                                       |
| Wrong key                                                                       | `401`, no Lead                                                                                                 |
| `ATS_API_KEY` unset                                                             | `503`                                                                                                          |

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

## Persistence

`AtsCallEvent` — unique `uid`; tracks latest `state`, `disposition`, `billsec`, `record_link`, `clid`, `input`, `calldirect`, optional `leadId`.

## Related

- Meta DM Lead ingest pattern: `08-Meta-Messaging-Identity-and-Lead-Dedup.md`
- External services overview: `04-External-Services.md`
- Lead pipeline: `../02-Modules/01-CRM/02-Lead-Pipeline.md`
