# Professional Delivery Card — UI design specification

**Статус:** спецификация для реализации **Opened Delivery Card** (код ещё не обязан совпадать полностью; этот документ — целевой layout и UX).  
**Обновлено:** 2026-05-08

**Канон (источник поведения и состава данных):**

- [`../02-Modules/02-Projects-Hub/07-Delivery-Board.md`](../02-Modules/02-Projects-Hub/07-Delivery-Board.md) §8
- [`../02-Modules/02-Projects-Hub/03-Products-and-Extensions.md`](../02-Modules/02-Projects-Hub/03-Products-and-Extensions.md) §4.8
- [`03-Project-Hub-Pages.md`](./03-Project-Hub-Pages.md) §0 (глобальная Delivery Board + product deep dive)

Здесь не дублируются бизнес-правила stage gates, RBAC и содержимое табов — только **композиция экрана**, **приоритеты**, **адаптив** и **связь с существующим кодом**.

---

## 1. Цели

1. **Один узнаваемый shell** с CRM: широкий правый drawer, как у `DealSheet` / `LeadSheet`, но с **delivery-визуальным акцентом** (отдельный градиент/токен темы, не копия Deal).
2. **Sticky header** с entity context и главными действиями — всегда виден при скролле контента табов.
3. **Первый экран = daily core** (канон §8.2 / §4.8): stage, readiness, blockers, owners, ключевые ссылки — без «простыни».
4. **2–3 колонки на desktop** внутри главного working cockpit; на узких экранах — одна колонка, порядок секций фиксирован.
5. **Табы** только для отдельных рабочих миров; активные delivery-данные остаются на первом экране.

Нецели этого документа: спецификация API, миграции БД, полный контент MVP каждого таба (placeholder допустим, см. канон).

---

## 2. Shell и размеры

| Параметр                         | Рекомендация                                                              | Референс в коде                                                  |
| -------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Позиция                          | `side="right"`                                                            | `SheetContent`                                                   |
| Ширина sm+                       | `w-full` → `sm:w-[90vw]` с **max-width** `min(1400px, 92vw)`              | См. `LeadSheet`: `sm:max-w-[1400px]`; `DealSheet`: `sm:w-[90vw]` |
| Высота                           | `flex flex-col overflow-hidden`, скролл **только** в зоне контента таба   | Как `DealSheet` (`overflow-hidden` на sheet, scroll внутри)      |
| Внутренние отступы контента таба | `px-6 py-4` (desktop `px-7` для выравнивания с Deal)                      | —                                                                |
| Закрытие                         | Кнопка закрытия в header (или договориться с `showCloseButton` как в CRM) | Единообразие с Deal/Lead                                         |

**Текущий gap:** `DeliveryItemDetailSheet` использует `max-w-lg` / `sm:max-w-xl` — это **узкий MVP**, целевой shell должен соответствовать строкам выше.

---

## 3. Иерархия зон (сверху вниз)

```text
┌─────────────────────────────────────────────────────────────────┐
│ A. Sticky header (primary): title, badges, readiness, actions    │
├─────────────────────────────────────────────────────────────────┤
│ B. Requirements / lifecycle zone: canonical stages + readiness    │
│    Starting → Development → QA → Transfer (+ blockers)             │
├─────────────────────────────────────────────────────────────────┤
│ C. Tab list: Work Space | Calls | Bonus | History                  │
├─────────────────────────────────────────────────────────────────┤
│ D. Main working cockpit / selected tab panel                      │
└─────────────────────────────────────────────────────────────────┘
```

- **A** и **C** остаются в viewport при скролле **D** (общий паттерн: header + tabs `shrink-0`, panel `flex-1 min-h-0 overflow-y-auto`).
- **B** можно объединить с **A** на mobile (компактная строка или collapsible), на desktop — отдельная полоса/rail под заголовком или сбоку. Это не decoration: пользователь должен видеть, какие stage requirements сделаны, какие остались, и что блокирует следующий stage.

---

## 4. Sticky header (зона A)

**Содержимое (канон §8.1 / §4.8):**

| Элемент         | Примечание                                                                          |
| --------------- | ----------------------------------------------------------------------------------- |
| Badge           | `Product` \| `Extension`                                                            |
| Title           | Имя сущности (truncate + tooltip при overflow)                                      |
| Meta line       | Проект `code · name`, ссылка «Open product / extension context»                     |
| Stage           | Текущий canonical stage (или terminal resolution)                                   |
| Work status     | Active \| On Hold (+ кратко причина/summary если On Hold)                           |
| Readiness       | Segmented current-stage readiness (как на board card, расширенный tooltip по hover) |
| Deadline / risk | Одна строка, визуальный акцент при просрочке                                        |
| Primary actions | Группа кнопок: move stage, pause/resume, Done, Cancel, Work Space, open source page |

**Правила UX:**

- Primary actions **не** прячутся в меню, пока не не хватает места: ниже `md` перенос в `DropdownMenu` с тем же порядком.
- Для **closed** карточки: действия мутаций скрыты или disabled; показать chip `Done` / `Cancelled` и read-only banner (канон §8.4).

---

## 5. Табы (зона C) — порядок и роль

Табы нужны только для отдельных рабочих миров, где много собственной логики:

1. **Work Space** — задачи / ссылка в Work Space (MVP: deep link кнопкой допустим).
2. **Calls** — filtered projection или MVP placeholder.
3. **Bonus** — с учётом RBAC: employee видит своё, CEO/Founder/allowed roles видят всё.
4. **History** — audit, stage movements, важные изменения.

`Overview`, `Requirements`, `Accesses` и `Files` не являются default tabs в целевой модели.

Главный экран opened card открывается сразу как **working cockpit**. Requirements, Accesses и Files должны быть доступны на первом экране как blocks/sections, потому что это активные данные для ежедневной работы.

---

## 6. Layout главного working cockpit (зона D, desktop)

Целевая сетка **≥1024px**:

```text
┌──────────────────────────────┬─────────────────────┐
│ Col 1 (flex-1, min-w-0)      │ Col 2 (w-80/96)     │
│ · Requirements / timeline    │ · Team              │
│ · Current stage requirements │ · Accesses readiness│
│ · Key work links             │ · Files summary     │
│ · Languages                  │ · Blockers / Risks  │
│ · Conditional setup          │ · Comments / Notes  │
└──────────────────────────────┴─────────────────────┘
```

- **Col 1** — основной рабочий поток.
- **Col 2** — «контекст рядом», как правый rail у Deal (`DealGeneralTab` ~`w-72`), слегка шире для delivery полей.
- При **≥1280px** допустима **третья** узкая колонка или вложенный двухколоночный grid только внутри Col 1 (избегать четырёх колонок на всю ширину).

**768px–1023px:** две колонки сужаются; Col 2 может уйти под Col 1.

**<768px:** одна колонка, порядок секций:

1. Header meta (уже в A)
2. Requirements / readiness
3. Blockers / risks
4. Team
5. Accesses
6. Files
7. Key links
8. Languages
9. Conditional blocks
10. Client / order summary

---

## 7. Requirements / Stage Timeline UX

Финальное визуальное решение для `Requirements` ещё не зафиксировано.

Жёсткое правило:

- Requirements должны быть видны на первом экране;
- текущий stage должен быть понятен сразу;
- пункты должны быть цветными и легко считываться;
- выполненные, оставшиеся, blocker/critical должны визуально различаться;
- пользователь должен быстро понять, что нужно заполнить/закрыть, чтобы двигаться дальше.

Допустимые варианты дизайна:

- slim боковая timeline-панель;
- горизонтальная цветная timeline-полоса под header;
- expanded block в основной колонке;
- отдельный `Requirements` tab только если первый экран становится слишком тяжёлым.

---

## 8. Conditional blocks (first screen)

Таблица канона §8.3 / §4.8 — **когда показывать** блок на первом экране:

| Тип                      | First screen                  | Примечание                                       |
| ------------------------ | ----------------------------- | ------------------------------------------------ |
| Payment setup            | Summary row + link            | Полная форма во вкладке или modal                |
| Platform design URL / ID | Только для WordPress          | `Product.productCategory = WORDPRESS`            |
| Languages                | Всегда                        | Первый выбранный язык = primary product language |
| Domain / Hosting         | Summary + link to Accesses    | Не список секретов                               |
| App iOS/Android          | Иконки + статус               | —                                                |
| API keys / ENV           | Только «configured / missing» | Детали через Accesses block/modal/RBAC           |

---

## 9. Визуальный язык vs Deal

| Аспект          | Deal         | Delivery Card                                                                                     |
| --------------- | ------------ | ------------------------------------------------------------------------------------------------- |
| Градиент header | Amber        | Предложение: **slate / indigo** или нейтральный + **один** delivery accent (зафиксировать в теме) |
| Pipeline strip  | CRM stages   | Delivery stages (Starting → … → Transfer)                                                         |
| Контент         | Sales fields | Stage gates, readiness, execution links                                                           |

Сохранить: **скругления секций**, **uppercase микро-лейблы секций**, **card-in-sheet** блоки как в `DealInfoSection`.

---

## 10. Состояния

| Состояние                  | UI                                                |
| -------------------------- | ------------------------------------------------- |
| Loading                    | Skeleton в header + в panel (не пустой sheet)     |
| Error fetch                | Inline alert в panel + retry                      |
| On Hold                    | Серый/приглушённый header strip + причина         |
| Terminal                   | Outcome banner в main cockpit + read-only actions |
| Permission denied (action) | Disabled + tooltip / toast                        |

---

## 11. Связь с текущей реализацией

| Компонент                             | Сейчас                               | Цель по спецификации                                                          |
| ------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| `DeliveryItemDetailSheet`             | Узкий sheet, один столбец, без табов | Wide shell, sticky header, working cockpit + focused tabs                     |
| `ProductStageGateSummary` / readiness | В одном скролле                      | First-screen Requirements / timeline zone                                     |
| Stage actions                         | Отключены в drawer                   | Перенести в header при готовности API/RBAC (или явно deep-link до готовности) |

---

## 12. Критерии готовности дизайн-среза (DoD)

- [ ] Согласованы max-width и поведение scroll с CRM sheets.
- [ ] Зафиксирован delivery accent (цвет/градиент) и отличие от Deal.
- [ ] Пройдены все breakpoints с mock-контентом (длинные названия, много blockers).
- [ ] Таб order задокументирован: `Work Space / Calls / Bonus / History`.
- [ ] First-screen blocks задокументированы: Requirements, Team, Accesses, Files, Key Links, Blockers, Languages, Conditional Setup.
- [ ] Requirements UX выбран или явно оставлен как accepted design decision pending с допустимыми вариантами.
- [ ] Closed state: read-only pattern согласован с PM.

После этого можно брать задачу **Opened Delivery Card** (implementation L) без «сырого» layout.
