-- CreateTable
CREATE TABLE "deal_additional_contacts" (
    "deal_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,

    CONSTRAINT "deal_additional_contacts_pkey" PRIMARY KEY ("deal_id","contact_id")
);

-- AddForeignKey
ALTER TABLE "deal_additional_contacts" ADD CONSTRAINT "deal_additional_contacts_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_additional_contacts" ADD CONSTRAINT "deal_additional_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
