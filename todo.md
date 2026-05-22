# Entity Notes Field — план реализации

Глобальный shared-блок заметок по сущности (Lead, Deal, Project, Task, …): одно поле с лёгким rich-text, без thread / history / activity feed. UI — по скриншоту (label «Комментарий», toolbar, focus border, lists) + токены `DETAIL_SHEET_*` / detail sheet.

**Стек:** Tiptap уже в `apps/web` (`NativeDocumentEditor` — эталон toolbar). Хранение на границе: `string` (HTML или plain — зафиксировать в фазе 1).

---

## Фаза 0 — Аудит и контракт

- [ ] Найти все места с `notes` / comment-полями: `LeadNotesSection`, `DealNotesSection`, finance/project/task forms.
- [ ] Зафиксировать формат значения: plain text vs HTML (сверить API/Prisma для `lead.notes`, `deal.notes`).
- [ ] Сверить скриншот с scope: только editor + toolbar; без списка комментариев, аватаров, дат, send.
- [ ] Выбрать имя: `EntityNotesField` (+ типы `EntityNotesFieldProps`, `EntityNoteEntityType`).

## Фаза 1 — Shared UI (ядро)

- [ ] `apps/web/src/components/shared/entity-notes/entity-notes-field.types.ts` — props: `entityType`, `entityId`, `value`, `onChange`, `onBlur?`, `disabled`, `loading`, `placeholder`, `label`, `className`, `gateRequiredClassName?`.
- [ ] `entity-notes-extensions.ts` — минимальный Tiptap: StarterKit (bold, italic, strike, lists), Link, Placeholder; без table/image/task-list.
- [ ] `entity-notes-toolbar.tsx` — B / I / U / S, ordered + bullet list, link; группы с `|`; active state `bg-sky-100`; ghost buttons как в `native-document-editor-toolbar`.
- [ ] `EntityNotesField.tsx` — label сверху (`text-muted-foreground text-xs`), shell `rounded-xl border`, focus `ring`/`border-blue-400`, `EditorContent`, controlled sync `value` ↔ editor.
- [ ] `entity-notes-field-classes.ts` — константы на базе `DETAIL_SHEET_FIELD_SHELL_GROUP_CLASS`.
- [ ] Экспорт из `apps/web/src/components/shared/index.ts`.

## Фаза 2 — Поведение и качество

- [ ] Debounced или `onBlur` emit — не дублировать save-логику сущности внутри компонента.
- [ ] `disabled` / `loading` — блок toolbar + editor.
- [ ] Sanitize HTML на read (DOMPurify) если храним HTML.
- [ ] a11y: `aria-label` на toolbar, focus trap не нужен.
- [ ] Unit-тест: рендер label + placeholder; опционально serialize plain fallback.

## Фаза 3 — Интеграция (эталоны)

- [ ] **Lead:** заменить `Textarea` в `LeadNotesSection` на `EntityNotesField` (сохранить `DetailSheetSection`, stage-gate class).
- [ ] **Deal:** то же в `DealNotesSection`.
- [ ] **Третья точка (опционально):** Project delivery «Scope & notes» или Task sheet — если поле `notes` уже в draft; иначе TODO stub.

## Фаза 4 — Документация и rollout

- [ ] Короткий JSDoc на `EntityNotesField` + пример использования в комментарии к типам.
- [ ] Чеклист сущностей для последующего подключения (Contact, Expense, Support, …) — без реализации в этом slice.
- [ ] `pnpm --filter @nbos/web typecheck` + lint по затронутым файлам.

---

## Критерии готовности

| Критерий                             |                                   |
| ------------------------------------ | --------------------------------- |
| Один shared-компонент, named exports | `EntityNotesField`                |
| Без inline styles                    | Tailwind + shadcn                 |
| Файл ≤300 строк, функции ≤50         | split по файлам в `entity-notes/` |
| Не привязан к Lead API               | props-only                        |
| Визуально близко к скриншоту         | toolbar + label + focus border    |

## Вне scope (не делать)

- Thread комментариев, аватары, даты, empty state списка.
- Отдельный API модуль comments (если нет — parent держит `value`/`onChange` как сейчас у Lead/Deal).
- AI-кнопка со скриншота (sparkle) — только если появится продуктовое требование.

---

## После каждой фазы

Отмечать пункты `- [x]` в этом файле и коммитить логичным сообщением (например `feat(web): entity notes field phase 1`).
