# Technical Assets And Environments

> Техническая карта продукта, environments и инфраструктурные зависимости

## Technical Profile / Техническая Карта Product

У каждого Product должна быть техническая карта.

Она отвечает на вопрос: "Что нужно знать, чтобы безопасно обслуживать и деплоить этот продукт?"

### Основные Поля Technical Profile

| Поле                   | Описание                                          |
| ---------------------- | ------------------------------------------------- |
| `product`              | Product, к которому относится техническая карта   |
| `project`              | Project context                                   |
| `technical_owner`      | ответственный за техническую эксплуатацию         |
| `production_url`       | основной production URL                           |
| `staging_url`          | staging URL, если есть                            |
| `repository_url`       | GitHub/GitLab repository                          |
| `deployment_method`    | manual / CI-CD / provider deploy / agency process |
| `hosting_provider`     | Vercel, Beget, Hetzner, DigitalOcean, AWS, other  |
| `primary_environment`  | Production environment                            |
| `monitoring_status`    | Healthy / Warning / Critical / Not Configured     |
| `backup_status`        | Healthy / Warning / Missing / Not Required        |
| `last_deploy_at`       | дата последнего деплоя                            |
| `last_deploy_status`   | Success / Failed / Rolled Back / Unknown          |
| `open_incidents_count` | открытые technical incidents                      |
| `technical_notes`      | non-secret технические заметки                    |

Техническая карта не хранит passwords, API keys или `.env` напрямую. Она хранит ссылки на Credentials.

## Technical Asset / Технический Актив

Technical Asset - любая техническая зависимость продукта.

Типы:

- Domain / DNS;
- Hosting / Server;
- Repository;
- Database;
- Storage;
- Email / SMTP;
- External API;
- Payment Provider;
- Analytics;
- CDN;
- Queue / Worker;
- Cron / Scheduler;
- Monitoring Tool;
- Error Tracking;
- Backup Storage.

### Поля Technical Asset

| Поле                    | Описание                                                       |
| ----------------------- | -------------------------------------------------------------- |
| `type`                  | тип технического актива                                        |
| `name`                  | понятное имя                                                   |
| `provider`              | поставщик                                                      |
| `environment`           | Production / Staging / Development                             |
| `status`                | Active / Warning / Broken / Deprecated / Unknown               |
| `product`               | связанный Product                                              |
| `client_service_record` | ссылка на Finance / Client Service, если есть деньги/продление |
| `credential`            | ссылка на Credentials, если нужен доступ                       |
| `url`                   | dashboard/admin/public URL                                     |
| `owner`                 | technical owner                                                |
| `notes`                 | non-secret notes                                               |

## Environment / Окружение

Environment - техническое окружение продукта.

Базовые типы:

- `Production`;
- `Staging`;
- `Development`;
- `Preview`;
- `Legacy`.

### Поля Environment

| Поле                | Описание                              |
| ------------------- | ------------------------------------- |
| `name`              | Production / Staging / Development    |
| `product`           | связанный Product                     |
| `url`               | публичный или внутренний URL          |
| `branch`            | git branch, если применимо            |
| `deployment_target` | куда деплоится                        |
| `env_credentials`   | ссылка на Credentials с env variables |
| `database_asset`    | связанный database asset              |
| `status`            | Healthy / Warning / Down / Unknown    |
| `last_checked_at`   | последняя проверка                    |

## Domain / DNS Как Technical Asset

Domain остаётся финансовым `Client Service Record`, если у него есть продление, стоимость и billing.

В Technical он отображается как зависимость:

```text
Product
    ->
Technical Profile
    ->
Domain/DNS Technical Asset
    ->
Client Service Record
    ->
Credential
```

Это даёт две перспективы:

- Finance видит домен как оплату и продление;
- Technical видит домен как production dependency.

## Hosting / Server Как Technical Asset

Hosting тоже может быть Client Service Record, если есть оплата.

Но Technical дополнительно хранит:

- environment;
- deployment target;
- technical status;
- linked credentials;
- linked monitoring;
- backup policy;
- incidents.

## Repository

Repository asset должен хранить:

- repository URL;
- provider;
- default branch;
- product;
- technical owner;
- CI/CD status, если интеграция есть;
- linked credentials, если нужен deploy token;
- linked Work Space / tasks, если нужно.

## Database / Storage

Database и storage assets должны хранить metadata без secret:

- provider;
- environment;
- region, если важно;
- database name, если безопасно;
- backup policy;
- status;
- linked credentials for connection string;
- linked monitoring/checks.

Connection strings, passwords и access keys должны быть только в Credentials.
