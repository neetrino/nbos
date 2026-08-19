# Clients module — implementation status

This note tracks **what is implemented in code** versus the full canon in `00-Clients-Overview.md`, `01-Companies.md`, `02-Contacts.md`, and `03-Client-Portfolio.md`. Product behavior remains defined by those documents; this file avoids duplicating rules and only lists shipped surfaces and gaps.

## Shipped (web + API)

- **Contacts / Companies lists** under `/clients/contacts` and `/clients/companies` with search, basic filters, row sheets, deep link `?openId=`, **Profile A Trash** (`scope=active|trash` via page settings): Move to Trash, Restore, **Delete permanently** (name-match confirm) in trash sheets.
- **Company / Contact row sheets** use the same detail-sheet pattern as CRM (75vw panel, floating close + rail, inline fields with draft + Save/Cancel footer). **Portfolio** opens as a nested right sheet over the row sheet (permalink + list deep link still available inside portfolio).
- **Contact create/update** persists `messengerLinks` (WhatsApp, Telegram, preferred channel, language) via API.
- **Extra phones:** `ContactPhone` (`contact_phones`) — primary stays `Contact.phone`. Lead→Contact attach writes an extra when primary already differs (not a notes line). Directory search / ATS / intake lookup match any phone. Sheet: add/remove extra (`POST/DELETE /clients/contacts/:id/phones`). Same normalized number is not stored twice.
- **Company create**: multi-select **contacts** (optional; first = primary), optional **billing contact**, optional company phone/email/country; no manual contact UUID.
- **Company update**: contacts list + billing contact, phone/email/country; **tax status cannot be changed** after creation (API enforced).
- **Schema**: `companies.contact_id` nullable; `companies.billing_contact_id`, phone/email/country; `company_additional_contacts` junction; Prisma `CompanyPrimaryContact` / `CompanyBillingContact` / `CompanyAdditionalContact`.
- **Client Portfolio (computed)**: `GET /clients/portfolio/contact/:id`, `GET /clients/portfolio/company/:id` — aggregates projects, invoices, subscriptions, support tickets, client services, summary metrics, `clientHealth` (good/warning/risk), and `accessMask` from the authenticated employee’s `module_VIEW` permissions plus `financeAmounts` (true when `FINANCE_INVOICES` EDIT or ADD scope is not `NONE`). Payload omits or redacts finance/support slices per mask (no client-side security reliance).
- **UI**: `/clients/portfolio`, `/clients/portfolio/contact/[id]`, `/clients/portfolio/company/[id]` with tabbed overview (delivery-style density); **Open Portfolio** from contact/company sheets; **Portfolio** tab in Clients layout; delivery board commercial section links to portfolio. Tabs and overview metrics respect `accessMask` from the API. **Quick actions** (New deal, Create invoice, New ticket, Open messenger, Open drive) use module permissions and deep links with query prefills to `/crm/deals`, `/finance/invoices`, and `/support`. Communication / Files tabs link out to Messenger and Drive (in-tab aggregation still future).

## Intentional placeholders / next slices

- Portfolio **Communication** and **Files** tabs: outbound links to Messenger and Drive plus placeholder copy; no in-tab aggregation yet (visibility still gated by `accessMask`).
- **Dedupe / merge contacts**, **bank details** UI, **Client Service** detail in portfolio — extra phones shipped; Contact merge is the next Clients slice.

## MVP assumptions (launch scope)

- **Audience:** internal employees only; no external client/partner login roles required for Clients MVP.
- **Delete vs Trash:** operational policy is **Trash-first** (see `00-Clients-Overview.md` §7 and platform `09-Entity-Lifecycle-Standard.md`). API `DELETE` moves to Trash (`trashedAt`); `POST …/restore` recovers; `DELETE …/permanent` purges trashed rows when relation guards pass.

## API routes (Nest)

- `clients/contacts`, `clients/companies` — CRUD + `?scope=active|trash` (default active), `DELETE` → Trash, `POST :id/restore`, `DELETE :id/permanent`. Contacts: `POST :id/phones`, `DELETE :id/phones/:phoneId`.
- `clients/portfolio/contact/:contactId`, `clients/portfolio/company/:companyId` — read-only computed JSON.

## Related code (for maintainers)

- Web: `apps/web/src/features/clients/*`, `apps/web/src/lib/api/clients.ts`, `apps/web/src/lib/api/client-portfolio.ts`, `apps/web/src/app/(app)/clients/portfolio/*`.
- API: `apps/api/src/modules/clients/portfolio/*` (`portfolio-access-mask.ts`, `portfolio-payload-policy.ts`), `contacts.service.ts`, `companies.service.ts`.
- DB: migrations `20260512140000_company_billing_and_contact_fields`, `20260612120000_contact_company_trash_lifecycle` (`trashed_at` on contacts/companies), `20260812140000_company_optional_primary_and_additional_contacts`, `20260819160000_contact_extra_phones`.
- Platform index: `docs/NBOS/03-Business-Logic/10-Platform-Lifecycle-Implementation-Status.md`.
