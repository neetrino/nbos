# Documents - overview

`Documents / Документы` - это встроенный модуль NBOS для ежедневной работы с рабочими документами компании.

Главная задача модуля - дать команде одно понятное место, где можно быстро создать, найти, прочитать, отредактировать и использовать регламенты, инструкции, обучающие материалы, SOP, правила работы и внутренние документы.

Модуль должен быть простым для команды:

```text
Открыть Documents
  -> найти нужный раздел или документ
  -> прочитать / отредактировать
  -> сохранить
  -> команда видит актуальную версию
```

Documents не должен превращаться в сложную корпоративную систему согласований. Это вспомогательный, но важный модуль для порядка, доступа и удобной ежедневной работы.

## Главный канон

```text
Documents = рабочее место для документов.
Drive = файловая инфраструктура и физические файлы.
R2 = object storage для вложений и загруженных файлов.
PostgreSQL = source of truth для native document content и metadata.
```

Documents владеет смыслом документа: название, раздел, текст, статус, доступ, владелец, дата обновления.

Drive владеет файлами: картинки, PDF, DOCX, XLSX, вложения, exports и другие file assets.

## Что Documents делает

| Задача             | Описание                                                                               |
| ------------------ | -------------------------------------------------------------------------------------- |
| Native documents   | Создание и редактирование документов внутри NBOS через TipTap                          |
| Sections / folders | Разделы и логическая структура документов                                              |
| Search             | Поиск по названию, plain text, tags и разделам                                         |
| Reading experience | Удобный режим чтения без ощущения редактора                                            |
| Editing experience | Быстрый и понятный редактор для регламентов, инструкций и обучения                     |
| Attachments        | Картинки и файлы через Drive File Asset / R2                                           |
| Access             | Доступ по ролям, разделам и при необходимости по документу                             |
| Status             | Простые статусы: draft, published, archived                                            |
| Activity           | Лёгкая история действий: создано, обновлено, переименовано, перемещено, изменён доступ |
| Google v2          | Позже - подключение Google Docs / Sheets как external editable documents               |

## Что Documents не делает

| Не делает                             | Почему                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| Не заменяет Google Docs полностью     | Google Docs уже удобен для сложной совместной работы и внешних документов               |
| Не заменяет Google Sheets / Excel     | Сложные таблицы, формулы и расчёты должны оставаться в Google Sheets или файлах         |
| Не является Drive                     | Documents показывает документы и связанные файлы, но не открывает весь файловый storage |
| Не хранит secrets                     | Пароли, токены и ключи относятся к Credentials                                          |
| Не является тяжелой approval-системой | Для текущей задачи достаточно простых статусов и прав                                   |
| Не создаёт AI logic                   | AI Assistant будет отдельным platform-level модулем позже                               |

## Supported document types

| Type            | Назначение                              | Где редактируется                         |
| --------------- | --------------------------------------- | ----------------------------------------- |
| `native`        | Документ, созданный в NBOS через TipTap | В Documents                               |
| `uploaded_file` | Загруженный DOCX/XLSX/PDF/другой файл   | Во внешнем приложении или download/upload |
| `external_link` | Ссылка на внешний документ или ресурс   | Во внешнем сервисе                        |
| `google_doc`    | Google Docs document, v2                | В Google Docs                             |
| `google_sheet`  | Google Sheets document, v2              | В Google Sheets                           |

В первой версии основной тип - `native`. Остальные типы должны быть заложены в модель, но Google v2 не входит в первую реализацию.

## Core UX principle

Documents должен быть удобнее, чем искать документ в чатах, случайных Google ссылках и папках.

Это значит:

- быстрый первый экран;
- понятные разделы;
- сильный поиск;
- recent / favorites;
- удобное чтение;
- редактирование без лишних настроек;
- понятные права;
- минимум технических слов в UI;
- все действия рядом с документом, а не в админских глубинах.

## Canonical structure

```text
Documents
  Home
    Recent
    Favorites
    Recently Updated
    My Drafts

  Sections
    Company Rules
    SOP / Processes
    Sales
    Delivery
    Support
    Finance
    HR / Onboarding
    Technical

  Document Detail
    Viewer mode
    Editor mode
    Attachments
    Activity
    Access

  Admin / Settings
    Sections
    Access defaults
    Tags
    Archived documents
```

The exact section names may be configured by company settings, but the module must support sections from day one.

## Key entities

| Entity                  | Назначение                                        |
| ----------------------- | ------------------------------------------------- |
| `Document`              | Главная карточка документа и текущий content      |
| `DocumentSection`       | Раздел / папка / collection документов            |
| `DocumentTag`           | Метка для поиска и группировки                    |
| `DocumentAttachment`    | Связь документа с Drive File Asset                |
| `DocumentPermission`    | Явное правило доступа поверх inherited access     |
| `DocumentActivityEvent` | Лёгкий лог действий по документу                  |
| `ExternalDocumentLink`  | Metadata для external_link / Google v2 документов |

## Main rules

1. Documents is a daily-use module, not an archive nobody opens.
2. UI language should use simple team words: Documents, sections, edit, publish, archive.
3. Native document content lives in PostgreSQL as TipTap JSON.
4. Images and uploaded files live in R2 through Drive File Asset.
5. Search uses document title, tags and extracted plain text.
6. The first version keeps history light: `updated_at`, `updated_by` and activity events.
7. Heavy version history and approval workflow are not core scope unless owner later approves them.
8. Google Docs / Sheets integration is v2, not first implementation.
9. Documents must not expose all Drive files by default.
10. AI is not part of this module canon; future AI Assistant will integrate later as a separate platform module.

## First release scope

First release should be complete enough for real daily use:

- Documents module route and sidebar item;
- sections / folders;
- document list;
- search;
- tags;
- recent and favorites;
- create / edit / rename / move / archive;
- TipTap editor;
- viewer mode;
- image upload and attachments through Drive/R2;
- simple statuses: draft, published, archived;
- owner, updated_by, updated_at;
- RBAC and section-level access;
- simple activity log.

## Later scope

Later versions can add:

- Google Docs / Sheets connection;
- external document preview;
- import/export Markdown;
- export PDF/HTML;
- richer templates;
- document acknowledgement by employees;
- training/tests linked to documents;
- advanced document analytics;
- AI Assistant integration from the future AI module.

## Related documents

- `01-Document-Types-and-Data-Model.md`
- `02-Editor-Content-and-Storage.md`
- `03-Sections-Search-and-Daily-UX.md`
- `04-Permissions-and-Activity.md`
- `05-Google-Workspace-Integration-v2.md`
- `99-Documents-Cleanup-Register.md`
