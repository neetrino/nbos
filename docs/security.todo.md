# NBOS — Security & Quality Check (production gate)

> **Цель:** поднять проект на сервер и закрыть дыры до уровня стандартов Neetrino + Minimum Acceptable Quality Gate.  
> **Как пользоваться:** `[x]` по мере выполнения. **P0** — блокер релиза; **P1** — первая неделя prod; **P2** — backlog.  
> **Синхронизация:** при закрытии пункта здесь — по возможности отметить соответствующий чекбокс в `docs/reference/Check/`.

**Условные обозначения:** 🤖 код/репо · 👤 панели/инфра/политики · ✅ есть (перепроверить на prod) · 🔄 частично

---

## Session 2026-06-01 — закрыто в коде (этапы A–D)

> Реализовано в рамках security-прохода. Все изменения прошли `typecheck` (api) + `lint` + unit-тесты.

| Пункт                | Что сделано                                                                                               | Файлы                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **19.1**             | `sortBy` whitelist в 7 сервисах + общий хелпер `resolveSortField`/`normalizeSortDirection` + тест         | `common/utils/sort-order.ts(.test)`, `projects/contacts/leads/deals/support/bonus/tasks`                |
| **3.11**             | Лимиты тела запроса (`json`/`urlencoded` 1 MB)                                                            | `apps/api/src/main.ts`                                                                                  |
| **3.7**              | Swagger `/api/docs` только вне production                                                                 | `apps/api/src/main.ts`                                                                                  |
| **1.4 / 2.10**       | Rate-limit auth: login 10/min, accept-invite 5/10min, invite-info 20/5min                                 | `modules/auth/auth.controller.ts`                                                                       |
| **5.4**              | Fail-fast env-валидация (required + сила/placeholder секретов в prod)                                     | `config/env.validation.ts(.test)`, `app.module.ts`                                                      |
| **3.8**              | `ServiceApiKeyGuard` для `/api/scheduler/*` (service key, не user-JWT) + `SkipThrottle`                   | `common/guards/service-api-key.guard.ts`, `scheduler.controller.ts`, `crypto.ts` (`timingSafeEqualStr`) |
| **1.5 / 1.5c**       | Security headers + baseline CSP во фронте (HSTS только prod)                                              | `apps/web/next.config.ts`                                                                               |
| **2.2**              | `useSecureCookies` в prod (явный Secure-флаг)                                                             | `apps/web/src/auth.ts`                                                                                  |
| **2.6**              | Парольная политика accept-invite: ≥10 + буква+цифра                                                       | `dto/accept-invite.dto.ts`                                                                              |
| **13.1 / 5.5 / 8.1** | CI: lint+typecheck+test+build, blocking `pnpm audit --audit-level=high`, gitleaks; npm Dependabot включён | `.github/workflows/ci.yml`, `.github/dependabot.yml`                                                    |
| **23.2**             | Regression-тест whitelist `sortBy`                                                                        | `common/utils/sort-order.test.ts`                                                                       |

**Закрыто во 2-м заходе P1:** §9.1 R2 ext-blocklist + size cap, §7.1 Redis TLS-enforce в prod.

**Закрыто в 3-м заходе P1:** §6.1 nestjs-pino + request-id (`x-request-id`), §6.3 редакция секретов в логах (authorization/cookie/scheduler-key/password/token), фильтр исключений переведён на Nest Logger.

**Осталось (следующий заход):** **👤 preflight** (§0, §18) — Coolify/Hetzner env, Neon, Cloudflare, GitHub branch protection. **Messenger (после доработки модуля):** §11.2, §11.3. **Deploy guide:** [`docs/deploy.md`](docs/deploy.md).

**Закрыто в 4-м заходе:** §2.7 Redis-backed JWT denylist (`nbos:jwt-denylist:*`), §9.3 R2 storage key path traversal guard, §5.6/§10.1 placeholder + required secrets (env validation), §7.2 denylist key prefix + TTL.

---

## Индекс стандартов `docs/reference/Check` (все источники)

| Документ                                                                                                                  | Назначение                              | Секция в этом файле |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------- |
| [`Security/0 Security List.md`](docs/reference/Check/Security/0%20Security%20List.md)                                     | P0 must-have (краткий)                  | §1–§8               |
| [`Security/1`…`8`](docs/reference/Check/Security/)                                                                        | Детальные инструкции по доменам         | §1–§8               |
| [`Security/WAF Cloudflare.md`](docs/reference/Check/Security/WAF%20Cloudflare.md)                                         | **REG-SEC-EDGE-001** — периметр         | §18                 |
| [`Security/SQL Injection Security Checklist.md`](docs/reference/Check/Security/SQL%20Injection%20Security%20Checklist.md) | SQLi аудит                              | §19                 |
| [`Security/Проектный Quality Checklist.md`](docs/reference/Check/Security/Проектный%20Quality%20Checklist.md)             | Полный gate A–O, anti-patterns, release | §20–§22             |
| [`Quality/project-quality-checklist.md`](docs/reference/Check/Quality/project-quality-checklist.md)                       | Общий quality (код, Nest, DB)           | §23                 |
| [`Quality/regression-gates.md`](docs/reference/Check/Quality/regression-gates.md)                                         | `pnpm test:regression`                  | §24                 |
| [`docs/TECH_CARD.md`](docs/TECH_CARD.md) §5, §8, §10                                                                      | Стек NBOS                               | §14, §0             |
| [`.cursor/rules/08-security.mdc`](.cursor/rules/08-security.mdc)                                                          | Правила для AI/кода                     | везде               |

**Minimum Acceptable Quality Gate (из Quality Checklist):** все **P0** закрыты; в **B, D, F, L** — 0 открытых P0/P1; суммарно ≤5 открытых P1 (ни одного в B/D/F/L).

---

## 0. Preflight — поднять на сервер безопасно

| #    | P   | Статус | Задача                                                                                                                                   | Проверка                       |
| ---- | --- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 0.1  | P0  | ⬜     | 👤 Окружения dev / staging / prod (Neon branch, Coolify on Hetzner)                                                                      | Секреты prod ≠ preview ≠ local |
| 0.2  | P0  | ⬜     | 👤 Сильные секреты: `AUTH_SECRET`, `JWT_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`                                                            | `openssl rand -base64 32`      |
| 0.3  | P0  | ⬜     | 👤 Coolify **nbos-web**: `AUTH_SECRET`, `BACKEND_URL`, `APP_URL`, `NEXT_PUBLIC_BACKEND_URL`; без API-секретов в web                      | Audit env                      |
| 0.4  | P0  | ⬜     | 👤 Coolify **nbos-api**: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `REDIS_URL`, R2, encryption key, `RESEND_*`, `NODE_ENV=production` | CORS assert OK                 |
| 0.5  | P0  | ⬜     | 👤 Neon: `sslmode=require`, `app_user` least privilege                                                                                   | Не owner в runtime             |
| 0.6  | P0  | ⬜     | 👤 `REPORT_EXPORT_SYNC_FALLBACK` выключен в prod                                                                                         | Только worker                  |
| 0.7  | P0  | ⬜     | 👤 Нет постоянного `ADMIN_PASSWORD` в prod; seed:admin один раз → смена пароля                                                           | —                              |
| 0.8  | P0  | ⬜     | 👤 **Cloudflare:** `app` + `api` → VPS IP, **Proxied ON**, SSL **Full (strict)** → Coolify origin                                        | `docs/deploy.md` §2            |
| 0.9  | P1  | ⬜     | 👤 Домены `@`, `www`, `api` (если отдельно) — proxied, SSL Full (strict), HSTS после теста                                               | §18                            |
| 0.10 | P1  | ✅     | 🤖 Runbook деплоя (Coolify/Hetzner + Cloudflare + security gate)                                                                         | `docs/deploy.md`               |

---

## 1. Edge / Network — Security `1`, WAF `§18`

| #    | P   | Статус | Задача                                                                                 | Проверка             |
| ---- | --- | ------ | -------------------------------------------------------------------------------------- | -------------------- |
| 1.1  | P0  | ⬜     | 👤 HTTPS + HSTS (Cloudflare → Coolify origin)                                          | `curl -I` + `cf-ray` |
| 1.2  | P1  | ⬜     | 👤 WAF: Managed + **OWASP CRS** ON (§18.2)                                             | CF Security          |
| 1.3  | P1  | ⬜     | 👤 Bot / DDoS protection ON                                                            | CF Security          |
| 1.4  | P0  | ✅     | 🤖 App rate limit: Throttler 100/min; auth ужесточён (login/accept-invite/invite-info) | 429 на login         |
| 1.5  | P0  | ✅     | 🤖 Next **security headers** (`next.config` `headers()`)                               | securityheaders.com  |
| 1.5b | P1  | ✅     | 🤖 Nest Helmet                                                                         | `/api/*`             |
| 1.5c | P1  | 🔄     | 🤖 CSP Next baseline (nonce-based — P1 follow-up вместо `unsafe-inline`)               | CSP evaluator        |
| 1.6  | P1  | ⬜     | 👤 CF rate rules для групп A–E (§18)                                                   | Логи 429             |

---

## 2. Auth + Sessions — Security `2`, Quality **B.1–B.7**

| #    | P   | Статус | Задача                                                                    | Проверка                            |
| ---- | --- | ------ | ------------------------------------------------------------------------- | ----------------------------------- |
| 2.1  | P1  | ⬜     | 👤 ADR auth: NextAuth JWT + API JWT + RBAC + invite-only                  | `docs/adr-auth.md`                  |
| 2.2  | P0  | ✅     | 🤖 Cookie flags: httpOnly+sameSite (Auth.js) + `useSecureCookies` prod    | DevTools                            |
| 2.3  | P0  | ✅     | 🤖 CSRF / Origin: OriginGuard на mutating + CORS allowlist                | POST чужой origin → 403             |
| 2.4  | P0  | ✅     | 🤖 RBAC: Auth + Employee + Permission guards                              | curl → 403                          |
| 2.5  | P1  | ⬜     | 👤 MFA для admin (Quality **B.19**)                                       | —                                   |
| 2.6  | P1  | 🔄     | 🤖 Пароль: invite ≥10 + буква+цифра ✅; login ≥6 (verify-path, оставлено) | 400 на слабый                       |
| 2.7  | P0  | ✅     | 🤖 JWT revoke: `jti` + Redis/in-memory denylist + logout                  | После logout → 401                  |
| 2.8  | P0  | ✅     | 🤖 BFF: JWT в httpOnly cookie, `/api/bff` + realtime-token для WS         | DevTools: нет accessToken в session |
| 2.9  | P2  | ⬜     | 🤖 Password reset (TECH_CARD §5.6)                                        | Phase 2+                            |
| 2.10 | P1  | ✅     | 🤖 `invite-info`: rate limit 20/5min                                      | Нет перебора                        |
| 2.11 | P0  | ✅     | 🤖 argon2id                                                               | —                                   |
| 2.12 | P0  | ✅     | 🤖 Invite-only                                                            | —                                   |

---

## 3. API — Security `3`, Quality **B.5–B.8, E.1, E.8**

| #    | P   | Статус | Задача                                                                | Проверка             |
| ---- | --- | ------ | --------------------------------------------------------------------- | -------------------- |
| 3.1  | P0  | ✅     | 🤖 ValidationPipe whitelist                                           | 400                  |
| 3.1a | P0  | ✅     | 🤖 XSS: DOMPurify                                                     | —                    |
| 3.2  | P0  | ✅     | 🤖 500 без stack в prod                                               | —                    |
| 3.2a | P0  | 🔄     | 🤖 4xx без утечки схемы/секретов                                      | Audit errors         |
| 3.3  | P0  | ✅     | 🤖 CORS strict + prod assert                                          | —                    |
| 3.4  | P1  | 🔄     | 🤖 Idempotency на payments/orders (Quality **E.2**)                   | Дубль POST           |
| 3.5  | P1  | ⬜     | 🤖 Webhooks: signature + replay (IDBank/Idram)                        | Подделка → 403       |
| 3.6  | P0  | ✅     | 🤖 SQL parameterized (Prisma)                                         | §19                  |
| 3.7  | P0  | ✅     | 🤖 Swagger `/api/docs` только вне production                          | Недоступен снаружи   |
| 3.8  | P0  | ✅     | 🤖 Scheduler: **service API key** (`ServiceApiKeyGuard`), не user JWT | §18 + runbook        |
| 3.9  | P1  | ⬜     | 🤖 `proxy.ts` + headers при необходимости                             | —                    |
| 3.10 | P1  | ✅     | 🤖 request-id в логах (`x-request-id`, nestjs-pino)                   | Trace                |
| 3.11 | P0  | ✅     | 🤖 **Body size limits**: JSON/urlencoded 1 MB (`main.ts`)             | 413 на huge body     |
| 3.12 | P1  | ⬜     | 🤖 API timeouts (Quality **B.21**)                                    | Nest/Render settings |
| 3.13 | P2  | ⬜     | 🤖 OpenAPI только internal                                            | —                    |

---

## 4. Data / DB — Security `4`, Quality **D**

| #   | P   | Статус | Задача                                                          | Проверка       |
| --- | --- | ------ | --------------------------------------------------------------- | -------------- |
| 4.1 | P0  | ⬜     | 👤 TLS `sslmode=require`                                        | Neon           |
| 4.2 | P0  | ✅     | 🤖 Pool + timeouts (TECH_CARD)                                  | —              |
| 4.3 | P0  | ⬜     | 👤 Least privilege + отдельная роль миграций (SQL checklist §6) | Нет DROP       |
| 4.4 | P0  | ⬜     | 👤 PITR + **тест restore** (Quality **D.13**)                   | Restore branch |
| 4.5 | P0  | ⬜     | 🤖 Миграции: один job, не из каждого инстанса (Quality **L.4**) | CI doc         |
| 4.6 | P1  | ⬜     | 🤖 Транзакции на критичных money ops (Quality **D.9**)          | Review         |

---

## 5. Secrets — Security `5`, Quality **C**

| #   | P   | Статус | Задача                                                               | Проверка           |
| --- | --- | ------ | -------------------------------------------------------------------- | ------------------ |
| 5.1 | P0  | ⬜     | 👤 Секреты только в Coolify env / GitHub Secrets (C.1–C.2)           | —                  |
| 5.2 | P1  | ⬜     | 👤 `docs/runbook-secret-rotation.md` (C.4)                           | Runbook            |
| 5.3 | P0  | ✅     | 🤖 `.gitignore` env                                                  | —                  |
| 5.4 | P0  | ✅     | 🤖 Fail-fast env validation at API boot (`config/env.validation.ts`) | Weak secret → exit |
| 5.5 | P0  | ✅     | 🤖 CI: gitleaks (`.github/workflows/ci.yml`)                         | PR fail            |
| 5.6 | P1  | ✅     | 🤖 Reject placeholder secrets in prod (JWT, CREDENTIALS, SCHEDULER)  | Boot fail          |
| 5.7 | P1  | ⬜     | 👤 R2 IAM minimal (Quality **C.3**, **F.3**)                         | —                  |
| 5.8 | P2  | ⬜     | 👤 Локальный dev без prod DB/secrets (C.10)                          | —                  |

---

## 6. Observability — Security `6`, Quality **K**

| #   | P   | Статус | Задача                                                            | Проверка      |
| --- | --- | ------ | ----------------------------------------------------------------- | ------------- |
| 6.1 | P0  | ✅     | 🤖 nestjs-pino + request-id (`x-request-id`); фильтр через Logger | JSON logs     |
| 6.2 | P1  | ⬜     | 👤 Sentry + alerts 5xx/latency (K.1–K.5)                          | Test alert    |
| 6.3 | P0  | ✅     | 🤖 Redact authorization/cookie/scheduler-key/password/token       | grep logs     |
| 6.4 | P1  | ⬜     | 🤖 Audit: credentials reveal, RBAC, export, delete (B.20)         | DB audit rows |
| 6.5 | P1  | ⬜     | 👤 CF Security Events + 401/403/429 spikes (WAF §8)               | Dashboard     |

---

## 7. Redis — Security `7`

| #   | P   | Статус | Задача                                                                         | Проверка |
| --- | --- | ------ | ------------------------------------------------------------------------------ | -------- |
| 7.1 | P0  | ✅     | 🤖👤 `rediss://` TLS — код enforce в prod (`common/redis/redis-connection.ts`) | Upstash  |
| 7.2 | P1  | ✅     | 🤖 JWT denylist: `nbos:jwt-denylist:` prefix + SETEX TTL                       | —        |
| 7.3 | P0  | ⬜     | 🤖 No secrets/PII in Redis                                                     | Review   |

---

## 8. Dependencies — Security `8`, Quality **B.17**

| #   | P   | Статус | Задача                                                                    | Проверка |
| --- | --- | ------ | ------------------------------------------------------------------------- | -------- |
| 8.1 | P0  | ✅     | 🤖👤 npm Dependabot включён + blocking CI `pnpm audit --audit-level=high` | Green PR |
| 8.2 | P1  | ⬜     | 👤 SLA: critical 7d, high 30d                                             | Policy   |
| 8.3 | P2  | ⬜     | 👤 SBOM при необходимости                                                 | —        |

---

## 9. Files / R2 — Quality **F** (18 пунктов, ключевые)

| #   | P   | Статус | Задача                                                                              | Проверка      |
| --- | --- | ------ | ----------------------------------------------------------------------------------- | ------------- |
| 9.1 | P0  | ✅     | 🤖 Presigned upload + RBAC; ext-blocklist + size cap (`drive-upload-validation.ts`) | .exe rejected |
| 9.2 | P0  | ⬜     | 👤 Bucket private; только signed URLs (F.1–F.2)                                     | —             |
| 9.3 | P1  | ✅     | 🤖 Path traversal в R2 keys (`storage-key-validation.ts`)                           | `../` fail    |
| 9.4 | P1  | ⬜     | 👤 R2 CORS minimal (F.4)                                                            | —             |
| 9.5 | P2  | ⬜     | 🤖 AV scan user uploads (F.6)                                                       | —             |
| 9.6 | P1  | ⬜     | 🤖 CDN cache rules не ломают private files (F.7+)                                   | —             |

---

## 10. Credentials vault (NBOS)

| #    | P   | Статус | Задача                                                    | Проверка  |
| ---- | --- | ------ | --------------------------------------------------------- | --------- |
| 10.1 | P0  | ✅     | 🤖 `CREDENTIALS_ENCRYPTION_KEY` required (env validation) | Boot fail |
| 10.2 | P0  | ✅     | 🤖 AES-256-GCM at rest                                    | —         |
| 10.3 | P1  | ⬜     | 🤖 Audit `credential.secret_revealed`                     | —         |
| 10.4 | P0  | ⬜     | 🤖 RBAC regression (`credentials.service.*.test` в gate)  | 403       |

---

## 11. WebSocket / Messenger

| #    | P   | Статус | Задача                                                | Проверка |
| ---- | --- | ------ | ----------------------------------------------------- | -------- |
| 11.1 | P0  | ✅     | 🤖 CORS + JWT handshake                               | —        |
| 11.2 | P1  | ⏸      | 🤖 Message rate limit — **после доработки messenger** | —        |
| 11.3 | P1  | ⏸      | 🤖 AuthZ на каждое WS event — **после messenger ACL** | —        |

---

## 12. Compliance — Quality **O**

| #    | P   | Статус | Задача                                   | Проверка |
| ---- | --- | ------ | ---------------------------------------- | -------- |
| 12.1 | P1  | ⬜     | 👤 Retention PII (messenger, mail, CRM)  | Policy   |
| 12.2 | P1  | ⬜     | 👤 Export/delete по запросу              | Process  |
| 12.3 | P2  | ⬜     | 👤 DPA: Neon, Vercel, Render, Resend, CF | —        |

---

## 13. CI/CD — Quality **L**, anti-pattern #9

| #    | P   | Статус | Задача                                                                 | Проверка          |
| ---- | --- | ------ | ---------------------------------------------------------------------- | ----------------- |
| 13.1 | P0  | ✅     | 🤖 GHA: lint + typecheck + test + build + audit + gitleaks (L.3)       | Branch protection |
| 13.2 | P0  | ⬜     | 👤 Protected main; no force push                                       | GitHub            |
| 13.3 | P0  | ⬜     | 👤 Single migration job (L.4)                                          | Log               |
| 13.4 | P1  | ⬜     | 👤 Preview ≠ prod DB (L.2)                                             | Env scopes        |
| 13.5 | P1  | ⬜     | 🤖 Dockerfile non-root (L + §13)                                       | Image scan        |
| 13.6 | P1  | ⬜     | 👤 Rollback runbook (L.5)                                              | Doc               |
| 13.7 | P1  | ⬜     | 👤 Coolify health check `GET /api/health` on nbos-api (L.10, anti #17) | Coolify UI        |

---

## 14. TECH_CARD §10 — переоценка

| Пункт              | Заявлено | Факт                                      |
| ------------------ | -------- | ----------------------------------------- |
| 10.2 CSRF          | ✅       | 🔄 Проверить cookies + Origin             |
| 10.6 Rate limit    | ✅       | 🔄 Auth endpoints слабее REG-SEC-EDGE-001 |
| 5.6 Password reset | ⬜       | ⬜ v1 — закрыть brute-force               |

---

## 15. OWASP Top 10 (кратко)

| Риск                      | Статус | Действие                                 |
| ------------------------- | ------ | ---------------------------------------- |
| Broken Access Control     | 🔄     | §3.7–3.8, §19.2 sortBy                   |
| Cryptographic Failures    | 🔄     | §0, §5, §7                               |
| Injection                 | 🔄     | §19 — whitelist sortBy                   |
| Security Misconfiguration | ⬜     | §1.5, §18, Swagger                       |
| Auth Failures             | 🔄     | §2, §18 A-class                          |
| SSRF                      | ⬜     | Аудит mail/integrations URL fetch (B.13) |

---

## 18. REG-SEC-EDGE-001 — Cloudflare WAF (обязательный регламент Neetrino)

> Полный текст: [`WAF Cloudflare.md`](docs/reference/Check/Security/WAF%20Cloudflare.md). Ниже — **NBOS endpoint map** для правил.

### 18.1 Инфра (чеклист §9.1–9.6 документа)

| #      | P   | Статус | Пункт регламента                                                                         |
| ------ | --- | ------ | ---------------------------------------------------------------------------------------- |
| 18.1.1 | P0  | ⬜     | DNS `@`, `www`, `api` — **Proxied ON**                                                   |
| 18.1.2 | P0  | ⬜     | SSL/TLS **Full (strict)**                                                                |
| 18.1.3 | P1  | ⬜     | HSTS после smoke-теста                                                                   |
| 18.1.4 | P1  | ⬜     | Managed Ruleset + OWASP CRS                                                              |
| 18.1.5 | P1  | ⬜     | Bot protection + whitelist мониторинга                                                   |
| 18.1.6 | P1  | ⬜     | CF Access или IP allowlist для чувствительных путей (нет публичного `/admin` без защиты) |

### 18.2 NBOS — классы endpoint’ов (для Rate limiting rules)

**Группа A — Auth / identity**

| Path                             | Метод | Лимит (регламент) | App (дублировать)                   |
| -------------------------------- | ----- | ----------------- | ----------------------------------- |
| `/api/auth/*` (NextAuth, Vercel) | POST  | 10/min/IP         | Edge + при необходимости middleware |
| `/api/v1/auth/login`             | POST  | 10/min/IP         | `@Throttle` на controller           |
| `/api/v1/auth/accept-invite`     | POST  | 5/10min/IP        | idem                                |
| `/api/v1/auth/invite-info`       | GET   | 20/5min/IP        | anti-enumeration                    |
| `/sign-in`, `/accept-invite`     | \*    | challenge         | CF                                  |

**Группа C — «дорогие»**

| Path                          | Лимит                                                      |
| ----------------------------- | ---------------------------------------------------------- |
| `/api/reports/*` export       | 30/min/IP                                                  |
| `/api/documents/*` search/FTS | 120/min/IP                                                 |
| `/api/scheduler/*`            | **не user rate limit** — только service key + allowlist IP |

**Группа D — Webhooks (будущие)**

| Path              | Политика                                     |
| ----------------- | -------------------------------------------- |
| `/api/webhooks/*` | Signature required; CF rule не как для users |

**Группа E — Admin / settings**

| Path                                          | Политика                                       |
| --------------------------------------------- | ---------------------------------------------- |
| `/settings/security`, roles, employees invite | Строгий RBAC + CF Access для ops (опционально) |

### 18.3 Origin (Render Nest)

| #      | P   | Статус | Задача                                   |
| ------ | --- | ------ | ---------------------------------------- |
| 18.3.1 | P0  | ✅     | `trust proxy: 1` в prod                  |
| 18.3.2 | P1  | ⬜     | Real IP: `CF-Connecting-IP` только за CF |
| 18.3.3 | P0  | ✅     | helmet + CORS + throttler                |

---

## 19. SQL Injection Checklist — аудит NBOS (2026-05-20)

| Критерий                        | Статус | Комментарий                       |
| ------------------------------- | ------ | --------------------------------- |
| ORM / параметризация            | ✅     | Prisma; raw через `sql` template  |
| `queryRawUnsafe`                | ✅     | Не найдено                        |
| Whitelist `ORDER BY` / `sortBy` | ✅     | Все списки whitelisted (см. ниже) |
| DB least privilege              | ⬜     | 👤 Neon                           |
| Manual test `' OR 1=1`          | ⬜     | QA на staging                     |

### 19.1 P0 — `sortBy` без whitelist (Prisma `orderBy: { [sortBy] }`)

Исправить по образцу `expenses.service.ts` / `CLIENT_SERVICE_SORT_FIELDS`:

| Файл                                                            | Статус                                   |
| --------------------------------------------------------------- | ---------------------------------------- |
| `apps/api/src/modules/projects/projects.service.ts`             | ✅ `resolveSortField`                    |
| `apps/api/src/modules/clients/contacts/contacts.service.ts`     | ✅ `resolveSortField`                    |
| `apps/api/src/modules/crm/leads/leads.service.ts`               | ✅ `resolveSortField`                    |
| `apps/api/src/modules/crm/deals/deals.service.ts`               | ✅ `resolveSortField`                    |
| `apps/api/src/modules/support/support.service.ts`               | ✅ `resolveSortField`                    |
| `apps/api/src/modules/bonus/bonus.service.ts`                   | ✅ `resolveSortField`                    |
| `apps/api/src/modules/tasks/task-find-all-paginated.op.ts`      | ✅ `resolveSortField`                    |
| `apps/api/src/modules/payroll-runs/payroll-run-list-queries.ts` | ✅ `LIST_SORT_FIELDS` (был закрыт ранее) |

**Проверка:** `?sortBy=__proto__` / невалидное поле → игнор или 400, не 500.

### 19.2 Raw SQL (OK, перепроверять при изменениях)

- `documents-list-fts.ts` — parameterized `sql`, LIKE escape
- `orders-reconciliation-gap-*.ts` — без user string concat

---

## 20. Проектный Quality Checklist — сводка по разделам

> Полный чеклист: 150+ пунктов. Здесь — **security/release-relevant**; остальное — при обычном quality review.

| Раздел                  | P0 открыто (оценка)             | Где закрывать     |
| ----------------------- | ------------------------------- | ----------------- |
| **A** Архитектура       | 🔄 proxy вместо middleware — OK | A.6               |
| **B** Безопасность (24) | ⬜ большинство                  | §2–§3, §18        |
| **C** Секреты (10)      | ⬜                              | §5                |
| **D** БД (16)           | ⬜ restore, migrations          | §4, §13           |
| **E** API (9)           | 🔄 idempotency, payload size    | §3                |
| **F** R2 (18)           | ⬜                              | §9                |
| **G** Frontend          | 🔄 error boundaries, metadata   | отдельный UX pass |
| **H** Performance       | —                               | post-launch       |
| **I** Код               | 🔄                              | lint CI           |
| **J** Тесты             | 🔄 E2E ⬜                       | §24               |
| **K** Observability     | ⬜                              | §6                |
| **L** CI/CD             | ⬜                              | §13               |
| **O** Compliance        | ⬜                              | §12               |

### 20.1 Anti-patterns (красные флаги) — NBOS

| #   | Anti-pattern                | NBOS                                     |
| --- | --------------------------- | ---------------------------------------- |
| 1   | Секреты в репо              | ✅ .gitignore                            |
| 2   | `NEXT_PUBLIC_` для секретов | ✅ только BACKEND_URL                    |
| 3   | Нет AuthZ на API            | ✅ guards                                |
| 4   | Нет rate limit login        | ✅ §1.4 (auth throttle)                  |
| 5   | Нет security headers        | ✅ §1.5 (next headers + CSP baseline)    |
| 6   | Параллельные миграции       | ⬜ §13.3                                 |
| 7   | Логи с токенами             | ⬜ §6.3                                  |
| 8   | Нет schema validation       | ✅ ValidationPipe                        |
| 9   | Render без health           | 🔄 `/api/health` есть — настроить Render |
| 10  | Игнор npm audit             | ✅ §8.1 (blocking CI audit)              |

---

## 21. Release Readiness (шаблон из Quality Checklist)

Заполнить перед GO:

1. Версия / PR / дата
2. URLs preview + prod
3. Миграции: да/нет + ID
4. **security.todo.md:** все P0 `[x]`
5. **B/D/F/L:** 0 открытых P0/P1
6. `pnpm test` + `pnpm test:regression` green
7. Sentry release + alerts
8. Rollback runbook
9. GO / NO-GO + подписи (§17)

---

## 22. Quality `project-quality-checklist.md` (код-гигиена, security-related)

| Блок               | Ключевые пункты для prod                          |
| ------------------ | ------------------------------------------------- |
| 00-core            | no secrets, no `any`, functions ≤50 lines         |
| 03-typescript      | strict, no `@ts-ignore` без причины               |
| 04-react-nextjs    | `'use client'` минимум; Server Components default |
| 05-backend-nestjs  | DTO + guards + filters                            |
| 06-database        | Prisma migrate; не SQL в UI                       |
| 08-security (rule) | = §2–§8 этого файла                               |

---

## 23. Regression gates — расширить security

Текущий набор: [`regression-gates.md`](docs/reference/Check/Quality/regression-gates.md).

| #    | P   | Статус | Добавить в `vitest.regression.config.ts` |
| ---- | --- | ------ | ---------------------------------------- |
| 23.1 | P1  | ⬜     | `auth.guard.test.ts`                     |
| 23.2 | P1  | ⬜     | Тест whitelist sortBy (после §19.1)      |
| 23.3 | P2  | ⬜     | E2E smoke login (Playwright)             |

---

## 16. Порядок работ

1. §0 + §18.1 (Cloudflare + env)
2. **§19.1** sortBy whitelist (быстрый P0 код)
3. §1.5, §2.2–2.8, §3.7–3.8, §3.11, §5.4–5.5
4. §13.1 CI + §8.1 audit
5. §18.2 rate rules в CF
6. Quality **Release Readiness** §21

---

## 17. Sign-off

| Роль     | Имя | Дата | P0  |
| -------- | --- | ---- | --- |
| Dev      |     |      | ⬜  |
| Ops      |     |      | ⬜  |
| Security |     |      | ⬜  |

---

**Аудит:** 2026-06-01 (перепроверка по коду + реализация этапов A–D)  
**Прошлый аудит:** 2026-05-20  
**Закрыто 2026-06-01 (код):** §19.1 sortBy (7 сервисов), §3.11 body limits, §3.7 Swagger prod, §1.4/§2.10 auth throttle, §5.4 env validation, §3.8 scheduler service key, §1.5 security headers + CSP, §2.2 secure cookies, §2.6 invite password policy, §13.1/§5.5/§8.1 CI (audit + gitleaks + Dependabot). См. «Session 2026-06-01».
