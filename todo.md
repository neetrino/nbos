# NBOS Drive — текущие остатки

Канон: `[docs/NBOS/02-Modules/11-Drive/08-Drive-Navigation-Project-Hub-and-Folders.md](docs/NBOS/02-Modules/11-Drive/08-Drive-Navigation-Project-Hub-and-Folders.md)`, R2: `[06-Drive-Storage-Export-and-Cleanup.md](docs/NBOS/02-Modules/11-Drive/06-Drive-Storage-Export-and-Cleanup.md)`. Статус кода vs канон: `[07-Drive-Cleanup-Register.md](docs/NBOS/02-Modules/11-Drive/07-Drive-Cleanup-Register.md)`.

---

## Закрыто в Phase 1 hardening

- Legacy raw-R2 HTTP routes `GET/POST/DELETE /drive/:projectId...` отключены.
- `/drive/library` теперь проходит через общий file access filter.
- Folder placement actions больше не обходят file-level access.
- Upload session create/complete повторно проверяет target context.
- Lifecycle audit actor больше не берётся из client body.

## Следующий срез (вне закрытого Drive backlog)

См. §9 в `[07-Drive-Cleanup-Register.md](docs/NBOS/02-Modules/11-Drive/07-Drive-Cleanup-Register.md)`:

- Upload widget на карточках CRM / Product / Task.
- Полная матрица Share/Move/Copy (`03-Permissions-Sharing-and-Audit.md`).
- Export catalog (типы из doc 06 §5, TTL, cancel).
- Cleanup candidates dashboard.
- Rich preview.
