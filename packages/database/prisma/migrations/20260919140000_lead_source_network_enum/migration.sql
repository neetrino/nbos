-- Additive CRM From value. Do not rewrite historic SALES + NETWORKING channel rows.
-- PostgreSQL requires the new enum value to be committed before later INSERT usage.

ALTER TYPE "LeadSourceEnum" ADD VALUE IF NOT EXISTS 'NETWORK';
