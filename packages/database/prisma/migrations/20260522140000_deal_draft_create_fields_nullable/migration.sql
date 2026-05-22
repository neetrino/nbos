-- Allow draft deals: seller + title only at creation; type/tax/contact filled before pipeline advance.
ALTER TABLE "deals" ALTER COLUMN "contact_id" DROP NOT NULL;
ALTER TABLE "deals" ALTER COLUMN "type" DROP NOT NULL;
ALTER TABLE "deals" ALTER COLUMN "tax_status" DROP NOT NULL;
ALTER TABLE "deals" ALTER COLUMN "tax_status" DROP DEFAULT;
