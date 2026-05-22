-- CreateTable
CREATE TABLE "project_additional_contacts" (
    "project_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,

    CONSTRAINT "project_additional_contacts_pkey" PRIMARY KEY ("project_id","contact_id")
);

-- AddForeignKey
ALTER TABLE "project_additional_contacts" ADD CONSTRAINT "project_additional_contacts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_additional_contacts" ADD CONSTRAINT "project_additional_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
