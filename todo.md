# NBOS Drive — текущие остатки

Канон: [`docs/NBOS/02-Modules/11-Drive/08-Drive-Navigation-Project-Hub-and-Folders.md`](docs/NBOS/02-Modules/11-Drive/08-Drive-Navigation-Project-Hub-and-Folders.md), R2: [`06-Drive-Storage-Export-and-Cleanup.md`](docs/NBOS/02-Modules/11-Drive/06-Drive-Storage-Export-and-Cleanup.md). Статус кода vs канон: [`07-Drive-Cleanup-Register.md`](docs/NBOS/02-Modules/11-Drive/07-Drive-Cleanup-Register.md).

---

## Завершено (Drive slice 2026-05)

1. ~~Prisma + API: scoped `DriveFolder` (`scopeEntityType` / `scopeEntityId`).~~
2. ~~DEAL / PROJECT / … scoped folders (web): Library → entity → sidebar tree, upload + FileLink.~~
3. ~~PROJECT hub: Folders, Deals / Products / Finance / Tasks, project shell files.~~
4. ~~Deal Won policy: auto `FileLink` на PROJECT / PRODUCT / CONTACT / COMPANY / EXTENSION.~~
5. ~~TASK / WORKSPACE Library UX: deep link, pinned rows, Work Space → Drive.~~
6. ~~Library actions UX: folder vs FileLink, scoped move/copy, unlink.~~
7. ~~R2 storage home + `NBOS_TENANT_ORGANIZATION_ID`.~~
8. ~~Project hub: Client (Company + Contact); Extensions under Products.~~
9. ~~Docs: `07-Drive-Cleanup-Register.md` сверен с runtime.~~

## Следующий срез (вне закрытого Drive backlog)

См. §9 в [`07-Drive-Cleanup-Register.md`](docs/NBOS/02-Modules/11-Drive/07-Drive-Cleanup-Register.md):

- Upload widget на карточках CRM / Product / Task.
- Полная матрица Share/Move/Copy (`03-Permissions-Sharing-and-Audit.md`).
- Export catalog (типы из doc 06 §5, TTL, cancel).
- Cleanup candidates dashboard.
- Rich preview.

## Отложено

- Полная матрица прав Share/Move/Copy (до отдельного согласования).
- Расширенный Export ZIP (типы из §5, TTL, cancel job).
