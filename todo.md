# NBOS Drive — реализация scoped folders (активно)

Канон: [`docs/NBOS/02-Modules/11-Drive/08-Drive-Navigation-Project-Hub-and-Folders.md`](docs/NBOS/02-Modules/11-Drive/08-Drive-Navigation-Project-Hub-and-Folders.md), R2: [`06-Drive-Storage-Export-and-Cleanup.md`](docs/NBOS/02-Modules/11-Drive/06-Drive-Storage-Export-and-Cleanup.md).

---

## Срезы (порядок)

1. ~~**Prisma + API:** `DriveFolder.scopeEntityType` / `scopeEntityId`; list/create/move в scope.~~
2. ~~**DEAL / PROJECT / … scoped folders (web):** Library → запись → дерево в сайдбаре, New folder, upload в папку + FileLink.~~
3. **PROJECT hub** — виртуальные секции (Deal, Products, Finance, Tasks) + Project files.
4. **Deal Won policy** — автоматические `FileLink` на PROJECT / PRODUCT / CLIENT.
5. **TASK / WORKSPACE** scoped folders.
6. **R2 storage home** — новые файлы в `nbos/tenants/{organizationId}/files/...`.

## Отложено (не этот срез)

- Полная матрица прав Share/Move/Copy (`03-Permissions-Sharing-and-Audit.md`).
- Расширенный Export ZIP (типы из §5, TTL, cancel job).
