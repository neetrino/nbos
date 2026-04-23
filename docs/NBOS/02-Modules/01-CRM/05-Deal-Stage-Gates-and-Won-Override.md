# Deal Stage Gates and Won Override

> NBOS Platform - canonical operational rules for required fields, stage transitions, and privileged `Deal Won` override

## Purpose

This document fixes the practical CRM rules that employees must follow when moving a Deal through the pipeline.

It exists to answer four implementation questions:

1. Which fields are required before each stage.
2. How requirements differ by `Deal Type`.
3. What the system must do when a user jumps multiple stages at once.
4. How `Deal Won` works when deposit is unpaid but leadership wants delivery to start anyway.

This document is implementation-oriented and complements:

- `03-Deal-Pipeline.md`
- `04-Offers-and-Handoff.md`
- `03-Business-Logic/01-Lead-to-Cash-Process.md`
- `03-Business-Logic/08-Stakeholder-Decisions-Product-Extension-Maintenance.md`

---

## Core principles

### 1. Stage transition must never rely on employee memory

The system must not expect Seller or Sales Manager to remember what is missing.

Before a Deal can move to the requested stage, NBOS must:

- validate all required fields for the target stage;
- validate all cumulative requirements from previous stages;
- validate non-field business blockers;
- show the user exactly what is missing;
- allow filling the missing fields immediately from the same flow.

### 2. Requirements are cumulative

If a user moves a Deal from Stage 1 directly to Stage 4 or Stage 6, the system checks **everything required up to the target stage**, not only the target stage itself.

### 3. Different Deal Types have different required fields

`PRODUCT`, `EXTENSION`, `MAINTENANCE`, and other deal types do not share the same card structure or stage requirements.

The system must validate fields based on:

- common requirements for all deals;
- type-specific requirements;
- stage-specific requirements;
- business blockers that are not plain fields.

### 4. `Deal Won` remains a manual business action

For now, `Deal Won` is triggered manually by Sales after confirming readiness.

NBOS should not auto-move a Deal into `WON` just because some finance event happened in the background.

### 5. For non-maintenance deals, unpaid deposit blocks `Deal Won`

For `PRODUCT`, `EXTENSION`, `OUTSOURCE`, and other deposit-based deals:

- invoice must be created;
- first required invoice must be paid and confirmed;
- only then can Sales move the Deal to `WON`.

`MAINTENANCE` is an exception and follows its own rules.

---

## Stage validation model

For every transition attempt, NBOS validates two groups:

### A. Field requirements

Examples:

- amount
- payment type
- offer file or offer link
- project type
- deadline
- linked project / linked product
- company
- tax status

### B. Action blockers

Examples:

- invoice is not created yet
- invoice exists but is not paid
- contract is not signed
- PM has not accepted handoff
- required checklist is not completed

Action blockers are not shown as empty fields. They must be shown as short operational notices in the transition popup.

Example notice:

`To move to Deal Won, first invoice must be marked as Paid by Finance.`

---

## Stage transition UX

## When user moves a card to another stage

If all requirements pass:

- move succeeds immediately;
- event is written to timeline/audit log.

If something is missing:

- open a transition popup;
- show only the missing required fields and blockers relevant to the requested target stage;
- allow inline completion of those fields;
- keep already valid fields hidden by default;
- after save, re-run validation and complete the move automatically.

## Popup structure

The popup should contain these sections in this order:

### 1. Target stage summary

Example:

`Move deal from "Start a Conversation" to "Deposit & Contract"`

### 2. Missing fields

Only fields that are missing or invalid.

Examples:

- Offer file
- Amount
- Payment type
- Project type
- Deadline
- Linked product

### 3. Business blockers

One-line notices for non-field blockers.

Examples:

- `Offer must be attached before moving to Get Answer.`
- `Invoice must be created before moving to Deposit & Contract.`
- `First invoice must be paid before moving to Deal Won.`

### 4. Available actions

Examples:

- `Save and move`
- `Create invoice`
- `Open linked invoice`
- `Cancel`

For privileged users on `Deal Won` blockers:

- `Request / apply override`

## UX rules

- Drag-and-drop and status dropdown must use the same validation engine.
- The popup must support both single-stage and multi-stage jumps.
- The popup must never show irrelevant fields from other Deal Types.
- The popup must explain why move is blocked even if there are no editable fields.

---

## Canonical stage gate matrix

This is the canonical business matrix for current implementation planning.

## Stage 1 - Start a Conversation

### Common required fields

- Deal name
- Contact
- Seller
- Lead source
- Deal type

### Type-specific

`EXTENSION`

- linked project is required at creation or before next meaningful transition

`MAINTENANCE`

- client context or linked project/product must be known before commercial discussion continues

## Stage 2 - Discuss What Is Needed

### Common required fields

- need / scope description
- preliminary service or product direction
- approximate budget or expected budget range

### Type-specific

`PRODUCT`

- preliminary product direction must be selected

`EXTENSION`

- existing project must be linked
- target product should be selected when known
- extension description is required

`MAINTENANCE`

- maintenance scope is required
- service period or servicing model is required when known

## Stage 3 - Meeting

### Common required fields

- meeting date
- meeting result / note
- clarified requirements

### Notes

- If the business process allows skipping an actual meeting for warm clients, the system should still require a recorded outcome note before advancing further.

## Stage 4 - Can We Do It?

### Common required fields

- project implementation type (`White Label`, `Mix`, `Custom Code`) when applicable
- preliminary timeline estimate
- preliminary commercial estimate
- internal feasibility confirmation

### Type-specific

`PRODUCT`

- product category
- product type

`EXTENSION`

- extension feasibility note
- linked product is strongly preferred; if not available yet, linked project is minimum

`MAINTENANCE`

- maintenance service model
- expected recurring amount or pricing logic

## Stage 5 - Send Offer

### Common required fields

- final or near-final amount
- payment type
- offer sent date

### Offer requirement

At least one must exist:

- attached offer file; or
- offer link

### Type-specific

`PRODUCT`

- product category
- product type
- planned deadline

`EXTENSION`

- linked project
- linked product if extension belongs to a specific product
- extension scope

`MAINTENANCE`

- maintenance scope
- billing model
- planned start date or service start logic

## Stage 6 - Get Answer

### Common required fields

- offer exists
- offer sent date
- response deadline or next follow-up date

### Notes

- If offer is revised, the Deal may return to `Send Offer` and store a new offer version.

## Stage 7 - Deposit & Contract

### Common required fields

- final amount
- payment type
- company or payer entity
- tax status
- signed contract flag or attached contract
- invoice created

### Type-specific

`PRODUCT`

- PM assigned
- final delivery deadline

`EXTENSION`

- linked project
- linked product when applicable
- extension scope frozen for handoff

`MAINTENANCE`

- maintenance package or agreed service scope
- recurring amount
- billing start date

### Blockers

For deposit-based deals:

- cannot proceed if invoice is not created

## Terminal stage - Deal Won

### Common principle

`WON` means the commercial phase is approved for handoff and downstream creation.

### Standard rule

For all non-maintenance deals:

- invoice must exist;
- required first payment must be confirmed as paid;
- contract must be signed;
- company/payer and tax status must be filled.

For `MAINTENANCE`:

- `WON` does not require the same deposit rule by default;
- exact finance rule depends on maintenance billing model.

### System effect after successful `WON`

- create or link `Order`
- create or link `Project`
- create `Product` or `Extension` as appropriate
- start handoff flow
- expose the work to delivery/creating boards

---

## Deal type specifics

## PRODUCT

Typical required data set:

- product category
- product type
- project type
- amount
- payment type
- offer
- PM
- deadline
- company
- tax status
- invoice

## EXTENSION

Typical required data set:

- linked project
- linked product where applicable
- extension scope
- amount
- payment type
- offer
- deadline
- invoice

Important rule:

- extension must never create an unrelated new project at `WON`;
- it must attach to the existing project context.

## MAINTENANCE

Typical required data set:

- maintenance scope
- billing model
- recurring amount
- start date
- linked project/product or clearly identified maintenance-only project path

Important rule:

- maintenance is not forced into the same deposit-paid rule as product and extension deals.

## OUTSOURCE and other future types

Each future type must explicitly define:

- which stages are used;
- which fields are mandatory;
- whether deposit-paid rule is required before `WON`;
- what downstream entity is created after `WON`.

No new Deal Type should be added without this matrix.

---

## Recommended solution for priority projects: privileged won override

## Business problem

Sometimes delivery must start immediately for a strategic project even though the invoice has already been issued but payment has not yet arrived.

Blocking `Deal Won` completely creates a business bottleneck:

- delivery cannot start;
- project does not appear in creating / orders flows;
- finance visibility becomes weaker instead of stronger.

## Recommended solution

Do **not** bypass by silently removing the payment rule.

Instead, add a privileged approval mechanism:

`Authorize Start Before Deposit`

This is not a new pipeline stage. It is a controlled override attached to the Deal.

## Why this is the safest option

- preserves normal rule for all employees;
- keeps `Deal Won` meaningful;
- allows leadership to unblock strategic projects;
- keeps finance visibility mandatory;
- leaves an audit trail of who accepted the risk.

## Mandatory conditions for override

Override may be granted only if all of these are true:

- invoice has already been created;
- commercial terms are fixed enough to start;
- reason for bypass is entered;
- approver is `CEO` or platform `Owner` or another explicitly privileged role;
- expected payment date is entered.

Recommended additional condition:

- contract is signed, unless leadership intentionally allows that exception too.

## What override does

After privileged approval, Sales may move the Deal to `WON` even if first payment is still unpaid.

System must then:

- create downstream `Order` / `Project` / `Product` or `Extension`;
- mark the deal, order, and project with a visible finance-risk badge;
- keep finance reminders active until payment is received;
- log approver, reason, date, and expected payment date.

## Required data model for override

At minimum, store:

- `overrideType = START_BEFORE_DEPOSIT`
- `approvedBy`
- `approvedAt`
- `reason`
- `expectedPaymentDate`
- `invoiceId`
- `isActive`

Optional:

- `comment`
- `expiresAt`
- `revokedBy`
- `revokedAt`

## Required UI behavior for override

When Sales tries to move a blocked deal to `WON`:

- system shows blocker: `First invoice is not paid`;
- for regular users, only informational notice is shown;
- for privileged users, an additional action is shown: `Authorize start before deposit`.

The approval UI must require:

- reason
- expected payment date
- confirmation checkbox

Suggested confirmation text:

`I approve starting delivery before deposit is received. Finance control remains active.`

## Required downstream visibility

After override-based `WON`, the following surfaces must visibly indicate the risk:

- Deal card
- Orders list and order card
- Project / product overview
- Finance dashboard or alerts area

Recommended badge text:

- `Deposit pending`
- `Won by override`

## Important restriction

Override must **not** be available if invoice has not been created.

This keeps finance visibility intact and guarantees the project enters the money-flow tracking path from day one.

---

## Implementation order

Recommended CRM implementation sequence:

1. Build a canonical stage gate config by `Deal Type` and stage.
2. Add backend validator for cumulative field + blocker checks.
3. Return structured transition requirements from API.
4. Add transition popup in CRM UI for drag/drop and manual stage changes.
5. Add offer file/link validation.
6. Add invoice-created and invoice-paid blockers for `WON`.
7. Add privileged override flow with audit log.

---

## Definition of done for this document

This CRM area is considered aligned only when:

- every stage has explicit requirements;
- every deal type has explicit exceptions;
- UI prevents blind stage moves;
- `Deal Won` is blocked correctly for non-maintenance deals;
- privileged override exists with audit trail;
- downstream entities still get created in a controlled way.
