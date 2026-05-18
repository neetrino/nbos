# NBOS Drive — текущие остатки

Канон: `[docs/NBOS/02-Modules/11-Drive/08-Drive-Navigation-Project-Hub-and-Folders.md](docs/NBOS/02-Modules/11-Drive/08-Drive-Navigation-Project-Hub-and-Folders.md)`, R2: `[06-Drive-Storage-Export-and-Cleanup.md](docs/NBOS/02-Modules/11-Drive/06-Drive-Storage-Export-and-Cleanup.md)`. Статус кода vs канон: `[07-Drive-Cleanup-Register.md](docs/NBOS/02-Modules/11-Drive/07-Drive-Cleanup-Register.md)`.

---

## Закрыто (Phase 1–3 backend slice)

**Phase 1 — hardening**

- Legacy raw-R2 HTTP routes отключены.
- `/drive/library` + folder placements + upload session entity checks.
- Lifecycle audit actor только с сервера.

**Phase 2 — permissions**

- Action grants (`VIEW` / `UPLOAD_VERSION` / `SHARE` / `DELETE` / `EXPORT`).
- Grant `expiresAt`, `reason`, sensitive → только `VIEW`.
- Copy policy + scoped `FileLink` on copy.
- Entity-scoped folders + library read через `assertDriveEntityContextAccessible`.

**Phase 3 — export/cleanup (backend)**

- Typed ZIP exports: `drive.project_zip`, `drive.product_zip`, `drive.client_zip`, `drive.finance_zip`, `drive.task_attachments_zip`.
- `POST /drive/zip-exports` принимает `exportKind` + `exportParams` или `fileIds`.
- `POST /drive/zip-exports/:id/cancel` для `QUEUED`.
- `GET /drive/cleanup/candidates` — review surface.
- `POST /drive/cleanup/apply` — confirmed cleanup (`ids` или `applyAll` для sessions / expired ZIP artifacts) + audit.
- Analytics UI: выбор кандидатов, Apply selected / batch.

---

## Следующий срез (Drive polish, не блокер)

- Export jobs polling while insights closed.
- Upload widget на карточках CRM / Product / Task.
- Полная UI-матрица Share/Move/Copy.
- Rich preview.
- Доп. export kinds из канона (Offer, Meeting, Full backup).
