1. **Drive / пространства:** явные **grants** (таблица + UI share) и расширение «Shared with me» поверх эвристики `ownerId`/`createdById`; **Shared with me** сейчас: API `sharedWithMe` + вкладка Drive «Shared».
2. **DriveFolder:** вложенные папки **под сущностью** в System Libraries (схема + API + UI), если закрепляем в каноне; сейчас только виртуальные «папки-записи» и пути в `displayName` при upload.
3. **Файлы:** семантика **Share** (общий доступ к тому же `FileAsset`); довести **Move/Copy/Remove** и согласованность с правами/аудитом.
4. **Удаление:** политика trash / delete forever / защита business-linked файлов по канону + UI.
5. **Entity quick attach:** компонент быстрого прикрепления в карточках Project / Product / Task / Finance.
6. **API библиотек:** context library endpoints по **entity graph**, не только UI-фильтрация и `listFileAssets` с query.
7. **Export:** ZIP + manifest (Project / Product / Client / Finance).
8. **Cleanup dashboard:** сироты, старые вложения задач, failed sessions, большие файлы.
9. **Preview:** inline image / PDF / video / code вместо только presigned open.
10. **Drive UI:** крупные информационные блоки убрать; аналитика только за действием Insights/Analytics (если ещё не так).
11. **Upload:** drag-drop между вкладками Library ↔ Company/Personal; сохранение структуры папок там, где ещё нет паритета с Company/Personal.
12. **Drive ↔ сущности:** отдельный **scope папок проекта** в Drive; deep link для типов без URL (PAYMENT, REPORT и т.д.), когда появятся маршруты в приложении.
13. **Drag & drop:** на папки при переключении Library; reorder файлов внутри папки (если нужен по канону).
