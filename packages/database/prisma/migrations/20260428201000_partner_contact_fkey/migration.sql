-- AddForeignKey
ALTER TABLE "partners" ADD CONSTRAINT "partners_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
