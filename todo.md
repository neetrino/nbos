# NBOS — актуальные задачи

Сделано (2026-08-20): Mail leftover на проде закрыт (очередь, inbound, unique mailbox, attachments, jobId, cron по одному, Redis `nbos-redis`). WhatsApp Won, Drive ZIP вручную, Client Services cron, лишние expense/secrets cron сняты.

Дальше:

- [ ] Auth Session V2 — канон: [`docs/NBOS/01-Platform-Overview/06-Authentication-and-Sessions.md`](docs/NBOS/01-Platform-Overview/06-Authentication-and-Sessions.md). Вход только V2 (короткий access + refresh). Старый 7d JWT больше не выдаётся и не принимается.
- [ ] [ai-modul-steps.md](http://ai-modul-steps.md)
