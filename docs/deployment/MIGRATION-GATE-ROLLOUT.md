# NBOS Production Migration Gate — rollout

Статус: **Phase 0 не начата**  
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

Пока Phase 5 не закрыта, прод как сейчас: Auto Deploy ON, ручной контроль.

---

## Phase 0 — инвентарь, без изменений

Цель: понять живой Coolify и репо. Ничего не менять.

### Чеклист

- [ ] Найдены 4 production app: web / api / worker / scheduler
- [ ] Записаны UUID/имена **без секретов** (в чате можно, в Git — только имена)
- [ ] Известна production branch (`main`?)
- [ ] Зафиксирован Auto Deploy: ON/OFF по каждому app
- [ ] Понятно, чем собираются (Dockerfile.api / Dockerfile.web / Nixpacks)
- [ ] Есть ли уже `DIRECT_URL` в Coolify (да/нет, **не значение**)
- [ ] Есть ли Coolify API token в среде агента (да/нет, **не значение**)
- [ ] Подтверждено: в API image нет отдельного migrator target
- [ ] Подтверждено: CI есть, CD нет

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

- [ ] Есть `db:migrate:deploy`
- [ ] Есть Docker target/file для migrator с Prisma CLI
- [ ] Runtime API image по-прежнему без migrate на старте
- [ ] Web без DB credentials в Dockerfile
- [ ] Локально/CI: migrator image собирается (или эквивалентная проверка)
- [ ] Auto Deploy не тронут

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

- [ ] `nbos-migrate` существует
- [ ] Нет public domain
- [ ] Auto Deploy migrator = OFF
- [ ] `DIRECT_URL` только там (факт, не значение)
- [ ] 4 app не изменены
- [ ] One-shot: exit 0 = success в Coolify, нет restart loop
- [ ] Сделан `migrate status` на prod (без вывода секретов)
- [ ] Если был pending — решение человека записано (deploy / не deploy)

### Стоп

Нельзя Phase 3, пока one-shot статус в Coolify понятен (success/fail не путается с «container exited»).

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
- Порядок: дождаться завершения `nbos-migrate` через Coolify API (poll + timeout), потом 4 deploy
- Не trigger сразу 4 webhook после старта migrate
- Worker/scheduler health: Coolify deployment status, не публичный HTTP из GitHub
- `concurrency: nbos-production`, `cancel-in-progress: false`
- По возможности передать exact SHA в Coolify API; если нельзя — явно написать ограничение в этом файле
- Один ручной прогон на текущем SHA

### Чеклист

- [ ] CD есть и не срабатывает на push
- [ ] CI не сломан
- [ ] Poll migrate до конца, timeout задан
- [ ] Fail migrate → 4 app не деплоятся
- [ ] Ручной dispatch прогнан
- [ ] SHA limitation записана, если API не пинит commit
- [ ] Auto Deploy 4 app всё ещё ON (так и должно быть)

### Стоп

Нельзя Phase 4, пока ручной CD не прошёл на живом Coolify.

### Промпт нового чата — Phase 3

```text
Читай docs/deployment/MIGRATION-GATE-ROLLOUT.md целиком.

Сейчас только Phase 3.
Добавь GitHub Actions CD только на workflow_dispatch.
Не вешай CD на push/merge main.
Не выключай Auto Deploy у 4 production apps.
Не клади DIRECT_URL / DATABASE_URL в GitHub Secrets.
Не ломай .github/workflows/ci.yml.

CD должен:
1) задеплоить/собрать nbos-migrate на нужном SHA;
2) poll Coolify до реального конца migrate;
3) при failure — стоп;
4) при success — deploy api, worker, scheduler, web;
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

- [ ] Auto Deploy 4 app = OFF
- [ ] migrator Auto Deploy = OFF
- [ ] Ручной CD после выключения прошёл
- [ ] Break-glass записан в канонический deploy doc

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

- [ ] Авто-CD только после зелёного CI
- [ ] Два merge не стартуют migrate параллельно
- [ ] Auto Deploy 4 app остаётся OFF
- [ ] Проверен no-migration release

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

- [ ] Канон описывает CI → nbos-migrate → 4 deploy
- [ ] Нет «миграции с ноутбука» как нормального пути
- [ ] Нет «Auto Deploy с main сразу на 4 app»
- [ ] security.todo 4.5 / 13.3 обновлены по факту

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
