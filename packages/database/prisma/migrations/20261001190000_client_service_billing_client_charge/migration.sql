-- Existing WE_PAY rows are Client Charge: the client pays us, then we pay the provider.
ALTER TYPE "ClientServiceBillingModel" RENAME VALUE 'WE_PAY' TO 'CLIENT_CHARGE';
