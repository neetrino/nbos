# Credentials Integrations

> Связи Password Vault с остальными модулями NBOS

## Project / Product Credentials

В карточке Project и Product должна быть вкладка `Credentials`.

Она показывает:

- credentials, напрямую привязанные к Project;
- credentials, привязанные к Product;
- credentials, связанные с Client Services этого Project/Product;
- credentials, связанные с Domain/Hosting/Subscription;
- supporting docs из Drive без secrets.

### Product Credentials

Product обычно требует доступы:

- hosting;
- domain/DNS;
- database;
- deployment;
- source repository;
- API integrations;
- admin panel;
- email/SMTP;
- analytics;
- payment provider;
- third-party services.

### Extension Credentials

Extension обычно использует доступы основного Product.

Если extension требует новый service/API, создаётся отдельный credential, но привязывается к тому же Product и Extension context.

### Maintenance Credentials

Maintenance использует те же Product credentials.

Если maintenance требует support-only доступ, он должен иметь отдельный access policy.

---

## Project Hub

- Project и Product имеют вкладку `Credentials`.
- Product показывает свои доступы и доступы связанных Client Services.
- Extension использует Product credentials или добавляет свои.

## Finance

Finance не хранит пароли.

Связи:

- Domain/Hosting/Client Service может ссылаться на Credential;
- Finance видит только metadata, если нет доступа к secret;
- payment/accounting credentials должны иметь restricted policy.

## Drive

Drive не хранит secrets.

Drive может хранить:

- provider invoices;
- setup guides;
- public certificates, если policy разрешает;
- screenshots без secrets;
- signed documents.

Если Drive asset содержит secret, это incident.

## Messenger

Messenger не должен быть местом передачи паролей.

Если secret отправлен в Messenger:

- сообщение нужно считать incident;
- secret переносится в Credentials;
- secret rotates, если риск высокий;
- создаётся audit/security note.

## Tasks / Work Space

Tasks могут создаваться из Credentials:

- rotate credential;
- verify access;
- migrate secret;
- revoke access;
- offboarding cleanup;
- incident cleanup.

Task comments не должны содержать secret.

## Notifications

Notification Engine отвечает за:

- access request;
- access approved/rejected;
- rotation due/overdue;
- emergency access used;
- export completed;
- backup failed;
- offboarding risk;
- secret incident.

## My Company

Credentials должны учитывать:

- Employee;
- Seat;
- Department;
- employment status;
- offboarding;
- role/permission policy.

При смене seat/department доступы должны пересматриваться.
