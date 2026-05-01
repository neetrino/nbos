# Upload, Versioning And Lifecycle

## 1. Upload Flows

Файл можно добавить из:

- Drive main page;
- Deal card;
- Lead card;
- Project shell;
- Product page;
- Extension card;
- Delivery Board card;
- Task card;
- Work Space;
- Support Ticket;
- Invoice Card;
- Expense Card;
- Partner card;
- Contact / Company / Client Portfolio;
- My Company / SOP / Templates.

Главное правило: пользователь не должен отдельно думать, куда потом перенести файл. Контекст загрузки автоматически создаёт нужные links.

---

## 2. Standard Upload Process

```text
User selects file
  -> NBOS creates upload session
  -> File is uploaded to R2
  -> NBOS creates File Asset
  -> NBOS creates File Version #1
  -> NBOS creates File Link to source entity
  -> NBOS assigns purpose and retention policy
  -> NBOS writes audit event
```

Если upload не завершился, запись должна стать `Failed Upload Session`, а не мусором в активной библиотеке.

---

## 3. Context Defaults

| Source                  | Default purpose                          | Default visibility                              |
| ----------------------- | ---------------------------------------- | ----------------------------------------------- |
| Deal Send Offer         | `OFFER_SENT`                             | Internal / CRM users                            |
| Deal Get Answer proof   | `MESSENGER_PROOF`                        | Internal / CRM users                            |
| Deal Won approved offer | `OFFER_APPROVED`                         | Project Team + restricted commercial visibility |
| Product page            | `WORKSPACE_ARTIFACT` or selected purpose | Project Team                                    |
| Work Space task         | `TASK_ATTACHMENT`                        | Task participants + workspace access            |
| QA task                 | `QA_EVIDENCE`                            | Product team                                    |
| Transfer / Done         | `DELIVERY_FILE`                          | Product team, client visible if marked          |
| Invoice Card            | `PAYMENT_PROOF` or `INVOICE_DOCUMENT`    | Finance Restricted                              |
| Expense Card            | `EXPENSE_PROOF`                          | Finance Restricted                              |
| Partner Agreement       | `PARTNER_AGREEMENT`                      | Legal/Finance/Partner managers                  |
| Support Ticket          | `SUPPORT_EVIDENCE`                       | Support + product team                          |
| SOP                     | `SOP_DOCUMENT`                           | Company Library                                 |

---

## 4. Versioning Rules

When uploading a file with the same business purpose in the same context, NBOS should ask:

- add as new file;
- upload new version;
- replace draft;
- mark old version archived.

For approved documents:

- old version remains available;
- new version requires reason;
- audit records who changed it;
- linked entities show current version but allow history.

---

## 5. Offer Versioning

Offer is special.

CRM may have many offer materials:

- first PDF;
- updated PDF;
- screenshot from messenger;
- final approved PDF;
- final approved screenshot.

Deal stage gate should require at least one valid offer material before moving forward.

At Deal Won:

- one or more files must be marked as `OFFER_APPROVED`;
- approved offer is linked to Product / Project / Client;
- draft offers stay in Deal archive;
- Product handoff uses approved offer as source document.

---

## 6. Task Files Lifecycle

Task files can create a lot of noise.

Rules:

1. Temporary task attachments start as `Draft` or `Active`.
2. If task output is important, user or automation marks it as `Final Artifact`.
3. Final Artifact is linked to Product / Work Space Library.
4. Non-final task files can be archived after a retention period.
5. Deleted task does not instantly delete files; it removes task link and sends file to cleanup candidate if no other links exist.

---

## 7. Deletion

Delete must be safe.

| Action        | Meaning                                                     |
| ------------- | ----------------------------------------------------------- |
| `Unlink`      | Remove file from this entity only                           |
| `Archive`     | Keep file but hide from active views                        |
| `Soft Delete` | Mark deleted, recoverable                                   |
| `Hard Delete` | Remove physical object from R2, only through cleanup policy |

If a file has multiple links, delete from one card should usually unlink, not delete the physical file.

---

## 8. Lifecycle Status

```text
Uploading
  -> Active
  -> Approved
  -> Archived
  -> Deleted
  -> Purged
```

Alternative paths:

```text
Uploading -> Failed
Active -> Archived
Active -> Deleted
Deleted -> Restored
Archived -> Restored
```

---

## 9. Required File Gates

Drive supports stage gates in other modules.

Examples:

- Deal cannot move past Send Offer without valid offer material.
- Product cannot be marked Done without required delivery files, if rule enabled.
- Task cannot close if completion rule requires attached file.
- Invoice official request cannot be considered sent without WP message event/proof, if required.
- Partner agreement cannot become Active without agreement document or approved manual override.

Drive does not decide the business process. It gives modules a reliable way to check file requirements.
