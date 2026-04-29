# Phase 4 Closure Gate

> Gate document for closing Phase 4 Delivery operations without hiding unfinished Tasks, Support or Drive/Credentials scope.

## 1. Decision

Phase 4 is **not fully closed yet**.

The Projects Hub delivery lifecycle slice is ready for closure review, and the first connected Work Space, task completion rules and Support-to-Task runtime slices now exist. The full Phase 4 roadmap still includes Scrum/review polish and deeper Support change-control/SLA work. Those areas must be finished or explicitly moved out of Phase 4 before the phase can be marked `Done`.

## 2. Confirmed Done In Projects Hub

- Canonical delivery lifecycle projection exists for Product and Extension.
- Product and Extension schema stores canonical stage, work status, terminal resolution and pause/cancel fields.
- Dedicated lifecycle endpoints exist: stage, pause, resume, cancel and complete.
- Delivery Board v1 exists in Project shell and groups Product/Extension cards by canonical lifecycle state.
- Product detail uses canonical lifecycle in header, overview and Stage Gate.
- Generic status mutation UI is retired; backend generic status endpoints are deprecated compatibility paths.
- Extension ownership is enforced at API/UI boundary and schema level.
- Product QA/Transfer gates block open execution tasks.
- Product Done blocks open delivery items, unpaid invoices, open order status and missing client acceptance.
- Product Done readiness surfaces runtime blockers, documentation warnings and missing runtime signals.
- Handoff readiness surfaces Project credentials, domain health and linked CRM/Order handoff file gaps.
- Product and Extension can ensure connected Work Spaces; Product detail exposes the connected Work Space context.
- Task completion can enforce explicit rules and return human-readable blocker reasons.
- Support tickets can create linked execution tasks while keeping ticket lifecycle separate.

## 3. Must Stay Out Of This Closure

These items are not safe to fake inside Projects Hub closure:

- DB-backed Drive `FileAsset` / `FileLink` runtime.
- Product-specific credential links and richer Vault access model.
- Messenger, Mail, Notifications and Technical Infrastructure depth.
- Global Reports / Analytics, scheduled exports and Control Center work.
- Full old `status` enum removal; legacy status remains a compatibility mirror for now.

## 4. Remaining Phase 4 Scope

### Tasks / Work Space

Required before full Phase 4 closure:

- `Work Space` exists as runtime planning context, not just a board label.
- Product and Extension can ensure connected Work Spaces through API.
- Backlog / future sprint / active sprint are separated from task workflow status.
- Product Work Space is visible in Product delivery UI.
- Task completion rules are explicit and can return human-readable blockers.
- Product execution tasks remain linked to Product stage gates without duplicating delivery lifecycle.

Remaining Tasks depth:

- Review / approval flow is still not implemented.
- Full workspace-level Scrum views are still not implemented.
- TaskSheet does not yet render completion rules and blockers as a first-class UI section.

### Support

Required before full Phase 4 closure:

- Support tickets can create or link execution tasks safely.
- Change Request tickets can create or link Extension Deal flow without becoming free work.
- Ticket lifecycle keeps customer case/SLA separate from internal task execution.
- SLA warnings/breach state is visible without pretending notification automation exists.
- Product Done readiness and Product support tabs remain based on real ticket data.

Remaining Support depth:

- Change Request -> Extension Deal bridge is still not implemented.
- Waiting / escalation overlays and SLA pause logic are still not implemented.
- Coverage decision is still not a first-class runtime field.

## 5. Closure Checklist

Mark full Phase 4 `Done` only when:

- Projects Hub items in section 2 stay green after regression checks.
- Tasks / Work Space items in section 4 are implemented or formally moved to a later phase.
- Support items in section 4 are implemented or formally moved to a later phase.
- API/Web typecheck and lint pass.
- Targeted tests cover lifecycle gates, ProductsService, ExtensionsService, Tasks and Support changes.
- `docs/IMPLEMENTATION_PROGRESS.md` and relevant cleanup registers are updated.
- No fake finance, credential, Drive, audit, report or notification data is introduced.

## 6. Recommended Next Slice

Continue with **Support change-control depth** or **task completion UI/review polish**.

The Work Space, completion rules and Support-to-Task foundations now exist; the next closure blockers are Support change-control/SLA depth and richer task completion UI/review flow.
