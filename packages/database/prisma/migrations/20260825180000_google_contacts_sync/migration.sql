-- Google Contacts org sync: singleton connection, encrypted refresh token, contact mapping.

CREATE TYPE "GoogleContactsConnectionStatus" AS ENUM ('DISCONNECTED', 'CONNECTED', 'ERROR');

CREATE TABLE "google_contacts_connections" (
    "id" TEXT NOT NULL,
    "google_email" TEXT,
    "status" "GoogleContactsConnectionStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "last_synced_at" TIMESTAMP(3),
    "last_error_code" TEXT,
    "last_error_message" TEXT,
    "connected_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_contacts_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "google_contacts_secrets" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "encrypted_secret" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_contacts_secrets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "google_contact_mappings" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "resource_name" TEXT NOT NULL,
    "etag" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "last_error_code" TEXT,
    "last_error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_contact_mappings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "google_contacts_connections_connected_by_user_id_idx"
    ON "google_contacts_connections"("connected_by_user_id");

CREATE UNIQUE INDEX "google_contacts_secrets_connection_id_key"
    ON "google_contacts_secrets"("connection_id");

CREATE UNIQUE INDEX "google_contact_mappings_contact_id_key"
    ON "google_contact_mappings"("contact_id");

CREATE INDEX "google_contact_mappings_resource_name_idx"
    ON "google_contact_mappings"("resource_name");

ALTER TABLE "google_contacts_connections"
    ADD CONSTRAINT "google_contacts_connections_connected_by_user_id_fkey"
    FOREIGN KEY ("connected_by_user_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "google_contacts_secrets"
    ADD CONSTRAINT "google_contacts_secrets_connection_id_fkey"
    FOREIGN KEY ("connection_id") REFERENCES "google_contacts_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "google_contact_mappings"
    ADD CONSTRAINT "google_contact_mappings_contact_id_fkey"
    FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "google_contacts_connections" ("id", "status", "created_at", "updated_at")
VALUES ('google-contacts-org', 'DISCONNECTED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
