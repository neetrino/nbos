# Credentials / Password Vault

> NBOS Platform - профессиональное защищённое хранилище доступов компании

## Назначение Модуля

`Credentials / Password Vault` - это не таблица паролей и не простой список логинов.

Это центральная безопасная система, где компания хранит, ищет, выдаёт, контролирует и обновляет все рабочие доступы:

- пароли;
- API keys и tokens;
- SSH/private keys;
- database credentials;
- `.env` данные;
- доменные и hosting-доступы;
- сервисные аккаунты;
- recovery codes;
- доступы к приложениям, cloud-сервисам, CRM, аналитике, маркетингу, разработке и финансовым сервисам.

Главная задача модуля - чтобы при 1000+ доступов команда могла быстро найти нужный доступ, безопасно использовать его и чтобы owner компании всегда понимал:

- где хранится доступ;
- кто имеет право его видеть;
- кто реально его открывал или копировал;
- какие доступы устарели;
- что нужно поменять при увольнении сотрудника;
- какие секреты связаны с конкретным Project / Product / Client Service.

## Ключевой Принцип

Ни один пароль, API key, private key или `.env` не должен храниться в Messenger, Drive, Task comments, Google Docs, Excel или личных заметках.

Любой secret должен жить только в `Credentials Vault`.

Drive может хранить supporting documents, инструкции, invoices, публичные setup-документы, но не сами секреты.

Если secret найден в Drive, Messenger или обычном файле - это security incident. Его нужно перенести в Credentials, удалить/заархивировать небезопасную копию и зафиксировать событие.

---

## Граница Модуля

### Что Делает Credentials

- хранит секреты;
- шифрует секретные поля;
- показывает доступы по правам;
- даёт быстрый поиск по безопасным metadata;
- логирует просмотр, копирование, изменение, экспорт и выдачу доступа;
- управляет доступами сотрудников;
- поддерживает временный доступ;
- поддерживает emergency access;
- контролирует rotation / overdue credentials;
- связывает доступы с Project, Product, Client Service, Domain, Hosting, Finance и Support.

### Что Не Делает Credentials

- не хранит обычные файлы проекта - это зона Drive;
- не заменяет Messenger - обсуждение остаётся в Messenger/Task chat;
- не хранит финансовые документы - это Finance + Drive;
- не является task manager - задачи на rotation/offboarding создаются через Task / Notification Engine;
- не является IAM для входа в сам NBOS, но может хранить внешние сервисные доступы.

---

## Структура Документации Модуля

| Файл                                 | Что смотреть                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `01-Credentials-Vault.md`            | назначение, границы, главные принципы и принятые решения                                   |
| `02-Credentials-Data-Model.md`       | сущности, типы credential, secret fields, context, access grants, обязательные поля        |
| `03-Credentials-Security.md`         | безопасность, encryption, reveal/copy, audit, backup/export, emergency access, offboarding |
| `04-Credentials-UX-Workflows.md`     | интерфейс, views, поиск, карточка, quick actions, daily workflows                          |
| `05-Credentials-Integrations.md`     | связи с Project Hub, Finance, Drive, Messenger, Tasks, Notifications, My Company           |
| `99-Credentials-Cleanup-Register.md` | что в текущем runtime нужно переделать по новому канону                                    |

---

## Принятые Решения Owner

- Credentials должен быть полноценной профессиональной vault-системой, а не простой таблицей паролей.
- UX должен быть удобен для 1000+ доступов.
- Система должна быть максимально безопасной.
- Доступы должны быть связаны с Project/Product и другими бизнес-сущностями.
- Secrets нельзя хранить в Drive/Messenger/Task comments.
- Нужны audit, access requests, rotation, emergency access и offboarding cleanup.
- Текущая реализация считается MVP и требует cleanup/refactor по новому канону.
