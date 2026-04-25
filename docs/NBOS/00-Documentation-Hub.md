# Центральный указатель документации NBOS

**Назначение:** одна страница, с которой можно продолжить работу в любой день: что канонично, где лежит архив, как связаны требования и код.

**Корень `docs/`:** см. [README.md](../README.md).

---

## 1. Иерархия источников правды

| Приоритет | Источник                                                  | Роль                                                                                |
| --------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1         | `01-Platform-Overview/03-Core-Entities-and-Data-Model.md` | Сущности, Deal Type / Product Type, связи                                           |
| 2         | `03-Business-Logic/*`                                     | Сквозные процессы (Lead-to-Cash, Order, подписки, **08-Stakeholder-Decisions-\*** ) |
| 3         | `02-Modules/*`                                            | Модули по областям (CRM, Projects Hub, Finance, …)                                  |
| 4         | `05-UI-Specifications/*`                                  | Экраны и навигация                                                                  |
| 5         | `00-Delta-New-Description.md`                             | Матрица пробелов и бэклог относительно старых обсуждений                            |

**Правило:** при конфликте формулировок между черновиком и § 1.1 Core Entities — **побеждает Core Entities**, затем актуальные решения из `08-Stakeholder-Decisions-*` и `05-Product-Centric-Navigation.md`. Архивные документы ниже не являются источниками правды.

---

## 2. Карта: материалы из архива → канон в `docs/NBOS`

Исходные файлы заказчика лежат в **`docs/archive/New-Description/`** (текст расшифровок и ранние версии). Смысл перенесён или дублируется в канон ниже.

| Файл в архиве                               | Каноническое размещение (куда смотреть разработчику)                                                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `1.md`                                      | Сквозной каркас: `03-Business-Logic/01-Lead-to-Cash-Process.md`, `02-Order-to-Delivery-Process.md`; модель Product — Core Entities § 1.1 |
| `2.md`, `Lead.md`                           | `02-Modules/01-CRM/02-Lead-Pipeline.md`, `05-UI-Specifications/02-CRM-Pages.md`                                                          |
| `Deal1.md`, `Deal2.md`                      | `02-Modules/01-CRM/03-Deal-Pipeline.md`, `03-Business-Logic/03-Bonus-Payroll-Logic.md`, `04-Finance/02-Invoices-and-Payments.md`         |
| `Orders.md`                                 | `03-Business-Logic/02-Order-to-Delivery-Process.md`, `04-Finance/*`, Core Entities                                                       |
| `Project Hub & Creating.md`                 | `02-Modules/02-Projects-Hub/*`, `05-Tasks/*`, `05-UI-Specifications/03-Project-Hub-Pages.md` § 0                                         |
| `Maintnanace (...).md`                      | `02-Modules/02-Projects-Hub/04-Project-Lifecycle.md`, `04-Finance/03-Subscriptions.md`                                                   |
| `Credentials #Password.md`                  | `02-Modules/12-Credentials/01-Credentials-Vault.md`                                                                                      |
| `Remember Clinet Payments.md`               | Бэклог в `00-Delta-New-Description.md`; близко `04-Finance/07-Domains-Hosting-Licenses.md`                                               |
| `00-Open-Questions-and-Decisions.md`        | **Канон:** `03-Business-Logic/08-Stakeholder-Decisions-Product-Extension-Maintenance.md`                                                 |
| `Project-Hub-Product-Centric-Navigation.md` | **Канон:** `02-Modules/02-Projects-Hub/05-Product-Centric-Navigation.md`                                                                 |

---

## 3. Ключевые «якорные» документы (часто нужны)

| Тема                                                | Файл                                                                                                |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Как прорабатывать каждый модуль                     | `00-Module-Documentation-Working-Method.md`                                                         |
| Финансовое ядро (журнал vB, accrual/cash, периоды)  | `02-Modules/04-Finance/09-Finance-Core-Architecture.md`                                             |
| Кошелёк сотрудника (Wallet, read-only)              | `02-Modules/04-Finance/08-Employee-Wallet.md`                                                       |
| Видение, слои                                       | `01-Platform-Overview/01-Vision-and-Goals.md`, `02-Platform-Architecture-Layers.md`                 |
| Продукто-центричный Hub                             | `02-Modules/02-Projects-Hub/05-Product-Centric-Navigation.md`                                       |
| Решения заказчика (Product, Extension, MAINTENANCE) | `03-Business-Logic/08-Stakeholder-Decisions-Product-Extension-Maintenance.md`                       |
| Воронка Deal                                        | `02-Modules/01-CRM/03-Deal-Pipeline.md`                                                             |
| Stage Gates Deal + override logic                   | `02-Modules/01-CRM/05-Deal-Stage-Gates-and-Won-Override.md`                                         |
| CRM cleanup register                                | `02-Modules/01-CRM/06-CRM-Cleanup-Register.md`                                                      |
| Projects Hub cleanup register                       | `02-Modules/02-Projects-Hub/06-Projects-Hub-Cleanup-Register.md`                                    |
| Task system / Work Space canon                      | `02-Modules/05-Tasks/01-Task-System-Overview.md`, `02-Modules/05-Tasks/02-Work-Spaces-and-Views.md` |
| Tasks cleanup register                              | `02-Modules/05-Tasks/04-Tasks-Cleanup-Register.md`                                                  |
| Support canon                                       | `02-Modules/06-Support/01-Support-Overview.md`, `02-Modules/06-Support/02-Ticket-Lifecycle.md`      |
| Support cleanup register                            | `02-Modules/06-Support/04-Support-Cleanup-Register.md`                                              |
| Finance cleanup register                            | `02-Modules/04-Finance/10-Finance-Cleanup-Register.md`                                              |
| My Company cleanup register                         | `02-Modules/07-My-Company/06-My-Company-Cleanup-Register.md`                                        |
| Дельта и бэклог                                     | `00-Delta-New-Description.md`                                                                       |
| Единый план и прогресс                              | [DEVELOPMENT_PLAN.md](../DEVELOPMENT_PLAN.md)                                                       |

---

## 4. Архив

- **`docs/archive/New-Description/`** — полный набор исходных `.md` из корня репозитория (перенос 2026-03-31). Не удалять: нужен для аудита формулировок.
- **`docs/archive/*`** (старые `ЧАСТЬ 1`, `Architecture` и т.д.) — исторические, не использовать как канон без сверки с NBOS.
- **`docs/NBOS/archive/00-Technical-Architecture-Brief.md`** — исторический сводный brief; не использовать как активный канон.
- **`docs/NBOS/archive/00-NEXT-STEPS-ROADMAP.md`** — исторический roadmap на момент раннего этапа восстановления Product/Projects Hub.
- **`docs/NBOS/archive/PRODUCT-ENTITY-GIT-ANALYSIS.md`** — исторический git-анализ удаления и возврата Product; использовать только как справку по прошлым решениям.

---

## 5. Связь с кодом

- Монорепо: `apps/web`, `apps/api`, `packages/database`.
- Целевая модель данных: Core Entities. Исторический анализ восстановления Product при необходимости смотреть в `archive/PRODUCT-ENTITY-GIT-ANALYSIS.md`.

---

**Версия:** 1.0  
**Дата:** 2026-03-31
