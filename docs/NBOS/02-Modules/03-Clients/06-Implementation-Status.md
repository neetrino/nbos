# Clients module — implementation status

This note tracks **what is implemented in code** versus the full canon in `00-Clients-Overview.md`, `01-Companies.md`, `02-Contacts.md`, and `03-Client-Portfolio.md`. Product behavior remains defined by those documents; this file avoids duplicating rules and only lists shipped surfaces and gaps.

## Shipped (web + API)

- **Contacts / Companies lists** under `/clients/contacts` and `/clients/companies` with search, basic filters, row sheets, deep link `?openId=`.
- **Company / Contact row sheets** use the same detail-sheet pattern as CRM (75vw panel, floating close + rail, inline fields with draft + Save/Cancel footer). **Portfolio** opens as a nested right sheet over the row sheet (permalink + list deep link still available inside portfolio).
- **Contact create/update** persists `messengerLinks` (WhatsApp, Telegram, preferred channel, language) via API.
- **Company create**: searchable **primary contact** picker, optional **billing contact**, optional company phone/email/country; no manual contact UUID.
- **Company update**: primary and billing contacts, phone/email/country; **tax status cannot be changed** after creation (API enforced).
- **Schema**: `companies.billing_contact_id`, `companies.phone`, `companies.email`, `companies.country`; Prisma relations `CompanyPrimaryContact` / `CompanyBillingContact`.
- **Client Portfolio (computed)**: `GET /clients/portfolio/contact/:id`, `GET /clients/portfolio/company/:id` — aggregates projects, invoices, subscriptions, support tickets, client services, summary metrics, `clientHealth` (good/warning/risk), and `accessMask` from the authenticated employee’s `module_VIEW` permissions plus `financeAmounts` (true when `FINANCE_INVOICES` EDIT or ADD scope is not `NONE`). Payload omits or redacts finance/support slices per mask (no client-side security reliance).
- **UI**: `/clients/portfolio`, `/clients/portfolio/contact/[id]`, `/clients/portfolio/company/[id]` with tabbed overview (delivery-style density); **Open Portfolio** from contact/company sheets; **Portfolio** tab in Clients layout; delivery board commercial section links to portfolio. Tabs and overview metrics respect `accessMask` from the API. **Quick actions** (New deal, Create invoice, New ticket, Open messenger, Open drive) use module permissions and deep links with query prefills to `/crm/deals`, `/finance/invoices`, and `/support`. Communication / Files tabs link out to Messenger and Drive (in-tab aggregation still future).

## Intentional placeholders / next slices

- Portfolio **Communication** and **Files** tabs: outbound links to Messenger and Drive plus placeholder copy; no in-tab aggregation yet (visibility still gated by `accessMask`).
- **Dedupe / merge contacts**, **bank details** UI, **Client Service** detail in portfolio — not in this slice.
- **Archive-first lifecycle** for Contact / Company (soft-delete, global trash, purge rules) — canon in `00-Clients-Overview.md` §7; runtime enforcement/UI may land incrementally (see **MVP assumptions** below).

## MVP assumptions (launch scope)

- **Audience:** internal employees only; no external client/partner login roles required for Clients MVP.
- **Delete vs archive:** operational policy is **archive-first** (see `00-Clients-Overview.md` §7). Hard `DELETE` may still exist in APIs until a unified archive is implemented; team should avoid deleting entities that already participate in CRM / finance / delivery history.

## API routes (Nest)

- `clients/contacts`, `clients/companies` — CRUD as before, extended as above.
- `clients/portfolio/contact/:contactId`, `clients/portfolio/company/:companyId` — read-only computed JSON.

## Related code (for maintainers)

- Web: `apps/web/src/features/clients/*`, `apps/web/src/lib/api/clients.ts`, `apps/web/src/lib/api/client-portfolio.ts`, `apps/web/src/app/(app)/clients/portfolio/*`.
- API: `apps/api/src/modules/clients/portfolio/*` (`portfolio-access-mask.ts`, `portfolio-payload-policy.ts`), `contacts.service.ts`, `companies.service.ts`.
- DB: migration `20260512140000_company_billing_and_contact_fields`.
