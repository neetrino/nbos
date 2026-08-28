# Messenger Rebuild — Final Independent Acceptance

> Status: **final release gate**.
>
> Execute only after Slices 0–11 in `11-Messenger-Rebuild-Implementation-Checklist.md` are `VERIFIED`.
>
> The acceptance reviewer must be independent from the implementation flow and must treat all slice handoffs/status claims as assertions to verify, not evidence.

## 1. Final outcome

Only two final outcomes are allowed:

```text
ACCEPTED
REJECTED
```

`ACCEPTED WITH KNOWN CRITICAL GAP` is not allowed.

Non-critical future features may remain outside the rebuild scope only if they do not violate approved canon or leave unsafe legacy dependencies.

---

## 2. Required review inputs

Reviewer reads:

- `00-Messenger-Overview.md`;
- `01-Internal-Messenger.md`;
- `02-External-Messenger-and-CRM-Inbox.md`;
- `03-Messenger-Architecture.md`;
- `04-Messenger-Integrations.md`;
- `05-Messenger-Permissions-and-UX.md`;
- `06-Messenger-Cleanup-Register.md`;
- `08-Messenger-Decision-Register.md`;
- `09-Messenger-Cross-Module-Canon.md`;
- `10-Messenger-Runtime-Reconciliation.md`;
- `11-Messenger-Rebuild-Implementation-Checklist.md`;
- `12-Messenger-Rebuild-Execution-Strategy.md`;
- all Slice evidence files;
- actual current code/schema/migrations/tests.

Reviewer must not rely on historical “completed” documentation without checking current runtime.

---

## 3. Repository and architecture audit

- [ ] One shared Messaging Core exists as source of message truth.
- [ ] Internal Messenger and Client Messenger are separate product surfaces/routes/working modes.
- [ ] No final mixed Internal/Client daily list/composer exists.
- [ ] Database is durable source of truth; realtime is transport only.
- [ ] external sends use durable/outbox/idempotent provider path.
- [ ] attachments use approved Drive/File Asset model.
- [ ] Support/Finance do not introduce duplicate external message stores.
- [ ] no active L1/L2 Topic architecture is required by target Messenger.
- [ ] no permanent Telegram chat bridge exists as target runtime.

---

## 4. Migration and data-integrity audit

### Task Discussion

Reviewer independently samples migrated Tasks and verifies:

- [ ] legacy discussion count/parity or documented mapping logic;
- [ ] authors/actor identity preserved;
- [ ] chronological ordering/timestamps preserved;
- [ ] attachments/File Assets preserved;
- [ ] AI/system provenance preserved where applicable;
- [ ] activity/audit associations not corrupted;
- [ ] rerunning migration/backfill does not duplicate messages;
- [ ] new Task human messages no longer write to the legacy store;
- [ ] Task Activity Feed remains separate from human Discussion;
- [ ] legacy storage has not been deleted before evidence/backup permits it.

### Product/Connected Work Space

- [ ] Product `Chat` and Connected Work Space `Discussion` resolve the same conversation id.
- [ ] no duplicate ensure/race path can create two canonical work conversations.
- [ ] any legacy duplicate real histories were preserved/mapped rather than silently discarded.

### WhatsApp binding migration

- [ ] every migrated existing Product has a valid WORK binding.
- [ ] existing Products resolve to the same physical WhatsApp conversation they used before migration unless an explicit business change was made.
- [ ] existing provider/account/chat ids were preserved.
- [ ] no automatic fake FINANCE binding was generated for all Products.
- [ ] old 1:1 uniqueness no longer blocks legitimate shared External Conversations.
- [ ] no destructive legacy cleanup occurred before parity/cutover evidence.

---

## 5. Internal Messenger product acceptance

- [ ] navigation is `All / Products / Tasks / Deals / Work Spaces / Groups / Direct / Collections`.
- [ ] `All` is flat recent accessible activity, not a mandatory Project hierarchy tree.
- [ ] Product/Work Space discussion is shared as canon requires.
- [ ] standalone Work Space can have its own discussion.
- [ ] Task Discussion is embedded in Task Card and uses Messaging Core.
- [ ] Project General is optional/lazy, not auto-created for every Project.
- [ ] Favorites is a built-in personal Collection.
- [ ] PERSONAL and SHARED Collections work.
- [ ] shared Collection never grants chat access.
- [ ] Internal Collections cannot contain Client conversations.

---

## 6. Client Messenger product acceptance

- [ ] navigation is `Inbox / Sales / Clients / Collections`.
- [ ] Support and Finance are not separate Messenger universes.
- [ ] Sales external chat is not the Internal Deal discussion object.
- [ ] Product WORK conversation can continue across Delivery → Maintenance without forced recreation.
- [ ] Client Collections cannot contain Internal conversations.
- [ ] Client-specific visual identity is unmistakable from Internal Messenger.

### Locked composer adversarial checks

- [ ] opening a Client conversation starts read-only/locked.
- [ ] authorized employee must explicitly activate `Reply to client`.
- [ ] switching conversation relocks composer.
- [ ] READ-only employee cannot unlock/send.
- [ ] forged frontend state does not bypass server SEND permission.
- [ ] Internal draft/state cannot accidentally send to Client conversation through route/session leakage.
- [ ] no Internal/Public toggle exists in Client or Support composer.

---

## 7. Flexible Product Communication Binding scenarios

All scenarios below must be executed against realistic data.

### Scenario A — ordinary Product

```text
Product A
  WORK -> WhatsApp Group 1
  no explicit FINANCE
```

- [ ] WORK resolves Group 1.
- [ ] FINANCE resolves Group 1 through fallback.

### Scenario B — Website + SEO shared work group

```text
Website WORK -> Group 1
SEO     WORK -> Group 1
```

- [ ] one physical External Conversation is reused.
- [ ] Products remain distinct business entities.
- [ ] no duplicate WhatsApp group is created.
- [ ] adding SEO binding does not automatically grant SEO developers Client access/SEND.

### Scenario C — shared finance group

```text
Product A FINANCE -> Group F
Product B FINANCE -> Group F
Product C FINANCE -> Group F
Product D FINANCE -> Group F
Product E FINANCE -> Group F
```

- [ ] one physical finance conversation serves all bindings.
- [ ] each Product still has deterministic FINANCE resolution.

### Scenario D — deterministic uniqueness

- [ ] one Product cannot have two competing active WORK destinations.
- [ ] Product may have zero/one explicit FINANCE only.
- [ ] External Conversation itself is not globally unique to one Product.

---

## 8. Deal Won and Product settings acceptance

- [ ] Product/Outsource Deal Won supports Create new WORK group.
- [ ] Deal Won supports Select/bind existing allowed External Conversation.
- [ ] existing create/bind failure/outcome handling remains safe.
- [ ] provider failure does not incorrectly roll back successful Product/Deal business state.
- [ ] `OUTCOME_UNKNOWN` cannot blindly create a second group.
- [ ] normal Deal Won does not require separate FINANCE setup.
- [ ] Product Client Communication settings expose WORK and FINANCE purposes rather than one raw group field.
- [ ] FINANCE supports Use WORK(default), Create new, Select existing.
- [ ] Extension does not automatically create another physical Product group.

---

## 9. WhatsApp Gateway integration acceptance

- [ ] NBOS communicates with existing Gateway boundary, not WAHA directly.
- [ ] outbound send persists in NBOS before provider dispatch.
- [ ] Gateway idempotency is used correctly for outbound attempts where required.
- [ ] duplicate/retry behavior does not double-send.
- [ ] inbound Project webhook authentication/HMAC/replay rules are enforced.
- [ ] duplicate inbound event is idempotent.
- [ ] account/project isolation is enforced.
- [ ] incoming message maps to canonical Client Conversation/provider mapping.
- [ ] Gateway does not own Product binding, Support/Finance routing or NBOS employee ACL.

---

## 10. Finance acceptance

### Automatic messages

- [ ] all approved payment/money reminders are sent with business purpose `FINANCE`.
- [ ] Finance module determines WHAT/WHEN; Messaging Core resolves WHERE and sends.
- [ ] explicit FINANCE binding is used when present.
- [ ] missing FINANCE falls back to WORK.
- [ ] no active Finance/Subscription/Client Service code directly sends using raw Product `groupChatId` after cutover.
- [ ] client replies remain in the same physical conversation that received the reminder.

### Manual FINANCE conversation

- [ ] manual employee communication in dedicated FINANCE group works as normal Client Messenger conversation.
- [ ] system reminder generation is not conflated with employee SEND permission.

### Default participant/access template

Verify default dedicated FINANCE access recommendation includes:

- [ ] Owner;
- [ ] CEO;
- [ ] Finance Director;
- [ ] relevant Seller;
- [ ] relevant Product PM.

And:

- [ ] developers/other Product employees are not automatically added;
- [ ] relevant Seller/PM are contextual, not hard-coded global people;
- [ ] READ/SEND still enforce effective permission.

---

## 11. Attention routing acceptance

- [ ] Delivery WORK defaults to Product PM attention.
- [ ] Maintenance WORK defaults to Support Intake queue.
- [ ] FINANCE defaults to Finance/authorized attention.
- [ ] changing lifecycle/attention does not create/move canonical conversation.
- [ ] manual reassignment works.
- [ ] no fixed permanent person is hard-coded as Product client owner/support owner.

---

## 12. Support acceptance

- [ ] Ticket is internal case/SLA/coverage/assignee/resolution object.
- [ ] Client message can create/link Ticket through stable source reference.
- [ ] Ticket does not duplicate external source message as an independent source of truth.
- [ ] Ticket has no public/internal composer switch.
- [ ] internal Ticket discussion cannot send externally.
- [ ] linked Task(s) can execute work.
- [ ] client-facing final response happens through Client Messenger.

---

## 13. Message action/reference acceptance

- [ ] one message can Create Task/share/reference.
- [ ] multiple selected messages can be used as source context.
- [ ] Create Task opens full Task creation workflow rather than blindly turning message text into final Task.
- [ ] source references preserve original conversation/message identity.
- [ ] user without source permission cannot use reference preview to bypass ACL.
- [ ] forwarding internally does not automatically create a new thread/Conversation.
- [ ] optional threads/replies do not become mandatory workflow.

---

## 14. Search/realtime/notifications acceptance

- [ ] Internal search exposes only accessible Internal content.
- [ ] Client search exposes only accessible Client content.
- [ ] unread state is not duplicated when Product and Work Space show same underlying conversation.
- [ ] inbound provider messages update realtime/attention after durable persistence.
- [ ] Notifications deep-link to the correct Messenger surface.
- [ ] Telegram notifications, if present, remain separate from Messenger source of truth.

---

## 15. Static/structural cleanup scan

Reviewer searches repository/runtime for forbidden remaining active paths.

Must find no uncontrolled target-runtime use of:

- [ ] legacy Task Discussion writes after Task cutover;
- [ ] raw Product `groupChatId` sends from Finance/Product business modules after binding cutover;
- [ ] hard one-to-one External Conversation uniqueness preventing shared Products;
- [ ] mixed Internal/Client Collection insertion;
- [ ] Internal route that can dispatch provider send;
- [ ] public Support Ticket composer;
- [ ] mandatory L1/L2 Topic architecture;
- [ ] permanent Telegram project-chat bridge;
- [ ] duplicated message body stores used as canonical Task/Ticket forwarded source.

Any intentional temporary compatibility code must have a concrete `DELETE-LATER` owner/gate and may block final acceptance if it still receives production writes.

---

## 16. Destructive cleanup decision

Before deleting legacy tables/fields:

- [ ] backup/restore point exists;
- [ ] migration counts/parity evidence exists;
- [ ] all production writes use target model;
- [ ] observation period or equivalent safety evidence is complete;
- [ ] rollback no longer depends on deleted provider/message identity;
- [ ] reviewer confirms no runtime dependency remains.

When risk is material, final acceptance should occur **before** destructive cleanup and cleanup should be a separate independently reviewed final change.

---

## 17. Final acceptance report template

```markdown
# Messenger Final Acceptance Result

Outcome: ACCEPTED | REJECTED
Commit/ref reviewed: ...
Date: ...

## Canon compliance

...

## Runtime/migration evidence

...

## Security/adversarial evidence

...

## WhatsApp/flexible-binding evidence

...

## Task migration evidence

...

## Finance/Support/routing evidence

...

## Cleanup/static scan

...

## Findings

- Critical: ...
- High: ...
- Medium: ...
- Low/deferred: ...

## Final reason

...
```

`ACCEPTED` requires zero unresolved Critical/High findings that violate canon, data integrity, security boundary or provider-delivery safety.
