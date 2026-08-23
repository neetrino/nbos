# NBOS — Runbook продакшен-деплоя

> **Security gate:** перед первым прод-трафиком пройти [`security.todo.md`](../security.todo.md) §0 (Preflight).  
> **Стек:** Hetzner VPS + [Coolify](https://coolify.io) + **Cloudflare** (DNS/TLS/WAF) → Neon, R2, Resend, Redis.

Упоминания Vercel/Render в старых доках — **не** актуальный путь деплоя.

---

## Архитектура

```text
Browser
  → Cloudflare (DNS proxied, TLS, WAF)
  → Hetzner VPS :443/:80
  → Coolify reverse proxy (Traefik/Caddy, origin cert or LE)
  → nbos-web   (Next.js, :3000)
  → nbos-api   (NestJS, :4000, PROCESS_ROLE=api)
  → nbos-worker (NestJS worker.ts, :4001 health, PROCESS_ROLE=worker)
  → nbos-scheduler (NestJS scheduler.ts, :4002, PROCESS_ROLE=scheduler)
  → redis      (Coolify or Upstash — REDIS_URL)
Neon Postgres / R2 / Resend — внешние SaaS
```

| Компонент          | Продакшен                                                                          |
| ------------------ | ---------------------------------------------------------------------------------- |
| **Compute**        | Hetzner VPS + Coolify (`nbos-web` + `nbos-api` + `nbos-worker` + `nbos-scheduler`) |
| **Edge / домены**  | Cloudflare proxied, SSL Full (strict), WAF                                         |
| **База данных**    | Neon Postgres (`sslmode=require`)                                                  |
| **Object storage** | Cloudflare R2 (private bucket)                                                     |
| **Кэш / очереди**  | Redis (`rediss://` в prod)                                                         |
| **Email**          | Resend                                                                             |

**Публичные URL (через Cloudflare):**

| Хост           | Coolify app | Пример                    |
| -------------- | ----------- | ------------------------- |
| `app.<domain>` | `nbos-web`  | `https://app.example.com` |
| `api.<domain>` | `nbos-api`  | `https://api.example.com` |

Оба DNS-записи с **Proxied ON**. WebSocket (messenger) идёт через `api.<domain>` в Cloudflare.  
Если web и api на одном Coolify-сервере — для `BACKEND_URL` на web используйте внутренний Docker URL.

**Безопасность (runtime):**

- HTTP из браузера: `/api/*` → Next.js **BFF** → Nest; JWT только в **httpOnly** cookie.
- Messenger: `/api/auth/realtime-token` + `NEXT_PUBLIC_BACKEND_URL`.
- Notification unread: `EventSource` → `/api/realtime/notifications` (Next SSE proxy) → Nest; multi-replica via `REDIS_EVENTS_URL` (fallback `REDIS_URL`).
- Incoming call popup: `EventSource` → `/api/realtime/calls` (Next SSE proxy) → Nest; same Redis fan-out (`nbos:realtime:calls`). Only the responsible employee receives the event.
- Logout JWT: `POST /api/v1/auth/logout` + Redis denylist по `jti`.
- Scheduler: `ServiceApiKeyGuard` на `/api/scheduler/*`.

---

## 1. Security preflight (до первого деплоя)

| Шаг                                                                                              | Где                      | Проверка                                          |
| ------------------------------------------------------------------------------------------------ | ------------------------ | ------------------------------------------------- |
| Сильные секреты (`AUTH_SECRET`, `JWT_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`, `SCHEDULER_API_KEY`) | Coolify env (web + api)  | ≥32 символов; `openssl rand -base64 32`           |
| Backup `CREDENTIALS_ENCRYPTION_KEY` (отдельно от БД)                                             | Owner / password manager | Потеря ключа = Mail + Credentials secrets мёртвые |
| `NODE_ENV=production` на API                                                                     | Coolify `nbos-api`       | Логи старта, без Swagger                          |
| `CORS_ORIGIN` = точный origin web                                                                | Coolify `nbos-api`       | `https://app.example.com`                         |
| `BACKEND_URL` доступен из web-контейнера                                                         | Coolify `nbos-web`       | `http://nbos-api:4000` или публичный API URL      |
| `NEXT_PUBLIC_BACKEND_URL` = публичный API URL                                                    | Coolify `nbos-web`       | `https://api.example.com`                         |
| `DATABASE_URL` с `sslmode=require`                                                               | Neon → api               | TLS включён                                       |
| DB role с минимальными правами                                                                   | Neon                     | Миграции — отдельной job, не owner в runtime      |
| Redis `rediss://` в prod                                                                         | Coolify / Upstash → api  | Лог: `JWT denylist backed by Redis`               |
| R2 bucket private                                                                                | Cloudflare R2            | Ключи только на api service                       |
| `REPORT_EXPORT_SYNC_FALLBACK` unset/false                                                        | Coolify api              | Экспорт только через worker                       |
| Cloudflare `app` + `api` proxied, SSL Full (strict)                                              | Cloudflare → Hetzner     | §2 ниже; заголовок `cf-ray` в ответах             |
| Firewall Hetzner                                                                                 | VPS                      | 80/443 (+22 SSH); без публичных 3000/4000         |
| Branch protection + зелёный CI на release commit                                                 | GitHub                   | lint, typecheck, test, audit, gitleaks            |

Полный чеклист: [`security.todo.md` §0](../security.todo.md).

---

## 2. Cloudflare DNS и SSL

### 2.1 DNS-записи

**Cloudflare → DNS:**

| Type | Name          | Content                     | Proxy       |
| ---- | ------------- | --------------------------- | ----------- |
| A    | `app`         | `<Hetzner VPS public IPv4>` | **Proxied** |
| A    | `api`         | `<тот же VPS IP>`           | **Proxied** |
| AAAA | `app` / `api` | `<VPS IPv6>` если есть      | **Proxied** |

Опционально: `www` CNAME → `app.<domain>`, proxied. Пользователи не должны ходить на сырой IP VPS напрямую.

### 2.2 SSL/TLS

**Cloudflare → SSL/TLS:** **Full (strict)**. Origin на Coolify: Let's Encrypt или [Cloudflare Origin Certificate](https://developers.cloudflare.com/ssl/origin-configuration/origin-ca/).

После smoke test: включить **HSTS** (сначала короткий `max-age`).

### 2.3 Домены в Coolify

- `nbos-web`: `https://app.example.com`
- `nbos-api`: `https://api.example.com`

### 2.4 WAF

[`WAF Cloudflare.md`](reference/Check/Security/WAF%20Cloudflare.md) — Managed Rules, OWASP CRS, rate rules (§18 `security.todo.md`).

---

## 3. Подготовка сервера Hetzner

| Шаг      | Действие                                                                     |
| -------- | ---------------------------------------------------------------------------- |
| VPS      | Ubuntu 22.04/24.04 LTS, ≥4 GB RAM (8 GB комфортно)                           |
| Firewall | 22 (SSH), 80, 443 only                                                       |
| Coolify  | [Установка Coolify](https://coolify.io/docs/get-started/installation) на VPS |

---

## 4. Приложения в Coolify

### 4.1 Redis

Coolify → **Resources → Database → Redis** (или Upstash `rediss://`).

API в production требует `rediss://` при `NODE_ENV=production`. Self-hosted Redis в Docker без TLS → Upstash или TLS (stunnel) до prod.

### 4.2 API — `nbos-api`

| Параметр      | Значение                                                                              |
| ------------- | ------------------------------------------------------------------------------------- |
| Build command | `pnpm install --frozen-lockfile && pnpm db:generate && pnpm --filter @nbos/api build` |
| Start command | `cd apps/api && node --import tsx dist/main.js`                                       |
| Port          | `4000`                                                                                |
| Health check  | `GET /api/health` → 200                                                               |
| Domain        | `https://api.example.com`                                                             |

```env
NODE_ENV=production
PROCESS_ROLE=api
PORT=4000
DATABASE_URL=postgresql://...?sslmode=require
JWT_SECRET=<openssl rand -base64 32>
CREDENTIALS_ENCRYPTION_KEY=<openssl rand -base64 32>
CORS_ORIGIN=https://app.example.com
REDIS_URL=rediss://...
# Optional dedicated URLs (fallback REDIS_URL). Do not flip QUEUE URL without drain plan.
# REDIS_QUEUE_URL=rediss://...
# REDIS_STATE_URL=rediss://...
# REDIS_EVENTS_URL=rediss://...
SCHEDULER_API_KEY=<openssl rand -base64 32>
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=nbos
NBOS_TENANT_ORGANIZATION_ID=<uuid>
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
REPORT_EXPORT_SYNC_FALLBACK=false
```

In-process scheduler cron в prod **не** включать без явного решения; используйте внешний cron + `SCHEDULER_API_KEY`.

### 4.2b Worker — `nbos-worker` (same image as API)

| Параметр      | Значение                                          |
| ------------- | ------------------------------------------------- |
| Build         | Same as `nbos-api`                                |
| Start command | `cd apps/api && node --import tsx dist/worker.js` |
| Port          | `4001` (`WORKER_HEALTH_PORT`)                     |
| Health check  | `GET /health` → 200; ready: `GET /ready` → 200    |
| Domain        | internal only (no public DNS required)            |

```env
NODE_ENV=production
PROCESS_ROLE=worker
WORKER_HEALTH_PORT=4001
DATABASE_URL=... # same Neon
REDIS_URL=rediss://... # same queue Redis as API producers
# BULLMQ_MAIL_CONCURRENCY=5
# BULLMQ_WHATSAPP_CONCURRENCY=3
# BULLMQ_REPORTS_CONCURRENCY=1
# BULLMQ_DRIVE_ZIP_CONCURRENCY=1
# BULLMQ_DRAIN_DELAY_SEC=20
# BULLMQ_STALLED_INTERVAL_MS=120000
# Total concurrency = worker_replicas × queue concurrency
```

**Rollout order (minimize dual consumers):**

1. Deploy image with role support (API still on previous start until cutover).
2. Start `nbos-worker` with `PROCESS_ROLE=worker`; verify `/ready`.
3. Stop API replicas briefly → start API with `PROCESS_ROLE=api`.
4. Enqueue one mail/report/zip/whatsapp test job; confirm waiting→active→completed on worker.
5. Do **not** run `PROCESS_ROLE=all` in production.

**Rollback:** restore API image/config that embeds workers; stop `nbos-worker` to avoid double processing; do not flush Redis queues.

**Redis URL migration:** changing `REDIS_QUEUE_URL` does not move jobs — drain old Redis first (see Phase 3 runbook).

### 4.2c Scheduler — `nbos-scheduler` (same image as API)

| Параметр      | Значение                                             |
| ------------- | ---------------------------------------------------- |
| Build         | Same as `nbos-api`                                   |
| Start command | `cd apps/api && node --import tsx dist/scheduler.js` |
| Port          | `4002` (`SCHEDULER_HEALTH_PORT`)                     |
| Health check  | `GET /api/health` → 200; ready: `GET /api/ready`     |
| Replicas      | **1** on first rollout                               |

```env
NODE_ENV=production
PROCESS_ROLE=scheduler
SCHEDULER_ENABLED=false
SCHEDULER_HEALTH_PORT=4002
SCHEDULER_LEASE_TTL_MS=120000
SCHEDULER_HEARTBEAT_INTERVAL_MS=30000
SCHEDULER_API_KEY=<same as api>
DATABASE_URL=...
REDIS_URL=rediss://...
# Stage C canary:
# SCHEDULER_ENABLED=true
# SCHEDULER_NOTIFICATION_INBOX_RECONCILE_ENABLED=true
# NOTIFICATION_INBOX_STATE_RECONCILE_ENABLED=true
# NOTIFICATION_INBOX_STATE_READ_ENABLED=false
```

**Rollout:** migrate lease tables → deploy with `SCHEDULER_ENABLED=false` → enable one job → disable duplicate external cron for that job → then next jobs. Never leave Nest cron on API (`PROCESS_ROLE=api` asserts empty cron registry).

**Rollback:** `SCHEDULER_ENABLED=false`, stop scheduler service, re-enable Coolify/external cron for the job; do not drop `scheduler_leases` / `scheduler_runs`.

### 4.3 Web — `nbos-web`

| Параметр      | Значение                                                                              |
| ------------- | ------------------------------------------------------------------------------------- |
| Build command | `pnpm install --frozen-lockfile && pnpm db:generate && pnpm --filter @nbos/web build` |
| Start command | `pnpm --filter @nbos/web start`                                                       |
| Port          | `3000`                                                                                |
| Domain        | `https://app.example.com`                                                             |

```env
NODE_ENV=production
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://app.example.com
NEXTAUTH_URL=https://app.example.com
APP_URL=https://app.example.com
BACKEND_URL=http://nbos-api:4000
NEXT_PUBLIC_BACKEND_URL=https://api.example.com
```

**Никогда** не кладите `JWT_SECRET`, `DATABASE_URL` или `CREDENTIALS_ENCRYPTION_KEY` на web — BFF инжектит auth на сервере.

См. также [`.env.example`](../.env.example).

---

## 5. Порядок деплоя

Нормальный прод-релиз: merge в `main` → зелёный CI → GitHub Actions **CD** (`workflow_run`). `workflow_dispatch` — hotfix. CD собирает `nbos-migrate` этого SHA (`prisma migrate deploy`), ждёт `NBOS_MIGRATE_DONE exit=0`, Stop migrator, затем Coolify deploy **по очереди** `nbos-api` → `nbos-worker` → `nbos-scheduler` → `nbos-web` (не параллельный force rebuild). Coolify Auto Deploy у этих пяти приложений **OFF**. Два merge не гоняют migrate параллельно (`concurrency: nbos-production`).

1. Cloudflare DNS + SSL Full (strict) (§2).
2. Миграции Neon **один раз на SHA**, через `nbos-migrate`, не с каждой реплики API. Не `prisma migrate deploy` с ноутбука как штатный путь.
3. Деплой **API** → `https://api.example.com/api/health` → 200.
4. Деплой **Web** → smoke sign-in на `https://app.example.com`.
5. Правила Cloudflare WAF (§2.4).

### 5.1 Break-glass: GitHub недоступен

Если Actions лежит, релиз из Coolify UI (не включать Auto Deploy обратно).

1. Coolify → `nbos-migrate` → **Deploy** (force rebuild ветки `main`, тот же SHA). Healthcheck migrator не включать.
2. Coolify `finished` = контейнер **стартанул**, не Prisma. Runtime logs: `NBOS_MIGRATE_START` → Prisma → `NBOS_MIGRATE_DONE exit=N`. Снять sentinel **до** Stop: после Stop логи пропадают.
3. `exit=0` → **Stop** `nbos-migrate`. `exit!=0` или нет sentinel → **стоп**, api / worker / scheduler / web не деплоить.
4. Coolify **Deploy** (force rebuild того же SHA): `nbos-api`, `nbos-worker`, `nbos-scheduler`, `nbos-web`.
5. Worker / scheduler без публичного HTTP: ждать Coolify deployment `finished` и `running:healthy`, не внешний health из браузера.

Rollback: Coolify → Deployments → предыдущий зелёный билд (§9). DB: Neon PITR, не `migrate reset`.

---

## 6. Scheduler / внешний cron

Не копируйте в Coolify весь каталог `# KEY=` из `.env.example`. Включайте только джоб, который запускаете сегодня.

**Recurring tasks** (создаёт `Task` из due-шаблонов) — выберите **один** триггер, не оба:

1. Внешний cron каждые 5 минут (флаги `SCHEDULER_RECURRING_TASKS_*` не нужны):

```bash
curl -fsS -X POST "https://api.example.com/api/scheduler/recurring-tasks-due" \
  -H "x-scheduler-key: $SCHEDULER_API_KEY"
```

2. Или dedicated `nbos-scheduler` (`PROCESS_ROLE=scheduler`): `SCHEDULER_ENABLED=true` + `SCHEDULER_RECURRING_TASKS_DUE_ENABLED=true`. На `PROCESS_ROLE=api` этот флаг ничего не делает.

Expense plan auto-due:

```bash
curl -fsS -X POST "https://api.example.com/api/scheduler/expense-plan-auto-due" \
  -H "x-scheduler-key: $SCHEDULER_API_KEY"
```

Подробнее: [`expense-plan-auto-due-external-cron.md`](reference/platforms/expense-plan-auto-due-external-cron.md).

---

## 7. Опциональные Dockerfiles (если Nixpacks не справляется)

**API** (`apps/api/Dockerfile`):

```dockerfile
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm db:generate && pnpm --filter @nbos/api build
WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "--import", "tsx", "dist/main.js"]
```

**Web:** тот же паттерн с `pnpm --filter @nbos/web build` + `next start`.

---

## 8. Smoke test после деплоя

1. `GET https://api.example.com/api/health` → 200
2. Вход в систему; DevTools: session cookie `httpOnly` + `Secure`; **нет** `accessToken` в session JSON
3. Sign out → старый token → 401
4. `curl -I https://app.example.com` → CSP, security headers, **`cf-ray`** (путь через Cloudflare)
5. RBAC: одно действие CRM/Finance под разрешённой ролью
6. Drive upload: заблокированное расширение отклоняется
7. Coolify UI: оба приложения healthy; в логах API — Redis denylist при заданном `REDIS_URL`

---

## 9. Rollback

1. Coolify → **Deployments** → redeploy предыдущего зелёного билда (web и/или api).
2. DB: Neon PITR restore если миграция упала (`security.todo` §4.4).
3. Запись деплоя в Technical module deployment record.

---

## Связанные документы

- [`security.todo.md`](../security.todo.md)
- [`WAF Cloudflare.md`](reference/Check/Security/WAF%20Cloudflare.md)
- [`TECH_CARD.md`](TECH_CARD.md)
