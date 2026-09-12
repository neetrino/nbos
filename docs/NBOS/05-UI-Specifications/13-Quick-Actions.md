# NBOS Quick Actions

> Канон быстрых входов в часто используемые операции NBOS. Утверждено owner 2026-09-12. Первая реализация — `Quick Task`.

## 1. Назначение

`Quick Actions` — это не отдельные мини-приложения и не второй mobile UI. Это стабильные быстрые точки входа в существующие действия NBOS, доступные с home screen / OS shortcut / widget / будущего native companion.

Цель — убрать лишнюю навигацию для операций, которые пользователь выполняет много раз в день:

```text
Tap shortcut
→ рабочая форма доступна первой
→ пользователь сразу начинает ввод
→ полный модуль подготавливается параллельно
```

Первая утверждённая операция:

```text
/quick/task → Create Task
```

Возможные будущие операции, только при отдельном продуктовом решении:

```text
/quick/expense
/quick/note
/quick/...
```

Наличие Quick Actions foundation не означает, что эти будущие действия уже входят в scope.

---

## 2. Главный архитектурный принцип

Quick Action **не владеет бизнес-формой** и не создаёт её копию.

```text
Domain component
├── normal NBOS entry point
└── Quick Action entry point
```

Для Task:

```text
QuickCreateTaskDialog
├── обычный Tasks / другие места NBOS
└── /quick/task
```

Если форма задачи изменяется в основном продукте — поля, validation, relation picker, priority, due date, UX — Quick Task получает те же изменения автоматически.

Запрещено:

- копировать `QuickCreateTaskDialog` в отдельный quick-only компонент;
- держать отдельную business validation для Quick Task;
- создавать второй task API или отдельную task-модель;
- форкать мобильный дизайн формы;
- добавлять quick-only права, отличные от обычного Tasks RBAC.

Допускается отдельный **launch shell**: auth/bootstrap, route lifecycle, background preload, install metadata, performance telemetry и переход в полный модуль.

---

## 3. Quick Action и способ запуска — разные слои

Стабильная операция не должна зависеть от того, откуда её вызвали.

```text
                    /quick/task
                        │
        ┌───────────────┼────────────────┐
        │               │                │
   Home-screen icon  OS Shortcut      Widget / Control
                                         later
```

Поэтому:

- URL/route — продуктовый entry point;
- PWA manifest / Add to Home Screen — один способ доставки;
- OS shortcut — другой способ доставки;
- native app / App Intent / Android pinned shortcut — возможный будущий способ доставки.

Если конкретная ОС/браузер не позволяет удобно установить вторую web-app иконку для того же origin, это **не меняет Quick Action**: пользовательский shortcut должен вести в тот же `/quick/task`.

---

## 4. Общая Quick Actions foundation

Первый срез должен заложить лёгкую общую основу, но не универсальную форму.

Концептуально:

```text
QuickActionShell
├── authenticated entry
├── current-user bootstrap
├── launch / exit lifecycle
├── non-blocking background module load
├── shared loading/error behavior
├── i18n shell strings
├── performance marks
└── optional small action registry

QuickTaskAction
└── existing QuickCreateTaskDialog
```

Минимальный registry допустим для метаданных:

```text
action id
route
module
label/icon metadata
full-module destination
```

Registry не должен превращаться в schema-driven `UniversalQuickForm`. Формы остаются собственностью модулей.

---

## 5. Quick Task — обязательный UX

### 5.1. Entry point

Канонический путь:

```text
/quick/task
```

Путь защищён обычной NBOS authentication/session моделью. Неавторизованный пользователь проходит обычный sign-in flow и после успешного входа возвращается в Quick Task через callback URL.

### 5.2. Что пользователь видит первым

Первой интерактивной поверхностью является **существующий `QuickCreateTaskDialog`**.

На phone viewport используется уже существующий NBOS mobile dialog contract: bottom sheet, swipe chrome, mobile spacing. Это та же форма, что открывается из мобильного Tasks; отдельный дизайн не создаётся.

На desktop тот же компонент может использовать обычное modal представление. Quick Task в первую очередь оптимизируется под телефон, но route не должен искусственно ломаться на desktop.

Обязательное поведение при запуске:

1. форма открыта сразу;
2. `Task name` получает focus;
3. пользователь может начать печатать до загрузки списка задач;
4. загрузка Tasks, stats и остальных вторичных данных не блокирует input;
5. сетевой запрос списка задач не является prerequisite для показа формы.

### 5.3. Background Tasks surface

Quick Task — не тупиковый launcher.

Пока пользователь заполняет форму, существующий Tasks surface подготавливается в фоне. После `Cancel` / `Close` пользователь должен получить рабочий список задач без необходимости заново открывать NBOS вручную.

Целевой lifecycle:

```text
OPEN /quick/task
├── immediately: QuickCreateTaskDialog
└── background: existing Tasks surface + task data

Close form
→ Tasks surface
→ click task
→ existing TaskSheet / edit flow
```

Background surface должен быть **reuse**, а не копией `/tasks`. Если текущая страница слишком связана с route/layout, допускается refactor в reusable `TasksSurface` / equivalent, который используют и обычный `/tasks`, и Quick Task.

Тяжёлая обычная app chrome (`MessengerPersistProvider`, full `AppLayout` и т.п.) не должна становиться blocking dependency формы только ради того, чтобы фон позже был доступен.

### 5.4. После создания

`POST /api/tasks` остаётся единственным обычным create flow.

После успешного create:

- созданная задача должна появиться в уже открытом/background Tasks state без полного reload;
- можно использовать существующий task-created synchronization contract;
- пользователь получает понятное success state;
- action `Open` / эквивалент может сразу открыть созданную задачу через существующий Task detail flow;
- если пользователь просто закрывает success/form state, он остаётся в Tasks context.

Quick Task не закрывает приложение автоматически после submit.

---

## 6. Creator и Assignee

### Creator

`creatorId` — текущий authenticated Employee. Quick Action не позволяет подменять creator отдельным локальным identity.

Форма может стать интерактивной до завершения current-user bootstrap, но submit нельзя отправлять без реального `creatorId`.

### Assignee

Default assignee — текущий пользователь, как в существующем Quick Create.

При этом выбор другого сотрудника является core flow: пользователь часто создаёт задачу для коллеги.

Требования:

- employee search не блокирует первое отображение формы;
- поиск полного каталога остаётся server-authoritative;
- допустим небольшой in-memory/session cache последних/часто используемых вариантов;
- после того как основная форма интерактивна, можно фоновой загрузкой подготовить первые employee options;
- полный persistent offline employee directory в первом срезе не нужен.

### Draft safety

Identity/bootstrap, employee preload и background Tasks load **не имеют права сбрасывать уже введённый draft**.

В частности, если `me` приходит после того, как пользователь уже начал ввод:

- `title` и `description` сохраняются;
- выбранный вручную assignee не заменяется;
- default assignee применяется только если пользователь ещё не сделал свой выбор;
- `Create` становится доступным после готовности creator, а не через reset формы.

Это обязательный regression case.

---

## 7. PWA / install behavior

Основной NBOS manifest остаётся отдельным и продолжает открывать обычный NBOS.

Quick Task может иметь dedicated install metadata с отдельным именем/иконкой и `start_url=/quick/task`.

Цель на home screen:

```text
[ NBOS ]      [ + Task ]
   │              │
 full app      /quick/task
```

Точная схема manifest/id должна быть проверена на поддерживаемых браузерах iOS и Android. Нельзя считать конкретное поведение второй установки одинаковым во всех браузерах без live QA.

Fallback: создать OS/home-screen shortcut, который открывает тот же стабильный route.

---

## 8. Cache и security

Quick Actions **не отменяют** текущую PWA security policy NBOS.

В первом срезе сохраняется принцип:

```text
NO cache for authenticated HTML / RSC
NO cache for BFF responses
NO cache for API data
NO offline task creation queue
```

Нельзя кэшировать session/user/task/employee payload ради иллюзии мгновенного запуска.

Разрешено полагаться на обычный browser cache для immutable hashed static assets. Любой будущий explicit precache допускается только для identity-free static assets после отдельного security review.

Service worker не должен отдавать stale authenticated UI или stale business data.

---

## 9. Performance contract

Quick Action оптимизируется по perceived latency, а не по полной готовности модуля.

Измерять как минимум:

- `quick_action_launch`;
- `quick_task_form_visible`;
- `quick_task_title_interactive`;
- `quick_task_identity_ready`;
- `quick_task_background_tasks_ready`;
- `quick_task_submit_start`;
- `quick_task_submit_success` / `failure`.

Не отправлять в telemetry title, description, employee search text или другие business payloads.

Начальные продуктовые targets после получения baseline:

- warm launch → title interactive: желательно `<300 ms`;
- cold launch → title interactive: желательно `<1 s` на согласованном reference device/network;
- background Tasks не влияет на возможность печатать;
- close form → Tasks: без дополнительного blocking fetch, если background load уже успел завершиться.

Это targets, не гарантии ОС. Acceptance строится на реальных замерах iOS/Android.

---

## 10. Failure behavior

- Session expired → обычный auth recovery, без отдельного quick auth.
- `/api/me` медленный → форма может принять draft, create disabled до creator readiness.
- employee search unavailable → текущий/default assignee остаётся usable; ошибка поиска не ломает draft.
- Tasks background load failed → create остаётся доступным, если create dependencies готовы; после закрытия показать обычный Tasks error/retry state.
- task create failed → draft не теряется автоматически, показывается существующая понятная ошибка.
- install-specific feature unavailable → route остаётся доступным обычной ссылкой/shortcut.

---

## 11. Future Quick Actions

Новая быстрая операция допускается, когда действие:

- часто повторяется;
- имеет короткий и понятный create/action flow;
- уже имеет канонический domain component/API;
- реально выигрывает от доступа в 1 tap.

Для каждого нового action:

1. создать стабильный `/quick/<action>` entry point;
2. переиспользовать существующую domain form/action;
3. указать full-module destination;
4. определить bootstrap/background dependencies;
5. добавить permission/error/performance acceptance;
6. отдельно решить способ установки/shortcut.

Нельзя заранее строить Quick Expense/Quick Note только ради демонстрации foundation.

---

## 12. Out of scope первого среза

- отдельное React Native / Flutter приложение ради Task;
- native widget с полноценным text-input form;
- Messenger mobile app;
- offline write queue;
- отдельный quick backend;
- дублирование Task form;
- новый Task data model;
- внедрение будущих Quick Expense / Quick Note;
- изменение обычного Tasks business behavior, не нужное Quick Action.

---

## 13. Acceptance

Quick Task считается продуктово правильным, если:

1. home-screen/shortcut открывает `/quick/task`;
2. существующий mobile Quick Create открывается первым и без отдельного дизайна;
3. пользователь может начать ввод до окончания background Tasks load;
4. current-user bootstrap не стирает draft;
5. creator = current Employee, default assignee = current Employee, assignee можно изменить;
6. create использует существующий Tasks API/RBAC;
7. созданная задача появляется в background Tasks surface;
8. закрытие формы даёт доступ к Tasks и существующему Task detail/edit flow;
9. основной NBOS PWA продолжает работать как раньше;
10. dynamic authenticated data не кэшируется service worker;
11. performance marks и live measurements выполнены на согласованных iOS/Android устройствах;
12. новая архитектура позволяет добавить следующий Quick Action без копирования общей launch infrastructure.
