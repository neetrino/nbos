# NBOS Drive — что осталось

Канон и контекст: `docs/NBOS/02-Modules/11-Drive/08-Drive-Navigation-Project-Hub-and-Folders.md`.

---

## В работе / следующий этап

1. **Share / Move / Copy — матрица прав** по `docs/NBOS/02-Modules/11-Drive/03-Permissions-Sharing-and-Audit.md` (сейчас RBAC + доступ к файлу; не полная матрица по каждому действию в UI).
2. **Export ZIP** — сделано: асинхронный job по **выбранным** `fileIds` (BullMQ или `DRIVE_ZIP_EXPORT_SYNC_FALLBACK` в dev), ZIP + `_manifest/export-manifest.json` внутри, результат как `FileAsset`, UI «Download as ZIP» + опрос статуса. Дальше: «вся библиотека / все проекты / отмена / TTL временных экспортов» и типы экспорта из канона §5.

---
