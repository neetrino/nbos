# Credentials UX And Workflows

> Интерфейс, поиск и ежедневные сценарии работы с Password Vault

## UX / UI Канон

Credentials должен быть быстрым рабочим инструментом, иначе сотрудники снова начнут писать пароли в чаты.

## Главный Экран Vault

Главный экран должен быть оптимизирован под 1000+ записей.

Обязательные зоны:

- стандартные NBOS tabs/search/actions;
- scope tabs;
- quick filters;
- compact recently/frequently used strip;
- list/tiles/category-board view switch;
- quick actions;
- unified Sheet.

## Scope Tabs

Scope tabs определяют область vault, а не внешний вид списка.

| Scope      | Для чего                                         | Create   |
| ---------- | ------------------------------------------------ | -------- |
| `All`      | все credentials, доступные пользователю          | скрыт    |
| `My`       | личные рабочие credentials сотрудника            | доступен |
| `Team`     | низкорисковые общие credentials компании/команды | доступен |
| `Project`  | credentials клиентов, проектов и продуктов       | доступен |
| `Secret`   | чувствительные credentials с ручным доступом     | доступен |
| `Archived` | архивированные credentials                       | скрыт    |

`All` используется для поиска, просмотра, открытия Sheet и quick actions. Создание из `All` не допускается: пользователь должен сначала перейти в `My`, `Team`, `Project` или `Secret`.

`Department` как UX-scope не использовать. Клиентские/рабочие credentials относятся к `Project`.

## View Modes

View modes меняют только способ отображения текущего scope/filter.

| View mode        | Для чего                          | Показывать снаружи                                                                                  |
| ---------------- | --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `List`           | плотный просмотр, поиск, контроль | title, login, category badge, credential type badge, provider, owner/rotation badges, quick actions |
| `Tiles`          | быстро использовать credential    | title, login, provider/type, `copy login`, `copy password`, `open URL`                              |
| `Category Board` | визуальный порядок по category    | category columns, compact credential cards, `+` in each column                                      |

`Category Board` — это view mode внутри Credentials, не отдельный board-модуль. В каждой колонке есть `+`; create Sheet наследует category колонки.

## Sort (включая Recently used)

Сортировка — фильтр **Sort** в панели (первый в списке фильтров):

| Значение UI   | Filter `sort`  | API `sort`     | Поведение                                                    |
| ------------- | -------------- | -------------- | ------------------------------------------------------------ |
| Recently used | `recent`       | `recent`       | Default активного vault; в меню нет, только подпись триггера |
| Name (A–Z)    | `name_asc`     | `name_asc`     | По title                                                     |
| Newest first  | `created_desc` | `created_desc` | Альтернатива; в Archived default = `created_desc`            |

Один список; отдельного strip «Recently used» нет.

## Search

Поиск должен быть быстрым и безопасным.

Ищем по:

- title;
- provider;
- URL/domain;
- project;
- product;
- client;
- category;
- type;
- tags;
- owner;

Не ищем по secret values.

## Фильтры

Обязательные фильтры:

- Project;
- Product;
- Client;
- Category;
- Type;
- Provider;
- Access Level;
- Owner;
- Criticality;
- Rotation status;
- Health status;
- Sort (Recently used / Name / Newest);
- Created/updated period.

Быстрые фильтры под search:

- Hosting;
- Domain;
- Mail;
- Admin;
- API;
- Database;
- Mine;
- Needs Rotation.

`Needs Rotation` — filter/saved view, не scope tab.

## Credential List Item

В списке должно быть видно:

- title;
- provider;
- category badge;
- credential type badge;
- project/product;
- access badge;
- health/rotation badge;
- owner;
- last used;
- quick actions: `copy login`, `copy secret`, `open URL`, `request access`.

Secret не показывается в списке.

## Credential Sheet

Один Sheet используется для create, open и edit из любого места:

- Credentials list;
- Tiles;
- Category Board;
- Delivery Board;
- Product page;
- Finance;
- другие модули.

Click по row/card открывает Sheet. Исключения: `copy login`, `copy secret`, `open URL` работают как quick actions без открытия Sheet.

**Shareable URL (vault list):** пока Sheet открыт, в адресе остаётся `?openCredentialId={uuid}` на `/credentials` (как `openLeadId` / `openExpense`). Floating rail: **Copy link** (текущий URL) и **Open** (та же ссылка в новой вкладке). Вне vault — ссылка из Product/Credentials tab ведёт на vault deep link.

Sheet должен иметь блоки:

- Overview;
- Secret Fields;
- Context Links;
- Manual Access;
- Rotation & Health;
- Audit Log;
- Related Files / Drive supporting docs;
- Related Tasks / Incidents;
- Versions.

Dangerous actions (`archive`, `restore`, `permanent delete`) находятся в Settings/Advanced внутри Sheet.

### Manual Access Block

Manual Access показывает только сотрудников, которым доступ к этому credential выдан руками из Sheet.

Не показывать здесь всех сотрудников, которые получили доступ через:

- Role Access Levels;
- Personal Access Levels;
- Project Team;
- Product Team;
- global owner/CEO policy.

Row в Manual Access:

- employee;
- access: `View` / `Edit`;
- remove manual access.

Inherited access можно показывать как короткий summary, без полного списка людей.

## Quick Actions

Допустимые quick actions:

- copy login;
- copy password/secret;
- reveal secret;
- open URL;
- request access;
- add to favorites;
- rotate credential;
- share temporarily;
- archive;
- create task;
- report issue.

Каждое действие с secret логируется.

## Bulk Actions

Для 1000+ записей нужны bulk actions:

- assign owner;
- assign project/product;
- add tag;
- change access policy;
- request rotation;
- archive selected;
- export selected, только admin policy;
- move category;
- mark as duplicate.

---

## Import / Migration

Так как у компании уже может быть много паролей, нужен import.

Поддержать:

- CSV import;
- import из 1Password/Bitwarden/LastPass формата, если понадобится;
- manual bulk import;
- duplicate detection;
- mapping categories/types;
- preview before import;
- import audit.

После import система должна предложить:

- назначить owners;
- связать с Project/Product;
- расставить categories/types;
- проверить слишком широкие доступы;
- запланировать rotation critical secrets.

---

## Recommended Daily Workflow

### Сотрудник Ищет Доступ

1. Открывает Vault или вкладку Credentials внутри Project/Product.
2. Ищет по project/provider/domain.
3. Видит credential metadata.
4. Если есть доступ - копирует нужное поле.
5. Copy логируется.
6. Если доступа нет - отправляет Access Request.

### PM Добавляет Доступ К Проекту

1. Открывает Project/Product.
2. Переходит во вкладку Credentials.
3. Создаёт новый credential.
4. Проверяет category, preset-нутую из Project/Product/slot context, или выбирает category в компактном control.
5. Выбирает credential type как `What is stored?`.
6. Указывает provider (если нужен типу).
7. Заполняет secret fields.
8. Назначает owner/custodian.
9. Выбирает access policy.
10. Сохраняет.

### CEO Проверяет Security

1. Открывает Admin / Security view.
2. Смотрит health summary.
3. Видит overdue rotations, broad access, missing owner.
4. Назначает tasks или меняет access policy.
5. Проверяет audit export/emergency actions.

### Увольнение Сотрудника

1. My Company переводит employee в offboarding flow.
2. Credentials показывает все access grants.
3. Доступы revoke.
4. Для critical credentials создаются rotation tasks.
5. Owner получает notification.
6. После completion offboarding фиксируется.
