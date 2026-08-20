# NBOS — актуальные задачи

Сделано (2026-08-20): Mail leftover на проде закрыт (очередь, inbound, unique mailbox, attachments, jobId, cron по одному, Redis `nbos-redis`). WhatsApp Won, Drive ZIP вручную, Client Services cron, лишние expense/secrets cron сняты.

Дальше:

- [x] **Mail IMAP вложения — стабильный part id:** sync пишет cid или `imap-part:{BODYSTRUCTURE section}`; download FETCH'ит секцию. Старые `part:{n}:файл` — fallback на Retry (в т.ч. если индекс mailparser съехал). Gmail не трогали. Письма в БД не мигрировали.
- [x] Отчёты: ручная полка Report files + расписание (день / неделя / месяц) → очередь → файл. Cron `REPORT_SCHEDULES_DUE_CRON_ENABLED`.
- [x] Отчёты: письмо Owner/CEO с вложением после появления файла (расписание и Create file now).
- [ ] [owner-security.md](http://owner-security.md)
- [ ] [ai-modul-steps.md](http://ai-modul-steps.md)
- [ ] После того как новый вход (Auth Session V2) полностью заменит старый JWT и все зайдут по-новому — удалить legacy-логин (v1) и denylist. Сейчас не трогать: иначе никто не войдёт. Джоба 14 включать только вместе с V2.
- [x] Добавить production-мониторинг ошибок BullMQ jobs и Scheduler runs с понятными уведомлениями.
- [ ] Вынести ops-токены из `.env.local` приложения и заменить секреты, если скриншоты или ENV попадали третьим лицам.
- [ ] Парковка / watch: уменьшить расход Redis-команд от API, Worker, Scheduler и BullMQ — **только если** после `nbos-redis` RAM/CPU на VPS станет заметным.
- [ ] **Contact ↔ Product (не сейчас):** после Lead «Связать» / create-contact-from-lead — сначала canon NBOS, потом проектировать Contact ↔ Product.
- [x] ~~Включать scheduler-cron только по реестру, не пакетом~~ Не актуально: вкл/выкл уже по одной джобе в Settings, не пакет env. Реестр — журнал, не замок.
