-- Partner accrual journal line type (separate migration: PG commits enum value add distinctly).
ALTER TYPE "JournalSourceTypeEnum" ADD VALUE 'PARTNER_ACCRUAL';
