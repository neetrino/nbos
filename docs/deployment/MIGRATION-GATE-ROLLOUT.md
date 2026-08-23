# NBOS Production Migration Gate — rollout

Статус: **DONE (2026-08-23) — CI → nbos-migrate → 4 Coolify apps; Auto Deploy OFF**  
Канон: один release → один `nbos-migrate` → потом 4 сервиса.  
Старый промпт `Implement NBOS Production Migration Gate + Coolify Orchestration.md` **не выполнять**.

## Как пользоваться

1. Одна фаза = один новый Agent-чат.
2. Скопируй блок **«Промпт нового чата»** нужной фазы целиком.
3. После фазы агент отмечает чекбоксы в этом файле и **останавливается**.
4. Следующую фазу начинаешь **новым чатом**, не продолжением старого.
5. Субагентов на Coolify / GitHub secrets / Auto Deploy не запускать.
6. Секреты и connection strings в чат и в этот файл не писать.

## Жёсткие запреты до Phase 4

- Не выключать Coolify Auto Deploy у `nbos-api` / `nbos-worker` / `nbos-scheduler` / `nbos-web`.
- Не включать CD на каждый push/merge в `main`.
- Не класть `DIRECT_URL` / `DATABASE_URL` в GitHub Secrets.
- Не добавлять `prisma migrate` в startup API / worker / scheduler.
- Не делать `prisma migrate dev` / `db push` / `migrate reset` на production.

## Целевой flow (после Phase 5)

```text
PR → main
  → GitHub Actions CI
  → CD (только после зелёного CI)
  → Coolify nbos-migrate  (rebuild этого SHA, prisma migrate deploy)
  → ждать success
  → Coolify: api + worker + scheduler + web
  → health / Coolify deployment status
```

Пока Phase 5 не закрыта: Auto Deploy у 4 app **OFF**; штатный релиз после влива Phase 5 = CI на `main` → CD. Coolify `finished` ≠ Prisma. Success = лог `NBOS_MIGRATE_DONE exit=0`, потом Stop.

---

## Phase 0 — инвентарь, без изменений

Цель: понять живой Coolify и репо. Ничего не менять.

### Чеклист

- [x] Найдены 4 production app: web / api / worker / scheduler
- [x] Записаны UUID/имена **без секретов** (в чате можно, в Git — только имена)
- [x] Известна production branch (`main`?)
- [x] Зафиксирован Auto Deploy: ON/OFF по каждому app
- [x] Понятно, чем собираются (Dockerfile.api / Dockerfile.web / Nixpacks)
- [x] Есть ли уже `DIRECT_URL` в Coolify (да/нет, **не значение**)
- [x] Есть ли Coolify API token в среде агента (да/нет, **не значение**)
- [x] Подтверждено: в API image нет отдельного migrator target
- [x] Подтверждено: CI есть, CD нет

### Инвентарь (2026-08-23, без секретов)

Имена в Git. UUID — только в чате Phase 0.

| App              | Branch | Auto Deploy | Build                         |
| ---------------- | ------ | ----------- | ----------------------------- |
| `nbos-web`       | `main` | **ON**      | Dockerfile, `/Dockerfile.web` |
| `nbos-api`       | `main` | **ON**      | Dockerfile, `/Dockerfile.api` |
| `nbos-worker`    | `main` | **ON**      | Dockerfile, `/Dockerfile.api` |
| `nbos-scheduler` | `main` | **ON**      | Dockerfile, `/Dockerfile.api` |

- `nbos-migrate` **нет**.
- Coolify `dockerfile_target_build` у API-образа: пусто (нет migrator target).
- `DIRECT_URL` в Coolify: **неизвестно** (live env не сняты).
- Coolify API token в среде этого агента: **нет**.
- GitHub Actions: есть `.github/workflows/ci.yml` (PR + `push` `main`). CD workflow **нет**. GitHub Actions secrets: пусто.
- Три активных GitHub `push` webhook → Coolify manual webhook (web/api + worker + scheduler). Auto Deploy не выключали.
- Не-prod: preview `kovkasyanplennica:*` собирается Nixpacks; к production gate не относится.

### Стоп

Нельзя Phase 1, пока инвентарь не записан. Coolify не менять.

### Промпт нового чата — Phase 0

```text
Читай docs/deployment/MIGRATION-GATE-ROLLOUT.md целиком.

Сейчас только Phase 0.
Ничего не меняй: ни репо, ни Coolify, ни GitHub secrets, ни Auto Deploy.

Собери фактический инвентарь production deployment (имена сервисов, branch, Auto Deploy ON/OFF, Dockerfile vs Nixpacks, есть ли DIRECT_URL в Coolify как факт да/нет, есть ли Coolify API доступ как факт да/нет).
Секреты и URL баз не печатай и не читай .env / .env.local.

В конце:
1) заполни чеклист Phase 0 в этом файле;
2) коротко напиши что нашёл;
3) остановись. Phase 1 не начинай.
```

---

## Phase 1 — только репозиторий

Цель: команда и образ migrator. Прод не трогать.

### Делать

- Root script `db:migrate:deploy` → `pnpm --filter @nbos/database migrate:deploy`
- Docker target `migrator` (Prisma CLI + migration files + one-shot `migrate deploy` + exit код)
- Не менять CMD api / worker / scheduler
- Не добавлять `.github/workflows/cd.yml` на `push: main`

### Чеклист

- [x] Есть `db:migrate:deploy`
- [x] Есть Docker target/file для migrator с Prisma CLI
- [x] Runtime API image по-прежнему без migrate на старте
- [x] Web без DB credentials в Dockerfile
- [x] Локально/CI: migrator image собирается (или эквивалентная проверка)
- [x] Auto Deploy не тронут

Локальная проверка (2026-08-23): `docker build --target migrator` успешен. CMD migrator = `pnpm --filter @nbos/database migrate:deploy`. Без `DIRECT_URL` и с unreachable dummy URL — exit 1. Last stage `Dockerfile.api` = `runner` (PROCESS_ROLE only). CD не добавлялся. Coolify / Auto Deploy не менялись.

### Стоп

Нельзя Phase 2, пока target migrator не существует в Git.

### Промпт нового чата — Phase 1

```text
Читай docs/deployment/MIGRATION-GATE-ROLLOUT.md целиком.

Сейчас только Phase 1.
Меняй только репозиторий. Coolify, Auto Deploy, GitHub production secrets, CD на main — не трогать.

Сделай:
- root script db:migrate:deploy;
- отдельный Docker migrator target с Prisma CLI;
- команда one-shot prisma migrate deploy и корректный exit code;
- не добавляй migrate в startup API/worker/scheduler.

Проверь, что обычный API image не начинает гонять миграции.
Секреты не печатай.

В конце обнови чеклист Phase 1 в этом файле, переключи статус сверху на Phase 1 done, остановись.
```

---

## Phase 2 — Coolify `nbos-migrate`

Цель: one-shot сервис. Четыре прод-приложения не менять. Auto Deploy у них оставить как есть.

### Делать

- Создать `nbos-migrate`: тот же repo, `main`, без public domain, без replicas, Auto Deploy OFF
- `DIRECT_URL` только на migrator (если секрета нет — остановиться и попросить человека вставить в Coolify)
- Каждый запуск = **новый deploy/build этого SHA**, не restart старого контейнера
- Проверить, что Coolify не рестартит контейнер по кругу после exit 0
- Один безопасный прогон: сначала `migrate status`; `migrate deploy` на prod только если status чистый/понятный и человек подтвердил

### Не делать

- Выключать Auto Deploy у 4 app
- Создавать CD workflow на автозапуск

### Чеклист

- [x] `nbos-migrate` существует
- [x] Нет public domain
- [x] Auto Deploy migrator = OFF
- [ ] `DIRECT_URL` только там (факт, не значение) — ключ есть на migrator **и** на `nbos-api`; с api в этом чате не снимали
- [x] 4 app не изменены в этом срезе (domains/`main` те же; Auto Deploy уже был OFF раньше Phase 4)
- [x] One-shot: Prisma не крутится по кругу; success/fail = `NBOS_MIGRATE_DONE`, не Coolify `finished`
- [x] Сделан `migrate status` на prod (без вывода секретов)
- [x] Если был pending — решение человека записано (deploy / не deploy)

**Phase 2 progress (2026-08-23, вечер):**

- `DIRECT_URL` на `nbos-migrate` есть (ключ верный). Тот же ключ всё ещё на `nbos-api` — не снимал (4 app не трогаем env).
- По явной просьбе: Auto Deploy **OFF** у `nbos-api` / `nbos-web` / `nbos-worker` / `nbos-scheduler`. Domains и ветка `main` у них не менялись. GitHub webhooks = 3, не удалял.
- Один rebuild `nbos-migrate` SHA `bf54ab4` (`development`), `force`, `PRISMA_MIGRATE_MODE=status`. Coolify deployment = `finished` в момент **start контейнера**, не по exit Prisma. После exit контейнер ушёл в restart loop (`restart_count=7`); остановлен. Runtime-логи `migrate status` Coolify API не отдал (app already not running).
- `prisma migrate deploy` на prod: сначала не запускался; вечером после reconcile — **применён** (см. ниже).
- PR #209 `development` → `main` **влит** человеком (2026-08-23 11:32 UTC, SHA `da27ead`). Четыре app **не** пересобрались: всё ещё `running:healthy` на старом SHA `03b93f1` (19 авг). GitHub webhooks = 3, деплой не пошёл (Auto Deploy OFF).
- `nbos-migrate` переведён на ветку **`main`**. Второй прогон `PRISMA_MIGRATE_MODE=status`, SHA `da27ead`. Coolify deployment `finished` при start; runtime-логи `migrate status` сняты; контейнер остановлен (`exited:unhealthy`, restart_count=0). `migrate deploy` не запускался.
- Prod DB **не чистая**: last common `20260820233000_auth_session_client_kind`; 17 pending в Git; 3 имени в `_prisma_migrations` нет в репо (`20260331180000_add_product_category_cascade`, `20260331180000_restore_products_extensions`, `20260430132500_mail_p0_provider_attachments` — старые имена, в Git переименованы). `migrate deploy` без resolve истории, скорее всего, упадёт. Решение человека не записано.
- Человек подтвердил reconcile+deploy. Coolify `start_command` у Dockerfile app не работает. В `sipan` добавлен `PRISMA_MIGRATE_MODE=reconcile` (`c7183dee`). Три orphan-строки удалены из `_prisma_migrations`. Затем `migrate deploy` применил 17 pending. Повторный `status`: **Database schema is up to date.** `nbos-migrate` снова на `main`, mode `status`, B64 удалён.
- Ручной Deploy `da27ead`: `nbos-api` / `nbos-web` / `nbos-scheduler` — rolling update **healthy**. `nbos-worker` сначала откатился (нет `CallRealtimeEventBus` в worker graph). Фикс влит в `main` (#211, SHA `698c6ba9`); повторный Deploy worker — **new container healthy**.
- One-shot (вечер, SHA `54338cbe` на `sipan`, `PRISMA_MIGRATE_MODE=status`, **без** `migrate deploy`): Coolify Dockerfile app **игнорирует** `--restart=no` (hardcode `unless-stopped`). Entrypoint после Prisma **держит процесс** (`NBOS_MIGRATE_HOLD=1`). Логи: `NBOS_MIGRATE_START mode=status` → schema up to date → `NBOS_MIGRATE_DONE exit=0`. Контейнер `running:unknown`, `restart_count=0`, START/DONE по одному разу (~1 мин). Stop через Coolify API (очередь, ~40 с) → `exited:unhealthy`. Ветка Coolify вернула на `main` (hold-скрипт на `main` появится после merge). `NBOS_MIGRATE_HOLD=0` — только локальный/CI выход с кодом Prisma.

**Как читать success (для Phase 3):** не ждать Coolify `finished` как конец migrate. `finished` = контейнер стартанул. Poll runtime logs на `NBOS_MIGRATE_DONE exit=N`. `exit=0` → success; иначе fail и 4 app не деплоить. Затем Stop. Не включать healthcheck: unhealthy на hold-контейнере снова даст restart.

### Стоп

Phase 2 закрыта по one-shot. Phase 3 можно начинать **новым чатом**. Не снимать `DIRECT_URL` с `nbos-api` в Phase 3. Не включать Auto Deploy. Hold-entrypoint должен попасть в `main` до первого CD-прогона.

### Промпт нового чата — Phase 2

```text
Читай docs/deployment/MIGRATION-GATE-ROLLOUT.md целиком.

Сейчас только Phase 2.
Создай/настрой Coolify resource nbos-migrate по файлу.
Не трогай Auto Deploy у nbos-api, nbos-worker, nbos-scheduler, nbos-web.
Не меняй domains и не удаляй сервисы.
Не клади DIRECT_URL в GitHub.
Не печатай секреты. Не читай .env / .env.local.

Если DIRECT_URL в Coolify нет — остановись и попроси человека вставить его в nbos-migrate.

Каждый запуск migrator должен быть новым deploy/build SHA, не docker restart.
Проверь, что Coolify не крутит restart loop на exit 0.

Сначала prisma migrate status. prisma migrate deploy на production не делай без явной фразы пользователя в этом чате.

В конце обнови чеклист Phase 2, остановись.
```

---

## Phase 3 — CD только вручную (`workflow_dispatch`)

Цель: оркестрация без автодеплоя с `main`.

### Делать

- `.github/workflows/cd.yml`: только `workflow_dispatch`
- Секреты GitHub: Coolify URL / token / UUID сервисов. Не DB URL
- Порядок: дождаться `NBOS_MIGRATE_DONE exit=0` в runtime-логах (не Coolify `finished`), потом Stop migrator, потом 4 deploy
- Не trigger сразу 4 webhook после старта migrate
- Worker/scheduler health: Coolify deployment status, не публичный HTTP из GitHub
- `concurrency: nbos-production`, `cancel-in-progress: false`
- По возможности передать exact SHA в Coolify API; если нельзя — явно написать ограничение в этом файле
- Один ручной прогон на текущем SHA

### Чеклист

- [x] CD есть и не срабатывает на push
- [x] CI не сломан
- [x] Poll migrate до конца, timeout задан
- [x] Fail migrate → 4 app не деплоятся
- [x] Ручной dispatch прогнан
- [x] SHA limitation записана, если API не пинит commit
- [x] Auto Deploy 4 app всё ещё OFF (уже выключен раньше Phase 4; не включать)

### GitHub Secrets (имена, не значения)

Repo `neetrino/nbos` → Settings → Secrets and variables → Actions. **Не** класть `DIRECT_URL` / `DATABASE_URL`.

| Secret                   | Что положить                     |
| ------------------------ | -------------------------------- |
| `COOLIFY_API_URL`        | Coolify API v1 base (`…/api/v1`) |
| `COOLIFY_TOKEN`          | Coolify API token                |
| `COOLIFY_UUID_MIGRATE`   | UUID `nbos-migrate`              |
| `COOLIFY_UUID_API`       | UUID `nbos-api`                  |
| `COOLIFY_UUID_WORKER`    | UUID `nbos-worker`               |
| `COOLIFY_UUID_SCHEDULER` | UUID `nbos-scheduler`            |
| `COOLIFY_UUID_WEB`       | UUID `nbos-web`                  |

На 2026-08-23 `gh secret list` пуст. Пока секретов нет — `workflow_dispatch` не запускать.

### SHA pin limitation

Coolify `GET/POST /applications/{uuid}/start` и `GET /deploy` **не принимают commit**. `PATCH /applications/{uuid}` принимает `git_commit_sha`, но этот инстанс **не обновляет** `application.git_commit_sha` (поле остаётся пустым/HEAD). Живой SHA — `GET /deployments/{uuid}` → `commit`.

CD: best-effort PATCH, затем force rebuild ветки приложения (`main`); после Coolify `finished` сверяет `deployment.commit` с `github.sha` (prefix). Mismatch → fail, 4 app не деплоятся. Dispatch только с `main` на том SHA, который Coolify клонирует как HEAD `main`.

### Phase 3 progress (2026-08-23)

- Добавлены `.github/workflows/cd.yml` (`workflow_dispatch` only, `concurrency: nbos-production`, `cancel-in-progress: false`) и `scripts/coolify-production-cd.py`.
- Порядок: force rebuild `nbos-migrate` → poll `NBOS_MIGRATE_DONE exit=N` (timeout) → Stop → при `exit=0` deploy api, worker, scheduler, web и ждать Coolify deployment status. `exit!=0` / timeout / SHA mismatch → 4 app не трогать.
- Sentinel снимается **до** Stop (после Stop runtime-логи пропадают). Coolify `finished` = старт контейнера, не Prisma.
- `ci.yml` не менялся. Auto Deploy не включался. Четвёртый GitHub webhook не добавлялся. `PRISMA_MIGRATE_MODE` не переключался (на Coolify остаётся `status`). `DIRECT_URL` с `nbos-api` не снимался.
- Ручной dispatch **прогнан** (2026-08-23): [CD run](https://github.com/neetrino/nbos/actions/runs/32645992730) на `main` `b60a51f0`. `NBOS_MIGRATE_DONE exit=0` → Stop → api / worker / scheduler / web `running:healthy` на том же SHA. Hold (#212 / #213) и CD (#214 / #215) в `main`. GitHub Secrets заполнены (URL / token / UUID, не DB URL). `PATCH git_commit_sha` на этом прогоне **persisted=True**; сверка всё равно идёт по `deployment.commit`.

### Стоп

Нельзя Phase 4, пока ручной CD не прошёл на живом Coolify.

### Промпт нового чата — Phase 3

```text
Читай docs/deployment/MIGRATION-GATE-ROLLOUT.md целиком.

Сейчас только Phase 3.
Добавь GitHub Actions CD только на workflow_dispatch.
Не вешай CD на push/merge main.
Не включай Auto Deploy у 4 production apps (уже OFF).
Hold-entrypoint (`NBOS_MIGRATE_DONE`) должен быть на ветке, с которой Coolify собирает nbos-migrate (после merge в main).
Не клади DIRECT_URL / DATABASE_URL в GitHub Secrets.
Не ломай .github/workflows/ci.yml.

CD должен:
1) задеплоить/собрать nbos-migrate на нужном SHA;
2) poll runtime logs до `NBOS_MIGRATE_DONE exit=N` (Coolify finished = старт контейнера, не Prisma);
3) при exit!=0 или timeout — стоп, 4 app не деплоить;
4) при exit=0 — Stop migrator, затем deploy api, worker, scheduler, web;
5) ждать Coolify status, а не публичный health worker/scheduler.

После кода нужен один ручной прогон, если секреты Coolify в GitHub уже есть.
Если секретов нет — опиши какие имена secrets нужны и остановись, не выдумывай токены.

Обнови чеклист Phase 3, остановись.
```

---

## Phase 4 — выключить Auto Deploy

Цель: убрать гонку. Делать только после зелёной Phase 3.

### Делать

- Auto Deploy OFF: api, worker, scheduler, web
- `nbos-migrate` Auto Deploy тоже OFF
- В `docs/deploy.md` break-glass: ручной Deploy в Coolify, если GitHub лежит
- Повторить `workflow_dispatch` CD ещё раз — прод всё ещё обновляется

### Чеклист

- [x] Auto Deploy 4 app = OFF
- [x] migrator Auto Deploy = OFF
- [x] Ручной CD после выключения прошёл
- [x] Break-glass записан в канонический deploy doc

### Phase 4 progress (2026-08-23)

- `PATCH /applications/{uuid}` `{ "is_auto_deploy_enabled": false }` на `nbos-api` / `nbos-web` / `nbos-worker` / `nbos-scheduler` / `nbos-migrate`: HTTP 200. Ветка `main` и domains не менялись. GET по-прежнему **не отдаёт** `is_auto_deploy_enabled` (как env values) — факт OFF = PATCH + отсутствие автодеплоя с webhook.
- Четвёртый GitHub webhook не добавлялся. Авто-CD на `push`/`merge` `main` не включался.
- Break-glass: `docs/deploy.md` §5.1.
- Повторный `workflow_dispatch` CD **зелёный**: [run](https://github.com/neetrino/nbos/actions/runs/32647347099) SHA `b60a51f0`. `NBOS_MIGRATE_DONE exit=0` → api / worker / scheduler / web `running:healthy`. Auto Deploy остаётся OFF; авто-CD на `main` не включался.

### Стоп

Нельзя Phase 5, пока hotfix через `workflow_dispatch` доказан.

### Промпт нового чата — Phase 4

```text
Читай docs/deployment/MIGRATION-GATE-ROLLOUT.md целиком.

Сейчас только Phase 4.
Phase 3 должна быть закрыта в этом файле. Если нет — остановись.

Выключи Coolify Auto Deploy только у production:
nbos-api, nbos-worker, nbos-scheduler, nbos-web, nbos-migrate.

Не удаляй сервисы, не меняй domains, не меняй DB secrets.
Не включай авто-CD на main в этом чате.

Добавь/обнови break-glass в docs/deploy.md: как задеплоить вручную из Coolify, если GitHub недоступен.

После выключения Auto Deploy повтори workflow_dispatch CD и подтверди, что сервисы всё ещё деплоятся.

Секреты не печатай. Обнови чеклист Phase 4, остановись.
```

---

## Phase 5 — авто-CD после зелёного CI

Цель: merge в `main` сам идёт в гейт, без гонки.

### Делать

- CD после успешного CI (`workflow_run` + `conclusion == success` на `main`)
- `workflow_dispatch` оставить как break-glass
- Не включать Coolify Auto Deploy обратно
- Проверить release без новой миграции: `migrate deploy` → no pending → deploy

### Чеклист

- [x] Авто-CD только после зелёного CI
- [x] Два merge не стартуют migrate параллельно
- [x] Auto Deploy 4 app остаётся OFF
- [x] Проверен no-migration release

### Phase 5 progress (2026-08-23)

- `.github/workflows/cd.yml`: `workflow_run` на workflow `CI` `completed`, job только если `conclusion == success` и `event == push` и `head_branch == main`. PR CI не деплоит. `workflow_dispatch` оставлен. `RELEASE_SHA` = `workflow_run.head_sha`. Workspace CD не checkout'ит этот SHA (CodeQL `untrusted-checkout`, #220).
- `concurrency: nbos-production`, `cancel-in-progress: false` — второй merge в очередь, migrate не параллельно.
- Coolify Auto Deploy не включался.
- No-migration proof: [auto CD](https://github.com/neetrino/nbos/actions/runs/32652466735) `workflow_run` SHA `c2df8f09`. `NBOS_MIGRATE_DONE exit=0` → Stop migrator → api / worker / scheduler / web `running:healthy` / Coolify `finished` на том же SHA. Первый авто-CD на `11d72401` упал гонкой с merge #220 (`nbos-api` failed); повтор после зелёного CI #220 — успех.

### Стоп

Нельзя Phase 6, пока авто-путь не доказан (или явно записан блокер).

### Промпт нового чата — Phase 5

```text
Читай docs/deployment/MIGRATION-GATE-ROLLOUT.md целиком.

Сейчас только Phase 5.
Phase 4 должна быть закрыта. Если нет — остановись.

Включи автоматический CD только после успешного CI на main.
Coolify Auto Deploy не включай.
workflow_dispatch оставь для ручного hotfix.

Не клади DB secrets в GitHub.
Не печатай секреты.

Подтверди no-migration path: migrate deploy без pending → success → deploy 4 apps.

Обнови чеклист Phase 5, остановись.
```

---

## Phase 6 — документы

Цель: канон совпадает с фактом. Архив не переписывать.

### Делать

Обновить живые:

- `docs/deploy.md`
- `docs/deployment/AUTOMATED-PRODUCTION-DATABASE-MIGRATIONS-STANDARD.md` (проектный факт, не раздувать)
- `docs/deployment/neon-connections.md` (`DIRECT_URL` только migrator)
- `docs/security.todo.md` пункты single migration job
- `docs/TECH_CARD.md` §8 если ещё Vercel/Render

Не рерайтить Progress Archive и AI handoff.

### Чеклист

- [x] Канон описывает CI → nbos-migrate → 4 deploy
- [x] Нет «миграции с ноутбука» как нормального пути
- [x] Нет «Auto Deploy с main сразу на 4 app»
- [x] security.todo 4.5 / 13.3 обновлены по факту

### Phase 6 progress (2026-08-23)

Живые docs обновлены под факт. Progress Archive / AI handoff не трогались. Coolify Auto Deploy не включался.

### Промпт нового чата — Phase 6

```text
Читай docs/deployment/MIGRATION-GATE-ROLLOUT.md целиком.

Сейчас только Phase 6.
Обнови канонические docs под фактический flow.
Не создавай новый длинный документ, если уже есть docs/deploy.md.
Не переписывай docs/Progress Archive и AI handoff-файлы.
Не меняй Coolify и не выключай/включай Auto Deploy.

Канон: merge main → CI → nbos-migrate → prisma migrate deploy → 4 Coolify apps.
Секреты не печатай.

Обнови чеклист Phase 6 и статус файла на DONE. Остановись.
```

---

## После любой фазы: если чат раздулся

Не продолжай следующей фазой в том же треде. Новый чат + промпт следующей незакрытой фазы.
