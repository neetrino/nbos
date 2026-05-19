# PageHero migration — remaining

**Status:** `[ ]` todo · `[x]` done

---

## Finance (Pattern B + list pages)

Shared `app/(app)/finance/layout.tsx` hero with tabs; child routes use hero slots. Replace `*PageHeader` + `FilterBar` with `PageHero` + `IntegratedSearchFilters`.

- [ ] Finance layout: `ModuleHeroSlotProvider`, nav tabs, settings sheet
- [ ] Orders
- [ ] Invoices
- [ ] Payments
- [ ] Subscriptions
- [ ] Expenses (+ expense plans if in scope)
- [ ] Wallet
- [ ] Bonus pools
- [ ] Finance reports (`/finance/reports`)
- [ ] Client services
- [ ] Payroll: salary board, payroll runs list

---

## Manual / optional

- [ ] Delivery Board: visual QA in browser; optional Settings sheet in hero

---

# CRM Lead / Deal modernization plan

**Status:** `[ ]` todo · `[x]` done · Project size: C (large monorepo)

Goal: bring Lead and Deal board cards + sheets to the same modern cockpit standard as Delivery cards, reduce CRM field clutter, and extract reusable patterns for active/closed board stages and entity file attachments.

## 0. Canon / docs alignment first

- [ ] Update CRM canon before code: `docs/NBOS/05-UI-Specifications/02-CRM-Pages.md`, `02-Lead-Pipeline.md`, `03-Deal-Pipeline.md`, `04-Offers-and-Handoff.md`, `05-Deal-Stage-Gates-and-Won-Override.md`, `01-Lead-to-Cash-Process.md`.
- [ ] Resolve Deal stage model: remove `Meeting` and `Can We Do It?` from docs, enums, API gates, UI constants, tests, and any migration/backfill plan.
- [ ] Resolve Deal Type visuals: keep one source of truth for Product / Extension / Maintenance / Outsource colors across CRM board, Delivery, and docs.
- [ ] Add a short UI decision note for shared sheet sections: Lead/Deal sheets must use the same visual block language as Delivery sheets.

## 1. Lead / Deal sheet visual redesign

- [ ] Audit current CRM sheets: `LeadSheet`, `DealSheet`, `LeadGeneralTab`, `DealGeneralTab`, and all CRM section components.
- [ ] Convert CRM sections to a shared detail-sheet section style (`DetailSheetSection` / `detail-sheet-classes`) instead of many custom gradient blocks.
- [ ] Rebuild field grouping to match Delivery cockpit density: overview, customer/contact, team, marketing attribution, commercial, offer/files, notes, actions.
- [ ] Keep General tab as draft + Save/Cancel, one save per form, no per-field autosave.
- [ ] Make labels, spacing, borders, empty states, required-state hints, and blocker messages consistent with Delivery.

## 2. Marketing block decision: From / Where / Which one

Decision proposal:

- `From` = top-level source: `Marketing`, `Sales`, `Partner`, `Client`.
- `Where` = channel inside selected source.
- `Which one` = exact linked entity only when attribution must point to a real record.

Rules:

- [ ] For `From = Marketing`, show `Where` from Marketing CRM Where options.
- [ ] For `From = Marketing`, require `Which one` only for channels that need measurable attribution to an account/activity/campaign. Current hardcoded channels are `LIST_AM`, `GOOGLE_ADS`, `META_ADS`; replace this with configurable metadata on Marketing Where options.
- [ ] For `From = Marketing` + organic/generic/manual channels, keep `Which one` optional or hidden unless a real Marketing Account / Activity exists.
- [ ] For `From = Sales`, show `Where` from Sales channels; no `Which one` by default.
- [ ] For `From = Partner`, replace generic `Which one` with required `Which Partner?`.
- [ ] For `From = Client`, replace generic `Which one` with required `Which Client?`.
- [ ] Apply the same rules and UI to both Lead and Deal.
- [ ] Update API attribution gate so Lead and Deal use one shared rule source.

## 3. Seller selection

- [ ] Add / fix Seller picker in Lead sheet General tab.
- [ ] Verify Deal Seller and Seller Assistant picker UX; keep both editable where role rules allow it.
- [ ] Ensure create dialogs, transition popup editors, and sheets use the same employee search component.
- [ ] Add required-field blockers when Seller is missing before meaningful movement.

## 4. Global active / closed board pattern

Professional approach:

- Default board view should be `Active`.
- Add status scope filter: `Active`, `Closed`, `All`.
- Terminal statuses should not live as equal always-visible columns on the active board.
- During drag, show bottom terminal drop zones ("planks") for closed outcomes.

Global reusable plan:

- [ ] Design shared board lifecycle metadata: status key, label, group (`active` / `closed`), terminal flag, color, drop-zone behavior.
- [ ] Create reusable board status scope control: `Active` / `Closed` / `All`, default `Active`.
- [ ] Create reusable terminal drop-zone bar shown only while dragging active cards.
- [ ] CRM Lead statuses: active = `NEW`, `ON_HOLD`, `DIDNT_GET_THROUGH`, `CONTACT_ESTABLISHED`, `MQL`; closed = `SPAM`, `FROZEN`, `SQL`.
- [ ] CRM Deal statuses after stage cleanup: active = `START_CONVERSATION`, `DISCUSS_NEEDS`, `SEND_OFFER`, `GET_ANSWER`, `DEPOSIT_AND_CONTRACT`; closed = `FAILED`, `WON`.
- [ ] Delivery statuses: keep active lifecycle board separate from `Done` / `Cancelled` closed view, but align filter/drop-zone UX with the shared pattern.
- [ ] Finance/support/task boards: document which statuses are active vs closed before changing UI; do not guess module-specific terminal semantics.
- [ ] Replace CRM always-visible terminal columns with the shared scope filter and drag terminal zones.
- [ ] Add tests for active/closed filtering and drag-to-terminal transitions.

## 5. Deal stage cleanup

- [ ] Remove `MEETING` and `CAN_WE_DO_IT` from web constants.
- [ ] Remove them from shared `DEAL_STAGE_GATE_ORDER`.
- [ ] Update API stage gate logic and tests.
- [ ] Update Prisma enum / migration/backfill strategy if DB enum contains those statuses.
- [ ] Decide migration mapping for existing records:
  - `MEETING` -> `DISCUSS_NEEDS`
  - `CAN_WE_DO_IT` -> `SEND_OFFER`
- [ ] Update docs and funnel text so the active Deal pipeline has 5 working stages.

## 6. Required fields by stage

Lead proposal:

- `New`: contact name, phone or email.
- `On Hold`: same as `New`; marketing block still optional.
- `Didn't Get Through`: marketing block, Seller, contact attempt note.
- `Contact Established`: marketing block, Seller, conversation/result note, interest/service type.
- `MQL / SQL conversion`: contact name, phone or email, marketing block, Seller, service type, rough budget or budget note, rough timeline or timeline note.
- `SPAM`: spam reason.
- `Frozen`: frozen reason and return/check date.

Deal proposal after removing two stages:

- `Start a Conversation`: contact, Seller, Deal Type.
- `Discuss What Is Needed`: marketing block, company if known, service/product type, need/scope note, rough budget/timeline.
- `Send Offer`: amount, payment type, product category/type for Product/Outsource, linked project/product for Extension/Maintenance, at least one Offer file.
- `Get Answer`: response due date or follow-up date.
- `Deposit & Contract`: final amount, payment type, tax status, company if tax deal, deadline / maintenance start date, invoice requirement by Deal Type/payment rules.
- `Failed`: lost reason and optional comment.
- `Won`: existing Deal Won rules: paid first invoice for Product/Extension/Outsource unless approved override; Maintenance follows its documented exception.

Implementation tasks:

- [ ] Create dedicated Lead stage gate service instead of only attribution checks.
- [ ] Update Deal stage gate service to new stage order and simplified offer rules.
- [ ] Transition popup must show only missing fields and jump to the right sheet section.
- [ ] Block moving forward when marketing block is required but incomplete.

## 7. Offer & Contract simplification

Current stored Deal fields:

- `offerSentAt`
- `offerLink`
- `offerFileUrl`
- `offerScreenshotUrl`
- `responseDueAt`
- `contractSignedAt`
- `contractFileUrl`

Decision proposal:

- Keep CRM MVP simple: one beautiful `Offer files` attachment block.
- Store files as Drive File Assets linked to Deal, not as local Deal URL fields.
- Allow many files, not only one.
- Use file purpose, not separate fields, to distinguish `OFFER_DRAFT`, `OFFER_SENT`, `OFFER_APPROVED`, `CONTRACT`, `MESSENGER_PROOF`.
- For stage gate, require at least one linked file with offer purpose before `Send Offer`.
- Keep `responseDueAt` as a Deal field for follow-up workflow.
- Move contract proof to Drive file purpose `CONTRACT`; do not keep a separate `contractFileUrl`.
- Plan deprecation/backfill for existing URL fields: convert links into Drive external-url file assets where possible, then stop rendering old inputs.

## 8. Global entity attachment block

Goal: one reusable attachment block for CRM, Delivery, Tasks, Support, Documents, and any sheet that links files.

UX requirements:

- [ ] Tile/grid view like Drive file cards, matching the provided file tile reference.
- [ ] Upload/attach multiple files.
- [ ] Attach external link as a file asset when needed.
- [ ] Purpose selector per file or per upload context.
- [ ] File card actions: preview/open, details, replace/version if supported, detach, delete/archive.
- [ ] On detach, ask:
  - `Detach from this record, keep in Drive`
  - `Delete/archive file from Drive completely`
- [ ] Respect permissions, confidentiality, and audit log.
- [ ] Reuse `DriveTileShell`, `DriveFileCard`, `EntityDriveQuickAttach`, Drive API, and add missing entity-level detach/delete UX.
- [ ] Replace CRM `EntityDriveFilesPanel` list preview with this shared attachment block.
- [ ] Replace Delivery file links section with this shared attachment block when Delivery needs real Drive attachments.
- [ ] Add tests for attach, detach-only, archive/delete, and file purpose filtering.

## 9. Deal Actions block

- [ ] Move `Open Drive` from Offer/Contract area into Deal `Actions`.
- [ ] Keep Offer block focused on attached offer files only.
- [ ] Deal Actions should include: create invoice, create task, open Drive, and later approved workflow actions.

## 10. Board card polish after model changes

- [ ] Lead board card: contact name as primary title, phone/email, source/channel icon, created date, Seller avatar, attention badge.
- [ ] Deal board card: contact/company, amount, payment type, deadline/maintenance start date, Seller avatar, Deal Type visual, linked project/product where relevant.
- [ ] Ensure closed cards have compact read-only presentation in Closed view.

## Suggested implementation order

1. Docs/canon update and stage cleanup decision.
2. Shared board active/closed pattern.
3. CRM stage cleanup + gates.
4. Marketing block unification.
5. Seller picker and required fields.
6. Shared attachment block.
7. Offer/Contract simplification.
8. Lead/Deal sheet visual redesign.
9. Deal Actions cleanup and board card polish.
