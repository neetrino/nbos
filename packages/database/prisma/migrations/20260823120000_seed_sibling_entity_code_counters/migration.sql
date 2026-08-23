-- Seeds independent human-readable code series into entity_code_counters (C25).
-- The table already exists from 20260823000000_entity_code_counters (TASK only).
--
-- Additive: INSERT of new (scope, year) rows. No existing row is rewritten,
-- no column is dropped, no index is built on an existing table.
--
-- Suffixes are compared as integers, not as text: lexicographically
-- 'INV-2026-9999' sorts above 'INV-2026-10000'. Rows that do not match
-- '{prefix}-{year}-{digits}' are ignored rather than guessed.
--
-- Rolling deploy is NOT safe. Old writers still derive the next number from
-- MAX(table); one such insert leaves the counter behind the table and the
-- next counter allocation collides with no concurrency. Deploy requires a
-- write pause for every series listed below. See
-- docs/NBOS/02-Modules/21-AI-Platform/34-Post-Phase-1-Chat-2-Code-Allocator-Handoff.md.
--
-- Risk: LOW for schema, MEDIUM for rollout (mixed old/new writers).

INSERT INTO "entity_code_counters" ("scope", "year", "next_value")
SELECT
  'INVOICE',
  CAST(SUBSTRING("code" FROM '^INV-(\d{4})-') AS INTEGER),
  MAX(CAST(SUBSTRING("code" FROM '^INV-\d{4}-(\d+)$') AS INTEGER))
FROM "invoices"
WHERE "code" ~ '^INV-\d{4}-\d+$'
GROUP BY 1, 2;

INSERT INTO "entity_code_counters" ("scope", "year", "next_value")
SELECT
  'SUPPORT_TICKET',
  CAST(SUBSTRING("code" FROM '^TKT-(\d{4})-') AS INTEGER),
  MAX(CAST(SUBSTRING("code" FROM '^TKT-\d{4}-(\d+)$') AS INTEGER))
FROM "support_tickets"
WHERE "code" ~ '^TKT-\d{4}-\d+$'
GROUP BY 1, 2;

INSERT INTO "entity_code_counters" ("scope", "year", "next_value")
SELECT
  'DEAL',
  CAST(SUBSTRING("code" FROM '^D-(\d{4})-') AS INTEGER),
  MAX(CAST(SUBSTRING("code" FROM '^D-\d{4}-(\d+)$') AS INTEGER))
FROM "deals"
WHERE "code" ~ '^D-\d{4}-\d+$'
GROUP BY 1, 2;

INSERT INTO "entity_code_counters" ("scope", "year", "next_value")
SELECT
  'LEAD',
  CAST(SUBSTRING("code" FROM '^L-(\d{4})-') AS INTEGER),
  MAX(CAST(SUBSTRING("code" FROM '^L-\d{4}-(\d+)$') AS INTEGER))
FROM "leads"
WHERE "code" ~ '^L-\d{4}-\d+$'
GROUP BY 1, 2;

INSERT INTO "entity_code_counters" ("scope", "year", "next_value")
SELECT
  'ORDER',
  CAST(SUBSTRING("code" FROM '^ORD-(\d{4})-') AS INTEGER),
  MAX(CAST(SUBSTRING("code" FROM '^ORD-\d{4}-(\d+)$') AS INTEGER))
FROM "orders"
WHERE "code" ~ '^ORD-\d{4}-\d+$'
GROUP BY 1, 2;

INSERT INTO "entity_code_counters" ("scope", "year", "next_value")
SELECT
  'SUBSCRIPTION',
  CAST(SUBSTRING("code" FROM '^SUB-(\d{4})-') AS INTEGER),
  MAX(CAST(SUBSTRING("code" FROM '^SUB-\d{4}-(\d+)$') AS INTEGER))
FROM "subscriptions"
WHERE "code" ~ '^SUB-\d{4}-\d+$'
GROUP BY 1, 2;

INSERT INTO "entity_code_counters" ("scope", "year", "next_value")
SELECT
  'PROJECT',
  CAST(SUBSTRING("code" FROM '^P-(\d{4})-') AS INTEGER),
  MAX(CAST(SUBSTRING("code" FROM '^P-\d{4}-(\d+)$') AS INTEGER))
FROM "projects"
WHERE "code" ~ '^P-\d{4}-\d+$'
GROUP BY 1, 2;
