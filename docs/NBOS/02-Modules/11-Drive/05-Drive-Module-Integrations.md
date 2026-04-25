# Drive Module Integrations

## 1. CRM

CRM uses Drive for:

- offer files;
- offer links;
- messenger screenshots;
- contracts;
- client briefs;
- commercial proofs.

Deal stage gates can require Drive files:

- `Send Offer` requires valid offer material;
- `Deposit & Contract` can require contract / invoice-related document;
- `Deal Won` for Product / Extension / Outsource should have approved offer and required commercial context.

At `Deal Won`, Drive auto-links approved materials to Project / Product / Client.

---

## 2. Projects Hub

Projects Hub uses Drive at three levels:

- Project shell;
- Product page;
- Extension card.

Project shell shows aggregate library. Product and Extension show operational files.

Handoff from CRM should bring:

- approved offer;
- messenger proof;
- contract, if exists;
- client brief;
- risk notes / special terms;
- finance/payment context documents, depending on permission.

---

## 3. Delivery Board

Delivery cards for Product and Extension should show:

- file count;
- missing required files warning;
- quick attach;
- latest important files;
- final delivery marker.

Moving to `Done` may require delivery files if configured in Product Type rules.

Cancelled cards keep files but mark active work links archived.

---

## 4. Tasks

Task attachments are Drive files.

Task module uses Drive for:

- normal attachments;
- completion rules requiring file;
- review materials;
- result files;
- comments with attachments;
- future task chat files.

If task is linked to Product / Extension / Invoice / Ticket, file can inherit additional contextual links depending on purpose.

---

## 5. Work Space

Work Space is the planning and execution area around tasks.

Drive integration:

- backlog attachments remain inside Work Space until pulled into sprint or marked final;
- sprint artifacts are grouped by sprint;
- task outputs can become Product Library files;
- Scrum documents, recordings and planning files live in Work Space Library;
- future Work Space types can define their own file sections.

Important rule:

Backlog/task files should not pollute Project/Product final libraries unless marked as important or final.

---

## 6. Finance

Finance uses Drive for documents around money, but Finance remains source of truth for amounts, status and payment logic.

Drive stores:

- invoice attachments;
- payment proof;
- official invoice request evidence;
- expense proof;
- partner payout documents;
- payroll exports;
- P&L exports;
- client service receipts.

Finance files default to `Finance Restricted`.

---

## 7. Subscriptions And Client Services

Subscription-generated invoices can attach:

- official invoice request proof;
- payment proof;
- client communication proof;
- generated statements.

Client Service Records can attach:

- domain invoices;
- hosting receipts;
- provider PDFs;
- cancellation confirmations;
- transfer documents.

Credentials for provider accounts remain in Credentials, not Drive.

---

## 8. Clients

Client Portfolio `Files` tab is a Drive view.

It aggregates:

- Contact files;
- Company files;
- Deal files;
- Project/Product files;
- Finance files, only if user has permission;
- Support files;
- approved documents and delivery archives.

Client Library is computed, not manually created as a separate client entity.

---

## 9. Partners

Partners module uses Drive for:

- partner agreements;
- commission policy attachments;
- payout statements;
- partner documents;
- future Partner Account visible files.

Partner portal must only see files marked `Partner Visible`.

---

## 10. Support

Support uses Drive for:

- screenshots;
- customer evidence;
- logs;
- call/video records;
- incident reports;
- resolution documents.

Support files linked to Product should be visible in Product Library under Support History.

---

## 11. Credentials

Drive does not store secrets.

Do not store in Drive:

- passwords;
- `.env`;
- API keys;
- private keys;
- database credentials.

Drive may store:

- setup instructions without secrets;
- provider invoices;
- certificates if approved by security policy;
- public config examples;
- onboarding documents explaining where credentials are stored.

If a file contains secrets, it must be migrated to Credentials or replaced by a credential record.

---

## 12. My Company

My Company uses Drive for:

- SOP attachments;
- templates;
- training materials;
- brand files;
- HR/onboarding documents;
- policy documents.

SOP process logic remains in My Company. Drive stores files and versions.
