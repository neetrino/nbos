-- Expand CredentialCategoryEnum. New values cannot be used in the same
-- transaction as ADD VALUE on older PostgreSQL — consume them in the next migration.

ALTER TYPE "CredentialCategoryEnum" ADD VALUE IF NOT EXISTS 'ENV';
ALTER TYPE "CredentialCategoryEnum" ADD VALUE IF NOT EXISTS 'SSH';
