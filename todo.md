1. Drive spaces model: System Libraries (NBOS автоматические связи), Company Drive (свободные общие папки), Personal Drive (личные папки), Shared with me.
2. Drive folder system: `DriveFolder` + `FolderPlacement` для пользовательских папок; system libraries не удаляются и не перемещаются как обычные папки. Backend + migration + basic UI: PARTIAL (есть root storage `__nbos_drive_root__`, дерево в сайдбаре Company/Personal, rename/delete, picker). 🟢 UX: отдельная строка «Root» в сайдбаре убрана; дерево вложено под Company/Personal; действия создания — одна кнопка «+» с меню.
3. File actions semantics: Move = перенести placement, Share = доступ к тому же FileAsset, Copy = новый независимый FileAsset. Move/Copy/Remove from folder: PARTIAL (включая root placement).
4. Delete semantics: Remove from folder, Move to trash everywhere, Delete forever only from Trash/cleanup with permissions/audit; business-linked files protected.
5. Entity quick attach component для карточек Project/Product/Task/Finance.
6. Настоящие context library endpoints по entity graph, а не только UI-фильтрация.
7. Export jobs: Project/Product/Client/Finance ZIP + manifest.
8. Cleanup dashboard: orphan files, old task attachments, failed sessions, large files.
9. Preview depth: image/PDF/video/code inline preview вместо только presigned open.
10. Drive UI cleanup: no large always-visible informational blocks; file details open on demand, analytics lives behind an Insights/Analytics action. 🟢 Частично: сайдбар Drive (Library) — компактнее: дерево под пунктом диска, одна кнопка «+» с меню вместо трёх кнопок в тулбаре.
11. Upload polish: drag-drop; upload whole folders from computer with structure preservation (частично есть). Загрузка в корень Company/Personal: DONE (скрытый root bucket + кнопки при вкладке Company/Personal даже на Archive).
12. **System Libraries (Library):** 🟢 **PARTIAL — сделано:** выбор сущности (picker по библиотеке), загрузка файлов с `entityType`/`entityId` в upload session + поля из канона библиотеки (`sourceModule`/`purpose`/`visibility`). **Осталось:** виртуальные папки по сущности; полный паритет «New folder / Upload folder» в system libraries (сейчас в Library — только upload файлов; папки — в Company/Personal).
13. **Двусторонняя работа Drive ↔ Project (и др.):** 🟢 **PARTIAL:** из карточки проекта — кнопка «Drive files» → `/drive?projectId=…` (Library → Projects, линк загрузок на проект, пин в picker + имя из API). **Осталось:** из Drive открыть проект по ссылке с файла; то же для Product/Task; «вести папки» проекта в Drive как отдельный scope.
14. **Shared with me** и полная модель пространств из п.1 — TODO.
15. **Drag & drop** файлов на папки (и в сайдбаре, и в списке) — 🟢 **PARTIAL:** Company/Personal — drag файлов на папки в сетке/листе/таблице и в дереве сайдбара (`moveFolderFile`); без drag между вкладками Library / без reorder внутри папки.
