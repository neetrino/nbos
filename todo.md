# NBOS Drive — текущие остатки

Канон: [`docs/NBOS/02-Modules/11-Drive/08-Drive-Navigation-Project-Hub-and-Folders.md`](docs/NBOS/02-Modules/11-Drive/08-Drive-Navigation-Project-Hub-and-Folders.md), R2: [`06-Drive-Storage-Export-and-Cleanup.md`](docs/NBOS/02-Modules/11-Drive/06-Drive-Storage-Export-and-Cleanup.md).

---

## Завершено

1. ~~**Prisma + API:** `DriveFolder.scopeEntityType` / `scopeEntityId`; list/create/move в scope.~~
2. ~~**DEAL / PROJECT / … scoped folders (web):** Library → запись → дерево в сайдбаре, New folder, upload в папку + FileLink.~~
3. ~~**PROJECT hub:** Folders + секции Deal/Products/Finance/Tasks; project shell files на корне Folders; убраны Unsorted / All project files.~~
4. ~~**Deal Won policy:** автоматические `FileLink` на PROJECT / PRODUCT / CONTACT / COMPANY / PRODUCT / EXTENSION для approved handoff files.~~

## Осталось

1. ~~**TASK / WORKSPACE Library UX:** deep link, pinned rows, entity root files merge, Work Space → Drive entry.~~
2. **Library actions UX:** чекбоксы/кнопки для файлов и ручных папок в Library, с чётким разделением:
   - `DriveFolderItem` actions: place/move/remove from folder, rename/delete только ручных scoped folders;
   - `FileLink` actions: link/unlink from entity, share/grants, archive;
   - виртуальные секции Project hub (Deals, Products, Finance, Tasks, Project files, Client/Company) не являются папками и не получают folder actions.
3. **R2 storage home:** новые файлы должны уходить в `nbos/tenants/{organizationId}/files/...`; текущий transitional path ещё `Drive/uploads/{sessionId}/...`.
4. **Project hub refinements:** добавить Client / Company section и Extension section, если нужно вывести их отдельно от Project files / Products.
5. **Docs cleanup after implementation:** сверить `07-Drive-Cleanup-Register.md` с фактически реализованными Drive-слайсами.

## Отложено (не этот срез)

- Полная матрица прав Share/Move/Copy (`03-Permissions-Sharing-and-Audit.md`).
- Расширенный Export ZIP (типы из §5, TTL, cancel job).
