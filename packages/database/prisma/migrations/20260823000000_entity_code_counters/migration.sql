-- Fixes the concurrent Task-code collision recorded as C23 in the AI cleanup register:
-- generating a code by reading the current maximum and then inserting races, so two
-- parallel creates produced the same code and the loser failed on tasks.code UNIQUE.
--
-- Additive: one new table plus a seed read from tasks. No existing row is rewritten,
-- no column is dropped, no index is built on an existing table.
--
-- Rolling-deploy safe in both directions. Old application instances keep using the
-- read-then-insert path and are unaffected by a table they never touch; new instances
-- allocate from the counter, which is seeded at or above every existing code.
--
-- Risk: LOW.

CREATE TABLE "entity_code_counters" (
  "scope"      TEXT         NOT NULL,
  "year"       INTEGER      NOT NULL,
  "next_value" INTEGER      NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "entity_code_counters_pkey" PRIMARY KEY ("scope", "year")
);

-- Seed the TASK scope so the first allocation cannot collide with a pre-existing code.
--
-- The suffix is compared as an integer rather than as text: lexicographically
-- 'T-2026-9999' sorts above 'T-2026-10000', which is the defect that produced
-- duplicate codes in the first place. Rows whose code does not match the canonical
-- 'T-<year>-<digits>' shape are ignored rather than guessed at; a year with no
-- conforming row simply gets no seed and starts at 1 on first allocation.
INSERT INTO "entity_code_counters" ("scope", "year", "next_value")
SELECT
  'TASK',
  CAST(SUBSTRING("code" FROM '^T-(\d{4})-') AS INTEGER),
  MAX(CAST(SUBSTRING("code" FROM '^T-\d{4}-(\d+)$') AS INTEGER))
FROM "tasks"
WHERE "code" ~ '^T-\d{4}-\d+$'
GROUP BY 1, 2;
