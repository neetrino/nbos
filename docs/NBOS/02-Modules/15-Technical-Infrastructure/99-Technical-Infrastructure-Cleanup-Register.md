# Technical Infrastructure Cleanup Register

> Что нужно вынести, уточнить или реализовать для нового Technical / Infrastructure модуля

## Documentation Cleanup

| Область              | Статус  | Где сейчас                                                                                                                             | Что нужно сделать                                                            |
| -------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Technical module     | MISSING | отдельного активного модуля нет                                                                                                        | Создан новый канон `15-Technical-Infrastructure`                             |
| Domain/Hosting logic | PARTIAL | `Finance/07-Domains-Hosting-Licenses.md`                                                                                               | Оставить деньги в Finance, technical dependency показывать в Technical       |
| Deployment checklist | PARTIAL | `Order-to-Delivery`, `My Company SOP`                                                                                                  | Сделать Technical readiness gate перед Transfer                              |
| Monitoring           | PARTIAL | упоминается в Support/SOP                                                                                                              | Описать Monitoring Check и operational health                                |
| Backup               | PARTIAL | Drive/Credentials/SOP/Delivery                                                                                                         | Разделить Drive export backup, Credentials backup и Product technical backup |
| Incidents            | PARTIAL | Support module                                                                                                                         | Связать Support Incident с Technical Asset/Environment                       |
| Credentials links    | PARTIAL | Credentials docs                                                                                                                       | Technical должен ссылаться на Credentials, не хранить secrets                |
| Mail module boundary | `OK`    | **2026-04-30:** `04-Technical-Integrations.md` (**Mail**) + `17-Mail/00`, `04` — mailbox ops health в Mail, не дублировать в Technical |

## Runtime Cleanup

| Область                 | Статус  | Что сейчас                                                                                                                                                         | Что нужно сделать                                                         |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Technical Profile model | `OK`    | **2026-04-30:** `ProductTechnicalProfile`                                                                                                                          | Product technical profile linked to Product/Project                       |
| Technical Asset model   | `OK`    | **2026-04-30:** `TechnicalAsset`                                                                                                                                   | Assets: domain, hosting, repo, database, storage, monitoring, etc.        |
| Environment model       | `OK`    | **2026-04-30:** `TechnicalEnvironment`                                                                                                                             | Production/Staging/Development/Preview/Legacy environments                |
| Deployment Record       | PARTIAL | **2026-05-06:** API/UI runtime slice: `POST /technical/products/:productId/deploy-records`, audit action `technical.deploy_recorded`, profile `deployment.records` | Дожать до отдельного deploy entity/history policies при необходимости     |
| Monitoring Check        | PARTIAL | baseline summary в profile API/UI: monitoring/backup status + warning/critical assets + missing owner/credential links                                             | Scheduled checks + persisted check runs                                   |
| Backup Policy           | PARTIAL | **2026-05-06:** API/UI runtime slice: `PATCH /technical/products/:productId/backup-policy`, audit action `technical.backup_policy_updated`, profile `backupPolicy` | При необходимости выделить persisted policy model + restore test workflow |
| Domain model            | PARTIAL | есть `Domain`, но только частный случай                                                                                                                            | Связать с Client Service Record и Technical Asset                         |
| Support Incident link   | PARTIAL | profile API/UI теперь показывает linked Support incidents по product (`open`, `critical`, `recent`)                                                                | Явные links incident -> asset/environment/deploy                          |
| Project Product UI      | `OK`    | **2026-04-30:** Product page tab **Technical**                                                                                                                     | Technical profile, readiness, assets and environments                     |
