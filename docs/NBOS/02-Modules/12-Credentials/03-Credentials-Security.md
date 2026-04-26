# Credentials Security

> Безопасность, audit, backup и emergency rules для Password Vault

## Шифрование

Все secret fields должны шифроваться.

Минимальный стандарт:

- AES-256-GCM или эквивалентный authenticated encryption;
- field-level encryption;
- unique IV/nonce per encryption;
- secret values не пишутся в logs;
- secret values не возвращаются в list API;
- secret values возвращаются только через controlled reveal/copy endpoint.

Целевая профессиональная модель:

- per-item data encryption key;
- master key / KMS key отдельно от базы;
- key rotation strategy;
- encrypted backups;
- audit for decrypt/reveal/copy/export;
- no plaintext secrets in server logs, browser logs, analytics, error trackers.

## Reveal / Copy

Secret скрыт по умолчанию.

Reveal/copy должны требовать:

- permission check;
- optional step-up auth для critical secrets;
- audit log;
- auto-hide;
- clipboard clear best effort;
- notification для high-risk actions, если policy требует.

## Step-Up Auth

Для опасных действий нужна повторная проверка пользователя:

- reveal critical secret;
- full export;
- emergency access;
- permission change для critical credential;
- просмотр старых версий secret;
- permanent delete.

Step-up может быть:

- повторный пароль;
- 2FA;
- short-lived security session.

## Emergency Access / Break Glass

CEO / Owner должен иметь возможность получить emergency access, если проект нужно срочно спасти.

Правила:

- доступ выдаётся только с reason;
- срок доступа ограничен;
- действие логируется как high-risk;
- owner/security получает notification;
- после emergency access может создаваться rotation task.

## Offboarding

При увольнении или смене роли сотрудника система должна показать:

- credentials, к которым сотрудник имел доступ;
- credentials, которые сотрудник копировал/revealed за период;
- credentials, где сотрудник был owner;
- recommended rotation list;
- access grants to revoke;
- open access requests.

Для critical credentials создаются tasks на rotation.

## Secret Incident

Secret incident возникает, если:

- пароль найден в Drive file;
- API key отправлен в Messenger;
- secret вставлен в Task comment;
- доступ был выдан неправильному сотруднику;
- сотрудник с доступом уволен, но rotation не сделан;
- credential exported небезопасно.

Incident должен фиксироваться и вести к cleanup/rotation.

---

## Audit Log

Audit должен быть append-only.

События:

- credential created;
- metadata updated;
- secret field created;
- secret field updated;
- secret revealed;
- secret copied;
- URL opened;
- access requested;
- access approved/rejected;
- access granted/revoked;
- access expired;
- export started/completed/failed;
- backup created/restored;
- emergency access used;
- credential archived/restored/permanently deleted;
- rotation completed;
- rotation overdue;
- ownership changed.

В audit нельзя писать plaintext secret.

Audit должен фильтроваться по:

- credential;
- employee;
- project;
- product;
- client;
- action;
- period;
- risk level.

---

## Backup / Export

Credentials backup критичен, потому что потеря vault может остановить компанию.

### Правила Export

- полный export доступен только CEO/Admin;
- export всегда encrypted;
- unencrypted CSV запрещён;
- full export требует step-up auth;
- export фиксируется в audit;
- желательно two-person approval для full export;
- export file должен иметь срок хранения и понятную процедуру уничтожения.

### Automatic Backup

Автоматический backup:

- encrypted;
- scheduled;
- хранится отдельно от основной базы;
- имеет retention policy;
- имеет restore test policy;
- уведомляет CEO/Admin о результате.

### Selective Export

Selective export может быть нужен для:

- передачи клиенту его доступов;
- backup конкретного Project;
- migration;
- incident response.

Он тоже должен быть encrypted и audited.

---

## Права И Роли

Права должны строиться не только по должности, а по комбинации:

- global permission;
- access grant;
- project/product membership;
- seat/department;
- credential criticality;
- emergency policy.

### Базовые Права

| Capability               | Кто может                                   |
| ------------------------ | ------------------------------------------- |
| View credential metadata | пользователи с доступом к context или grant |
| Reveal/copy secret       | только пользователи с explicit разрешением  |
| Create credential        | сотрудники с permission `CREDENTIALS ADD`   |
| Edit metadata            | owner/custodian/admin                       |
| Edit secret              | owner/custodian/admin или approved editor   |
| Grant access             | owner/custodian/PM/CEO по policy            |
| Export selected          | admin policy                                |
| Full export              | CEO/Admin + step-up                         |
| Emergency access         | CEO/Owner policy                            |
| Permanent delete         | CEO/Admin + step-up                         |

---

## Health Score

Для каждого credential полезно показывать health.

Примеры статусов:

- `Healthy`;
- `Missing Owner`;
- `Missing Context`;
- `Too Broad Access`;
- `Rotation Due Soon`;
- `Rotation Overdue`;
- `Unused`;
- `Duplicate`;
- `Compromised`;
- `Needs Review`.

Health помогает быстро увидеть, где vault опасен.
