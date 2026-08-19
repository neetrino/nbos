-- Extra Contact phones. Primary stays contacts.phone; lookup uses either slot.

CREATE TABLE "contact_phones" (
    "id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "e164" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_phones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contact_phones_contact_id_e164_key" ON "contact_phones"("contact_id", "e164");

CREATE INDEX "contact_phones_e164_idx" ON "contact_phones"("e164");

CREATE INDEX "contacts_phone_idx" ON "contacts"("phone");

ALTER TABLE "contact_phones"
  ADD CONSTRAINT "contact_phones_contact_id_fkey"
  FOREIGN KEY ("contact_id") REFERENCES "contacts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
