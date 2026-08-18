# NBOS — реестр cron

Часовой пояс: **`TZ=Asia/Yerevan`**. Мастер: **`SCHEDULER_ENABLED`**.
Прод: мастер **вкл**, восемь 🟢 крутятся (биллинг, просрочка, KPI, повтор. задачи, планы расходов, inbox, enqueue, Client Services). Остальные жёлтые не включать пакетом.

- 🟢 включаем
- 🟡 позже (время уже выставлено)
- ⚪ не включать
- 🗑️ удалено из кода
- ❓ жду ответ
- 🖐️ не cron — кнопка

---

### Деньги

1. 🟢 **Ежемесячный биллинг** — 1-го в 03:00 создаёт счета по подпискам.  
   `SCHEDULER_BILLING_ENABLED`

2. 🗑️ **Старый черновик расходов** — **удалён из кода.** Не клон пункта 1, черновик пункта 8.

3. 🟢 **Просроченные счета** — каждый день в 05:00 помечает `OVERDUE`.  
   `SCHEDULER_OVERDUE_INVOICES_ENABLED`

4. 🟡 **Напоминания по счетам** — каждый день в **11:00** (не ночью): налог + WhatsApp D-10 / D-2.  
   Пока ждём. `SCHEDULER_INVOICE_CARD_REMINDERS_ENABLED`

5. 🟡 **Напоминания по backlog расходов** — каждый день в 07:00, in-app по зависшим карточкам.  
   Ждём. `SCHEDULER_EXPENSE_BACKLOG_REMINDERS_ENABLED`

6. 🟢 **Закрытие Sales KPI** — 1-го в 08:00 закрывает KPI за прошлый месяц.  
   `SCHEDULER_SALES_KPI_MONTH_CLOSE_ENABLED`

### Задачи и планы

7. 🟢 **Повторяющиеся задачи** — каждые **10 минут** создаёт Task из шаблонов.  
   `SCHEDULER_RECURRING_TASKS_DUE_ENABLED`

8. 🟢 **Планы расходов** — каждый день в 02:00 создаёт карточки из due-планов.  
   Это правильный механизм «аренда / хостинг раз в месяц». Пояснение ниже.  
   `SCHEDULER_EXPENSE_PLAN_AUTO_DUE_ENABLED`

### Корзина

9. 🟡 **Единая чистка корзины** — **воскресенье 03:30**: секреты + Drive + почта + Profile A.  
   Позже, раз в неделю. `SCHEDULER_PLATFORM_TRASH_PURGE_ENABLED`

10. 🗑️ **Чистка только секретов** — **удалён из кода.** Секреты чистит пункт 9.

### Поддержка и уведомления

11. 🟡 **Support SLA** — каждые 15 минут эскалации. Ждём.  
    `SCHEDULER_SUPPORT_SLA_ESCALATION_ENABLED`

12. 🟢 **Сверка inbox** — каждые 15 минут чинит счётчики уведомлений.  
    `SCHEDULER_NOTIFICATION_INBOX_RECONCILE_ENABLED`

13. 🟢 **Сверка очереди нотификаций** — каждые 10 минут.  
    `SCHEDULER_NOTIFICATION_ENQUEUE_RECONCILE_ENABLED`

### Сессии и ручное

14. 🟡 **Чистка новых сессий входа** — каждый час в :15. Пока не нужно.  
    Старый вход не удаляем сейчас — иначе никто не зайдёт. В `todo.md` после перехода.  
    `SCHEDULER_AUTH_SESSION_CLEANUP_ENABLED`

15. 🖐️ **Отложенные отчёты** — кнопка, cron не нужен.  
    `REPORT_SCHEDULES_DUE_CRON_ENABLED`

16. 🗑️ **WhatsApp-группа продукта — крон-ремонт удалён.** Нельзя обходить старые продукты без группы (миграция). Очередь, воркер и кнопка остаются. Автосоздание только у **нового** Product / Deal Won.

17. 🟢 **Client Services (домены, хостинг, лицензии)** — каждый день в **06:00**: для `WE_PAY` с `renewal_date` ≤ 60 дней создаёт `Invoice Card` (EXP-04; поле `renewal_date`, не `expiry_date`). `REMINDER_ONLY` — без invoice. На проде флаг **вкл**.  
    `SCHEDULER_CLIENT_SERVICES_RENEWAL_INVOICE_ENABLED` · cron `SCHEDULER_CLIENT_SERVICES_RENEWAL_INVOICE_CRON` (default `0 6 * * *`)

18. 🟡 **Почта — сверка исходящих** — каждые **2 минуты**: `QUEUED` старше 60 с и зависший `SENDING`. Default **off**.  
    `SCHEDULER_MAIL_OUTBOUND_RECONCILE_ENABLED` · cron `SCHEDULER_MAIL_OUTBOUND_RECONCILE_CRON` (default `*/2 * * * *`)

Ручной ремонт без cron: `POST /api/scheduler/sales-kpi-backfill-all`.

---

### 2 — не клон биллинга. Проверено, можно удалять

**Пункт 1** создаёт **счета клиентам** из подписок (деньги входят).  
**Пункт 2** трогает **расходы** (деньги выходят). Это не копия 1.

**Пункт 8** — нормальные планы: «аренда 1-го», «домен раз в год» → своя карточка, своя дата.

**Пункт 2** — черновик до планов. 1-го числа делает так:

1. Если в этом месяце уже есть хоть одна карточка с типом «запланированный» — **ничего**.
2. Иначе берёт старые такие карточки и копирует **по одной на категорию** (офис, зарплата…).

Пример: в июле были «аренда 400к» и «вода 20к» — обе категория Офис. 1 августа 2 создаст только одну копию (последнюю). Связи с планом нет. В каноне NBOS этой джобы нет.

Проверено и удалено: cron, HTTP `/scheduler/expenses`, `POST /billing/run-expenses`. Живой процесс — пункт 8.

---

### 9 и 10 — не два смысла, а старый файл никто не удалил

Сначала написали только чистку секретов (10). Потом сделали общую корзину (9): секреты + Drive + почта + Profile A. Внутри 9 вызывается **та же** функция, что и в 10.

Не задумка «два режима». Просто 10 не выкинули из кода.

Cron и HTTP пункта 10 удалены. Когда дойдём до корзины — только 9.

---

### 14 — два входа, старый пока нельзя выкинуть

Сейчас в коде два способа **войти в NBOS**:

- **Старый:** логин → токен JWT. Так заходят все прямо сейчас.
- **Новый:** логин → сессия в базе. Ещё не включили. Удобнее выкинуть один телефон.

Это не две платформы. Это замена замка на двери. Новый замок ещё не повесили.

Джоба 14 подметает только просроченные **новые** сессии. Пока новый вход выкл — джоба не нужна.

Старый вход **сейчас не удаляем**: иначе никто не зайдёт. Сначала включим и проверим новый, потом выкинем старый. Это в `todo.md`, не в этом срезе.

---

### 16 — группа: очередь оставляем, cron нет

Со своим Redis очередь не трогаем: шлюз может думать долго, API не блокируем.

Cron не нужен. Кнопку позже сделаем честной: «создаём…» / ошибка / повтор через ~10 с. Воркер не удаляем.

---

### Env на `nbos-scheduler` после деплоя

Только этот сервис. API / web / worker не трогать.

```env
TZ=Asia/Yerevan
SCHEDULER_ENABLED=true

SCHEDULER_BILLING_ENABLED=true
SCHEDULER_EXPENSE_PLAN_AUTO_DUE_ENABLED=true
SCHEDULER_OVERDUE_INVOICES_ENABLED=true
SCHEDULER_SALES_KPI_MONTH_CLOSE_ENABLED=true
SCHEDULER_RECURRING_TASKS_DUE_ENABLED=true
SCHEDULER_RECURRING_TASKS_DUE_CRON=*/10 * * * *
SCHEDULER_NOTIFICATION_INBOX_RECONCILE_ENABLED=true
SCHEDULER_NOTIFICATION_ENQUEUE_RECONCILE_ENABLED=true

SCHEDULER_INVOICE_CARD_REMINDERS_ENABLED=false
SCHEDULER_INVOICE_CARD_REMINDERS_CRON=0 11 * * *
SCHEDULER_EXPENSE_BACKLOG_REMINDERS_ENABLED=false
SCHEDULER_PLATFORM_TRASH_PURGE_ENABLED=false
SCHEDULER_PLATFORM_TRASH_PURGE_CRON=30 3 * * 0
SCHEDULER_SUPPORT_SLA_ESCALATION_ENABLED=false
SCHEDULER_AUTH_SESSION_CLEANUP_ENABLED=false
REPORT_SCHEDULES_DUE_CRON_ENABLED=false
SCHEDULER_CLIENT_SERVICES_RENEWAL_INVOICE_ENABLED=false
SCHEDULER_CLIENT_SERVICES_RENEWAL_INVOICE_CRON=0 6 * * *
```

Джобы 1 / 3 / 6 есть только в новом образе scheduler. Старый эти флаги проигнорирует.
