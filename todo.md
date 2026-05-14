# NBOS Drive — что осталось

Канон и контекст: `docs/NBOS/02-Modules/11-Drive/08-Drive-Navigation-Project-Hub-and-Folders.md`.

---

## В работе / следующий этап

1. **Share / Move / Copy — матрица прав** по `docs/NBOS/02-Modules/11-Drive/03-Permissions-Sharing-and-Audit.md` (сейчас RBAC + доступ к файлу; не полная матрица по каждому действию в UI).

2. **Export ZIP** — отдельный job, storage, скачивание, manifest (не только `POST /api/drive/files/export-manifest` + JSON в Library).

3. **DnD Library ↔ Company/Personal** — перетаскивание между панелями при общем layout / split-view (сейчас: bulk «Place in Company folder…» + API).

4. **Дерево папок только под PROJECT** в Drive — отдельный scope/API/UI, не только deep link + подсказка.

5. **Ручной порядок файлов в папке** (`sortOrder` в БД и т.п.) — только если закрепят в каноне; иначе достаточно текущей сортировки в UI.

---

## На решение продукта (не в текущем backlog)

**Реальные подпапки в System Library** под сущность (`PROJECT` / `DEAL` / …) vs виртуальные папки и `displayName` при upload folder — см. историю обсуждения в чате; без sign-off не делаем.
