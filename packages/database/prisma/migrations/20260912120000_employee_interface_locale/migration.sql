-- Additive personal UI locale. Default en keeps existing employees on English.
-- Writable allowlist (en, ru) is enforced in the API; hy is reserved and rejected on write.

ALTER TABLE "employees" ADD COLUMN "interface_locale" TEXT NOT NULL DEFAULT 'en';
