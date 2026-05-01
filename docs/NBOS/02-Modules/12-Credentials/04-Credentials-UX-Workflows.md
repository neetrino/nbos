# Credentials UX And Workflows

> Интерфейс, поиск и ежедневные сценарии работы с Password Vault

## UX / UI Канон

Credentials должен быть быстрым рабочим инструментом, иначе сотрудники снова начнут писать пароли в чаты.

## Главный Экран Vault

Главный экран должен быть оптимизирован под 1000+ записей.

Обязательные зоны:

- global search;
- saved views;
- left filters;
- list/card/table view;
- quick actions;
- detail drawer.

## Основные Views

| View                  | Для чего                                   |
| --------------------- | ------------------------------------------ |
| `All Vault`           | все credentials, доступные пользователю    |
| `Project Credentials` | credentials по проектам                    |
| `Product Credentials` | credentials по продуктам                   |
| `Shared With Me`      | доступы, которыми поделились с сотрудником |
| `My Credentials`      | личные рабочие доступы сотрудника          |
| `Favorites`           | часто используемые доступы                 |
| `Recently Used`       | недавно открытые/скопированные доступы     |
| `Needs Rotation`      | доступы, где rotation due/overdue          |
| `Access Requests`     | запросы на доступ                          |
| `Admin / Security`    | audit, export, emergency, health           |

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
- environment.

Не ищем по secret values.

## Фильтры

Обязательные фильтры:

- Project;
- Product;
- Client;
- Category;
- Type;
- Provider;
- Environment;
- Access Level;
- Owner;
- Criticality;
- Rotation status;
- Health status;
- Recently used;
- Created/updated period.

## Credential List Item

В списке должно быть видно:

- title;
- provider;
- type/category;
- project/product;
- environment;
- access badge;
- health/rotation badge;
- owner;
- last used;
- quick actions: `copy login`, `copy secret`, `open URL`, `request access`.

Secret не показывается в списке.

## Credential Detail Drawer / Card

Карточка должна иметь блоки:

- Overview;
- Secret Fields;
- Context Links;
- Access & Sharing;
- Rotation & Health;
- Audit Log;
- Related Files / Drive supporting docs;
- Related Tasks / Incidents;
- Versions.

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
4. Указывает type/category/provider/environment.
5. Заполняет secret fields.
6. Назначает owner/custodian.
7. Выбирает access policy.
8. Сохраняет.

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
