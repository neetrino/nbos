-- Rename ClientServiceBillingModel enum values to action-oriented names.
ALTER TYPE "ClientServiceBillingModel" RENAME VALUE 'CLIENT_PAID' TO 'WE_PAY';
ALTER TYPE "ClientServiceBillingModel" RENAME VALUE 'COMPANY_PAID' TO 'REMINDER_ONLY';
