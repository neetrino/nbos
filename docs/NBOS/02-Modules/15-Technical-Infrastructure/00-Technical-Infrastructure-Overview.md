# Technical / Infrastructure Overview

> NBOS Platform - техническая эксплуатация продуктов, environments, deployment, monitoring, backups и incidents

## Назначение Модуля

`Technical / Infrastructure` - это модуль, который отвечает за техническое состояние каждого Product.

Он показывает:

- где продукт размещён;
- какие environments существуют;
- как продукт деплоится;
- какие домены и DNS используются;
- где база данных и storage;
- где лежат credentials;
- работает ли production;
- настроены ли SSL, monitoring и backups;
- какие incidents были по продукту;
- кто технически отвечает за эксплуатацию.

Главная цель модуля - чтобы компания не теряла контроль над технической стороной продуктов после продажи, разработки и передачи клиенту.

## Почему Это Отдельный Модуль

Сейчас техническая информация размазана по нескольким зонам:

- `Finance / Client Services` - домены, hosting, лицензии, продления, invoice, expense;
- `Credentials` - логины, API keys, `.env`, hosting panels;
- `Project Hub / Delivery` - deployment checklist и Transfer;
- `Support` - incidents и problem tickets;
- `My Company / SOP` - deployment и incident response инструкции.

Это нормально как связи, но недостаточно как центр управления.

`Technical / Infrastructure` нужен как отдельный operational layer: он не заменяет Finance, Credentials или Support, а собирает техническую картину продукта в одном месте.

## Главная Граница Модуля

### Finance / Client Services

Отвечает за деньги:

- кто платит за domain/hosting/service;
- когда продление;
- какой invoice выставить клиенту;
- какой expense оплатить компании;
- какая цена для клиента и себестоимость.

### Credentials

Отвечает за секреты:

- логины;
- пароли;
- API keys;
- `.env`;
- SSH/private keys;
- access grants;
- audit reveal/copy.

### Technical / Infrastructure

Отвечает за техническое состояние:

- production/staging/dev environments;
- hosting/server/cloud;
- deployment method;
- repository;
- domain/DNS/SSL status;
- database/storage/queues;
- monitoring/error tracking;
- backup policy;
- incident history;
- technical readiness перед Transfer/Done.

### Support

Отвечает за обращения и инциденты:

- client support ticket;
- incident;
- problem/RCA;
- SLA;
- communication.

Technical module может видеть linked incidents, но не заменяет Support.

---

## Product Operations Center

Главная идея модуля:

`Technical / Infrastructure = Product Operations Center`.

Для каждого Product должна быть техническая карта, где видно:

- `Production URL`;
- `Staging URL`;
- `Repository`;
- `Hosting Provider`;
- `Deployment Method`;
- `Environment Variables link -> Credentials`;
- `Domain/DNS link -> Client Service`;
- `SSL status`;
- `Database`;
- `Storage`;
- `Backups`;
- `Monitoring / Uptime`;
- `Error Tracking`;
- `Last Deploy`;
- `Open Incidents`;
- `Technical Owner`.

Это должно быть доступно из Product page в Project Hub и из отдельного Technical module.

---

## Базовый Поток

```text
Product is created
    ->
Technical Profile is created or prepared
    ->
Environments are defined
    ->
Credentials / Client Services / Repositories are linked
    ->
Deployment checklist is completed
    ->
Production is monitored
    ->
Incidents / backups / changes are tracked
```

---

## Структура Документации Модуля

| Файл                                              | Что смотреть                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `00-Technical-Infrastructure-Overview.md`         | назначение, границы и общая концепция                                           |
| `01-Technical-Assets-and-Environments.md`         | Technical Profile, assets, environments и техническая карта Product             |
| `02-Deployment-and-Release-Process.md`            | release/deployment процесс, checklist, stage gates, rollback                    |
| `03-Monitoring-Backups-Incidents.md`              | monitoring, backups, incidents, runbooks и operational health                   |
| `04-Technical-Integrations.md`                    | связи с Finance, Credentials, Project Hub, Support, Tasks, Drive, Notifications |
| `99-Technical-Infrastructure-Cleanup-Register.md` | что в текущих docs/runtime нужно перенести или переделать                       |

---

## Принятые Решения Owner

- Technical / Infrastructure нужен как отдельный модуль.
- Он не заменяет Finance / Client Services и Credentials.
- Домены/hosting как деньги остаются в Finance, но как технические зависимости отображаются в Technical.
- Secrets остаются в Credentials, но Technical показывает ссылки на нужные credentials.
- Support incidents остаются в Support, но Technical показывает linked incidents и technical health.
- Главная сущность модуля - техническая карта Product / Product Operations Center.
