# 04 — Topic Lifecycle

## Guarantees

| Invariant                                                    | Guaranteed?                              | Evidence                                                                        |
| ------------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------- |
| Project exists ⇒ PROJECT_GENERAL exists                      | **NO**                                   | DB: 14 projects, 9 PROJECT_GENERAL; no messenger hook in `ensureProjectForDeal` |
| Deal exists ⇒ DEAL conversation                              | **NO**                                   | Only on ensure DEAL                                                             |
| Product ⇒ PRODUCT conversation                               | **NO**                                   | Only on ensure PRODUCT                                                          |
| Task ⇒ TASK conversation                                     | **NO**                                   | Only on ensure TASK                                                             |
| Opening L1 entity ⇒ primary conversation exists after ensure | **Intentional yes** (if ensure succeeds) | `selectEntity` → `ensureConversation`                                           |

## Lifecycle per type

### PROJECT_GENERAL

```
Project created (CRM bootstrap / elsewhere)
  → NO messenger create
User selects PROJECT in L1
  → POST ensure PROJECT_GENERAL (idempotent by canonicalKey)
  → appears in L2 after list
Can disappear from UI when: tab reset, ACL filter, stale refresh wipe, status not ACTIVE/ARCHIVED
Never auto-archived on project trash in messenger code (UNKNOWN if orphans remain)
```

### PRODUCT / DEAL / TASK

Same lazy pattern. Appear under All→Project tree only after materialization.

### DIRECT

Created on ensure when selecting Direct bucket peer (or API ensure). Listed via participants.

### INTERNAL_GROUP

Created by **backfill** (or theoretically other writers). Not in ensure DTO types for nav. On All tab, appended to L2 for **any** selected entity that uses `includeInternalGroups: true` — including projects (**IMPLEMENTATION_LEAK / UNKNOWN_PRODUCT_DECISION**).

## Ensure idempotency

- Lookup `findUnique({ where: { canonicalKey } })` then `create`.
- Unique on `canonicalKey` prevents durable duplicates.
- **Not transactional:** concurrent ensure can race → one create fails (P2002) — caller may see error (**CONFIRMED_FROM_CODE** pattern; no retry wrapper found).
- Backfill reuses **legacy id** as conversation id; ensure creates **new UUID** if key missing → **ensure-before-backfill hazard**.

## Who calls ensure

| Caller                                                   | When                                 |
| -------------------------------------------------------- | ------------------------------------ |
| Web `useMessengerNavigation.selectEntity`                | L1 click (not DIRECT_BUCKET)         |
| Any API client of `POST /messenger/conversations/ensure` | Manual/future embeds                 |
| **Not** project/deal/product/task create services        | CONFIRMED_FROM_CODE (CRM grep empty) |
