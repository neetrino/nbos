# NBOS Drive — что ещё не закрыто полностью

Полный канон по всем 13 линиям = отдельные релизы. Ниже — реальный остаток после текущего кода.

1. **Grants:** UI «кому доступ» / отзыв (`revokedAt`), роли кроме `VIEW`, уведомления.
2. **Папки под сущностью в Library:** отдельная модель размещения в БД, не только `displayName` путей.
3. **Share / Move / Copy:** матрица прав по канону `03-Permissions`; аудит на каждое действие.
4. **Удаление:** delete forever, корзина, защита linked-файлов в UI.
5. **Quick attach:** те же кнопки на Product / Task / Finance карточках (сейчас — Project).
6. **Library graph API:** агрегации по связям графа, не только `purpose` counts.
7. **Export ZIP:** job + storage + download (не только отчётные export jobs).
8. **Cleanup UI:** экран оператора + действия (не только `GET /api/drive/cleanup-summary`).
9. **Preview:** подсветка кода, UX больших PDF, streaming video при необходимости.
10. **Drive UI:** мелкие empty states (аналитика уже за кнопкой Analytics).
11. **DnD:** между Library и Company/Personal.
12. **Папки проекта в Drive:** отдельный scope дерева под `PROJECT`.
13. **Reorder:** порядок файлов в папке, если закрепят в каноне.
