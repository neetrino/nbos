1. Drive spaces model: System Libraries (NBOS автоматические связи), Company Drive (свободные общие папки), Personal Drive (личные папки), Shared with me.
2. Drive folder system: `DriveFolder` + `FolderPlacement` для пользовательских папок; system libraries не удаляются и не перемещаются как обычные папки.
3. File actions semantics: Move = перенести placement, Share = доступ к тому же FileAsset, Copy = новый независимый FileAsset.
4. Delete semantics: Remove from folder, Move to trash everywhere, Delete forever only from Trash/cleanup with permissions/audit; business-linked files protected.
5. Entity quick attach component для карточек Project/Product/Task/Finance.
6. Настоящие context library endpoints по entity graph, а не только UI-фильтрация.
7. Export jobs: Project/Product/Client/Finance ZIP + manifest.
8. Cleanup dashboard: orphan files, old task attachments, failed sessions, large files.
9. Preview depth: image/PDF/video/code inline preview вместо только presigned open.
10. Drive UI cleanup: no large always-visible informational blocks; file details open on demand, analytics lives behind an Insights/Analytics action.
11. Missing now: create folders, upload files from computer directly into Company/Personal folders, and later upload whole folders from computer with structure preservation.
