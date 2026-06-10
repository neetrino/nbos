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
  → nbos-api   (NestJS, :4000)
  → redis      (Coolify or Upstash — REDIS_URL)
Neon Postgres / R2 / Resend — внешние SaaS
```

| Компонент          | Продакшен                                       |
| ------------------ | ----------------------------------------------- |
| **Compute**        | Hetzner VPS + Coolify (`nbos-web` + `nbos-api`) |
| **Edge / домены**  | Cloudflare proxied, SSL Full (strict), WAF      |
| **База данных**    | Neon Postgres (`sslmode=require`)               |
| **Object storage** | Cloudflare R2 (private bucket)                  |
| **Кэш / очереди**  | Redis (`rediss://` в prod)                      |
| **Email**          | Resend                                          |

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
PORT=4000
DATABASE_URL=postgresql://...?sslmode=require
JWT_SECRET=<openssl rand -base64 32>
CREDENTIALS_ENCRYPTION_KEY=<openssl rand -base64 32>
CORS_ORIGIN=https://app.example.com
REDIS_URL=rediss://...
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

1. Cloudflare DNS + SSL Full (strict) (§2).
2. Миграции Neon **один раз** (не с каждой реплики API):

   ```bash
   pnpm db:migrate:deploy
   ```

3. Деплой **API** → `https://api.example.com/api/health` → 200.
4. Деплой **Web** → smoke sign-in на `https://app.example.com`.
5. Правила Cloudflare WAF (§2.4).

---

## 6. Scheduler / внешний cron

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
