# Deployment And Release Process

> Как Product переходит в production, как фиксируются deploys и rollback

## Назначение

Deployment process нужен, чтобы каждый Product можно было безопасно выпустить, проверить, передать клиенту и поддерживать после запуска.

Technical module не заменяет Delivery Board, но усиливает stage gates перед `Transfer` и `Done`.

## Когда Создаётся Technical Profile

Technical Profile должен появляться:

- при создании Product, если известно, что продукт будет иметь technical delivery;
- при переходе Product в Starting/Development, если профиль ещё не создан;
- обязательно до перехода Product в `Transfer`.

Для не-технических продуктов, например Logo или Branding, Technical Profile может быть `Not Required`.

## Release Readiness / Готовность К Релизу

Перед Transfer у Product должен быть пройден technical checklist.

### Обязательные Проверки

| Проверка                            | Что значит                                                    |
| ----------------------------------- | ------------------------------------------------------------- |
| `Production environment configured` | production окружение создано и доступно                       |
| `DNS configured`                    | DNS записи настроены                                          |
| `SSL active`                        | SSL сертификат работает                                       |
| `Secrets stored in Credentials`     | `.env` и secrets сохранены в Credentials                      |
| `Repository linked`                 | repository привязан                                           |
| `Deployment method documented`      | понятно как деплоить                                          |
| `Monitoring configured`             | uptime/error monitoring настроен или явно marked not required |
| `Backup policy configured`          | backup есть или явно not required                             |
| `Smoke test passed`                 | production smoke test пройден                                 |
| `Rollback plan exists`              | понятно как откатить                                          |

Если обязательные пункты не заполнены, Product нельзя переводить в `Transfer`, кроме approved override.

## Deployment Record

Каждый production deploy должен фиксироваться.

### Поля Deployment Record

| Поле                 | Описание                                 |
| -------------------- | ---------------------------------------- |
| `product`            | Product                                  |
| `environment`        | Production / Staging / Development       |
| `version`            | tag / commit / release name, если есть   |
| `commit_hash`        | commit, если есть                        |
| `deployed_by`        | кто деплоил                              |
| `deployed_at`        | дата и время                             |
| `status`             | Success / Failed / Rolled Back / Partial |
| `deployment_method`  | CI/CD / manual / provider                |
| `release_notes`      | что изменилось                           |
| `smoke_test_status`  | Passed / Failed / Not Run                |
| `rollback_available` | есть ли возможность отката               |
| `linked_tasks`       | связанные задачи                         |
| `linked_incident`    | incident, если deploy вызвал проблему    |

## Deployment Flow

```text
Tasks / Work Space completed
    ->
QA passed
    ->
Release readiness checklist
    ->
Deploy to staging
    ->
Staging smoke test
    ->
Deploy to production
    ->
Production smoke test
    ->
Monitoring watch period
    ->
Transfer / Done stage gate
```

## Rollback

Rollback должен быть не идеей "если что вернём", а понятным планом.

В Technical Profile должно быть указано:

- можно ли откатить;
- как откатить;
- кто отвечает;
- где backup;
- какие credentials нужны;
- сколько времени занимает rollback;
- какие риски.

## Deployment Incidents

Если deploy failed или вызвал production issue:

1. создаётся linked Support Ticket category `Incident`;
2. Deployment Record получает статус `Failed` или `Rolled Back`;
3. Notification Engine уведомляет responsible people;
4. если нужен RCA, создаётся Problem в Support;
5. SOP/checklist обновляется, если причина повторяемая.

## Stage Gate Перед Transfer

Product нельзя переводить в `Transfer`, если:

- production URL не указан;
- DNS/SSL не проверены;
- secrets не сохранены в Credentials;
- deployment method неизвестен;
- нет technical owner;
- critical incident открыт;
- monitoring/backup requirements не решены.

Override возможен только с reason и owner approval.
