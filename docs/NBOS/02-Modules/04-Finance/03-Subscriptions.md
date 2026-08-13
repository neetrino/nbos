# Подписки (Subscriptions)

## Общая концепция

`Subscription / Подписка` — это долгоживущая договорённость о регулярных деньгах.

Сама подписка хранит:

- правила биллинга;
- сумму за период оплаты (`amount`) и длину периода (`coverage_month_count`);
- дату старта биллинга;
- статус;
- тип и частоту оплаты.

А конкретные деньги за конкретные месяцы живут уже в `Invoice Card`.

```text
Project
    -> Product
        -> Subscription
            -> Invoice Card(s) for covered period
                -> Payment
                    -> MRR / revenue control
```

Ownership rule (required):

- every `Subscription` has a required `productId` (FK → Product);
- `projectId` is stored on Subscription as a denormalized copy of `Product.projectId` and must match on create/update;
- one Product may have many Subscriptions; one Project may have many Products.

---

## Типы подписок

| Тип                           | Описание                                        | Когда начинается             |
| ----------------------------- | ----------------------------------------------- | ---------------------------- |
| **Maintenance Only**          | Техническое обслуживание                        | После сдачи проекта клиенту  |
| **Development + Maintenance** | Разработка по подписочной модели + обслуживание | С момента начала разработки  |
| **Development Only**          | Оплата разработки ежемесячными платежами        | С момента начала разработки  |
| **Partner Service**           | Партнёр платит Neetrino за переданного клиента  | После сдачи проекта партнёру |

### Development + Maintenance: жизненный цикл

Типичный сценарий для подписочной модели:

```
Месяцы 1-3: Фаза разработки
  └─ Клиент платит 100,000/мес (Development + Maintenance)
  └─ Если проект партнёрский, Partner Accrual создаётся только от реально полученных платежей и по правилам Partners

Месяц 4+: Фаза обслуживания
  └─ Development-часть завершена
  └─ Добавляется Maintenance: 80,000/мес
  └─ Итого: 180,000/мес (если dev-подписка сохраняется) или 80,000/мес (если только maintenance)
  └─ Partner payout для subscription идёт через Partner Accrual / Balance / payout_rule конкретной subscription-связи
```

Сумма подписки может меняться со временем:

- После завершения разработки — переход на другой тариф
- Согласованное повышение цены с клиентом
- Добавление новых услуг
- Изменение объёма обслуживания

---

## Поля подписки

| Поле                        | Описание                                                                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `subscription_id`           | Уникальный идентификатор                                                                                                                              |
| `product`                   | **Обязательный** продукт (FK). Источник ownership для биллинга, паузы deadline и WhatsApp reminders                                                   |
| `project`                   | Проект (denormalized = `Product.projectId`; валидируется при create/update)                                                                           |
| `company`                   | Компания-плательщик                                                                                                                                   |
| `contact`                   | Контактное лицо                                                                                                                                       |
| `type`                      | Тип подписки (Maintenance / Dev+Maint / Dev Only / Partner Service)                                                                                   |
| `amount`                    | Сумма за **один** период биллинга — ровно то, что клиент платит и что попадает на `Invoice Card` (единственное денежное поле, которое вводит человек) |
| `coverage_month_count`      | Длина периода в месяцах: `Monthly` = 1, `Yearly` = 12, `Custom` = произвольное (2–60). Заменяет устаревшее `prepaid_month_count`                      |
| `monthly_equivalent_amount` | `amount / coverage_month_count` — generated stored column в БД; **не редактируется вручную**; только MRR и аналитика                                  |
| `currency`                  | Валюта                                                                                                                                                |
| `billing_start_date`        | Дата старта биллинга                                                                                                                                  |
| `billing_frequency`         | Monthly / Yearly / Custom                                                                                                                             |
| `billing_day`               | День месяца для выставления карточек, если применяется месячная логика                                                                                |
| `end_date`                  | Дата окончания (null = бессрочная)                                                                                                                    |
| `tax_status`                | Tax / Free                                                                                                                                            |
| `notifications_enabled`     | Разрешены ли автоматические уведомления по карточкам оплат                                                                                            |
| `reminder_language`         | Язык клиентских WhatsApp payment reminders: `HY` / `RU` / `EN` (default `HY`)                                                                         |
| `status`                    | Pending / Active / On Hold / Cancelled / Completed                                                                                                    |
| `partner`                   | Партнёр: для Partner Service как плательщик; для referral subscription как источник partner accruals                                                  |
| `amount_history`            | История изменений `amount` за период                                                                                                                  |

### Client WhatsApp payment reminders (D-10 / D-2)

Anchor date: `Invoice.dueDate` (pay-by). Offsets: **10** and **2** calendar days before due (Yerevan calendar). Each offset fires **once** per invoice (idempotent; no catch-up if the invoice appears after the D-10 day).

- Target: **Product WhatsApp Group** via `subscription.productId`.
- Copy uses `Product.name` and localized month from `Invoice.coverageStartMonth` in `reminder_language`.
- Tax gate: if `taxStatus = TAX` and official invoice request not sent → **no** client payment reminder (accountant official-request path is separate).
- `notifications_enabled = false` (invoice / subscription / client-service as applicable) → no send.
- Paid / cancelled / on hold → no send.
- Missing WhatsApp `groupChatId` → skip + log (no crash).

### Сумма подписки: `amount`, `coverage_month_count`, `monthly_equivalent_amount`

**Инвариант:** `amount` — единственный источник истины для денег. Сумма на `Invoice Card` = `amount` напрямую, без умножения. `monthly_equivalent_amount` — только для MRR и сравнения подписок разной частоты; **никогда** не использовать для расчёта счёта и не вводить вручную.

| Поле                        | Кто задаёт                               | Назначение                                              |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------- |
| `amount`                    | человек                                  | Сумма за выбранный период (месяц / год / custom)        |
| `coverage_month_count`      | человек / система по `billing_frequency` | Сколько месяцев покрывает один платёж                   |
| `monthly_equivalent_amount` | БД (`amount / coverage_month_count`)     | Эквивалент в MRR; в UI — только с пометкой «эквивалент» |

Примеры:

- ежемесячно `10 000` → `amount = 10 000`, `coverage_month_count = 1`, `monthly_equivalent_amount = 10 000`;
- ежегодно `120 000` → `amount = 120 000`, `coverage_month_count = 12`, `monthly_equivalent_amount = 10 000`; одна карточка на `120 000`, MRR-вклад `10 000`;
- custom 4 месяца за `40 000` → `amount = 40 000`, `coverage_month_count = 4`, `monthly_equivalent_amount = 10 000`.

Подписка продолжает жить **по месяцам** в Grid; одна карточка оплаты может покрывать 1, 4, 12 или другое число месяцев. Поля покрытия на стороне `Invoice` (`coverage_start_month`, `coverage_month_count`) **не меняются**.

### UI: период и сумма

В форме подписки сначала выбирается **период** (`billing_frequency` → `coverage_month_count`), затем сумма **за этот период** с явной подписью (например, «сумма за год»).

Карточка подписки читается как: «112 000 ֏ раз в год, следующий платёж 24.04.2027». Где нужна месячная колонка — показывается `monthly_equivalent_amount` с подписью **эквивалент**, не «цена».

---

## CRM entry paths into Subscription Board

Subscriptions enter the board through two distinct business routes.

### Route A: `Deal Type = PRODUCT` + `Payment Type = Subscription`

Flow:

1. Seller creates first invoice in CRM.
2. Finance confirms the first payment.
3. Deal moves to `Deal Won`.
4. Order / Project / Product are created (`ensureProduct`).
5. Subscription record is created immediately as `Active` with that `productId` (+ matching `projectId`).

Important rules:

- idempotency key for auto-create is **`productId` + subscription `type`** (not projectId + type);
- the first paid invoice is not only the project start confirmation;
- it is also the **first paid month of the subscription**;
- the month of that first invoice must be visible as paid in Subscription Board;
- the next payment is due after the already paid coverage period ends.

Example:

- first invoice paid on `15 March`
- March is shown as paid in the subscription row
- next billing cycle is `15 April`

### Route B: `Deal Type = MAINTENANCE`

Flow:

1. Maintenance deal reaches `Deal Won`.
2. `existingProductId` is **required** — without a Product, Subscription is **not** created.
3. Subscription record is created immediately in `Pending` on that Product.
4. `billing_start_date` may already be filled as a planning date, but billing is not active yet.
5. Finance later confirms / edits `billing_start_date` and activates billing.

Important rules:

- invoice is not required before maintenance `Deal Won` by default;
- CRM may pass the expected billing start date;
- while status is `Pending`, this date is still editable and does not yet generate billing;
- idempotency: `productId` + `MAINTENANCE_ONLY`.

### Route C: Finance manual create

- DTO requires `productId`;
- `projectId` is taken from Product, or must match `Product.projectId` if also sent.

### Route D: Partner Service (outbound)

- Project + Product are required;
- `PARTNER_SERVICE` Subscription is created on that Product (`PartnerServiceTerm.productId`);
- create-finance must **link** the existing Product — it must not spawn a second Product;
- WhatsApp group is ensured for that Product;
- delivery-deadline auto-pause does **not** apply to `PARTNER_SERVICE`.

---

## Payment frequency and multi-month coverage

У подписки должна быть поддержка не только ежемесячной, но и другой частоты оплаты.

### Частота оплаты

| Значение  | Смысл                           | `coverage_month_count`  |
| --------- | ------------------------------- | ----------------------- |
| `Monthly` | обычная ежемесячная оплата      | 1                       |
| `Yearly`  | одна оплата сразу за 12 месяцев | 12                      |
| `Custom`  | предоплата на несколько месяцев | обязательно, от 2 до 60 |

Сумма каждой карточки = `amount` подписки. Покрытие в месяцах = `coverage_month_count` (на `Invoice` — в `coverage_month_count` карточки).

### Главный принцип

Подписка всё равно живёт **по месяцам**, даже если клиент платит сразу за несколько месяцев.

То есть:

- одна карточка оплаты может покрывать `1`, `4`, `12` и другое число месяцев;
- в `Subscription Grid` всё равно должны быть отмечены именно конкретные закрытые месяцы;
- следующая карточка оплаты должна создаваться только после окончания уже существующего покрытия.

### Пример: yearly subscription

- `amount = 120 000`
- `billing_frequency = Yearly`
- `coverage_month_count = 12`
- `monthly_equivalent_amount = 10 000`
- система создаёт одну `Invoice Card` на `120 000` (без умножения)
- в карточке фиксируется, что покрыты `12` месяцев
- в grid эти 12 месяцев отображаются как оплаченные; MRR-вклад = `10 000`
- следующая карточка появится только после окончания этих 12 месяцев

### Пример: custom prepayment

- `amount = 40 000`
- `billing_frequency = Custom`
- `coverage_month_count = 4`
- `monthly_equivalent_amount = 10 000`
- одна карточка оплаты на `40 000` покрывает `4` месяца
- в grid 4 месяца отмечаются по статусу оплаты карточки (`Paid` / pending / overdue)
- следующая карточка появится на 5-й месяц

### Что должна хранить Invoice Card для подписки

Для карточек оплат, созданных из подписки, нужно уметь хранить:

- `coverage_start_month`
- `coverage_month_count`

Именно это позволяет:

- показать на grid, какие месяцы уже закрыты;
- не создавать новые карточки раньше времени;
- поддержать yearly и custom prepayment без поломки месячной модели.

У legacy/migrated карточек без `coverage_start_month` покрытие считается одним календарным месяцем даты создания карточки.

### Ежемесячный прогон биллинга

Ежедневный прогон выбирает активные подписки по `billing_day`:

- подписка попадает в прогон, если сегодня — её `billing_day`, либо последний день месяца, когда `billing_day` = 29–31, а в месяце меньше дней;
- для целевого месяца `YYYY-MM` подписка **пропускается**, если у неё уже есть карточка оплаты, покрывающая этот месяц: месяц попадает в полуинтервал `[coverage_start_month, coverage_start_month + coverage_month_count)`;
- наличие покрытия блокирует повторное выставление **независимо от статуса оплаты** карточки; факт оплаты (`Paid`) используется отдельно — для Subscription Grid.

---

## Subscription Grid View (Сетка подписок)

Ключевой инструмент для финансового контроля подписок. Матричное представление всех подписок компании за год.

### Структура сетки

Подпись строки (например, `(80 000/мес экв.)`) — `monthly_equivalent_amount`, не цена периода.

```
                  Янв    Фев    Мар    Апр    Май    ...    Дек
┌────────────────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ Project Alpha  │  ██  │  ██  │  ██  │  ░░  │      │      │      │
│ (80,000/мес)   │ 80k  │ 80k  │ 80k  │ 80k  │  —   │  —   │  —   │
├────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ Project Beta   │  ██  │  ██  │  ░░  │  ░░  │  ░░  │      │      │
│ (120,000/мес)  │ 120k │ 120k │ 120k │ 120k │ 120k │  —   │  —   │
├────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ Project Gamma  │      │      │  ██  │  ██  │  ░░  │      │      │
│ (50,000/мес)   │  —   │  —   │ 50k  │ 50k  │ 50k  │  —   │  —   │
├────────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ ИТОГО:         │ 200k │ 200k │ 250k │ 250k │ 170k │  —   │  —   │
└────────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

██ = Оплачено (зелёный)    ░░ = Ожидает оплаты (жёлтый)
▓▓ = Не оплачено (красный)  — = Не применимо (пусто/серый)
```

### Цветовая кодировка ячеек

| Цвет                 | Статус               | Описание                                                   |
| -------------------- | -------------------- | ---------------------------------------------------------- |
| 🟣 Фиолетовый контур | Subscription Pending | Подписка создана, но billing ещё не запущен                |
| 🟢 Зелёный           | Paid                 | Счёт оплачен                                               |
| 🔴 Красный           | Unpaid / Overdue     | Счёт не оплачен, срок прошёл                               |
| 🟡 Жёлтый            | Pending              | Счёт выставлен, ожидает оплаты                             |
| ⬜ Пустой            | N/A                  | Подписка ещё не началась или не применяется к этому месяцу |
| 🔵 Синий             | Forecast             | Будущие месяцы (прогноз)                                   |

### Взаимодействие с сеткой

- **Клик на ячейку** → переход к конкретному счёту (Invoice)
- **Клик на строку (проект)** → детали подписки
- **Изменение суммы** → выбор месяца, с которого действует новая сумма
- **Итоговая строка** → помесячные суммы (ожидаемый доход)

### Summary Row (итоговые показатели)

| Метрика                  | Описание                                                     |
| ------------------------ | ------------------------------------------------------------ |
| **Total MRR**            | Сумма `monthly_equivalent_amount` по всем активным подпискам |
| **Paid this month**      | Сумма оплаченных подписок текущего месяца                    |
| **Unpaid this month**    | Сумма неоплаченных подписок текущего месяца                  |
| **Active subscriptions** | Количество активных подписок                                 |
| **New this month**       | Новые подписки, начавшиеся в этом месяце                     |
| **Churned this month**   | Подписки, отменённые в этом месяце                           |

---

## Автоматизация биллинга

### Авто-генерация карточек оплат

```
Каждый день система проверяет:
  └─ Есть ли активные подписки, у которых пора создать новую карточку оплаты?
     └─ Да → Для каждой такой подписки:
        ├─ проверить, нет ли уже карточки с покрытием целевого месяца
        ├─ создать Invoice Card
        ├─ сумма = amount подписки (без умножения)
        ├─ tax_status = из подписки
        ├─ notifications_enabled = из подписки
        └─ карточка попадает на доску `Invoices` в статус `New`
```

### Изменение суммы подписки

При изменении `amount`:

1. Указывается новая сумма за период
2. Указывается месяц начала действия новой суммы
3. Предыдущая сумма сохраняется в `amount_history`
4. Все будущие карточки оплат используют новый `amount`
5. В сетке отображается корректный `monthly_equivalent_amount` (эквивалент) для соответствующих месяцев

---

## Partner Subscriptions (Партнёрские подписки)

Когда Neetrino передаёт клиента партнёру (например, для SMM/SEO):

```
Клиент обратился → Neetrino не оказывает эту услугу
  → Передаём клиента партнёру
  → Партнёр заключает договор с клиентом
  → Партнёр платит Neetrino ежемесячно за привлечение
  → Этот платёж = Partner Service subscription
```

Особенности:

- Подписка создаётся на **Product** внутри Project (бренд клиента)
- Плательщик = партнёр (не клиент)
- Сумма = договорённый % или фиксированная сумма
- Отображается в общей сетке подписок
- Счета генерируются автоматически как обычная подписка
- Client WhatsApp reminders идут в **Product WhatsApp Group** этого Product (язык = `reminder_language` подписки)

Важно: `Partner Service` — это outbound-доход Neetrino, когда партнёр платит нам. Это не Partner Payout.

Если же подписка клиента пришла от inbound-партнёра, Subscription остаётся клиентской подпиской, а партнёрские начисления создаются в Partners после каждого реально полученного платежа:

```
Client Subscription Invoice Paid
  -> Partner Accrual
  -> Partner Balance
  -> payout_rule конкретной subscription-связи
  -> Payout Batch
  -> Expense Card
```

---

## Отмена и Churn

### Статусы подписки

| Статус        | Смысл                                                                              |
| ------------- | ---------------------------------------------------------------------------------- |
| **Pending**   | Подписка создана, billing_start_date можно менять, активный биллинг ещё не запущен |
| **Active**    | Подписка активна и участвует в регулярном биллинге                                 |
| **On Hold**   | Биллинг и обслуживание временно остановлены                                        |
| **Cancelled** | Подписка прекращена досрочно                                                       |
| **Completed** | Подписка завершилась штатно и больше не должна генерировать новые invoice          |

### Процесс отмены

1. Клиент прекращает платить / уведомляет об отмене
2. Финансовый директор меняет статус подписки на **Cancelled**
3. Указывается дата отмены (последний оплаченный месяц)
4. Подписка перестаёт генерировать новые счета
5. В сетке оставшиеся месяцы становятся пустыми

### Пауза подписки

- Статус **On Hold** — временная остановка
- Новые карточки оплат не генерируются в период паузы
- В сетке отображается особым цветом (серый)
- При возобновлении — статус возвращается в Active

### Churn-метрики

| Метрика                | Формула                                                |
| ---------------------- | ------------------------------------------------------ |
| **Monthly Churn Rate** | Отменённые подписки / Активные на начало месяца × 100% |
| **Revenue Churn**      | Потерянный MRR / MRR на начало месяца × 100%           |
| **Net MRR Change**     | New MRR + Expansion MRR − Churned MRR                  |
| **Retention Rate**     | 100% − Churn Rate                                      |

---

## Фильтры и отображение

### Фильтры Subscription Grid

- **По типу**: Maintenance / Dev+Maint / Dev Only / Partner
- **По статусу**: Pending / Active / On Hold / Cancelled / Completed
- **По проекту**: выбор конкретного проекта
- **По клиенту (компании)**: все подписки одного клиента
- **По году**: переключение между годами
- **По Tax статусу**: Tax / Tax-Free

### Альтернативные виды

Помимо Grid View, подписки доступны в виде:

- **Список (List View)** — табличное представление со всеми полями
- **Kanban** — по статусам (Pending / Active / On Hold / Cancelled / Completed)
- **Timeline** — хронологическая шкала подписок

---

## Связи с другими сущностями

```
Project ──→ Product(s) ──→ Subscription(s) ──→ Invoice(s) ──→ Payment(s)
                              │
                              ├──→ Subscription Grid View
                              ├──→ MRR Reports
                              ├──→ Churn Reports
                              ├──→ Product WhatsApp Group (client reminders)
                              ├──→ Partner Service Revenue (если outbound Partner Service)
                              └──→ Partner Accrual (если inbound referral subscription)
```

| Сущность     | Связь                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Product      | Обязательный owner подписки. У Product может быть несколько Subscription разных типов                   |
| Project      | Denormalized на Subscription (= Product.projectId). У проекта — много Product и много Subscription      |
| Invoice Card | Из подписки создаются карточки оплат с покрытием одного или нескольких месяцев                          |
| Payment      | При оплате карточки обновляется покрытие месяцев в Grid                                                 |
| Partner      | Для Partner Service — плательщик outbound-дохода; для referral subscription — источник partner accruals |
| Company P&L  | Subscription revenue входит в доходную часть P&L                                                        |
| Project P&L  | Subscription revenue входит в доход проекта                                                             |
