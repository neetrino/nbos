-- We Pay: the company pays the provider. No client invoice; Finance gets an expense card.
ALTER TYPE "ClientServiceBillingModel" ADD VALUE IF NOT EXISTS 'WE_PAY';
