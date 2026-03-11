# Домены, хостинг, лицензии

## Общая концепция

Этот раздел описывает управление инфраструктурными ресурсами проектов: доменными именами, хостингом/серверами и внешними сервисами/лицензиями. Все эти ресурсы имеют общие черты:

- Привязаны к проекту
- Требуют периодической оплаты (ежемесячно, ежегодно)
- Имеют учётные данные (credentials), которые нужно хранить безопасно
- Могут быть pass-through (клиент платит → Neetrino покупает) или собственными (Neetrino платит из своего бюджета)
- Создают записи в модуле расходов (Planned Expenses)

```
Ресурс (Domain/Hosting/License) → Planned Expense → Invoice (client) → Payment → Auto-task → Purchase/Renewal
```

---

## Домены (Domains)

### Определение

Доменное имя — веб-адрес проекта клиента. Один проект может иметь от 1 до 10+ доменов (основной домен, поддомены, дополнительные зоны).

### Поля записи домена

| Поле | Описание |
|------|----------|
| `domain_id` | Уникальный идентификатор |
| `domain_name` | Доменное имя (example.am, example.com) |
| `project` | Проект, к которому привязан |
| `provider` | Провайдер (Beget, Reg.ru, GoDaddy, Cloudflare и др.) |
| `provider_account` | Ссылка на аккаунт у провайдера (из Credentials) |
| `purchase_date` | Дата покупки |
| `expiry_date` | Дата истечения |
| `renewal_cost` | Стоимость продления (фактическая) |
| `client_charge` | Сумма для клиента (с наценкой, если есть) |
| `tax_status` | Tax / Tax-Free |
| `status` | Active / Expiring Soon / Expired / Cancelled |
| `auto_renew` | Авто-продление у провайдера (да/нет) |
| `notes` | Заметки |

### Жизненный цикл домена

#### Покупка нового домена

```
1. Клиенту нужен домен
   │
2. Создаётся Invoice (тип: Domain/Service)
   ├─ Указывается: доменное имя, сумма (с наценкой если есть)
   ├─ Tax status: из настроек проекта/домена
   │
3. Invoice проходит стандартный цикл:
   ├─ Tax: создание в гос. системе → отправка клиенту
   └─ Tax-Free: сразу отправка клиенту
   │
4. Клиент оплачивает → Payment создан
   │
5. Авто-создание задачи (Task):
   ├─ Проверка: есть ли у проекта аккаунт у данного провайдера?
   │   ├─ ДА → Задача: "Купить домен [name] у [provider]"
   │   └─ НЕТ → Задача: "Создать аккаунт у [provider] + Купить домен [name]"
   │
6. Специалист выполняет задачу:
   ├─ Создаёт аккаунт у провайдера (если нужно)
   │   └─ Сохраняет credentials в модуле Credentials:
   │       ├─ Provider: Beget / Reg.ru / GoDaddy / ...
   │       ├─ Login, Password, Email
   │       └─ Привязка к проекту
   ├─ Покупает домен
   └─ Заполняет данные домена:
       ├─ Domain name, Purchase date, Expiry date
       ├─ Renewal cost, Provider account link
       └─ Статус: Active
   │
7. Создаётся Planned Expense (ежегодный, на дату expiry)
   │
8. Создаётся Expense (Pass-through) на фактическую сумму покупки
```

#### Ежегодное продление

```
Expiry date − 2 месяца:
  │
  ├─ Система создаёт напоминание
  ├─ Авто-создание Invoice для клиента (сумма = client_charge)
  │
  ▼
Клиент оплачивает:
  │
  ├─ Авто-задача: "Продлить домен [name]"
  │
  ▼
Специалист продлевает:
  │
  ├─ Обновляет expiry_date (+1 год)
  ├─ Обновляет Planned Expense (новая дата)
  └─ Создаёт Expense (фактическая сумма продления)
```

### Работа с аккаунтами провайдеров

Один клиент (проект) может иметь аккаунты у разных провайдеров. Один аккаунт может содержать несколько доменов.

```
Проект Alpha
  ├─ Аккаунт у Beget
  │   ├─ example.am (expiry: 2027-03-15)
  │   └─ example.ru (expiry: 2026-11-20)
  ├─ Аккаунт у GoDaddy
  │   └─ example.com (expiry: 2026-08-01)
  └─ Аккаунт у Cloudflare
      └─ DNS management (бесплатно)
```

При покупке нового домена система проверяет:
- Есть ли у проекта аккаунт у выбранного провайдера?
- Если да — используем существующий аккаунт
- Если нет — сначала создаём аккаунт, потом покупаем домен

### Наценка на домены

| Показатель | Пример |
|------------|--------|
| Стоимость домена у провайдера | 10,000 |
| Наценка Neetrino | 2,000 |
| Сумма в Invoice для клиента | 12,000 |
| Expense (фактическая покупка) | 10,000 |
| Доход Neetrino | 2,000 |

Наценка опциональна и определяется индивидуально. В большинстве случаев — минимальная или отсутствует.

---

## Хостинг и серверы (Hosting / Servers)

### Определение

Хостинг — серверная инфраструктура, на которой размещается проект клиента. Может быть shared hosting, VPS, cloud-сервер или managed-платформа.

### Поля записи хостинга

| Поле | Описание |
|------|----------|
| `hosting_id` | Уникальный идентификатор |
| `name` | Название (Beget Shared, DigitalOcean VPS и т.д.) |
| `project` | Проект |
| `provider` | Провайдер (Beget, DigitalOcean, AWS, Vercel и др.) |
| `provider_account` | Ссылка на аккаунт (Credentials) |
| `type` | Shared / VPS / Cloud / Managed |
| `cost` | Стоимость |
| `frequency` | Monthly / Yearly |
| `billing_type` | Pass-through / Neetrino-owned |
| `start_date` | Дата начала |
| `status` | Active / Suspended / Cancelled |
| `specs` | Характеристики (CPU, RAM, Storage) |

### Pass-through vs Neetrino-owned

| Модель | Описание | Биллинг |
|--------|----------|---------|
| **Pass-through** | Клиент оплачивает хостинг через Neetrino | Invoice клиенту → Payment → Neetrino платит провайдеру |
| **Neetrino-owned** | Neetrino оплачивает из своего бюджета | Planned Expense → оплата из бюджета компании |

Для pass-through хостинга процесс аналогичен доменам: Invoice клиенту, после оплаты — Neetrino оплачивает провайдеру.

### Учёт в расходах

Каждый хостинг создаёт запись в Planned Expenses:
- Ежемесячный хостинг → Monthly Planned Expense
- Ежегодный хостинг → Yearly Planned Expense
- Привязка к проекту для корректного Project P&L

---

## Лицензии и сервисы (Licenses / Services)

### Определение

Внешние сервисы, используемые для работы проектов или компании. Включают как фиксированные, так и usage-based подписки.

### Типичные сервисы по проектам

| Сервис | Назначение | Ценообразование | Типичный биллинг |
|--------|-----------|-----------------|-----------------|
| **Google Workspace** | Корпоративная почта, документы | Per user / month | Pass-through |
| **Cloudflare** | CDN, DNS, защита | Free / Pro plan | Neetrino-owned или Pass-through |
| **Neon** | PostgreSQL database | Usage-based | Neetrino-owned |
| **Upstash** | Redis, message queues | Usage-based | Neetrino-owned |
| **Resend** | Transactional email | Usage-based | Neetrino-owned |
| **Vercel** | Hosting, deployment | Per project | Neetrino-owned |
| **AWS S3** | File storage | Usage-based | Neetrino-owned |
| **App Store Account** | iOS app publishing | $99/year | Pass-through |
| **Google Play Account** | Android app publishing | $25 one-time | Pass-through |

### Поля записи сервиса/лицензии

| Поле | Описание |
|------|----------|
| `service_id` | Уникальный идентификатор |
| `name` | Название сервиса |
| `project` | Привязка к проекту (опционально — может быть company-wide) |
| `provider` | Поставщик |
| `provider_account` | Ссылка на аккаунт (Credentials) |
| `cost` | Стоимость (фиксированная или средняя) |
| `pricing_model` | Fixed / Usage-based |
| `frequency` | Monthly / Yearly / One-time |
| `billing_type` | Pass-through / Neetrino-owned |
| `tax_status` | Tax / Tax-Free |
| `start_date` | Дата начала |
| `renewal_date` | Дата продления (для ежегодных) |
| `status` | Active / Cancelled |

### Usage-based сервисы

Для сервисов с переменной стоимостью (Neon, Upstash, Resend):
- Сумма может отличаться от месяца к месяцу
- При авто-генерации Expense карточки → сумма берётся из последнего известного значения
- Финансовый директор корректирует сумму по факту
- Если сервис pass-through → клиенту выставляется фактическая сумма

### App Store / Google Play аккаунты

Особый случай pass-through:
- Создаются для клиента (для публикации мобильных приложений)
- Credentials хранятся в модуле Credentials
- Apple Developer: $99/year → ежегодное продление
- Google Play: $25 одноразово

Процесс:
1. Клиент заказывает мобильное приложение
2. Нужен аккаунт разработчика → Invoice клиенту
3. После оплаты → задача создать аккаунт
4. Credentials сохраняются с привязкой к проекту
5. Для Apple: Planned Expense на ежегодное продление

---

## Хранение Credentials

Все учётные данные (логины, пароли, API-ключи) хранятся в модуле **Credentials** с контролем доступа:

```
Credentials Module
  ├─ Domain Provider Accounts
  │   ├─ Beget: login, password → Project Alpha
  │   ├─ GoDaddy: login, password → Project Alpha
  │   └─ Reg.ru: login, password → Project Beta
  ├─ Hosting Accounts
  │   ├─ DigitalOcean: API key → Project Alpha
  │   └─ Beget Hosting: login, password → Project Beta
  ├─ Service Accounts
  │   ├─ Google Workspace: admin login → Project Alpha
  │   ├─ App Store Connect: login, password → Project Gamma
  │   └─ Neon: connection string → Project Alpha
  └─ ENV Files
      ├─ Project Alpha: .env production secrets
      └─ Project Beta: .env production secrets
```

### Контроль доступа к credentials

| Уровень | Описание |
|---------|----------|
| **Персональные** | Видит только владелец |
| **Проектные** | Видят участники проекта с соответствующей ролью |
| **Отдельные** | Доступ конкретным сотрудникам (назначается вручную) |
| **Публичные** | Доступны всей команде (некритичные данные) |

CEO может видеть все credentials. Финансовый директор — те, что связаны с финансовыми аккаунтами. Разработчик — только credentials своих проектов (и только те, к которым ему дан доступ).

---

## Сводная таблица инфраструктуры проекта

Для каждого проекта доступна сводная таблица всех инфраструктурных ресурсов:

```
╔════════════════════════════════════════════════════════════════════╗
║  PROJECT ALPHA — Infrastructure                                    ║
╠══════════╦═══════════════╦════════════╦══════════╦════════════════╣
║ Тип      ║ Название      ║ Провайдер  ║ Стоимость║ Следующая опл. ║
╠══════════╬═══════════════╬════════════╬══════════╬════════════════╣
║ Domain   ║ example.am    ║ Beget      ║ 12,000/y ║ 2027-03-15     ║
║ Domain   ║ example.com   ║ GoDaddy    ║ 15,000/y ║ 2026-08-01     ║
║ Hosting  ║ VPS Basic     ║ DigitalOcn ║  6,000/m ║ 2026-04-01     ║
║ Service  ║ G.Workspace   ║ Google     ║  3,000/m ║ 2026-04-15     ║
║ Service  ║ Neon DB       ║ Neon       ║  ~2,000/m║ usage-based    ║
║ Service  ║ Cloudflare    ║ Cloudflare ║     Free ║ —              ║
║ Account  ║ App Store     ║ Apple      ║ 40,000/y ║ 2026-09-20     ║
╠══════════╬═══════════════╬════════════╬══════════╬════════════════╣
║ ИТОГО    ║               ║            ║ ~16k/мес ║                ║
║          ║               ║            ║ +67k/год ║                ║
╚══════════╩═══════════════╩════════════╩══════════╩════════════════╝
```

---

## Напоминания и автоматизация

| Событие | Когда | Действие |
|---------|-------|----------|
| Домен истекает | За 2 месяца | Напоминание финдиректору + авто-Invoice клиенту |
| Домен истекает | За 1 месяц | Повторное напоминание (если не оплачено) |
| Домен истекает | За 1 неделю | Срочное уведомление |
| Ежегодный сервис продлевается | За 2 месяца | Напоминание + Invoice |
| Usage-based сервис | 1-е число | Напоминание проверить стоимость |
| Новый аккаунт создан | Сразу | Напоминание сохранить credentials |
| Credentials не заполнены | При переходе стадии проекта | Блокировка перехода до заполнения |

---

## Связи с другими модулями

```
Projects Hub ──→ Domains, Hosting, Services (привязка к проекту)
Credentials ──→ Аккаунты провайдеров, пароли, API-ключи, .env
Expenses ──→ Planned Expenses (ежемесячные/ежегодные)
Invoices ──→ Pass-through invoices клиентам
Tasks ──→ Авто-задачи (купить домен, создать аккаунт, продлить)
Notifications ──→ Напоминания об истечении, продлении
P&L Reports ──→ Infrastructure costs в Project P&L
```
