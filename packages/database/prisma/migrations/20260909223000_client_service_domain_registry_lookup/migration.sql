-- Additive: last WHOIS/RDAP snapshot on Client Service Records.
-- Nullable so existing rows stay valid. Rolling deploy: old writers omit columns.

CREATE TYPE "ClientServiceRegistryLookupStatusEnum" AS ENUM (
  'OBSERVED',
  'NOT_FOUND',
  'NO_EXPIRY',
  'FAILED'
);

CREATE TYPE "ClientServiceRegistryLookupSourceEnum" AS ENUM ('WHOIS', 'RDAP');

ALTER TABLE "client_service_records"
  ADD COLUMN "registry_lookup_status" "ClientServiceRegistryLookupStatusEnum",
  ADD COLUMN "registry_expiry_date" TIMESTAMP(3),
  ADD COLUMN "registry_checked_at" TIMESTAMP(3),
  ADD COLUMN "registry_lookup_source" "ClientServiceRegistryLookupSourceEnum";

CREATE INDEX "client_service_records_type_registry_checked_at_idx"
  ON "client_service_records"("type", "registry_checked_at");
