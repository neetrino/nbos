-- Company primary contact becomes optional; add multi-contact junction (Deal/Project pattern).
ALTER TABLE "companies" ALTER COLUMN "contact_id" DROP NOT NULL;

CREATE TABLE "company_additional_contacts" (
    "company_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,

    CONSTRAINT "company_additional_contacts_pkey" PRIMARY KEY ("company_id","contact_id")
);

ALTER TABLE "company_additional_contacts" ADD CONSTRAINT "company_additional_contacts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_additional_contacts" ADD CONSTRAINT "company_additional_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
