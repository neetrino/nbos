# Partners Cleanup Register

> NBOS Platform — runtime gaps, stale-логика и задачи зачистки по модулю Partners.

## 1. Current runtime status

Сейчас runtime реализует только базовую часть:

- `Partner` model есть;
- `Lead.sourcePartnerId` есть;
- `Deal.sourcePartnerId` есть;
- `Order.partnerId` есть;
- `Subscription.partnerId` есть;
- API Partners поддерживает CRUD;
- UI Partners показывает простую таблицу.

### Runtime matrix

| Area                        | Status  | Notes                                                                                                              |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| Partner model               | PARTIAL | Есть `name`, `type`, `direction`, `defaultPercent`, `status`, `contactId`; нет policy, agreements, payout settings |
| CRM source partner          | PARTIAL | Lead / Deal имеют `sourcePartnerId`, но нет Partner Referral Terms                                                 |
| Order partner fields        | PARTIAL | Order имеет `partnerId`, `partnerPercent`, но процент не фиксируется через policy / terms                          |
| Subscription partner fields | PARTIAL | Subscription имеет `partnerId`, но нет payout_rule на уровне subscription-связи                                    |
| Partner CRUD API            | PARTIAL | CRUD есть, но DTO не покрывает новый канон                                                                         |
| Partner UI                  | STALE   | UI ожидает поля, которых API не отдаёт                                                                             |
| Partner Accrual             | MISSING | Нет модели начислений                                                                                              |
| Partner Balance             | MISSING | Нет computed view / endpoint                                                                                       |
| Payout Batch                | MISSING | Нет batch-выплаты перед Expense                                                                                    |
| Partner Service Terms       | MISSING | Outbound не отделён как business case                                                                              |
| Partner Account v2          | MISSING | Не реализуется сейчас, но нужно заложить видимость данных                                                          |

---

## 2. Runtime gaps

### P1. UI Partners не совпадает с API

UI ожидает поля:

- `companyName`;
- `level`;
- `agreementStatus`;
- `defaultPercentage`;
- `dealsCount`;
- `totalRevenue`;
- `outstanding`.

API / DB сейчас имеют:

- `name`;
- `type`;
- `direction`;
- `defaultPercent`;
- `status`;
- `_count.orders`;
- `_count.subscriptions`.

Нужно привести UI/API к новому канону.

### P2. Нет Commission Policy по Deal Type

Сейчас есть только `defaultPercent`.

Нужно добавить Partner Commission Policy:

- Product percent;
- Extension percent;
- Maintenance percent;
- Outsource percent;
- fallback default percent.

### P3. Нет Partner Referral Terms

Сейчас partner source хранится на Lead / Deal, но условия процента не фиксируются отдельно.

Нужно фиксировать percent на момент сделки, чтобы будущие изменения policy не меняли старые deals.

### P4. Нет Partner Accrual / Balance / Payout Batch

Сейчас docs раньше предлагали сразу Expense.

Новый канон:

```
Client Payment -> Partner Accrual -> Partner Balance -> Payout Batch -> Expense Card -> Paid
```

Нужно реализовать отдельный слой начислений.

### P5. Subscription payout_rule должен быть на уровне subscription / project

Нельзя хранить payout_rule только глобально на Partner.

У одного партнёра разные проекты могут иметь разные правила выплаты subscription accruals.

### P6. Classic payout не должен использовать subscription payout_rule

Classic payout:

- проект сдан;
- все деньги получены;
- создаётся accrual;
- платим партнёру за проект.

Если нужна задержка, это manual hold с reason.

### P7. Outbound flow не отделён от inbound

Outbound — это доход Neetrino от партнёра.

Нужно:

- хранить Partner Service Terms;
- создавать Invoice / Subscription в Finance;
- показывать revenue в Partners.

### P8. Partner Account v2 не заложен в data visibility

Нужно проектировать Partner Accrual / Balance так, чтобы позже безопасно показать партнёру read-only данные.

---

## 3. Documentation cleanup

Старый `01-Partners-Overview.md` был одним большим смешанным документом и заменён новой структурой:

- `00-Partners-Overview.md`;
- `01-Partner-Directory-and-Settings.md`;
- `02-Partner-Commission-Policy.md`;
- `03-Inbound-Referral-Flow.md`;
- `04-Partner-Payouts-and-Balance.md`;
- `05-Outbound-Partner-Services.md`;
- `06-Partner-Account-Portal-v2.md`;
- `07-Partner-Analytics-and-Agreements.md`;
- `08-Partners-Cleanup-Register.md`.

Активные соседние документы должны ссылаться на новую структуру Partners. Старое имя `01-Partners-Overview.md` остаётся только как историческая заметка в cleanup/archive-контексте.

---

## 4. Implementation checklist

### Models

- Partner Commission Policy.
- Partner Referral Terms.
- Partner Accrual.
- Partner Balance computed view.
- Payout Batch.
- Partner Service Terms for outbound.
- Agreement metadata.

### Detailed DB backlog

#### DB1. Partner model cleanup

Текущий `Partner.type` в базе означает `REGULAR / PREMIUM`. В UI старый код использует `type` как Inbound / Outbound / Both.

Нужно привести naming:

| Canon                                   | Runtime сейчас                       | Решение                                                 |
| --------------------------------------- | ------------------------------------ | ------------------------------------------------------- |
| `level` = Regular / Premium             | `Partner.type`                       | Переименовать в `level` или в UI/API мапить как `level` |
| `direction` = Inbound / Outbound / Both | `Partner.direction`                  | OK                                                      |
| `status` = Active / Paused / Terminated | `Partner.status = ACTIVE / INACTIVE` | Расширить enum                                          |

#### DB2. Partner Commission Policy

Новая модель:

```
PartnerCommissionPolicy
  id
  partner_id
  deal_type        // PRODUCT / EXTENSION / MAINTENANCE / OUTSOURCE
  percent
  is_active
  effective_from
  effective_to
  created_by
  reason
```

Правило: процент зависит только от Deal Type.

#### DB3. Partner Referral Terms

Новая модель:

```
PartnerReferralTerms
  id
  partner_id
  lead_id?
  deal_id?
  order_id?
  subscription_id?
  deal_type
  payment_type
  partner_percent
  source_policy       // POLICY / DEFAULT / OVERRIDE
  override_reason?
  payout_rule?        // только для subscription
  minimum_payout_amount? // только если payout_rule = THRESHOLD
  status
```

Terms фиксируют условия на конкретной сделке / заказе / подписке.

#### DB4. Partner Accrual

Новая модель:

```
PartnerAccrual
  id
  partner_id
  referral_terms_id
  project_id
  product_id?
  order_id?
  subscription_id?
  invoice_id?
  payment_id
  deal_type
  payment_type
  base_amount
  percent
  amount
  status       // ACCRUED / ELIGIBLE / IN_BATCH / PAID / CANCELLED
  eligible_at?
  created_at
```

Accrual создаётся только от реально полученного Payment.

#### DB5. Payout Batch

Новая модель:

```
PartnerPayoutBatch
  id
  partner_id
  total_amount
  status       // DRAFT / APPROVED / EXPENSE_CREATED / PAID / CANCELLED
  payout_date?
  expense_id?
  approved_by?
  notes
```

Связь many-to-many / one-to-many с PartnerAccrual.

#### DB6. Partner Service Terms

Для outbound:

```
PartnerServiceTerms
  id
  partner_id
  client_contact_id?
  client_company_id?
  project_id?
  service_type
  payment_model   // ONE_TIME / MONTHLY / CUSTOM
  amount
  subscription_id?
  invoice_id?
  status
  notes
```

Это источник связи outbound-case, но Finance остаётся source of truth по Invoice / Subscription / Payment.

#### DB7. Agreement metadata

```
PartnerAgreement
  id
  partner_id
  status       // NO_AGREEMENT / DRAFT / ACTIVE / EXPIRED
  start_date?
  end_date?
  file_id?
  special_terms
  owner_id?
```

### API

- Partner CRUD aligned with UI.
- Commission policy endpoints.
- Accrual list / balance endpoints.
- Payout batch create / approve / paid endpoints.
- Partner portfolio / analytics endpoints.
- Outbound Partner Service endpoints.

### Detailed API backlog

#### API1. Partner CRUD alignment

`GET /partners` должен возвращать canonical fields:

- `id`;
- `name`;
- `direction`;
- `level`;
- `status`;
- `defaultPercent`;
- `primaryContact`;
- `agreementStatus`;
- `counts`;
- `analyticsSummary`.

#### API2. Partner detail

`GET /partners/:id` должен возвращать Partner Card tabs:

- overview;
- commission policy;
- inbound referrals;
- payouts & balance;
- outbound services;
- agreements;
- analytics.

#### API3. Commission Policy

Endpoints:

- `GET /partners/:id/commission-policy`;
- `PUT /partners/:id/commission-policy`;
- `POST /partners/:id/commission-policy/override`.

Override требует reason.

#### API4. Referral Terms

Partners API или CRM API должен уметь:

- рассчитать percent по Deal Type;
- зафиксировать Partner Referral Terms на Deal / Order / Subscription;
- вернуть terms в Deal / Order / Subscription карточках.

#### API5. Accruals and Balance

Endpoints:

- `GET /partners/:id/accruals`;
- `GET /partners/:id/balance`;
- `GET /partners/:id/balance?projectId=...`;
- `GET /partners/:id/balance?subscriptionId=...`.

#### API6. Payout Batch

Endpoints:

- `POST /partners/:id/payout-batches`;
- `POST /partners/payout-batches/:id/approve`;
- `POST /partners/payout-batches/:id/create-expense`;
- `POST /partners/payout-batches/:id/mark-paid`;
- `POST /partners/payout-batches/:id/cancel`.

#### API7. Outbound Services

Endpoints:

- `GET /partners/:id/outbound-services`;
- `POST /partners/:id/outbound-services`;
- `PATCH /partners/outbound-services/:id`;
- link to Finance Invoice / Subscription.

### UI

- Partner Card with tabs.
- Commission Policy tab.
- Inbound Referrals tab.
- Payouts & Balance tab.
- Outbound Services tab.
- Agreements tab.
- Analytics tab.

### Detailed UI backlog

#### UI1. Partners list

Нужно исправить текущую таблицу:

- `companyName` -> `name`;
- `level` -> Partner level;
- `type` -> direction or rename column;
- `defaultPercentage` -> `defaultPercent`;
- `dealsCount` -> counts from API;
- `totalRevenue / outstanding` -> analytics summary from API.

#### UI2. Partner Card

Нужна полноценная карточка / page:

- Overview;
- Commission Policy;
- Inbound Referrals;
- Payouts & Balance;
- Outbound Services;
- Agreements;
- Analytics.

#### UI3. Commission Policy editor

UI должен позволять настроить:

| Deal Type   | Percent |
| ----------- | ------- |
| Product     | n%      |
| Extension   | n%      |
| Maintenance | n%      |
| Outsource   | n%      |

Payment Type не должен быть в этой таблице.

#### UI4. Subscription payout_rule editor

Payout rule настраивается не на Partner global level, а на конкретной subscription / project связи.

UI нужен в:

- Partner Card -> Inbound Referrals / Payouts;
- Subscription Card, если subscription партнёрская;
- возможно Order / Deal handoff.

#### UI5. Payout Batch screen

Нужен экран / tab для Finance:

- выбрать eligible accruals;
- собрать batch;
- approve;
- create Expense Card;
- mark paid через Finance.

#### UI6. Outbound Services tab

Показывает:

- client;
- service type;
- payment model;
- amount;
- linked subscription / invoice;
- received revenue.

#### UI7. Partner Account v2 readiness

В UI v1 можно пока не делать portal, но внутренние статусы должны иметь partner-facing labels.

### Automation

- CRM source Partner stage-gates.
- Partner percent fixed on Deal / Order / Subscription.
- Accrual creation after real payment.
- Subscription payout_rule scheduler.
- Payout batch -> Expense Card.
- Notifications for payout and agreement expiration.

### Detailed automation backlog

#### A1. CRM stage-gate

If `source = Partner`:

- Partner is required;
- Partner Referral Terms are required before Deal Won;
- percent is calculated from Deal Type;
- override requires permission and reason.

#### A2. Classic accrual trigger

Trigger:

```
Project delivered
AND Order fully paid
AND Payment Type = Classic
AND Partner Referral Terms exist
```

Action:

- create Partner Accrual;
- set eligible according to classic rules;
- do not create Expense directly.

#### A3. Subscription accrual trigger

Trigger:

```
Subscription Invoice Paid
AND Payment Type = Subscription
AND Partner Referral Terms exist
```

Action:

- create Partner Accrual from received payment;
- update Partner Balance for that subscription;
- evaluate payout_rule.

#### A4. Payout rule scheduler

For subscription accruals:

- Monthly;
- Quarterly;
- Semiannual;
- Manual;
- Threshold.

Scheduler should only move eligible accruals into batch suggestions. Finance still approves the batch.

#### A5. Payout Batch -> Expense

When batch is approved:

- create Expense Card category = Partner Payout;
- link Expense to PartnerPayoutBatch;
- after Expense paid, mark batch/accruals paid.

#### A6. Agreement notifications

Notify CEO / Head of Sales:

- agreement expires in 30 days;
- partner status changed to Paused / Terminated;
- premium partner has no active agreement.

---

## 5. Cross-module risks

### R1. Finance bypass risk

If implementation creates Expense directly from Invoice / Order, Partner Balance will be wrong.

Rule: no partner Expense without Payout Batch.

### R2. Percent drift risk

If Order reads current Partner Commission Policy every time, old deals can change retroactively.

Rule: percent must be frozen in Partner Referral Terms.

### R3. Subscription payout_rule scope risk

If payout_rule is stored globally on Partner, one partner cannot have different payout preferences per project.

Rule: payout_rule belongs to subscription / project relationship.

### R4. UI/API naming risk

Current UI uses `type` as Inbound / Outbound / Both, while DB uses `type` as Regular / Premium.

Rule: rename conceptually to `level` and `direction`.

### R5. Outbound/inbound mixing risk

Outbound Partner Service is revenue, not payout.

Rule: outbound goes through Finance Invoice / Subscription to Partner.

---

## 6. Implementation phases

### Phase 1 — Stabilize existing Partners

- Align UI/API field names.
- Rename Partner type concept to level in UI/API.
- Ensure direction filters work.
- Add Partner Card skeleton.
- Add cleanup notes to implementation tickets.

### Phase 2 — Commission Policy and CRM Terms

- Add Partner Commission Policy.
- Add Partner Referral Terms.
- Add CRM stage-gates.
- Freeze percent on Deal / Order / Subscription.

### Phase 3 — Accrual and Balance

- Add Partner Accrual.
- Add balance endpoints.
- Create accrual from real payments.
- Stop any direct partner Expense creation.

### Phase 4 — Payout Batch and Finance integration

- Add Payout Batch.
- Add approve/create-expense/paid flow.
- Link Expense Card to batch.
- Add partner payout notifications.

### Phase 5 — Outbound Partner Services

- Add Partner Service Terms.
- Link to Finance Invoice / Subscription.
- Add outbound revenue analytics.

### Phase 6 — Partner Account v2 readiness

- Add partner-facing visibility fields.
- Add access mask plan.
- Prepare read-only portal endpoints, but do not expose until v2.

---

## 7. Accepted decisions

| Решение                                                   | Статус   |
| --------------------------------------------------------- | -------- |
| Старый Partners overview заменён модульной структурой     | Accepted |
| Runtime currently PARTIAL                                 | Accepted |
| defaultPercent alone is not enough                        | Accepted |
| Need Partner Accrual / Balance / Batch before Expense     | Accepted |
| Need outbound revenue model separated from inbound payout | Accepted |
| Cleanup register is the implementation backlog            | Accepted |
