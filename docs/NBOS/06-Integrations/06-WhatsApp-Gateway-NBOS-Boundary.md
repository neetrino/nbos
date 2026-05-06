# WhatsApp Gateway и граница с NBOS

Документ фиксирует **согласованную production-архитектуру**: логический адаптер `WhatsAppWebAdapter` реализуется как **отдельный сервис WhatsApp Gateway**; NBOS не вызывает WAHA напрямую и не хранит `WAHA_API_KEY`.

Канон сценариев и статусов: `01-WhatsApp-Integration.md`.  
Бриф по развёртыванию WAHA + Gateway на сервере: `docs/NBOS/06-Integrations/07-waha-server-deployment-brief.md`.

---

## 1. Зачем отдельный Gateway

- **Изоляция WAHA**: webhooks, raw payloads, deduplication, session/QR, ошибки движка WhatsApp Web — не должны засорять основной NestJS NBOS.
- **Безопасность**: NBOS знает только публичный URL Gateway и токен вызова; `WAHA_API_KEY` и webhook-secret остаются на стороне Gateway/WAHA контура.
- **Сеть**: WAHA остаётся на **внутреннем** Docker URL (`http://waha:3000`); наружу по HTTPS выставляется в первую очередь **Gateway** (через reverse proxy).
- **Соответствие старому канону**: в документации изначально была граница **adapter / External Channel Adapter**, а не обязательность «всё внутри одного репозитория NBOS». Отдельный Gateway — это **физическая реализация** той же границы.

---

## 2. Логическая и физическая цепочка

**Логика продукта (без изменений по смыслу):**

```text
NBOS (Messenger / CRM / Notifications)
  -> External Channel Adapter
    -> WhatsAppWebAdapter (контракт)
      -> … доставка в WhatsApp …
```

**Физическое развёртывание (production target):**

```text
NBOS
  -> HTTPS -> WhatsApp Gateway (NestJS, публичный endpoint)
       -> HTTP (internal Docker) -> WAHA (http://waha:3000)
            -> QR-connected WhatsApp account
              -> Groups / 1:1

WhatsApp Gateway
  -> Prisma
    -> Neon PostgreSQL (DATABASE_URL, sslmode=require)
```

---

## 3. Production на одном Hetzner VPS

| Компонент           | Где               | Примечание                                             |
| ------------------- | ----------------- | ------------------------------------------------------ |
| Reverse proxy + TLS | Тот же VPS        | nginx / Caddy / Traefik                                |
| WhatsApp Gateway    | Docker service    | Публичный HTTPS → Gateway                              |
| WAHA                | Docker service    | **Не** публичный по умолчанию; только internal network |
| Volume для WAHA     | Persistent volume | Сессии WhatsApp Web                                    |
| Restart policy      | Gateway + WAHA    | `unless-stopped` или эквивалент                        |
| БД Gateway          | Neon              | Без локального PostgreSQL в compose                    |

NBOS (web + основной API) может быть на другом хостинге; связь с Gateway — **только по HTTPS** с Bearer-токеном.

---

## 4. Что делает NBOS

| Область                      | Ответственность                                                                                                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UI**                       | External Messenger: списки разговоров, история, composer, зоны CRM Inbox / группы / Support / Finance (по канону Messenger).                                                                       |
| **Бизнес-связи**             | Привязка `chatId` / контекста к Project, Deal, Ticket, Invoice, Contact и т.д.                                                                                                                     |
| **Права и UX**               | External send permission, подписи «клиент видит», audit на уровне продукта.                                                                                                                        |
| **Notifications**            | Правила, jobs, решение «кому/когда/куда»; вызов **Gateway API**, а не WAHA.                                                                                                                        |
| **Drive (истина по файлам)** | Создание `File Asset`, права, хранение в R2; приём вложений от Gateway через **согласованный защищённый internal API** (или pull по контракту) — деталь протокола фиксируется в задаче интеграции. |
| **Конфиг**                   | Base URL Gateway, токен(ы) для вызова Gateway и (при push-модели) приёма событий от Gateway в NBOS; секреты **WAHA** в NBOS **не** хранятся.                                                       |
| **Тонкий клиент адаптера**   | HTTP-клиент к Gateway: send, health/session UI, получение нормализованных сообщений/статусов.                                                                                                      |

NBOS **не** реализует: парсинг сырых WAHA webhooks, хранение `rawPayload` WAHA, deduplication по id WAHA, прямые вызовы REST WAHA.

---

## 5. Что делает WhatsApp Gateway

| Область                    | Ответственность                                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WAHA client**            | Вызовы WAHA с `WAHA_API_KEY`; базовый URL `WAHA_BASE_URL=http://waha:3000` (internal).                                                                           |
| **Webhooks WAHA**          | Приём событий, проверка `WAHA_WEBHOOK_SECRET`, запись сырых/нормализованных событий в **свою** БД (Neon).                                                        |
| **Идентификаторы**         | Основной технический ключ — WhatsApp `chatId` (`…@g.us` / `…@c.us`); опционально phone для 1:1 как метаданные; нормализация `+374…` → `374…@c.us`.               |
| **MVP-аккаунт**            | Один общий сервисный номер / одна сессия по умолчанию (`DEFAULT_WAHA_SESSION=default` или согласованное имя).                                                    |
| **Исходящий текст**        | Префикс отправителя `FirstName: message`, если имя есть; иначе чистый текст (см. продуктовые правила). Разумно хранить `originalText` и `whatsappText` отдельно. |
| **Статусы**                | Очередь/отправлено/ошибка/delivery/read по возможности WAHA — в модели Gateway.                                                                                  |
| **Session / QR**           | Endpoints для админки: статус, QR, reconnect — без проброса WAHA наружу.                                                                                         |
| **Исходящий API для NBOS** | Стабильный REST (или аналог) с авторизацией `Authorization: Bearer <NBOS_INTERNAL_API_TOKEN>` (или отдельный client credential).                                 |

Gateway **не** заменяет NBOS в вопросах RBAC конечных пользователей и бизнес-привязок сущностей: он может знать `chatId` и технические id сообщений, но «чей это проект» — зона NBOS (или согласованное зеркалирование через API).

---

## 6. Переменные окружения (ориентир)

**На стороне Gateway (пример production):**

- `PORT=5000`
- `DATABASE_URL=<Neon, sslmode=require>`
- `WAHA_BASE_URL=http://waha:3000`
- `WAHA_API_KEY=<secret>`
- `WAHA_WEBHOOK_SECRET=<secret>`
- `NBOS_INTERNAL_API_TOKEN=<secret>` — для вызовов **из NBOS в Gateway** и/или наоборот (разделить на два токена при необходимости).
- `DEFAULT_WAHA_SESSION=default`

**На стороне NBOS (пример):**

- `WHATSAPP_GATEWAY_BASE_URL=https://whatsapp-gateway.example.com` (публичный HTTPS)
- `WHATSAPP_GATEWAY_TOKEN=<secret>` — Bearer для вызова Gateway

Устаревшая или вспомогательная настройка **`WHATSAPP__WAHA_INSTANCE`** в system lists может оставаться как **URL Gateway** для админки до явной миграции ключей; семантика в UI должна быть «endpoint WhatsApp-интеграции», а не обязательно прямой WAHA.

---

## 7. Вложения и Drive

Канон NBOS: файлы — **Drive File Asset**. Рекомендуемый паттерн:

1. Gateway получает media от WAHA (URL или download).
2. Gateway передаёт файл в NBOS через **защищённый server-to-server** контракт (предпочтительно), либо NBOS запрашивает у Gateway бинарник по internal route после уведомления.

Точный shape API — отдельная задача; в документации важно: **истина по файлам в NBOS/Drive**, техническая доставка байтов — согласование Gateway ↔ NBOS.

---

## 8. Синхронизация документации

После принятия этой схемы обновлены:

- `01-WhatsApp-Integration.md` — общий канон + отсылка сюда.
- `docs/NBOS/06-Integrations/07-waha-server-deployment-brief.md` — развёртывание VPS.
- Messenger / Notifications — диаграммы с узлом Gateway.
- `docs/PHASE_7_INTEGRATIONS_MIGRATION_WORK_PLAN.md` — срез WhatsApp/WAHA.

---

## 9. Когда допустимо без Gateway (не целевой путь)

Только для эксперимента или крошечного MVP: NBOS → WAHA напрямую. Для текущего NBOS (крупный монолит продуктовой логики, группы, webhooks) **целевой путь — Gateway + WAHA на одном VPS**.
