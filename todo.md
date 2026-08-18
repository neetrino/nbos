# NBOS — актуальные задачи

Очередь сейчас: Mail BullMQ migration. WhatsApp-очередь оставляем. Upstash на проде больше не нужен.

- [ ] Завершить Mail: отправку и синхронизацию полностью перевести на BullMQ Worker, удалить старые stub/direct-пути и добавить end-to-end тест.
- [ ] Локальный Redis: на ноутбуке `REDIS_URL` закомментирован — так и оставить (не прод). Второй компьютер проверить так же. Dev-Redis позже свой/локальный, не Upstash и не prod `nbos-redis`.
- [x] Прод Redis: `nbos-redis`, TLS `rediss://:6380`, AOF + `maxmemory 256mb` + `noeviction`, 6379 закрыт. Runtime `REDIS_URL` у api / worker / scheduler. Preview-ключи Coolify на Upstash ничего не жрут, пока нет Preview-деплоя. Upstash аккаунт можно удалить.
- [ ] Найти и уменьшить постоянный расход Redis-команд от API, Worker, Scheduler и BullMQ без риска потерять очередь задач (после своего Redis — только если расход RAM/CPU на VPS станет заметным).
- [ ] Оставить создание отчётов только ручным: кнопка → очередь → готовый файл → скачивание, без автоматического report cron.
- [ ] Оставить создание Drive ZIP только ручным: кнопка → очередь → готовый ZIP → скачивание, без cron.
- [ ] WhatsApp-группа продукта: очередь и воркер **оставить**. Cron групп не включать. Позже — честная кнопка: статус «создаём…», повтор через ~10 с если упало. Не вырезать BullMQ.
- [x] **Client Services cron** — `SCHEDULER_CLIENT_SERVICES_RENEWAL_INVOICE_ENABLED` (default off): ежедневно 06:00 Yerevan, `WE_PAY` + `renewal_date` ≤ 60 дней → idempotent Invoice Card. `REMINDER_ONLY` — без invoice. Не путать с пунктом 8 (Expense Plan).
- [x] Удалить из кода лишний cron «ежемесячные расходы» (`runMonthlyExpenses` / пункт 2): это не биллинг и не планы, а старый клон карточек `PLANNED` по категории. Оставить пункт 8.
- [x] Удалить из кода лишний cron чистки только секретов (пункт 10). Оставить единую корзину (пункт 9).
- [ ] После того как новый вход (Auth Session V2) полностью заменит старый JWT и все зайдут по-новому — удалить legacy-логин (v1) и denylist. Сейчас не трогать: иначе никто не войдёт. Джоба 14 включать только вместе с V2.
- [ ] Включать scheduler-cron только по реестру `docs/architecture/scheduler-cron-roster.md`, не пакетом.
- [ ] Добавить production-мониторинг ошибок BullMQ jobs и Scheduler runs с понятными уведомлениями.
- [ ] Вынести ops-токены из `.env.local` приложения и заменить секреты, если скриншоты или ENV попадали третьим лицам.
