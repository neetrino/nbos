# Marketing Cleanup Register

> NBOS Marketing - что нужно реализовать/очистить после принятия Marketing Operations canon.

## Назначение

Этот файл фиксирует расхождения между текущим состоянием и новым каноном `Marketing`.

Новый канон:

- Marketing является полноценным рабочим модулем;
- CRM использует Marketing fields, но не управляет marketing operations;
- Marketing Board является главным экраном маркетолога;
- Channels/Accounts/Attribution Options живут в Marketing Settings;
- `Which one` зависит от `Where`;
- List.am accounts являются Marketing Accounts и могут связываться с Finance Expense Plans;
- Campaign/Activity launch может создавать Finance Expense Card;
- CPL/ROI считаются только там, где есть spend;
- attribution работает даже без Finance link;
- Lead/Deal marketing fields обязательны для продвижения по CRM stages.

---

## A. Already aligned / Уже совпадает с каноном

### A1. CRM already has marketing fields concept

Статус: `PARTIAL DOCS / PARTIAL UI`

В CRM уже обсуждены поля:

```text
From
Where
```

Новый канон добавляет `Which one` as dynamic field based on `Where`.

### A2. Finance already has Expense Plans / Expense Cards canon

Статус: `OK DOCS`

Finance canon уже поддерживает планы расходов, карточки расходов и recurring-like расходы. Marketing должен ссылаться на них, а не создавать отдельную финансовую систему.

---

## B. Runtime / UI stale or missing

### B1. Marketing module is missing

Статус: `MISSING MODULE`

Нужно добавить module route:

```text
/marketing
```

Main sections:

- Marketing Board;
- Attribution Review;
- Marketing Dashboard;
- Marketing Settings.

### B2. Sidebar does not include Marketing

Статус: `MISSING UI`

Нужно добавить Marketing как top-level module, если он включён для компании/пользователя.

### B3. Lead/Deal attribution is too shallow

Статус: `NEEDS REFACTOR`

Текущие marketing fields должны стать:

```text
From
Where
Which one
```

`Which one` должен быть dynamic by `Where`.

### B4. Marketing Accounts are missing

Статус: `MISSING CODE / MISSING UI`

Нужно добавить:

- channel;
- account name;
- identifier/phone;
- status;
- linked finance expense plan;
- attribution availability.

### B5. Marketing Activities are missing

Статус: `MISSING CODE / MISSING UI`

Нужно добавить:

- board stages;
- activity card;
- launch process;
- budget/start/end/expected payment date;
- linked expense card.

### B6. Attribution Review is missing

Статус: `MISSING UI`

Нужно добавить экран для лидов/сделок с неполным источником.

### B7. Finance links from Marketing are missing

Статус: `MISSING CODE`

Нужно добавить:

- Marketing Activity -> Expense Card;
- Marketing Account -> Expense Plan;
- spend status visible in Marketing.

### B8. List.am account tracking is missing

Статус: `MISSING CODE / MISSING UI`

Нужно реализовать List.am как channel with accounts:

- account name;
- phone number;
- finance expense plan link;
- leads/won/revenue attribution.

### B9. Marketing Dashboard is missing

Статус: `MISSING UI`

Нужно добавить:

- leads by channel/account/activity;
- MQL/SQL/Won;
- revenue attribution;
- spend where available;
- missing attribution warnings.

---

## C. Implementation order

1. Add Marketing module route and sidebar entry.
2. Add Marketing Settings: Channels and Accounts.
3. Add Marketing Account model and UI.
4. Add `Which one` dynamic attribution model.
5. Update CRM Lead/Deal forms to use Marketing attribution.
6. Add Marketing Board and Activity model.
7. Add launch popup with budget/start/end/expected payment date.
8. Add Activity -> Finance Expense Card creation.
9. Add Account -> Finance Expense Plan manual linking.
10. Add Attribution Review screen.
11. Add Marketing Dashboard.
12. Add KPI data outputs for My Company.

## D. Non-goals for MVP

В MVP не нужно:

- direct Meta/Google Ads API integration;
- automatic call tracking;
- automatic UTM attribution;
- advanced multi-touch attribution;
- perfect CPL for every source;
- marketing payroll logic inside Marketing.

## E. Important safeguards

Do not block marketing operations because finance link is missing.

Correct behavior:

```text
Attribution works without spend.
Cost analytics requires spend.
```

Do not show fake cost values.

Correct behavior:

```text
No spend data -> show missing spend, not zero.
```
