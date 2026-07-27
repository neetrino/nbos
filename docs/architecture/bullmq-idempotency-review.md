# Idempotency review — BullMQ processors (Phase 3.6)

| Queue                   | Double-run risk                                 | DB unique / status             | External key                | Notes                                                                                    |
| ----------------------- | ----------------------------------------------- | ------------------------------ | --------------------------- | ---------------------------------------------------------------------------------------- |
| mail sync               | Re-sync IMAP/Gmail                              | Account id                     | none                        | Re-sync is mostly idempotent (upsert messages).                                          |
| mail send               | **Could send twice** if no delivery status gate | Message row status             | none                        | `enqueueSend` unused; compose sends inline today. Remediation: gate on SENT before SMTP. |
| reports.export          | Duplicate file if status not gated              | `ReportExportJob` + jobId      | BullMQ `jobId`              | `processExportJob` must no-op when COMPLETED.                                            |
| drive.zip-export        | Same as reports                                 | `DriveZipExportJob` + jobId    | BullMQ `jobId`              | Conditional status transition required.                                                  |
| whatsapp.product-groups | Create/invite dupes                             | Operation status + dedupe keys | `whatsapp-op:{operationId}` | Early return on SUCCEEDED/SKIPPED/OUTCOME_UNKNOWN; conditional PROCESSING lock.          |

Critical gaps to track (not blocking worker split): mail outbound send path lacks queue idempotency record; keep sync fallbacks off in production.
