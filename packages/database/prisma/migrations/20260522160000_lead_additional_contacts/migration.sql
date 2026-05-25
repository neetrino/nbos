-- CreateTable
CREATE TABLE "lead_additional_contacts" (
    "lead_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,

    CONSTRAINT "lead_additional_contacts_pkey" PRIMARY KEY ("lead_id","contact_id")
);

-- AddForeignKey
ALTER TABLE "lead_additional_contacts" ADD CONSTRAINT "lead_additional_contacts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_additional_contacts" ADD CONSTRAINT "lead_additional_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
