# Technical Infrastructure Cleanup Register

> Что нужно вынести, уточнить или реализовать для нового Technical / Infrastructure модуля

## Documentation Cleanup

| Область              | Статус  | Где сейчас                               | Что нужно сделать                                                            |
| -------------------- | ------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| Technical module     | MISSING | отдельного активного модуля нет          | Создан новый канон `15-Technical-Infrastructure`                             |
| Domain/Hosting logic | PARTIAL | `Finance/07-Domains-Hosting-Licenses.md` | Оставить деньги в Finance, technical dependency показывать в Technical       |
| Deployment checklist | PARTIAL | `Order-to-Delivery`, `My Company SOP`    | Сделать Technical readiness gate перед Transfer                              |
| Monitoring           | PARTIAL | упоминается в Support/SOP                | Описать Monitoring Check и operational health                                |
| Backup               | PARTIAL | Drive/Credentials/SOP/Delivery           | Разделить Drive export backup, Credentials backup и Product technical backup |
| Incidents            | PARTIAL | Support module                           | Связать Support Incident с Technical Asset/Environment                       |
| Credentials links    | PARTIAL | Credentials docs                         | Technical должен ссылаться на Credentials, не хранить secrets                |

## Runtime Cleanup

| Область                 | Статус  | Что сейчас                              | Что нужно сделать                                                     |
| ----------------------- | ------- | --------------------------------------- | --------------------------------------------------------------------- |
| Technical Profile model | MISSING | нет                                     | Добавить Product Technical Profile                                    |
| Technical Asset model   | MISSING | нет                                     | Добавить assets: domain, hosting, repo, database, storage, monitoring |
| Environment model       | MISSING | нет                                     | Добавить Production/Staging/Development environments                  |
| Deployment Record       | MISSING | нет                                     | Фиксировать deploys, failures, rollback                               |
| Monitoring Check        | MISSING | нет                                     | Добавить checks и status summary                                      |
| Backup Policy           | MISSING | нет                                     | Добавить product backup policy и restore test                         |
| Domain model            | PARTIAL | есть `Domain`, но только частный случай | Связать с Client Service Record и Technical Asset                     |
| Support Incident link   | PARTIAL | есть SupportTicket category Incident    | Добавить связи incident -> asset/environment/deploy                   |
| Project Product UI      | PARTIAL | есть Product tabs, но нет Technical tab | Добавить Technical / Operations tab                                   |
