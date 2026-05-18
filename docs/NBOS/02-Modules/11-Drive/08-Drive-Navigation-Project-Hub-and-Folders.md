# Drive: навигация, три пространства, scoped-папки и Project hub

**Статус:** зафиксировано для реализации (2026-05-18).  
**Связанные документы:** [`00-Drive-Overview.md`](./00-Drive-Overview.md), [`02-Libraries-and-Entity-Links.md`](./02-Libraries-and-Entity-Links.md), [`06-Drive-Storage-Export-and-Cleanup.md`](./06-Drive-Storage-Export-and-Cleanup.md).

---

## 1. Три пространства Drive (верхний уровень UI)

В модуле Drive пользователь работает в **трёх пространствах** (вкладки / segment control):

| Пространство             | Смысл                                                                         | Дерево `DriveFolder`                                        |
| ------------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **System Library Drive** | Бизнес-библиотеки по сущностям (Deals, Projects, Products, Tasks, Finance, …) | **Scoped** — отдельное дерево на контекст сущности (см. §3) |
| **Company Drive**        | Свободный общий диск компании (templates, brand, shared)                      | `space=COMPANY`, без entity scope                           |
| **Personal Drive**       | Личный диск сотрудника                                                        | `space=PERSONAL`, `ownerId`                                 |

**Shared with me** — отдельный view доступа, не четвёртое дерево.

System Library **не** является одним физическим деревом «все Deal внутри всех Project». На корне библиотеки (например Projects) — **виртуальная сетка сущностей**; внутри выбранной сущности — scoped-папки + файлы по `FileLink`.

```text
Drive
├── Company Drive          → общее дерево компании
├── Personal Drive         → личное дерево сотрудника
└── System Library Drive
    ├── Deals Library      → Deal → scoped tree + files
    ├── Project Library    → Project hub (§4)
    ├── Product Library    → …
    ├── Task / Workspace Library
    ├── Finance / Support / …
    └── All Files (глобальный фильтр, без entity tree)
```

---

## 2. Три технических слоя (истина в БД)

| Слой                   | Модель                            | Назначение                                                             |
| ---------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| **Файл**               | `FileAsset`                       | Один объект: метаданные, версии, `storageKey` в R2                     |
| **Бизнес-привязка**    | `FileLink`                        | К какой записи относится файл: `DEAL`, `PROJECT`, `PRODUCT`, `TASK`, … |
| **Размещение в папке** | `DriveFolder` + `DriveFolderItem` | Где файл/подпапка лежат в UI-дереве (не копия `FileAsset`)             |

Принципы:

- **Не плодить копии** файла ради видимости в Deal и Project.
- **Права и видимость** — из RBAC + `FileLink` + confidentiality, **не** из пути в R2.
- **R2** — storage home (читаемый путь); см. [`06-Drive-Storage-Export-and-Cleanup.md`](./06-Drive-Storage-Export-and-Cleanup.md).

---

## 3. Scoped folder trees (целевая модель папок)

Папки в System Library привязаны к **scope сущности**, а не только к `COMPANY` / `PERSONAL`.

Рекомендуемые поля на `DriveFolder` (имена уточняются в миграции):

- `scopeEntityType` — например `DEAL`, `PROJECT`, `PRODUCT`, `TASK`, `WORKSPACE`, `SUPPORT_TICKET`, …
- `scopeEntityId` — id записи; `null` для Company/Personal root trees

| Scope                  | Когда нужен                                                | Пример                                  |
| ---------------------- | ---------------------------------------------------------- | --------------------------------------- |
| `DEAL`                 | Файлы накапливаются **до** Project; много сделок в воронке | `Offers/`, `Proofs/`, `Contracts/`      |
| `PROJECT`              | После Won — рабочая оболочка PM/delivery                   | `Handoff/`, `Delivery/`, `Client docs/` |
| `PRODUCT`              | Delivery-контекст продукта                                 | `Design/`, `QA/`, …                     |
| `TASK` / `WORKSPACE`   | Независимые задачи и workspaces с файлами                  | вложения задачи                         |
| `COMPANY` / `PERSONAL` | Свободные диски (как сейчас)                               | `space` + optional `ownerId`            |

**Не делать:** отдельное полное дерево `DriveFolder` на каждую сущность **внутри** другой (Deal-tree внутри Project-tree в БД) — высокая цена синхронизации.  
**Делать:** своё дерево на **ту сущность, где файл родился или где ведётся работа**, плюс **виртуальные секции** в Project hub по `FileLink` и CRM-связям.

### Жизненный цикл: Deal → Project

```text
До Deal Won:
  FileAsset + FileLink(DEAL)
  optional: DriveFolder scope DEAL + DriveFolderItem

Deal Won (без копии файла в R2):
  + FileLink(PROJECT), FileLink(PRODUCT), FileLink(CLIENT) — по политике продукта
  файл остаётся в storage home, если создан из Deal

Project Library:
  ├── PROJECT scoped folders (пользовательские подпапки)
  ├── виртуальные секции: Commercial (Deal), Products, Finance, Tasks, …
  └── Unsorted: есть FileLink(PROJECT), нет placement в project folder
```

Файлы только с `FileLink(DEAL)` **не обязаны** появляться в Project Library до появления линка `PROJECT`.

---

## 4. Project Library как хаб (не единственный корень всего Drive)

Project — **центральная оболочка после Won**, но **не** родитель всех файлов платформы.

Целевой UI внутри `Project P-…`:

| Зона                   | Тип                   | Источник                                 |
| ---------------------- | --------------------- | ---------------------------------------- |
| Project folders        | Scoped tree `PROJECT` | `DriveFolder` + `DriveFolderItem`        |
| Commercial / Deal      | Виртуальная секция    | `FileLink(DEAL)` + связь CRM             |
| Products / Extensions  | Виртуальная секция    | связанные Product + links                |
| Finance                | Виртуальная секция    | invoice/payment links при доступе        |
| Tasks / Workspaces     | Виртуальная секция    | связанные task/workspace files           |
| Unsorted project files | Список                | `FileLink(PROJECT)` без folder placement |

Секции — **фильтры и представления**, не второе физическое дерево на каждую сущность.

---

## 5. Сущности без Project

Task, Work Space, Finance (без projectId), Support ticket и т.д. **не** обязаны жить под Project Library.

- Вход: соответствующая **Library** → виртуальная сетка сущностей → scoped tree / список файлов.
- Project hub показывает их **только при связи** с проектом (линк, FK, политика модуля).

---

## 6. Company / Personal (без изменения смысла)

- Полноценное дерево, New folder, move/copy, upload folder — как сейчас.
- Файл может иметь `DriveFolderItem` в Company **и** `FileLink` на Deal/Project при последующей привязке.
- Personal — `ownerId`, private-by-default; не обход business permissions.

---

## 7. Deep links из карточек

| Параметр           | Куда ведёт                            |
| ------------------ | ------------------------------------- |
| `?projectId=`      | Library → Projects → контекст PROJECT |
| `?driveProductId=` | Library → Products                    |
| `?driveTaskId=`    | Library → Tasks & Work Spaces         |

Реализация: `apps/web/src/features/drive/drive-deep-link.ts`, `DriveWorkspace`.

---

## 8. Очередь реализации (срезы)

1. **Схема:** `scopeEntityType` / `scopeEntityId` на `DriveFolder`; API list/create/move в scope.
2. **DEAL scoped folders** — приоритет (файлы до Project).
3. **PROJECT scoped folders + hub sections + Unsorted**.
4. **Deal Won:** политика автоматических `FileLink` (PROJECT / PRODUCT / CLIENT).
5. **TASK / WORKSPACE** scoped folders.
6. **R2 storage home** по канону `tenants/{organizationId}/files/...` для **новых** загрузок (см. doc 06); миграция старых ключей — отдельно.

### Текущее состояние кода (на момент фиксации)

- Company/Personal: дерево `DriveFolder` работает.
- System Library: виртуальная сетка сущностей + плоский список файлов по `FileLink`; scoped folders **не** реализованы; New folder в library-entity **disabled**.
- R2: префикс `Drive/uploads/{sessionId}/...` — см. § «Implementation note» в doc 06.

---

## 9. Отменённые / отложенные варианты

- Одно глобальное дерево R2 или UI на все Deal + Project + Task.
- Отдельные полные `DriveFolder`-деревья под Deal, Product и Client **внутри** Project в БД (дублирование).
- Использование пути R2 как источника прав доступа.
