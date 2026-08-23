# Стандарт автоматических production-миграций баз данных

Статус: базовое правило для проектов Neetrino  
Применимость: Vercel, Google Cloud Run, Hetzner/Coolify и другие deployment-платформы

## 1. Цель

Production-миграции должны запускаться автоматически как отдельный контролируемый шаг deployment, а не вручную с компьютера разработчика и не при старте каждого экземпляра приложения.

Это универсальный контракт, а не готовая конфигурация для слепого копирования. Реализация адаптируется к конкретному проекту, его ORM, структуре, hosting и сети.

## 2. Сначала изучить проект

Перед изменениями исполнитель обязан проверить:

- database, ORM/migration tool и их реальные версии;
- package manager, monorepo layout, schema и migration history;
- существующие scripts, Dockerfiles, Compose, CI/CD и deployment hooks;
- какие сервисы используют одну database;
- какие variables фактически читает runtime и migration CLI;
- доступна ли database из deployment environment или только из private network;
- разделение Development, Preview/Staging и Production;
- что уже реализовано и не должно дублироваться или ломаться.

Нельзя придумывать команды по названию framework. Сначала изучить код и manifests, затем показать точный план, риски и rollback.

Проект классифицируется как:

- **готов** — механизм уже соответствует стандарту, нужно только доказать тестами;
- **частично готов** — сохранить существующее и добавить недостающее;
- **не готов** — создать migration job;
- **небезопасен** — migrations выполняются из runtime/startup/build или вручную с production secret; сначала согласовать переход.

## 3. Обязательный контракт проекта

В проекте должна быть одна явная idempotent production-команда, например:

```text
db:migrate:deploy
```

Она обязана:

- применять только migration history из Git;
- работать без интерактивных вопросов;
- возвращать `0` при успехе и ненулевой код при ошибке;
- безопасно повторяться после успешного запуска;
- использовать lock migration-инструмента или эквивалентную защиту от параллельного запуска.

Для Prisma production-команда:

```text
prisma migrate deploy
```

В production запрещены автоматические `prisma migrate dev`, `prisma db push` и `prisma migrate reset`. Для другого ORM используется его штатная production migration-команда с тем же контрактом.

## 4. Connection variables и роли

Канонические имена:

```text
DATABASE_URL = runtime connection с минимальными правами
DIRECT_URL   = direct privileged connection только для migrations
```

`DIRECT_URL` — секретная строка подключения с credentials migration-роли.

Правила:

- API/worker/scheduler получают `DATABASE_URL`;
- только migration job получает `DIRECT_URL`;
- migration tool явно настраивается использовать `DIRECT_URL`;
- если tool понимает только `DATABASE_URL`, job подставляет туда значение `DIRECT_URL` только внутри migration-процесса;
- `DIRECT_URL` не попадает в runtime, browser bundle, image layers, logs или Git;
- Preview не получает Production credentials;
- для каждого environment используются отдельные database и credentials;
- приложение не подключается как owner/superuser.

Secret хранится там, где реально выполняется migration job, а не обязательно там, где работает приложение.

## 5. Local Development

Локально обе variables указывают только на local/dev database:

```text
DATABASE_URL = local/dev runtime database
DIRECT_URL   = local/dev direct database
```

Workflow разработчика:

1. изменить schema;
2. создать migration development-командой;
3. проверить её на чистой и существующей dev database;
4. закоммитить schema и полный migration history;
5. пройти tests/review;
6. deployment автоматически применит migration к нужному environment.

Production URLs не хранятся в Git. Ручной `prisma migrate deploy` с ноутбука **не** штатный путь.

**NBOS (факт):** merge `main` → GitHub Actions CI → CD (`workflow_run`, `workflow_dispatch` как hotfix) → Coolify `nbos-migrate` (`prisma migrate deploy`, sentinel `NBOS_MIGRATE_DONE`) → Stop migrator → `nbos-api` / `nbos-worker` / `nbos-scheduler` / `nbos-web`. Coolify Auto Deploy OFF. Один SHA — один migrate job. Break-glass без GitHub: Coolify UI, тот же порядок (`docs/deploy.md` §5.1).

## 6. Порядок deployment

```text
Checkout exact commit
  → build immutable artifact/image
  → run one migration job
      → failure: stop rollout, старая версия остаётся активной
      → success: deploy/promote application
  → health checks, smoke tests, monitoring
```

Migration выполняется из того же commit/image, который разворачивается. Если одну database используют API, worker и scheduler, назначается один migration owner/job. Autoscaled instances не запускают migrations самостоятельно.

## 7. Реализация по платформам

### Vercel

Использовать внешний CI/CD job:

1. собрать и проверить exact commit;
2. выполнить migration job;
3. дождаться успешного результата;
4. только затем deploy/promote production deployment.

Не запускать migrations в Serverless/Edge Function startup, request handler или как неконтролируемый side effect `next build`.

Если job выполняет GitHub Actions или другой CI, `DIRECT_URL` хранится в secrets этого CI и не передаётся Vercel runtime. Для private database нужен runner/job внутри разрешённой сети; нельзя открывать database интернету ради CI.

### Google Cloud Run

Использовать отдельный Cloud Run Job из того же image/commit:

1. build и push immutable image;
2. обновить migration Job на этот image digest;
3. выполнить Job с одним task и дождаться завершения;
4. при успехе развернуть новую Cloud Run Service revision;
5. при ошибке не переключать production traffic.

`DIRECT_URL` хранится в Google Secret Manager и выдаётся только service account migration Job. Runtime service получает только `DATABASE_URL`. Migration нельзя запускать в startup command autoscaled service.

### Hetzner + Coolify

Использовать отдельный one-shot migrator container/service из нового commit/image:

1. Coolify строит новую версию;
2. migrator получает `DIRECT_URL` и выполняет production-команду;
3. application services запускаются только после его успешного завершения;
4. ошибка блокирует новую версию.

В Docker Compose migrator завершается после выполнения и исключается из постоянных health checks.

Не полагаться вслепую только на Coolify pre/post-deployment command: сначала проверить поведение установленной версии. Pre-command может работать в старом контейнере и пропускаться при первом deployment, а ошибка post-command может не отменить успешный статус deployment.

`DIRECT_URL` хранится как Coolify secret и передаётся только migrator service.

## 8. Database provider не меняет стандарт

Одинаковый механизм работает с Neon, собственной PostgreSQL, Cloud SQL и другими совместимыми databases:

```text
Neon:
DATABASE_URL = pooled runtime endpoint
DIRECT_URL   = direct migration endpoint

Own PostgreSQL:
DATABASE_URL = PgBouncer/runtime endpoint
DIRECT_URL   = direct PostgreSQL endpoint
```

Меняются endpoints, credentials и network path. Migration history и production-команда проекта остаются теми же.

## 9. Безопасность изменений schema

До автоматизации необходимо проверить/baseline существующую production schema и убедиться, что она соответствует migration history. Migration тестируется на Staging или свежей копии Production.

Автоматический запуск не означает автоматическое одобрение любого SQL. Отдельного ручного approval и rollback-плана требуют:

- удаление table/column;
- изменение типа с риском потери данных;
- массовый rewrite/backfill;
- длительные locks;
- обязательное поле без безопасного default/backfill;
- изменение, несовместимое со старой версией приложения.

Для zero-downtime использовать expand/contract:

1. добавить совместимую schema;
2. развернуть код, понимающий старую и новую schema;
3. выполнить backfill;
4. переключить использование;
5. удалить старые объекты отдельным поздним deployment.

Rollback приложения не откатывает database schema автоматически. Для критичных migrations нужны актуальный backup, проверенный restore/PITR, monitoring и отдельный recovery plan.

## 10. Что хранить в репозитории

- schema и полный migration history;
- production migration command;
- container/job definition или CI workflow;
- `.env.example` только с пустыми именами variables;
- короткий project-specific runbook;
- tests migration workflow.

Production URLs, passwords, tokens и dumps в Git запрещены.

## 11. Definition of Done

Проект соответствует стандарту, когда:

- local development не использует Production database;
- migration запускается автоматически из exact release;
- существует один migration job на database/release;
- job использует `DIRECT_URL`, runtime — `DATABASE_URL`;
- failure блокирует rollout новой версии;
- migration history сохранена и проверена;
- secrets находятся в подходящем secret store;
- Preview/Staging/Production изолированы;
- dangerous migrations требуют ручного approval;
- протестированы успешная pending migration и намеренная ошибка;
- после deployment работают health checks и smoke tests;
- конкретная реализация проекта кратко документирована.

## 12. Официальные ориентиры

- Prisma: <https://www.prisma.io/docs/cli/migrate/deploy>
- Vercel deployments: <https://vercel.com/docs/deployments/overview>
- Vercel variables: <https://vercel.com/docs/environment-variables>
- Cloud Run Jobs: <https://docs.cloud.google.com/run/docs/execute/jobs>
- Cloud Run secrets: <https://docs.cloud.google.com/run/docs/configuring/jobs/secrets>
- Coolify deployment commands: <https://next.coolify.io/docs/applications/builds/dockerfile>
- Coolify Docker Compose: <https://coolify.io/docs/applications/build-packs/docker-compose>
