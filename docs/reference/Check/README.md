# Check — стандарты качества и безопасности (Neetrino)

Единая точка входа для ревью и production gate. **Операционный трекер NBOS:** [`security.todo.md`](../../../security.todo.md) в корне репозитория.

## Когда что открывать

| Ситуация                          | Документ                                                                                                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Перед релизом / подъём на prod    | [`security.todo.md`](../../../security.todo.md) + Minimum Gate в [Проектный Quality Checklist](Security/Проектный%20Quality%20Checklist.md#minimum-acceptable-quality-gate) |
| Быстрый P0 security               | [0 Security List](Security/0%20Security%20List.md)                                                                                                                          |
| Настройка Cloudflare / WAF        | [WAF Cloudflare](Security/WAF%20Cloudflare.md) (REG-SEC-EDGE-001)                                                                                                           |
| Аудит SQL                         | [SQL Injection Checklist](Security/SQL%20Injection%20Security%20Checklist.md)                                                                                               |
| Полный quality review             | [Проектный Quality Checklist](Security/Проектный%20Quality%20Checklist.md)                                                                                                  |
| После крупного среза              | [regression-gates](Quality/regression-gates.md) → `pnpm test:regression`                                                                                                    |
| Ежедневная разработка (код-стиль) | [project-quality-checklist](Quality/project-quality-checklist.md)                                                                                                           |

## Security (детализация P0)

| #   | Файл                                                                                         | Тема                       |
| --- | -------------------------------------------------------------------------------------------- | -------------------------- |
| 0   | [0 Security List](Security/0%20Security%20List.md)                                           | Сводный P0                 |
| 1   | [Edge / Network](<Security/1%20Edge-Network%20защита%20(периметр).md>)                       | Headers, rate limit        |
| 2   | [Auth + Sessions](<Security/2%20Auth%20+%20Sessions%20(самая%20любимая%20точка%20атаки).md>) | Cookies, CSRF, RBAC, MFA   |
| 3   | [API](<Security/3%20API%20безопасность%20(Next%20API%20-%20Nest).md>)                        | Validation, CORS, webhooks |
| 4   | [Data / DB](<Security/4%20Data-DB%20(Neon%20Postgres).md>)                                   | TLS, roles, backups        |
| 5   | [Secrets](Security/5%20Secrets%20%26%20Config%20hygiene.md)                                  | Env, rotation              |
| 6   | [Observability](<Security/6%20Observability%20(иначе%20ты%20слепой).md>)                     | Logs, Sentry, PII          |
| 7   | [Redis](<Security/7%20Upstash%20Redis%20(если%20используется).md>)                           | TLS, TTL                   |
| 8   | [Dependencies](Security/8%20Dependency%20scanning.md)                                        | audit, Dependabot          |
| —   | [WAF Cloudflare](Security/WAF%20Cloudflare.md)                                               | Обязательный периметр      |
| —   | [SQL Injection](Security/SQL%20Injection%20Security%20Checklist.md)                          | Code audit                 |

## Quality

| Файл                                                                       | Назначение                                         |
| -------------------------------------------------------------------------- | -------------------------------------------------- |
| [Проектный Quality Checklist](Security/Проектный%20Quality%20Checklist.md) | Разделы A–O, anti-patterns, release template       |
| [project-quality-checklist](Quality/project-quality-checklist.md)          | Краткие чеклисты по слоям (архитектура, TS, Nest…) |
| [regression-gates](Quality/regression-gates.md)                            | Узкий автоматический набор тестов                  |

## Связь с проектом

- **TECH_CARD** §10 — заявленные меры; сверка с фактом в `security.todo.md` §14.
- **Cursor rule** `.cursor/rules/08-security.mdc` — ссылается на `0 Security List.md`.
- **Исполнение:** 🤖 разработка/AI в репо; 👤 Vercel, Cloudflare, Neon, Render.

## Обновление стандартов

При изменении регламента Neetrino: обновить файл в `Security/` или `Quality/`, затем синхронизировать пункты в `security.todo.md` (индекс § «Индекс стандартов»).
