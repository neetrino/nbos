# Entity Notes Field — план реализации

Глобальный shared-блок заметок по сущности (Lead, Deal, Project, Task, …): одно поле с лёгким rich-text, без thread / history / activity feed. UI — по скриншоту (label «Комментарий», toolbar, focus border, lists) + токены `DETAIL_SHEET_*` / detail sheet.

**Стек:** Tiptap (`@tiptap/extension-underline` + StarterKit). **Хранение:** `string | null` — HTML при форматировании; legacy plain text поддерживается (`entity-notes-value.ts`).

---

## Фаза 0 — Аудит и контракт

- [x] Найти все места с `notes` / comment-полями: `LeadNotesSection`, `DealNotesSection`, finance/project/task forms.
- [x] Зафиксировать формат значения: `String?` в Prisma; wire = HTML или plain (`entity-notes-contract.ts`).
- [x] Сверить скриншот с scope: только editor + toolbar; без списка комментариев, аватаров, дат, send.
- [x] Имя: `EntityNotesField` + `EntityNoteEntityType`.

## Фаза 1 — Shared UI (ядро)

- [x] `entity-notes-field.types.ts` — props.
- [x] `entity-notes-extensions.ts` — StarterKit + Underline + Link + Placeholder.
- [x] `entity-notes-toolbar.tsx` — B / I / U / S, lists, link.
- [x] `EntityNotesField.tsx` + `use-entity-notes-editor.ts`.
- [x] `entity-notes-field-classes.ts` + `globals.css` (`.nbos-entity-notes-editor`).
- [x] Экспорт из `components/shared/index.ts`.

## Фаза 2 — Поведение и качество

- [x] `onChange` на каждом update; optional `onBlur`.
- [x] `disabled` / `loading` — блок toolbar + editor.
- [x] DOMPurify sanitize в browser (`entity-notes-value.ts`).
- [x] a11y: `role="toolbar"`, `aria-label` на кнопках.
- [x] Unit-тест: `entity-notes-value.test.ts`.

## Фаза 3 — Интеграция (эталоны)

- [x] **Lead:** `LeadNotesSection` → `EntityNotesField`.
- [x] **Deal:** `DealNotesSection` → `EntityNotesField`.
- [ ] **Дальше:** Project delivery «Scope & notes», Task, Expense plan, Contact, Support.

## Фаза 4 — Документация и rollout

- [x] JSDoc + example на `EntityNotesFieldProps`.
- [x] Чеклист rollout (фаза 3, пункт «Дальше»).
- [x] `pnpm --filter @nbos/web typecheck` + `pnpm test entity-notes-value`.

---

## Rollout (следующие экраны)

| Сущность          | Файл / место                                         |
| ----------------- | ---------------------------------------------------- |
| Project delivery  | `delivery-item-detail-*-section.tsx` — Scope & notes |
| Task              | sheet / workspace forms                              |
| Expense plan      | `ExpensePlanGeneralTab`                              |
| Contact / Company | detail sheets                                        |
| Support ticket    | create / triage                                      |

## Вне scope

- Thread, аватары, даты, activity feed.
- Отдельный comments API.
- AI sparkle на toolbar.
