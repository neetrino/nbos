# Messenger Phase 6 — Manual browser checklist

> Live UI evidence. Automate only with existing browser tooling.
> There is no Playwright/Cypress suite in this repository.
>
> Status legend: `PASS` / `NOT RUN` / `BLOCKED`.
> Do not mark production/live items complete without exercising them.

Date: **\_\_\_\_**  
Environment: **\_\_\_\_**  
Actor: **\_\_\_\_**

## Preconditions

- Authenticated employee with Internal and Client Messenger access.
- Two browser profiles or windows for the same user (two-tab) and a second
  account for logout/switch.
- Do not send live WhatsApp/provider messages.

## A. Same-user reload

- [ ] Cold `/messenger`: one Internal bootstrap; All list renders without a blank frame.
- [ ] All → Tasks → All: no conversations GET; no collection GET; no blank list.
- [ ] Leave Messenger and return in the same session: cached list paints immediately.
- [ ] Hard reload: persisted canonical list (if IDB enabled) paints before background bootstrap/delta.

## B. Logout / account switch

- [ ] Logout purges visible Messenger memory; next user does not see previous titles/previews.
- [ ] A → B account switch does not show A’s list; B does not inherit A’s IndexedDB envelope.

## C. IndexedDB unavailable / corrupt / expired

- [ ] Persistence disabled (`NEXT_PUBLIC_MESSENGER_PERSISTENCE=0`): HTTP bootstrap still works.
- [ ] Corrupt IDB record is ignored; Messenger still bootstraps.
- [ ] Envelope older than 24h is ignored; HTTP remains authoritative.

## D. Two tabs (old vs new writes)

- [ ] Tab 1 captures then Tab 2 captures later: reload keeps the newer capture.
- [ ] Equal `capturedAt`: first write wins; older tab cannot replace it.

## E. Offline / reconnect

- [ ] Cached list remains visible if bootstrap/delta fails (no blanking).
- [ ] Reconnect uses delta when the flag is on; only changed open threads refetch history.
- [ ] With delta off, reconnect/bootstrap is FULL and still does not blank cached rows.

## F. Accessibility / no blanking

- [ ] Keyboard All ↔ Tasks does not flash an empty list when cache exists.
- [ ] Screen reader still has list content while background recovery runs.
- [ ] Error state against stale cache keeps previous rows on screen.

## G. Realtime (optional if a second actor exists)

- [ ] Inbound summary/read/delivery does not trigger a full inbox refetch in DevTools.
- [ ] Access loss removes that thread from this user’s list without wiping unrelated rows.

## Recorded outcome (this implementer pass)

| Check            | Status  | Notes                                                 |
| ---------------- | ------- | ----------------------------------------------------- |
| A–G live browser | NOT RUN | No Playwright; login/DB session not used in this pass |
