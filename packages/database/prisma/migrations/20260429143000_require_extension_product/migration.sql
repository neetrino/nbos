DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "extensions" WHERE "product_id" IS NULL) THEN
    RAISE EXCEPTION 'Cannot require extensions.product_id: legacy extensions without a product link exist';
  END IF;
END $$;

ALTER TABLE "extensions" ALTER COLUMN "product_id" SET NOT NULL;
