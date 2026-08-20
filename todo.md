# NBOS — актуальные задачи

Сделано (2026-08-20): Mail leftover на проде закрыт (очередь, inbound, unique mailbox, attachments, jobId, cron по одному, Redis `nbos-redis`). WhatsApp Won, Drive ZIP вручную, Client Services cron, лишние expense/secrets cron сняты.

Дальше:

- [x] **Mail IMAP вложения — стабильный part id:** sync пишет cid или `imap-part:{BODYSTRUCTURE section}`; download FETCH'ит секцию. Старые `part:{n}:файл` — fallback на Retry (в т.ч. если индекс mailparser съехал). Gmail не трогали. Письма в БД не мигрировали.
- [x] Отчёты: ручная полка Report files + расписание (день / неделя / месяц) → очередь → файл. Cron `REPORT_SCHEDULES_DUE_CRON_ENABLED`.
- [x] Отчёты: письмо Owner/CEO с вложением после появления файла (расписание и Create file now).
- [x] [owner-security.md](http://owner-security.md)
- [ ] [ai-modul-steps.md](http://ai-modul-steps.md)
- [ ] После того как новый вход (Auth Session V2) полностью заменит старый JWT и все зайдут по-новому — удалить legacy-логин (v1) и denylist. Сейчас не трогать: иначе никто не войдёт. Джоба 14 включать только вместе с V2.
- [x] Добавить production-мониторинг ошибок BullMQ jobs и Scheduler runs с понятными уведомлениями.
- [x] Вынести ops-токены из `.env.local` приложения и заменить секреты, если скриншоты или ENV попадали третьим лицам.
- [x] Парковка Redis-команд: **не делать.** Проверено 2026-08-20 на `nbos-redis`: ~2.6 MB / 256 MB, CPU ~0.2 %, ~2 ops/s, evicted=0. Срез команд уже в коде (`drainDelay=20s`, `stalledInterval=120s`, без `INFO` ready-check). Возвращаться только если **контейнер Redis** станет заметным по RAM/CPU — не путать со swap хоста.
- [x] **Contact ↔ Product:** канон `07-Contact-and-Product.md` + schema/API/Связать/Won/merge/WhatsApp/UI.
