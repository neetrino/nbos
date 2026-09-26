# Phase 3 — полное закрытие: продуктовый шлюз (gate)

> **Назначение:** один документ, который снимает повторяющиеся вопросы («что значит 72%», «что мешает закрыть Phase 3», «где это в NBOS») и задаёт **явные решения** до начала реализации оставшегося объёма.  
> **Статус:** закрыто. Подтверждённый ниже v1-scope реализован и отражён в [IMPLEMENTATION_PROGRESS.md](./IMPLEMENTATION_PROGRESS.md).

---

## 1. Два разных смысла «Phase 3 закрыта»

| Формулировка            | Смысл                                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Done (pragmatic)**    | Согласованный срез работ выполнен; в трекере зафиксированы **deferred** темы. См. текущее состояние в [IMPLEMENTATION_PROGRESS.md](./IMPLEMENTATION_PROGRESS.md) (Phase 3 pragmatic closure).                             |
| **Done (full roadmap)** | Выполнены пункты **Scope** и **Exit criteria** Phase 3 из [docs/NBOS/00-Implementation-Roadmap.md](../NBOS/00-Implementation-Roadmap.md) **в объёме, который вы считаете обязательным для v1**, без «тихих» дыр в каноне. |

**Важно:** полное закрытие по канону **не требует** сначала закрыть Phase 4–7. Зависимости — только там, где вы сами выносите функциональность в другую фазу (например, отчёты как часть Control layer).

---

## 2. Где уже описаны связи и функции (NBOS Finance)

Канон **не пустой** — материал разнесён по модулям:

| Тема                                                                       | Документ                                                                                                                                                                                       |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Обзор Finance, таблица подмодулей                                          | [docs/NBOS/02-Modules/04-Finance/01-Finance-Overview.md](../NBOS/02-Modules/04-Finance/01-Finance-Overview.md)                                                                                 |
| Client Services, `Client Service Record`, связи с Invoice / Expense / Task | [docs/NBOS/02-Modules/04-Finance/07-Domains-Hosting-Licenses.md](../NBOS/02-Modules/04-Finance/07-Domains-Hosting-Licenses.md)                                                                 |
| Расходы, `source_type`, client service                                     | [docs/NBOS/02-Modules/04-Finance/04-Expenses.md](../NBOS/02-Modules/04-Finance/04-Expenses.md)                                                                                                 |
| Project Bonus Pool, payroll, wallet                                        | [docs/NBOS/02-Modules/04-Finance/05-Bonus-and-Payroll.md](../NBOS/02-Modules/04-Finance/05-Bonus-and-Payroll.md), [08-Employee-Wallet.md](../NBOS/02-Modules/04-Finance/08-Employee-Wallet.md) |
| P&L, отчёты, client services в P&L                                         | [docs/NBOS/02-Modules/04-Finance/06-PnL-Reports.md](../NBOS/02-Modules/04-Finance/06-PnL-Reports.md)                                                                                           |
| Ядро учёта, периоды                                                        | [docs/NBOS/02-Modules/04-Finance/09-Finance-Core-Architecture.md](../NBOS/02-Modules/04-Finance/09-Finance-Core-Architecture.md)                                                               |
| Пробелы реализации относительно канона                                     | [docs/NBOS/02-Modules/04-Finance/10-Finance-Cleanup-Register.md](../NBOS/02-Modules/04-Finance/10-Finance-Cleanup-Register.md)                                                                 |
| Сквозная модель сущностей                                                  | [docs/NBOS/01-Platform-Overview/03-Core-Entities-and-Data-Model.md](../NBOS/01-Platform-Overview/03-Core-Entities-and-Data-Model.md)                                                           |

Этот файл **не дублирует** канон — только фиксирует **что именно вы включаете в v1** перед кодом.

---

## 3. Оставшийся объём для «full» Phase 3 (типовой)

Ниже три столпа, которые чаще всего отделяют pragmatic closure от full closure. Их можно включать **выборочно** — тогда «full» для вас = «всё из списка ниже, что отмечено „в scope“».

### 3.1. Client Services как runtime-модуль

- **Канон:** [07-Domains-Hosting-Licenses.md](../NBOS/02-Modules/04-Finance/07-Domains-Hosting-Licenses.md), [10-Finance-Cleanup-Register.md](../NBOS/02-Modules/04-Finance/10-Finance-Cleanup-Register.md) (C5: сущность ещё не в рантайме).
- **Решения до кода:** минимальный набор типов сервисов в v1; обязательные связи (invoice / expense / task); права и аудит; нужен ли отдельный раздел в навигации.

### 3.2. Finance report definitions (v1 каталог)

- **Канон:** [06-PnL-Reports.md](../NBOS/02-Modules/04-Finance/06-PnL-Reports.md) и ссылки из [09-Finance-Core-Architecture.md](../NBOS/02-Modules/04-Finance/09-Finance-Core-Architecture.md).
- **Решения до кода:** какие отчёты входят в v1 (имена / аудитория); источники данных (только операционные таблицы NBOS); частота и экспорт; граница с Phase 6 (Control / Reports catalog), если отчёт переносится туда.

### 3.3. «NBOS pool» vs уже описанный **Project Bonus Pool**

- **Канон по бонусному пулу проекта:** [05-Bonus-and-Payroll.md](../NBOS/02-Modules/04-Finance/05-Bonus-and-Payroll.md) — **Project Bonus Pool** как плановая логика по проекту/order; в коде уже есть read-only агрегаты (см. прогресс-трекер).
- **Если под «NBOS pool» имеется отдельная сущность в Prisma** (не дубль project pool): нужно **отдельное решение**: название, поля, связь с `BonusEntry` / проектом / периодом, кто создаёт/закрывает. Без этого реализация = риск переделки.

---

## 4. Чеклист решений (заполнить до реализации)

Отметьте **In scope for v1** / **Out of scope** / **Later**.

| #   | Вопрос                                                                                                  | Решение команды                                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Client Services: входит в v1 полноценный `Client Service Record` + UI?                                  | **In scope for v1.** Нужен полноценный runtime-модуль `Client Service Record` с UI, API и связями с Finance / Projects.                                                                                                                                                                                                                                     |
| B   | Если да — какие 1–3 пользовательских сценария обязаны работать end-to-end?                              | 1. Создание и управление сервисом клиента: Domain / Hosting / Service / Account / License с проектом, продуктом, провайдером, billing model, суммами, renewal date и статусом. 2. Client-paid flow: service -> invoice card -> payment -> task -> expense. 3. Company-paid flow: service -> expense / expense plan -> renewal tracking and cost visibility. |
| C   | Report definitions: фиксированный список отчётов v1 (перечислить)?                                      | **In scope for v1:** Finance-owned read-only definitions for Company P&L, Project P&L, Cash Flow, MRR / Subscription Revenue, Expense Plan vs Actual and Payroll Report.                                                                                                                                                                                    |
| D   | Отчёты v1: только read-only из существующих API или нужны новые агрегирующие endpoint’ы?                | Отчёты v1 read-only и строятся только из реальных NBOS operational tables. Existing stats/list APIs may be reused where enough; new read-only aggregating endpoints are allowed where needed for trustworthy rows and drill-down links.                                                                                                                     |
| E   | NBOS pool: это **отдельная** сущность от Project Bonus Pool? (да/нет)                                   | **No.** В Phase 3 v1 отдельная сущность `NBOS pool` не создаётся. Используется уже описанный в каноне `Project Bonus Pool`.                                                                                                                                                                                                                                 |
| F   | Если да на E — одна строка назначения сущности + обязательные поля (или ссылка на приложение со схемой) | Not applicable (`E = No`). Если позже понадобится отдельный company-level pool, он требует нового product/schema gate.                                                                                                                                                                                                                                      |
| G   | Закрытие Phase 3 «full» допускает оставить часть строк C–D на Phase 6? (да/нет)                         | Phase 3 full закрывает Finance-owned report definitions v1 и минимально нужные read-only endpoints. Phase 6 остаётся владельцем global Reports / Analytics catalog, scheduled reports, advanced dashboards, BI presentation, accrual depth and period close.                                                                                                |

---

## 5. После подтверждения — что делает реализация

1. Принятые строки из §4 реализованы срезами: Client Services runtime, Client Services flows, Finance report definitions v1 and six read-only aggregates.
2. [IMPLEMENTATION_PROGRESS.md](./IMPLEMENTATION_PROGRESS.md) обновлён до статуса Phase 3 **Done (full)**.
3. [10-Finance-Cleanup-Register.md](../NBOS/02-Modules/04-Finance/10-Finance-Cleanup-Register.md) обновлён по закрытым Phase 3 v1 пунктам и оставляет Phase 6/control work как future scope.

**Правила репозитория:** схема БД и публичные API — только после явного согласования (см. workspace rules).

---

## 6. Подтверждение (заполняет владелец продукта / команда)

- **Дата:** 2026-04-29
- **Мы подтверждаем in-scope для закрытия Phase 3 (full) в этом цикле:**
  - Client Services: полноценный `Client Service Record` + UI. v1 scenarios:
    1. create/manage client service records for Domain, Hosting, Service, Account and License;
    2. client-paid service flow: service -> invoice card -> payment -> task -> expense;
    3. company-paid service flow: service -> expense / expense plan -> renewal tracking and cost visibility.
  - Report definitions v1: Finance-owned read-only definitions for Company P&L, Project P&L, Cash Flow, MRR / Subscription Revenue, Expense Plan vs Actual and Payroll Report. Existing APIs may be reused; new read-only aggregating endpoints are allowed where needed for trustworthy rows and drill-downs.
  - Отдельная сущность NBOS pool: нет. Phase 3 v1 uses the canonical Project Bonus Pool only. Any separate company-level pool requires a future product/schema gate.
- **Результат реализации:** Phase 3 Finance full closure complete for confirmed v1 scope.
- **Подпись / роль:** Product Owner

Этот документ теперь служит закрывающей записью по Phase 3 Finance v1-scope. Новые Finance темы после этой точки требуют отдельного product/schema gate либо явного включения в Phase 4/6.

---

## 7. Версия

| Версия | Дата       | Изменение                                         |
| ------ | ---------- | ------------------------------------------------- |
| 1.0    | 2026-04-28 | Первичная фиксация gate-документа                 |
| 1.1    | 2026-04-29 | Закрытие подтверждённого Phase 3 Finance v1-scope |
