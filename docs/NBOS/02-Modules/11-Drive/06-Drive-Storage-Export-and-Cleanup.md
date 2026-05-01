# Storage, Export And Cleanup

## 1. Physical Storage Principle

R2 should be readable by humans, but business truth lives in NBOS database.

Physical storage key must help emergency work:

- understand module/context;
- identify project/client/product;
- identify file purpose;
- find file date;
- avoid name collisions.

But physical folder should not be used as permission source or business status source.

---

## 2. Recommended R2 Layout

```text
nbos/
  company-neetrino/
    files/
      crm/
        deals/
          deal-{dealCode}-{slug}/
            offers/
            screenshots/
            contracts/
            briefs/

      projects/
        project-{projectCode}-{slug}/
          _project/
            commercial/
            handoff/
            finance/
          product-{productCode}-{slug}/
            approved-offers/
            handoff/
            design/
            development/
            qa/
            delivery/
            support/
            workspace/
          extension-{extensionCode}-{slug}/
            approved-offers/
            scope/
            development/
            qa/
            delivery/

      clients/
        company-{companyId}-{slug}/
          legal/
          commercial/
          finance/
        contact-{contactId}-{slug}/
          personal-context/

      finance/
        invoices/
        payments/
        expenses/
        payroll/
        partner-payouts/

      partners/
        partner-{partnerId}-{slug}/
          agreements/
          payouts/
          shared/

      tasks/
        task-{taskCode}/

      workspaces/
        workspace-{workspaceId}-{slug}/
          backlog/
          sprints/
          artifacts/

      support/
        ticket-{ticketCode}/

      company-library/
        templates/
        sop/
        brand/
        training/
        shared/

    _archive/
    _trash/
    _exports/
    _manifests/
```

---

## 3. File Naming

Recommended object filename:

```text
YYYY-MM-DD__purpose__short-name__fileId__v{version}.ext
```

Examples:

```text
2026-04-25__offer-approved__marco-website__f_123__v3.pdf
2026-04-25__messenger-proof__price-confirmed__f_124__v1.png
2026-05-02__payment-proof__invoice-889__f_222__v1.pdf
```

Rules:

- include date;
- include purpose;
- include stable file ID;
- include version;
- sanitize names;
- never rely only on original uploaded filename.

---

## 4. Storage Home Vs Logical Links

Each file has one `storage_home`.

Example:

Offer uploaded in CRM:

```text
storage_home:
crm/deals/deal-123-marco-am/offers/2026-04-25__offer-sent__f_1__v1.pdf
```

After Deal Won, NBOS adds links to Product and Client, but does not copy the file.

If owner exports Product Library, the offer appears in the ZIP under Product folder through export manifest, not because it was physically copied.

---

## 5. Export And Backup

Drive must include `Export Job` functionality.

Export types:

| Export                    | What it downloads                                            |
| ------------------------- | ------------------------------------------------------------ |
| `Project Export`          | All or selected project files                                |
| `Product Export`          | Product library with approved offer, handoff, delivery files |
| `Client Export`           | Client/company documents                                     |
| `Offer Export`            | All offer materials by period/client/seller/status           |
| `Meeting Export`          | Meeting recordings and notes by period/project               |
| `Call Export`             | Call recordings by period/contact/project                    |
| `Finance Export`          | Finance documents by period/type                             |
| `Partner Export`          | Partner agreements and payout documents                      |
| `Task Attachments Export` | Task files by workspace/project/period                       |
| `Full Backup Manifest`    | Metadata + file list for full backup                         |

Export should generate:

- ZIP file;
- manifest JSON/CSV;
- audit event;
- optional expiration date.

---

## 6. Export Manifest

Every export should include manifest:

| Field             | Meaning                           |
| ----------------- | --------------------------------- |
| `file_id`         | File Asset ID                     |
| `display_name`    | Human name                        |
| `purpose`         | Purpose                           |
| `source_module`   | Where it came from                |
| `linked_entities` | Related Deal/Product/Invoice/etc. |
| `version`         | Version included                  |
| `storage_key`     | R2 key                            |
| `checksum`        | Integrity check                   |
| `export_path`     | Path inside ZIP                   |

This makes backup usable even outside NBOS.

---

## 7. Cleanup Policy

Cleanup must be managed from NBOS, not by random manual R2 deletion.

Cleanup candidate categories:

- orphan files with no active links;
- failed upload leftovers;
- old draft versions;
- task-only attachments older than retention period;
- duplicate files by checksum;
- archived support files;
- temporary exports;
- soft-deleted files past retention;
- oversized files without active business purpose.

---

## 8. Task Attachment Cleanup

Task attachments need special policy because they are often temporary.

Recommended policy:

| File type             | Default retention                                |
| --------------------- | ------------------------------------------------ |
| Task draft attachment | 90-180 days after task close                     |
| Task final artifact   | Keep with Product/Work Space                     |
| QA evidence           | Keep until project archive, longer for incidents |
| Support evidence      | Keep by support retention policy                 |
| Completion proof      | Keep if completion rule depended on it           |

Before cleanup, NBOS must show:

- file count;
- total size;
- links;
- last access;
- reason it is cleanup candidate.

---

## 9. Archive And Trash

`_archive` is for files still valuable but not active.

`_trash` is for soft-deleted files waiting for purge.

Hard delete only if:

- retention passed;
- file has no active required links;
- file is not approved/legal/finance protected;
- user has permission;
- audit event is written.

---

## 10. Storage Dashboard

Drive should have an admin storage dashboard:

- total storage used;
- storage by module;
- storage by project/client;
- largest files;
- old drafts;
- task attachments volume;
- exports volume;
- orphan files;
- cleanup candidates;
- archive size.

This is important because Drive will grow faster than most modules.
