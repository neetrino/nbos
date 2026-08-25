# NBOS follow-ups

## Slice 1 (this work) — Official Invoice WhatsApp v1

- [x] Paced outbound WhatsApp queue (`whatsapp.outbound-messages`, concurrency 1, 2s gap, Idempotency-Key)
- [x] Accountant group JID on WhatsApp Gateway Settings (singleton DB column)
- [x] Send / Cancel / Send again actually deliver HY templates to that group
- [x] `officialInvoiceRequestSent` only after successful send
- [x] Hide Government invoice ID in UI (column kept for EHDM)

## Slice 2 (next) — client WhatsApp copy

- Client WhatsApp for Subscription + Client Service (not Deal/Order)
- HY / RU / EN; add `reminderLanguage` on Client Service (default HY)
- Richer copy: amount, purpose, payment details (Bitrix as structure, not raw merge fields)
- Tax vs Tax-Free variants while Tax-Free exists; later one template when Tax-Free is removed
- Templates stay in code (no DB editor until that decision)
- Same outbound queue only (no second send path)

## Later

- EHDM / Government invoice ID in UI
- Possibly drop Tax-Free from the model
