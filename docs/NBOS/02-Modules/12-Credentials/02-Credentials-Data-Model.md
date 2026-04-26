# Credentials Data Model

> Сущности, поля и связи Credentials / Password Vault

## Основные Сущности

### 1. Credential Item / Запись Доступа

Главная сущность модуля.

Одна запись описывает один рабочий доступ или один набор связанных секретных данных.

Принцип: `один credential = одна цель`.

Примеры:

- `Marco.am - Beget Hosting - Production`;
- `Marco.am - Neon Database - Production`;
- `NBOS - OpenAI API Key - Production`;
- `ClientBrand - Cloudflare Account`;
- `Internal - Apple Developer Account`;
- `Marco.am - .env - Frontend Production`.

### 2. Credential Type / Тип Доступа

Тип нужен, чтобы разные доступы имели разные обязательные поля и разный UX.

| Type                | Для чего нужен                                        |
| ------------------- | ----------------------------------------------------- |
| `Login / Password`  | обычный аккаунт с логином и паролем                   |
| `API Key / Token`   | API ключи, bearer tokens, bot tokens                  |
| `Database`          | database URL, username, password, host, port, DB name |
| `SSH / Private Key` | private key, passphrase, host, user                   |
| `ENV Bundle`        | группа `.env` переменных для окружения                |
| `Domain Registrar`  | доступ к регистратору домена                          |
| `Hosting / Server`  | hosting, VPS, server panel, cloud console             |
| `App Store Account` | Apple Developer, Google Play Console                  |
| `Mail / SMTP`       | почтовые аккаунты, SMTP, IMAP                         |
| `Recovery Codes`    | backup/recovery codes для 2FA                         |
| `Other Secret`      | нестандартный доступ                                  |

### 3. Secret Field / Секретное Поле

Секретные поля должны быть отдельной гибкой структурой, а не фиксированными колонками `password`, `apiKey`, `envData`.

У одной записи может быть несколько secret fields:

- password;
- API key;
- refresh token;
- private key;
- passphrase;
- database password;
- connection string;
- env variable;
- recovery code.

Каждое secret field:

- шифруется;
- скрыто по умолчанию;
- имеет отдельный audit для reveal/copy;
- может иметь дату rotation;
- может быть помечено как critical.

### 4. Context / Контекст

Credential должен быть связан с бизнес-контекстом, чтобы сотрудник не искал пароль вручную среди 1000 записей.

Возможные связи:

- Project;
- Product;
- Extension;
- Client;
- Company;
- Client Service Record;
- Domain;
- Hosting;
- Subscription;
- Support Ticket;
- Work Space;
- Department;
- Employee.

Связь с Project/Product особенно важна: в карточке Project/Product должна быть вкладка `Credentials`, где автоматически видны нужные доступы.

### 5. Owner / Custodian

У каждого credential должен быть ответственный.

`Owner / Custodian` - это сотрудник или seat, который отвечает за:

- актуальность доступа;
- правильный access level;
- rotation;
- перенос доступа при изменении проекта;
- реакцию на access requests;
- offboarding cleanup.

Owner не обязательно единственный человек, который видит secret. Owner - ответственный за порядок.

### 6. Access Grant / Разрешение Доступа

Доступ к credential должен быть отдельной сущностью, а не только одним enum-полем.

Access grant может быть выдан:

- сотруднику;
- business seat;
- department;
- project team;
- product team;
- role/permission group;
- временно до конкретной даты.

У access grant должны быть:

- кто получил доступ;
- кто выдал доступ;
- причина;
- срок действия, если доступ временный;
- дата выдачи;
- дата отзыва;
- audit.

### 7. Access Request / Запрос Доступа

Если сотруднику нужен доступ, но у него нет прав, он не должен писать в чат "скинь пароль".

Правильный процесс:

1. сотрудник открывает credential card или project credentials list;
2. видит запись без секрета или видит placeholder `Access required`;
3. нажимает `Request Access`;
4. указывает причину;
5. owner / PM / CEO получает уведомление;
6. approve/reject фиксируется в audit;
7. при approve создаётся access grant.

### 8. Credential Version / История Версий

При изменении secret нужно сохранять безопасную историю:

- когда secret был обновлён;
- кто обновил;
- почему обновил;
- какая версия активна;
- была ли rotation по плану или emergency.

Старое значение не должно свободно показываться всем. Доступ к старым версиям - только через admin/emergency policy.

### 9. Rotation Policy / Правило Обновления

Для критичных доступов нужно понимать, когда их менять.

Поля:

- rotation interval;
- next rotation date;
- last rotated at;
- rotation owner;
- status: `Healthy`, `Due Soon`, `Overdue`, `Compromised`, `Unknown`.

Примеры:

- root/server/admin доступы - каждые 90 дней;
- API keys production - каждые 180 дней или при инциденте;
- личные рабочие доступы - по политике компании;
- shared service accounts - по событию offboarding/role change.

---

## Категории

Category нужна для группировки и фильтрации, но не должна заменять Credential Type.

| Category      | Примеры                                         |
| ------------- | ----------------------------------------------- |
| `Admin`       | main company admin accounts, super admin panels |
| `Domain`      | registrars, DNS providers                       |
| `Hosting`     | VPS, hosting panels, cloud providers            |
| `Service`     | SaaS tools, analytics, support tools            |
| `App`         | Apple Developer, Google Play Console            |
| `Mail`        | mailbox, SMTP, Google Workspace                 |
| `API Key`     | OpenAI, Stripe, Telegram Bot, payment APIs      |
| `Database`    | Neon, PostgreSQL, MySQL, Redis                  |
| `Development` | GitHub, GitLab, CI/CD, deployment               |
| `Marketing`   | ad accounts, analytics, social tools            |
| `Finance`     | payment services, accounting portals            |
| `Other`       | нестандартные доступы                           |

---

## Обязательные Поля

### Общие Поля

| Поле                | Обязательное | Описание                                  |
| ------------------- | ------------ | ----------------------------------------- |
| `Title`             | Да           | Понятное название credential              |
| `Type`              | Да           | Login, API Key, Database, SSH, ENV и т.д. |
| `Category`          | Да           | Domain, Hosting, Service, Finance и т.д.  |
| `Owner / Custodian` | Да           | Кто отвечает за credential                |
| `Access Policy`     | Да           | Кто может видеть/копировать secret        |
| `Criticality`       | Да           | Low / Medium / High / Critical            |
| `Context`           | По ситуации  | Project/Product/Service/Department        |
| `Provider`          | По ситуации  | Beget, Vercel, Cloudflare, Neon           |
| `URL`               | По ситуации  | Страница входа или admin panel            |
| `Environment`       | По ситуации  | Production / Staging / Development        |
| `Notes`             | Нет          | Только non-secret notes                   |
| `Secure Notes`      | Нет          | Secret notes, шифруются                   |

### Naming Convention

Рекомендуемый формат названия:

`{Project/Product/Client} - {Provider/Service} - {Environment} - {Purpose}`

Примеры:

- `Marco.am - Beget - Production - Hosting Panel`;
- `Marco.am - Neon - Production - Database`;
- `NBOS - Vercel - Production - Deployment`;
- `Internal - Google Workspace - Admin Account`;
- `ClientBrand - Cloudflare - DNS`.

---

## Уровни Доступа

Текущая идея уровней доступа сохраняется, но должна быть усилена через explicit access grants.

### Private / Personal

Видит только владелец.

Для личных рабочих паролей сотрудника.

### Restricted / Secret

Видят только явно указанные сотрудники или seats.

Для критичных company/admin/root/finance доступов.

### Project Team

Видят участники связанного Project/Product team.

Для проектных доступов, нужных разработке, PM или support.

### Department / Seat

Видит отдел или business seat.

Например: Delivery, Finance, Marketing, Support.

### Company Internal

Видят все сотрудники компании.

Использовать редко и только для low-risk доступов.
