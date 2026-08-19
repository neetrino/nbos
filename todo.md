# NBOS — актуальные задачи

Очередь сейчас: Mail unique mailbox + attachment Retry на проде (`215bfc4b` / PR #165). Почтовые cron 18–20 на scheduler включены по одному. WhatsApp Won на проде. Очередь групп оставляем.

- [x] Mail runtime A+B+C: compose/reply через очередь, inbound sync/IDLE на worker, inbound attachments в Drive. Код в `main` (`d6801b6d`), миграции на проде, api/worker/web выкатаны.
- [ ] Mail — осталось после выкладки (не новый срез A/B/C):
  - [ ] Smoke на проде: connect → inbound (тело + вложение Pending→Ready) → reply ушёл → рестарт worker → письмо не задвоилось.
  - [x] Unique mailbox в коде (`567327f4`): global `lower(email)` среди live (`status <> DISABLED`); shared mailbox = один MailAccount + access; второй сотрудник → 409; reconnect/upsert своей DISABLED строки.
  - [x] Prod migrate `20260819183000_mail_accounts_live_email_unique` — на Neon prod применена (`215bfc4b`).
  - [x] Attachment download — Retry для застрявшего Pending в коде (`1a383407`): UI FAILED сразу / PENDING >3 мин; API retry-download; queue re-enqueue.
  - [x] Attachment download — deploy api/worker/web (`215bfc4b`, running:healthy).
  - [ ] Attachment download — verify Toon Expo PNG на prod test@ (Retry → Ready).
  - [ ] (опционально) Данные: 3 DISABLED `test@neetrino.com` в prod DB (история сохранена) — убрать позже, не срочно.
  - [x] Включить почтовые cron **по одному**, не пакетом (реестр 18–20, default off):
    - [x] `SCHEDULER_MAIL_OUTBOUND_RECONCILE_ENABLED` — застрявшие исходящие (QUEUED / stale SENDING).
    - [x] `SCHEDULER_MAIL_GMAIL_WATCH_RENEW_ENABLED` — продление Gmail watch (только если есть Gmail-ящики).
    - [x] `SCHEDULER_MAIL_SYNC_RECONCILE_ENABLED` — сетка inbox раз в 5 мин; без неё новые письма только пока живы Pub/Sub / IDLE / ручной Sync.
  - [ ] Помнить, не чинить «заодно»: IMAP id вложения (`part:{n}:{name}`) может дать Failed → Retry; enqueue-miss оставляет Pending без cron — только Retry в UI; удаления письма у Gmail/IMAP нет (сознательно).
- [x] Локальный Redis: на ноутбуке и втором компьютере `REDIS_URL` закомментирован — так и оставить (не прод). Dev-Redis позже свой/локальный, не Upstash и не prod `nbos-redis`.
- [x] Прод Redis: `nbos-redis`, TLS `rediss://:6380`, AOF + `maxmemory 256mb` + `noeviction`, 6379 закрыт. Runtime `REDIS_URL` у api / worker / scheduler. Upstash аккаунт удалён.
- [ ] Оставить создание отчётов только ручным: кнопка → очередь → готовый файл → скачивание, без автоматического report cron.
- [x] Drive ZIP только вручную: кнопка → очередь → файл → скачивание. Cron нет.
- [x] WhatsApp: крон-ремонт и batch-reconcile **удалены** (старые мигрированные продукты без группы не трогать). Очередь и воркер оставить. Тихий auto-create при новом Product / Deal Won **выключен**.
- [x] **План — WhatsApp на Won (PRODUCT / OUTSOURCE):** перед успешным закрытием модалка, **без кнопки «пропустить»**. Два пути: (1) «Создать группу» — очередь как сейчас; если WAHA лежит и создание упало — **всё равно можно идти дальше**; когда WAHA живой — группа создаётся. (2) Вставить ID уже существующей группы и сохранить — тоже можно идти дальше. Автокод `ensure` не удалять; тихий вызов при Product/Won выключен, чтобы группу не создавало незаметно. MAINTENANCE / EXTENSION — не этот гейт (новую группу не плодить). Та же логика, если WhatsApp снова отвалится.
- [x] **Client Services cron** — на проде вкл (`SCHEDULER_CLIENT_SERVICES_RENEWAL_INVOICE_ENABLED`). Ежедневно 06:00 Yerevan, `WE_PAY` + `renewal_date` ≤ 60 дней → idempotent Invoice Card. `REMINDER_ONLY` — без invoice. Не путать с пунктом 8 (Expense Plan).
- [x] Удалить из кода лишний cron «ежемесячные расходы» (`runMonthlyExpenses` / пункт 2): это не биллинг и не планы, а старый клон карточек `PLANNED` по категории. Оставить пункт 8.
- [x] Удалить из кода лишний cron чистки только секретов (пункт 10). Оставить единую корзину (пункт 9).
- [ ] После того как новый вход (Auth Session V2) полностью заменит старый JWT и все зайдут по-новому — удалить legacy-логин (v1) и denylist. Сейчас не трогать: иначе никто не войдёт. Джоба 14 включать только вместе с V2.
- [ ] Включать scheduler-cron только по реестру `docs/architecture/scheduler-cron-roster.md`, не пакетом.
- [ ] Добавить production-мониторинг ошибок BullMQ jobs и Scheduler runs с понятными уведомлениями.
- [ ] Вынести ops-токены из `.env.local` приложения и заменить секреты, если скриншоты или ENV попадали третьим лицам.
- [ ] Парковка / watch: уменьшить расход Redis-команд от API, Worker, Scheduler и BullMQ — **только если** после `nbos-redis` RAM/CPU на VPS станет заметным (Upstash burn больше не актуален).
