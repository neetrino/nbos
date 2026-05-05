-- Optional sales assistant on Deal (bonus / team display).

ALTER TABLE "deals" ADD COLUMN "seller_assistant_id" TEXT;

ALTER TABLE "deals" ADD CONSTRAINT "deals_seller_assistant_id_fkey" FOREIGN KEY ("seller_assistant_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
