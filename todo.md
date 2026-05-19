# NBOS — активные задачи

`[ ]` открыто · `[x]` сделано (история в git)

---

## Следующий фокус: CRM (дожать MVP)

**Рекомендуемый порядок**

1. **Transition popup + blockers** — при `STAGE_GATE_VALIDATION` показывать только недостающие поля, кнопки «перейти в секцию» sheet (marketing / offer / team / notes). Частично есть: `TransitionBlockerDialog`, `blocker-actions`, scroll в `LeadSheet` / `DealSheet`.
2. **Stage gates (пробелы)** — Lead: `MQL`/`SQL` (service type, budget/timeline в notes до появления полей в схеме). Deal: `START_CONVERSATION` (contact, seller, type), `DISCUSS_NEEDS` (scope/need note).
3. **Канон** — довести `04-Offers-and-Handoff.md`, `01-Lead-to-Cash-Process.md` под 5 стадий Deal и Drive offer/contract.
4. **Тесты доски** — active/closed filter + terminal drop (web или API integration).
5. **Legacy offer/contract URL** — backfill в Drive external-url assets; убрать из UI/API gate зависимость от `offerLink` / `contractFileUrl` (поля в БД пока можно оставить).
6. **Attachment block** — purpose при upload, external link, тесты detach/archive; заменить `EntityDriveFilesPanel` если ещё используется.
7. **Полировка** — Closed view карточки компактнее; единый Deal Type visual с Delivery; UI note про `DetailSheetSection`.

---

## CRM — открыто

### Переходы и валидация

- [ ] Transition popup: только missing fields + jump в секцию sheet (Lead/Deal).
- [ ] Marketing gate в UI согласован с API (блокер до заполнения From/Where/Which one).
- [ ] Lead gate: MQL/SQL — service type + budget/timeline (notes или новые поля).
- [ ] Deal gate: `START_CONVERSATION`, `DISCUSS_NEEDS` (seller, type, scope note).

### Документация

- [ ] `docs/NBOS/02-Modules/01-CRM/04-Offers-and-Handoff.md` — Drive files, без Meeting/Can We Do It.
- [ ] `docs/NBOS/03-Business-Logic/01-Lead-to-Cash-Process.md` — 5 стадий Deal.

### Доски

- [ ] Тесты: `boardScope` Active/Closed/All + terminal drop zones (Leads/Deals).
- [ ] Closed view: компактные read-only карточки.

### Sheet / UX

- [ ] Группировка полей как у Delivery (overview → contact → team → marketing → commercial → files → notes).
- [ ] Empty states и required-hints единообразно с Delivery.
- [ ] Deal Seller + Seller Assistant: проверить UX и роли.
- [ ] Create dialogs / transition editors — один `SearchField` для employees.
- [ ] Deal Type colors — один source of truth с Delivery + короткая UI note в docs.

### Drive / Offer–Contract

- [ ] Purpose selector при attach/upload.
- [ ] Attach external URL как file asset.
- [ ] Backfill legacy `offerLink` / `contractFileUrl` → Drive.
- [ ] Заменить `EntityDriveFilesPanel` на `EntityAttachmentBlock` (если остались вхождения).
- [ ] Тесты: attach, detach, archive, purpose filter.

### Паттерн досок (вне CRM)

- [ ] Delivery: Active/Closed + terminal drops (как CRM).
- [ ] Finance / Support / Tasks: задокументировать active vs closed перед UI.

---

## Finance — PageHero (отдельный трек)

Shared `app/(app)/finance/layout.tsx` + hero slots; заменить `*PageHeader` + `FilterBar`.

- [ ] Finance layout: tabs, settings sheet
- [ ] Orders, Invoices, Payments, Subscriptions, Expenses
- [ ] Wallet, Bonus pools, Reports, Client services
- [ ] Payroll: salary board, payroll runs

---

## Опционально

- [ ] Delivery Board: visual QA в браузере; Settings в hero
