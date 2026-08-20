# NBOS — актуальные задачи

Сделано (2026-08-20): Mail leftover на проде закрыт (очередь, inbound, unique mailbox, attachments, jobId, cron по одному, Redis `nbos-redis`). WhatsApp Won, Drive ZIP вручную, Client Services cron, лишние expense/secrets cron сняты.

Дальше:

- [ ] [ai-modul-steps.md](http://ai-modul-steps.md)
- [ ] [auth-v2.md](http://auth-v2.md) После того как новый вход (Auth Session V2) полностью заменит старый JWT и все зайдут по-новому — удалить legacy-логин (v1) и denylist. Сейчас не трогать: иначе никто не войдёт. Джоба 14 включать только вместе с V2.