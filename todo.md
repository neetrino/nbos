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
