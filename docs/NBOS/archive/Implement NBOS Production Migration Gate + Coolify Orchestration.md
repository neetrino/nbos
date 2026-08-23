Ты работаешь в production-репозитории NBOS.

Нужно не просто проанализировать, а **реализовать** согласованную production deployment architecture для NBOS.

Работай как senior DevOps/backend engineer. Сначала быстро проверь текущее состояние, затем внеси необходимые изменения. Не переусложняй решение.

# Контекст

NBOS состоит из 4 production applications:

- `nbos-web`
- `nbos-api`
- `nbos-worker`
- `nbos-scheduler`

Infrastructure:

- GitHub repository
- production branch: `main`
- Hetzner
- Coolify
- PostgreSQL сейчас в Neon
- позже PostgreSQL будет перенесён на Hetzner
- Prisma
- pnpm monorepo
- `@nbos/database`

Текущий development flow:

```text id="yvm4ij"
feature branches
↓
development
↓
testing
↓
PR development → main
↓
merge main
↓
production release
```

Сейчас у production applications включён Coolify Auto Deploy от `main`.

Это нужно изменить.

# Целевая architecture

После merge в `main` должен быть ОДИН контролируемый release flow:

```text id="ri35h2"
merge → main
↓
GitHub Actions CI
↓
CI SUCCESS
↓
GitHub Actions запускает Coolify `nbos-migrate`
↓
nbos-migrate:
prisma migrate deploy
↓
ждать завершения
↓
SUCCESS?
├── NO  → STOP RELEASE
└── YES
      ↓
      Coolify deploy:
      ├── nbos-api
      ├── nbos-worker
      ├── nbos-scheduler
      └── nbos-web
↓
healthchecks
```

# Очень важный принцип

Migration должна выполняться **на каждом production release**.

Не нужно проверять, изменялась ли Prisma schema или появились ли новые migration files.

Всегда выполняй:

```bash id="u79ns6"
prisma migrate deploy
```

Если новых migrations нет, Prisma просто завершится успешно и deployment продолжится.

То есть НЕ добавляй лишнюю логику:

```text id="8swowr"
git diff migrations
if schema changed
if prisma files changed
```

Она не нужна.

Правило простое:

```text id="0c3ctz"
EVERY RELEASE
→ prisma migrate deploy
→ deploy
```

# Migration ownership

Production migrations НЕ принадлежат:

- API
- Worker
- Scheduler
- Web

Migration принадлежит RELEASE PROCESS.

Должно быть:

```text id="mpbtib"
ONE RELEASE
→ ONE MIGRATOR
→ MULTIPLE APPLICATION DEPLOYS
```

Не должно быть:

```text id="w0ice2"
API startup → migrate
Worker startup → migrate
Scheduler startup → migrate
```

Не добавляй migration в:

- Docker CMD API
- Docker CMD Worker
- Docker CMD Scheduler
- `start`
- `start:prod`
- entrypoint
- application bootstrap

# Coolify

ВАЖНО: в environment Cursor/agent может иметь Coolify API key/token.

Сначала проверь доступные environment variables и существующую конфигурацию.

НЕ показывай значение токена в output или logs.

Если Coolify credentials/API access действительно доступны, используй их для реализации Coolify-side конфигурации самостоятельно.

Не проси меня вручную создавать сервис, если это можно безопасно выполнить через доступный Coolify API.

Но:

- сначала идентифицируй правильный Coolify project/environment/resources;
- никогда не угадывай resource IDs;
- не трогай другие проекты;
- не удаляй существующие production services;
- не меняй domains;
- не меняй production secrets без необходимости;
- не показывай secrets;
- перед destructive action остановись и не выполняй её.

# Создать `nbos-migrate`

Нужно создать отдельный Coolify resource/application/job:

```text id="p0grxo"
nbos-migrate
```

Его единственная задача:

```bash id="nlr8en"
pnpm --filter @nbos/database migrate:deploy
```

или эквивалентная реальная команда проекта после проверки scripts.

Если сейчас такой root command отсутствует, можно добавить понятный script:

```json id="av6k86"
"db:migrate:deploy": "..."
```

но используй правильную workspace-команду проекта.

`nbos-migrate` должен:

- использовать тот же repository;
- использовать production `main`;
- запускаться на том же release SHA;
- иметь Prisma CLI;
- иметь доступ к `DIRECT_URL`;
- завершаться после migration;
- возвращать exit code `0` при success;
- возвращать non-zero при failure;
- НЕ быть постоянно работающим HTTP application;
- НЕ иметь public domain;
- НЕ иметь replicas.

Если обычный Coolify Application плохо подходит для one-shot job, изучи возможности текущей версии Coolify и выбери наиболее простой штатный механизм.

Не создавай Kubernetes/новую infrastructure.

# DATABASE_URL / DIRECT_URL

Целевая модель:

### `nbos-api`

```text id="hy728p"
DATABASE_URL
```

### `nbos-worker`

```text id="izpna9"
DATABASE_URL
```

### `nbos-scheduler`

```text id="2dwb33"
DATABASE_URL
```

### `nbos-web`

```text id="5z825d"
NO DATABASE CREDENTIALS
```

### `nbos-migrate`

```text id="772atz"
DIRECT_URL
```

Если Prisma для запуска migration технически также требует `DATABASE_URL`, настрой минимально необходимое окружение, но DDL/direct credential должен принадлежать только migrator.

Не копируй `DIRECT_URL` в API/Worker/Scheduler без необходимости.

Не помещай DB credentials в GitHub Secrets, если migration выполняется внутри Coolify/Hetzner.

GitHub Actions должен знать:

```text id="4nbzeb"
Coolify API/webhook credentials
```

но не production DB owner credentials.

# Auto Deploy

Сейчас Auto Deploy у production services включён.

Это создаёт race:

```text id="6wbxfk"
merge main
├── GitHub migration flow
└── Coolify сразу deploy API/Worker/Scheduler/Web
```

Поэтому после того как новый orchestration полностью готов:

выключи automatic push-based deployment для:

- `nbos-api`
- `nbos-worker`
- `nbos-scheduler`
- `nbos-web`

Они должны деплоиться ТОЛЬКО после successful `nbos-migrate`.

Не оставляй систему в промежуточном состоянии, где:

```text id="9d27ob"
Auto Deploy ON
+
GitHub orchestrated deploy
```

работают одновременно.

Если `nbos-migrate` не должен автоматически реагировать на обычный Git push, также отключи direct Auto Deploy для него.

Его должен запускать release workflow.

# GitHub Actions CD

Проверь существующий:

```text id="cmgly1"
.github/workflows/ci.yml
```

Не ломай CI.

Создай минимальный production CD workflow, например:

```text id="k1nmtd"
.github/workflows/cd.yml
```

или интегрируй в существующую architecture, если это лучше.

Целевой flow:

```text id="y1u3jg"
main SHA
↓
CI success
↓
start nbos-migrate in Coolify
↓
WAIT for actual completion
↓
check result
↓
if migration failed:
    workflow FAILED
    STOP
↓
if migration succeeded:
    deploy API
    deploy Worker
    deploy Scheduler
    deploy Web
↓
wait / healthchecks
```

Критически важно:

не делай:

```text id="5k2ce9"
trigger migrate webhook
↓
immediately trigger API
```

GitHub Actions должен дождаться реального завершения migration.

Если Coolify deployment webhook является fire-and-forget, используй Coolify API/status endpoint для polling результата.

Добавь разумный timeout.

# Same SHA

Migration и приложения должны использовать один и тот же release commit.

Не должно быть ситуации:

```text id="c4e82f"
migration = commit A
API = commit B
```

Проверь, как Coolify выбирает commit/ref при API-triggered deployment, и обеспечь максимально возможную фиксацию одного release SHA.

Если Coolify API текущей версии не позволяет это гарантировать напрямую, явно укажи ограничение и реализуй наиболее безопасный доступный вариант.

# Concurrency

Одновременно должен выполняться максимум один production release.

Добавь GitHub Actions production concurrency.

Например концептуально:

```yaml id="qy563f"
concurrency:
  group: nbos-production
  cancel-in-progress: false
```

Не позволяй второму merge начать migration параллельно с уже выполняющимся production release.

# Failure behavior

Если:

```bash id="u4yyqv"
prisma migrate deploy
```

падает:

```text id="7ufn2x"
nbos-migrate = FAILED
↓
API deploy = NOT STARTED
Worker deploy = NOT STARTED
Scheduler deploy = NOT STARTED
Web deploy = NOT STARTED
```

Не использовать:

```bash id="wrpykx"
|| true
```

Не скрывать ошибки.

# Application deploy failure

Если migration прошла, но один application deployment упал:

- не пытайся автоматически откатывать DB migration;
- явно пометь release как failed/partial;
- покажи какой service failed;
- сохрани logs/status;
- не запускай destructive DB rollback автоматически.

# Backward-compatible migrations

Так как порядок:

```text id="om24no"
migration
↓
deploy
```

некоторое время означает:

```text id="gij396"
OLD CODE + NEW SCHEMA
```

production migrations должны быть backward compatible.

Правила:

### Можно

- ADD TABLE
- ADD nullable column
- ADD column with safe default
- ADD non-breaking index

### Нельзя одним release

- DROP COLUMN
- DROP TABLE
- destructive rename
- incompatible type change
- NOT NULL без предварительного backfill
- удаление enum value, которое может использовать старый код

Для destructive changes использовать:

```text id="c67qba"
EXPAND
↓
DEPLOY
↓
BACKFILL
↓
CONTRACT в следующем release
```

Не переписывай старые уже применённые migration files.

# Neon → Hetzner PostgreSQL

Решение должно остаться тем же после переноса PostgreSQL:

```text id="soi9mm"
Neon
↓
Hetzner PostgreSQL
```

Должны измениться только infrastructure details:

- DATABASE_URL
- DIRECT_URL
- network/firewall
- backup/PITR
- DB roles

Но release flow остаётся:

```text id="pvoyqp"
GitHub
↓
Coolify migrator
↓
Coolify applications
```

Именно поэтому migration должна выполняться внутри Hetzner/Coolify, а не GitHub-hosted runner.

# Документация

Очень важно.

После реализации найди ВСЕ документы проекта, где описаны:

- production deployment;
- Coolify deployment;
- Auto Deploy;
- CI/CD;
- Prisma migrations;
- production DB migrations;
- Neon deployment;
- Hetzner deployment;
- release process;
- Docker/Nixpacks;
- database security;
- migration ownership;
- security.todo;
- technical decisions;
- runbooks.

Не создавай ещё один документ, если уже существует канонический документ по этой теме.

Обнови существующие документы так, чтобы они описывали НОВУЮ фактическую модель:

```text id="njnlm3"
merge main
↓
CI
↓
Coolify nbos-migrate
↓
prisma migrate deploy
↓
SUCCESS
↓
Coolify deploy 4 services
```

Удаляй/исправляй устаревшие утверждения вроде:

- manual prod migrations;
- migrations from developer laptop;
- migration inside API startup;
- прямой Coolify Auto Deploy на production apps;
- Vercel/Render, если это больше не актуально;
- старый deployment flow.

Если несколько документов противоречат друг другу:

1. определи канонический;
2. обнови канонический;
3. остальные либо синхронизируй, либо явно сделай ссылку на canonical source.

Не оставляй документацию описывающей старую архитектуру после изменения кода/infrastructure.

# Проверка перед изменениями

Перед реализацией кратко зафиксируй фактическое состояние:

- Coolify project/environment;
- 4 существующих applications;
- их production branch;
- Auto Deploy status;
- deployment configuration;
- Prisma scripts;
- Dockerfiles;
- GitHub Actions;
- DB env ownership;
- доступность Coolify API.

После этого переходи к реализации.

Мне не нужно отдельное подтверждение, если изменения безопасны и соответствуют этому заданию.

# Проверка после реализации

Обязательно проверь:

1. CI продолжает работать.
2. `prisma migrate deploy` может выполняться из migrator image/environment.
3. `nbos-migrate` существует.
4. migrator использует production `main`.
5. migration запускается один раз.
6. Auto Deploy у 4 applications выключен.
7. merge в main больше не может напрямую задеплоить API раньше migration.
8. CD ждёт migration result.
9. migration failure блокирует deployment.
10. success запускает 4 deployments.
11. Web не получил DB credentials.
12. GitHub не получил `DIRECT_URL`.
13. API/Worker/Scheduler не запускают migration на startup.
14. concurrency защищает от двух releases.
15. документация обновлена.
16. existing production domains/services не сломаны.

Если есть безопасный способ протестировать orchestration без изменения production data, сделай dry-run/validation.

Не создавай фиктивную Prisma migration только ради теста.

# Финальный отчёт

После выполнения дай мне конкретный результат.

## 1. What was changed

Перечисли изменения в:

- GitHub Actions
- repository
- Docker
- Coolify
- environment ownership
- documentation

## 2. Coolify state

Покажи:

```text id="rk82xm"
nbos-migrate         → configured
nbos-api AutoDeploy  → OFF
nbos-worker          → OFF
nbos-scheduler       → OFF
nbos-web             → OFF
```

Не показывай secret values.

## 3. Final release flow

Нарисуй:

```text id="oixb6k"
development
↓
PR → main
↓
CI
↓
nbos-migrate
↓
SUCCESS
↓
API + Worker + Scheduler + Web
↓
healthcheck
```

## 4. No-migration release

Подтверди, что обычный release без DB changes работает так:

```text id="8rsyjl"
prisma migrate deploy
→ no pending migrations
→ success
→ normal deploy
```

## 5. Migration release

Подтверди:

```text id="mgdpq9"
pending migration
→ apply
→ success
→ deploy
```

## 6. Failed migration

Подтверди:

```text id="04zg31"
migration failed
→ production apps NOT deployed
```

## 7. Changed files

Дай точный список файлов.

## 8. External changes

Перечисли точные изменения, сделанные через Coolify API.

## 9. Documentation

Перечисли обновлённые документы и кратко что было исправлено.

## 10. Remaining issues

Если что-то невозможно было сделать автоматически из-за ограничений Coolify API/permissions, укажи только реально оставшиеся ручные действия.

Не оставляй мне ручные действия, которые можно было выполнить безопасно автоматически через имеющийся Coolify API.

# Главная цель

После этой работы production release NBOS должен быть полностью предсказуемым:

```text id="5dwmug"
MERGE MAIN

→ CI
→ ONE MIGRATION ATTEMPT
→ MIGRATION SUCCESS
→ DEPLOY
```

Никаких race conditions между migration и Auto Deploy.

Никаких migrations из API/Worker/Scheduler.

Никаких migrations с developer laptop.

Никакого прямого deploy production services раньше migration.

Простая production-grade архитектура без лишней инфраструктуры.
