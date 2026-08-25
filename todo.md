# NBOS follow-ups

## Slice 1 — Official Invoice WhatsApp v1

- [x] Paced outbound WhatsApp queue (`whatsapp.outbound-messages`, concurrency 1, 2s gap, Idempotency-Key)
- [x] Accountant group JID on WhatsApp Gateway Settings (singleton DB column)
- [x] Send / Cancel / Send again actually deliver HY templates to that group
- [x] `officialInvoiceRequestSent` only after successful send
- [x] Hide Government invoice ID in UI (column kept for EHDM)

## Slice 2 — client WhatsApp copy

- [x] Client WhatsApp for Subscription + Client Service (not Deal/Order)
- [x] HY / RU / EN; `reminderLanguage` on Client Service (default HY)
- [x] Richer copy: amount, purpose, payment details (Tax-Free: Hasmik personal requisites)
- [x] Tax vs Tax-Free variants
- [x] Templates in code (no DB editor)
- [x] Same outbound queue only (no second send path)
- [ ] Prod migration `client_service_records.reminder_language` when ready to deploy

## Later

- EHDM / Government invoice ID in UI
- Possibly drop Tax-Free from the model
- Settings for pay-to requisites; notification template editor in DB/UI
