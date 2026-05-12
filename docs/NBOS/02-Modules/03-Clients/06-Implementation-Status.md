# Clients module — implementation status

This note tracks **what is implemented in code** versus the full canon in `00-Clients-Overview.md`, `01-Companies.md`, `02-Contacts.md`, and `03-Client-Portfolio.md`. Product behavior remains defined by those documents; this file avoids duplicating rules and only lists shipped surfaces and gaps.

## Shipped (web + API)

- **Contacts / Companies lists** under `/clients/contacts` and `/clients/companies` with search, basic filters, row sheets, deep link `?openId=`.
- **Contact create/update** persists `messengerLinks` (WhatsApp, Telegram, preferred channel, language) via API.
- **Company create**: searchable **primary contact** picker, optional **billing contact**, optional company phone/email/country; no manual contact UUID.
- **Company update**: primary and billing contacts, phone/email/country; **tax status cannot be changed** after creation (API enforced).
- **Schema**: `companies.billing_contact_id`, `companies.phone`, `companies.email`, `companies.country`; Prisma relations `CompanyPrimaryContact` / `CompanyBillingContact`.
- **Client Portfolio (computed)**: `GET /clients/portfolio/contact/:id`, `GET /clients/portfolio/company/:id` — aggregates projects, invoices, subscriptions, support tickets, client services, summary metrics, `clientHealth` (good/warning/risk), and an MVP `accessMask` (all `true` until RBAC is wired per request).
- **UI**: `/clients/portfolio`, `/clients/portfolio/contact/[id]`, `/clients/portfolio/company/[id]` with tabbed overview (delivery-style density); **Open Portfolio** from contact/company sheets; **Portfolio** tab in Clients layout; delivery board commercial section links to portfolio.

## Intentional placeholders / next slices

- Portfolio **Communication** and **Files** tabs: copy + structure only; no Messenger/Drive aggregation yet.
- **RBAC** on portfolio sections: `accessMask` is returned but not yet derived from the authenticated employee.
- **Dedupe / merge contacts**, **archive vs delete**, **bank details** UI, **Client Service** detail in portfolio, **cross-module quick actions** (new deal, invoice, ticket from portfolio header) — not in this slice.

## API routes (Nest)

- `clients/contacts`, `clients/companies` — CRUD as before, extended as above.
- `clients/portfolio/contact/:contactId`, `clients/portfolio/company/:companyId` — read-only computed JSON.

## Related code (for maintainers)

- Web: `apps/web/src/features/clients/*`, `apps/web/src/lib/api/clients.ts`, `apps/web/src/lib/api/client-portfolio.ts`, `apps/web/src/app/(app)/clients/portfolio/*`.
- API: `apps/api/src/modules/clients/portfolio/*`, `contacts.service.ts`, `companies.service.ts`.
- DB: migration `20260512140000_company_billing_and_contact_fields`.
