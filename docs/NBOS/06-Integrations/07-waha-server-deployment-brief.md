# WAHA и WhatsApp Gateway — бриф по развёртыванию

Цель: объяснить роль **WAHA** и **WhatsApp Gateway**, и что подготовить на **сервере (VPS)**, чтобы команда NBOS могла подключить продукт. Канон сценариев: `docs/NBOS/06-Integrations/01-WhatsApp-Integration.md`. Граница NBOS ↔ Gateway: `docs/NBOS/06-Integrations/06-WhatsApp-Gateway-NBOS-Boundary.md`.

---

## 1. Цепочка (согласованный production target)

```text
NBOS (основное приложение)
  → HTTPS → WhatsApp Gateway (NestJS, публичный API)
    → HTTP внутри Docker-сети → WAHA (например http://waha:3000)
      → QR-подключённый WhatsApp-аккаунт
        → группы и редкие 1:1 чаты

WhatsApp Gateway
  → Prisma → Neon PostgreSQL (DATABASE_URL с sslmode=require)
```

**WAHA** — внешний self-hosted HTTP-движок WhatsApp Web (QR). **Gateway** — наш NestJS-сервис: единственный компонент, который знает `WAHA_API_KEY` и принимает webhooks от WAHA.

---

## 2. Один Hetzner VPS: Gateway + WAHA

Рекомендуемая упаковка:

| Сервис                                        | Docker              | Публично                          |
| --------------------------------------------- | ------------------- | --------------------------------- |
| Reverse proxy + TLS (nginx / Caddy / Traefik) | да                  | да (HTTPS на Gateway)             |
| WhatsApp Gateway                              | отдельный контейнер | да, через proxy                   |
| WAHA                                          | отдельный контейнер | **нет** (только internal network) |
| Volume для WAHA                               | persistent          | сессии WhatsApp Web               |

- `WAHA_BASE_URL` на Gateway: **`http://waha:3000`** (имя сервиса в compose).
- **Не** публиковать WAHA наружу без крайней необходимости; если нужен admin/debug — отдельный путь с auth.
- Оба контейнера: **restart policy** (например `unless-stopped`).
- **Не** поднимать PostgreSQL в compose для продукта Gateway: только **Neon**.

---

## 3. Webhooks

- WAHA шлёт webhooks на **URL Gateway** (не на NBOS).
- Gateway проверяет секрет (`WAHA_WEBHOOK_SECRET` или эквивалент в вашей сборке WAHA).
- NBOS получает уже **нормализованные** события/сообщения через свой контракт с Gateway (pull или push — по задаче интеграции).

---

## 4. Настройки в NBOS (admin / system lists)

Исторически в UI интеграций фигурирует ключ **`WHATSAPP__WAHA_INSTANCE`** как «URL инстанса». При архитектуре с Gateway семантика должна быть **базовый URL WhatsApp Gateway** (HTTPS), а не прямой WAHA.

Предпочтительно завести явные переменные в NBOS (ориентир):

- `WHATSAPP_GATEWAY_BASE_URL`
- `WHATSAPP_GATEWAY_TOKEN` (Bearer для вызова Gateway)

Миграция подписей в UI system lists — отдельная задача; до неё допустимо хранить в `WHATSAPP__WAHA_INSTANCE` именно URL Gateway, **не** внутренний `http://waha:3000`.

---

## 5. Чеклист на стороне VPS (инфраструктура)

1. Docker / Compose (или аналог) по документации **[WAHA](https://github.com/devlikeapro/waha)**.
2. **Persistent volume** для сессий WAHA.
3. **Reverse proxy + TLS** для публичного hostname Gateway.
4. Секреты: `WAHA_API_KEY`, `WAHA_WEBHOOK_SECRET`, `NBOS_INTERNAL_API_TOKEN` (или пара токенов NBOS↔Gateway), ключи для вызова NBOS из Gateway при push-событиях (если используются).
5. QR-login служебного номера; проверка health, отправка в тестовую группу, входящие, **рестарт** контейнера WAHA без потери сессии (volume).
6. Передать команде **письменно**: публичный URL Gateway, правила авторизации для NBOS, контакт на инциденты WAHA/session.

---

## 6. Что делает команда NBOS после готовности Gateway

- Прописать URL Gateway и токен в конфигурации NBOS.
- Реализовать **тонкий клиент** к Gateway (send, health/QR через Gateway, приём нормализованных сообщений).
- Подключить Messenger External + Notifications к этому API; Drive — по контракту передачи вложений (см. boundary doc).

Roadmap-срез: `docs/PHASE_7_INTEGRATIONS_MIGRATION_WORK_PLAN.md` (блок WhatsApp / WAHA).

---

## 7. Ссылки

- `docs/NBOS/06-Integrations/01-WhatsApp-Integration.md`
- `docs/NBOS/06-Integrations/06-WhatsApp-Gateway-NBOS-Boundary.md`
- `docs/NBOS/02-Modules/13-Notifications/04-Notification-Integrations.md`
- `docs/PHASE_7_INTEGRATIONS_MIGRATION_WORK_PLAN.md`
