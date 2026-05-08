# Checklist Template Builder

> NBOS My Company - reusable checklist templates for Delivery Board, Maintenance, automation tasks and future operational processes.

## 1. Назначение

`Checklist Template Builder` - это общий центр создания чеклистов-инструкций.

Он нужен, чтобы компания могла создавать, редактировать, версионировать и переиспользовать чеклисты для повторяемых процессов:

- Delivery Board stage requirements;
- Product / Extension development guidance;
- QA / Transfer checks;
- Maintenance update checks;
- recurring / automation tasks;
- future onboarding, finance, support or technical processes.

Это не просто список галочек. Checklist template - это короткое практическое руководство по правильному выполнению работы, разбитое на пункты.

Ключевой принцип:

```text
Checklist Template belongs to My Company / SOP & Templates.
Delivery Board, Tasks, Maintenance and Automation can use it.
```

---

## 2. Почему не привязывать только к Delivery Board

Первый потребитель - Delivery Board.

Но тот же механизм нужен в будущем для:

- maintenance-проверок по всем проектам;
- автоматических задач техкоманды;
- ежемесячных обновлений;
- QA-процессов;
- внутренних SOP runs.

Поэтому checklist templates должны быть reusable foundation, а не delivery-only модель.

---

## 3. Связь с Delivery Board

На Delivery Board каждый stage имеет `Stage Requirements`.

Checklist может быть одним из requirement types:

```text
Stage
  StageRequirement
    type = CHECKLIST
    checklistTemplate = WordPress Development Checklist
```

Важно:

```text
Checklist is one requirement type, not the whole stage readiness model.
```

Например:

```text
Starting requirements
  - Developer selected
  - Designer selected
  - Tech specialist selected
  - Client data received
  - Kickoff Checklist completed
```

`Kickoff Checklist completed` - один requirement. Внутри него есть свои checklist items.

---

## 4. Template vs Instance

### Checklist Template

Шаблон, который редактируется в builder.

Пример:

```text
WordPress Development Checklist
```

### Checklist Instance

Конкретный чеклист, созданный из шаблона для конкретного Product, Extension, Task или Maintenance run.

Пример:

```text
WordPress Development Checklist for classiccarlane.com
```

Instance должен хранить snapshot версии шаблона, чтобы старые проекты не ломались после изменения template.

---

## 5. Версионирование

Версионирование обязательно.

Причина: если активный шаблон изменился, уже созданные Product/Extension не должны внезапно получить новые обязательные пункты или потерять старые.

Правило:

```text
Template edit creates a new version for future instances.
Existing instances keep snapshot of the version used at creation.
```

Модель:

```text
ChecklistTemplate
  id
  name
  description
  category
  ownerModule
  status
  activeVersion

ChecklistTemplateVersion
  id
  templateId
  versionNumber
  status
  items
  createdBy
  createdAt

ChecklistInstance
  id
  templateId
  templateVersionId
  ownerEntityType
  ownerEntityId
  snapshotItems
  completedAt
  completedBy
```

Statuses:

```text
Draft -> Active -> Archived
```

Rules:

- `Draft` можно редактировать;
- `Active` используется для новых instances;
- `Archived` не используется для новых instances, но остаётся доступен для истории;
- publish новой версии не меняет уже созданные instances.

---

## 6. Checklist Template fields

Минимальные поля шаблона:

| Field         | Meaning                                                        |
| ------------- | -------------------------------------------------------------- |
| `name`        | Название шаблона                                               |
| `description` | Для чего нужен шаблон                                          |
| `category`    | Delivery / Maintenance / QA / Technical / SOP / Other          |
| `ownerModule` | Модуль-владелец смысла: My Company, Projects, Tasks, Technical |
| `status`      | Draft / Active / Archived                                      |
| `version`     | Версия active template                                         |
| `items`       | Ordered checklist items                                        |

Дополнительные binding fields могут жить не в самом checklist template, а в consumer rule.

Например Delivery Board выбирает шаблон через stage requirement:

```text
Product Type = Website
Stage = Development
Requirement type = CHECKLIST
Checklist Template = WordPress Development Checklist
```

Так один и тот же checklist можно переиспользовать в разных местах.

---

## 7. Checklist item model

У каждого item при создании обязательны:

| Field                       | Meaning                                                                    |
| --------------------------- | -------------------------------------------------------------------------- |
| `title`                     | Короткое название пункта                                                   |
| `description / instruction` | Подробное объяснение, что нужно сделать                                    |
| `decisionRequired`          | Нужно ли обязательно принять решение по пункту перед завершением checklist |
| `sortOrder`                 | Порядок пункта, скрыто сохраняется через drag/drop                         |

`sortOrder` не показывается пользователю как поле. В builder пользователь меняет порядок drag/drop-ом.

### decisionRequired / Must Review

`decisionRequired` не означает "обязательно выполнить".

Оно означает:

```text
Specialist must review this item and mark Done or Not Done.
```

Если `decisionRequired = yes`:

- item нельзя оставить `Pending`;
- item должен быть отмечен `Done` или `Not Done`;
- если `Not Done`, reason/comment обязателен;
- checklist нельзя завершить, пока такой item остаётся `Pending`.

Если `decisionRequired = no`:

- item можно оставить `Pending`;
- item можно отметить `Done`;
- item можно отметить `Not Done`, но тогда reason/comment всё равно обязателен.

---

## 8. Item mark states

Checklist item не имеет сложного workflow.

У него есть только лёгкое mark state:

| State      | Visual       | Meaning                                    |
| ---------- | ------------ | ------------------------------------------ |
| `Pending`  | empty / gray | item ещё не трогали                        |
| `Done`     | green check  | специалист отметил пункт как выполненный   |
| `Not Done` | red mark     | специалист отметил пункт как невыполненный |

`Not Done` всегда требует reason/comment.

Комментарий должен быть доступен рядом с пунктом через icon/tooltip/popover, чтобы менеджер или QA мог быстро понять, почему пункт не выполнен.

---

## 9. Checklist completion

Checklist можно завершить, если:

```text
all decisionRequired items are Done or Not Done
AND every Not Done item has reason/comment
```

Checklist completion не означает, что все пункты выполнены.

Он означает:

```text
Specialist reviewed required points and made an explicit decision for each.
```

Это защищает команду от забытых пунктов, но не заставляет искусственно отмечать "done" то, что не подходит или не было сделано.

---

## 10. Item evidence types

На первом этапе item может быть простым текстовым пунктом.

Дальше builder должен поддерживать evidence/input types:

- text instruction only;
- URL;
- file;
- image;
- video;
- PDF/document;
- credential link;
- task link;
- free text answer.

Важно: evidence type не меняет mark state. Пункт всё равно отмечается как `Pending`, `Done` или `Not Done`.

---

## 11. Builder UX

Checklist Template Builder должен быть визуальным и быстрым.

Основные возможности:

- create template;
- edit draft/new version;
- archive template;
- duplicate template;
- preview template;
- publish version;
- drag/drop reorder items;
- add item;
- delete item from draft;
- mark item as `Must Review`;
- edit item instruction;
- choose item evidence/input type later;
- show version history.

Builder layout:

```text
Template header
  name
  category
  status
  version

Items editor
  drag handle
  title
  instruction
  Must Review toggle
  evidence type
  preview
```

The builder should feel like creating a practical operating guide, not editing raw system fields.

---

## 12. Assignment and usage

Checklist templates do not decide by themselves where they appear.

They are attached by consumer modules:

### Delivery Board

```text
StageRequirement type = CHECKLIST
ChecklistTemplate = selected template
```

### Task Automation

```text
Automation creates task
Task attaches ChecklistTemplate instance
```

### Maintenance

```text
Monthly maintenance run
Attach Maintenance Update Checklist
```

### SOP / Process Run

```text
Process step requires ChecklistTemplate instance
```

---

## 13. Permissions and audit

Template editing should be restricted.

Suggested permissions:

- `templates.checklists.view`;
- `templates.checklists.create`;
- `templates.checklists.edit`;
- `templates.checklists.publish`;
- `templates.checklists.archive`.

Important audit events:

- template created;
- version published;
- template archived;
- template duplicated;
- item added/removed/changed;
- checklist instance completed;
- item marked `Not Done` with reason.

---

## 14. Relationship with Task Checklist

`Task Checklist` and `Checklist Template` are related but not the same.

| Concept              | Meaning                                                                     |
| -------------------- | --------------------------------------------------------------------------- |
| `Checklist Template` | Reusable template built in My Company / SOP & Templates                     |
| `Checklist Instance` | Snapshot created from a template for Product, Extension, Task, etc.         |
| `Task Checklist`     | Checklist instance attached to a concrete task                              |
| `Stage Requirement`  | Delivery gate requirement; may require a checklist instance to be completed |

This prevents one generic "templates" concept from swallowing delivery gates, task checklists and SOP documents.

---

## 15. Decisions

| Decision                                                               | Status   |
| ---------------------------------------------------------------------- | -------- |
| Checklist templates are reusable, not Delivery-only                    | Accepted |
| Checklist template builder lives under My Company / SOP & Templates    | Accepted |
| Checklist item `decisionRequired` means must review, not must do       | Accepted |
| Checklist item mark states are Pending / Done / Not Done               | Accepted |
| Not Done always requires reason/comment                                | Accepted |
| Checklist completion requires decisions for all decisionRequired items | Accepted |
| Checklist templates must be versioned and instances snapshot versions  | Accepted |
