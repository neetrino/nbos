# Libraries And Entity Links

## 1. Главный принцип

`Library / Библиотека` - это логическое представление файлов по бизнес-контексту.

В NBOS пользователь видит библиотеки как папки и разделы, но технически они собираются из `File Asset` + `File Link` + permissions.

Это нужно, потому что один файл может одновременно быть:

- файлом сделки;
- approved offer;
- handoff материалом;
- файлом продукта;
- документом клиента.

---

## 2. Основные библиотеки

| Library              | Что показывает                                                 |
| -------------------- | -------------------------------------------------------------- |
| `Deals Library`      | Offer materials, messenger proofs, commercial documents по CRM |
| `Project Library`    | Все файлы проекта как бизнес-контейнера                        |
| `Product Library`    | Рабочие и финальные файлы конкретного Product                  |
| `Extension Library`  | Файлы конкретной доработки                                     |
| `Client Library`     | Документы Contact / Company / Client Portfolio                 |
| `Finance Library`    | Invoice, payment proof, expense proof, financial reports       |
| `Partner Library`    | Agreements, payout statements, partner documents               |
| `Task Files`         | Вложения задач                                                 |
| `Work Space Library` | Backlog / sprint / scrum artifacts                             |
| `Support Files`      | Screenshots, logs, recordings, evidence                        |
| `Company Library`    | Templates, SOP, brand, training, shared materials              |
| `Personal Library`   | Приватные рабочие файлы сотрудника                             |

---

## 3. Deals Library

CRM не должен хранить файлы отдельно от Drive.

Когда Seller прикрепляет файл к Deal:

1. создаётся `File Asset`;
2. создаётся `File Link` к Deal;
3. задаётся `purpose`;
4. файл виден в Deal card и Deals Library.

Типы файлов:

- `OFFER_DRAFT`;
- `OFFER_SENT`;
- `OFFER_APPROVED`;
- `MESSENGER_PROOF`;
- `CONTRACT`;
- `CLIENT_BRIEF`;
- `COMMERCIAL_NOTE`.

Если Deal переходит в `Deal Won`, approved materials автоматически получают дополнительные links к Project / Product / Client.

---

## 4. Project Library

Project Library показывает все файлы, относящиеся к бизнесу / бренду клиента.

Project Library не должна смешивать всё в одну кучу. Минимальные секции:

- Commercial;
- Handoff;
- Products;
- Extensions;
- Finance;
- Support;
- Client Documents;
- Archive.

Project Library нужна CEO, PM, Seller и Finance как общий вход.

---

## 5. Product Library

Product Library - главный рабочий файловый контекст delivery.

Секции:

- Approved Offer / Scope;
- Handoff;
- Design;
- Development Docs;
- Assets;
- QA Evidence;
- Delivery;
- Credentials References, без хранения secrets;
- Support History;
- Finance Documents, если есть доступ.

Product Library получает часть файлов автоматически:

- approved offer из Deal;
- handoff documents из CRM / Project;
- task artifacts из Work Space;
- support evidence по этому Product;
- final delivery files после Transfer / Done.

---

## 6. Extension Library

Extension всегда связана с Project и обычно с одним Product.

Extension Library должна показывать:

- approved extension offer;
- scope changes;
- design / dev / QA материалы;
- files from extension tasks;
- final delivery files;
- related invoice/payment files, если у пользователя есть доступ.

Extension files могут быть видны и в Product Library как отдельная секция `Extensions`.

---

## 7. Client Library

Client Library открывается из Client Portfolio, Contact или Company.

Содержимое:

- legal documents;
- company requisites;
- commercial documents;
- approved offers;
- contracts;
- finance proofs, если у пользователя есть permission;
- project delivery archives;
- partner-visible или client-visible documents, если в будущем будет portal.

Client Library не является отдельной сущностью клиента. Она вычисляется по Contact / Company / Projects / Deals / Finance links.

---

## 8. Finance Library

Finance Library показывает только документы, связанные с деньгами.

Типы:

- Invoice Card attachments;
- official invoice request proof;
- payment proof;
- expense proof;
- salary / payroll exports;
- partner payout documents;
- P&L exports;
- client service receipts.

Finance files должны иметь отдельный permission layer. Не каждый участник проекта должен видеть finance-sensitive files.

---

## 9. Task Files And Work Space Library

Task attachments - самый частый источник мусора.

Правила:

1. Файл, прикреплённый к Task, создаёт link к Task.
2. Если Task находится внутри Work Space, файл также получает link к Work Space.
3. Если Task связана с Product / Extension, файл может быть виден в Product / Extension Library.
4. Temporary task files получают более короткую retention policy.
5. Final artifacts из задач должны быть явно marked as `WORKSPACE_ARTIFACT` или `DELIVERY_FILE`, чтобы не попасть в cleanup.

Work Space Library должна иметь секции:

- Backlog attachments;
- Sprint artifacts;
- Task outputs;
- QA evidence;
- Final delivery candidates;
- Archive.

---

## 10. Support Files

Support Ticket attachments:

- screenshots;
- logs;
- screen recordings;
- customer proofs;
- incident reports;
- fix documentation.

Если ticket связан с Product, файл должен быть виден:

- в Ticket;
- в Support Files;
- в Product Library, секция Support History.

Resolved ticket files можно архивировать по retention policy, но incident/post-mortem материалы хранить дольше.

---

## 11. Company Library

Company Library хранит внутренние документы Neetrino:

- templates;
- brand materials;
- SOP documents;
- training;
- HR / onboarding materials;
- shared operational files.

SOP source of truth остаётся в My Company SOP, если SOP является исполняемым процессом. Drive хранит вложения, шаблоны и экспортированные материалы.
