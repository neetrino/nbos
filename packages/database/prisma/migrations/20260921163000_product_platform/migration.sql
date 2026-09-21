-- Delivery Compensation v2: product platform as its own axis (WEB / APP / DESKTOP).
--
-- product_type mixed kind (shop, CRM) with where it runs (MOBILE_APP, WEB_APP), so a deal could
-- not say "online shop + app". Platform does not enter the base-profile key and does not change
-- units. Legacy rows of kind MOBILE_APP become APP; everything else defaults to WEB. The owner
-- still assigns a real kind on those cards by hand.

CREATE TYPE "ProductPlatformEnum" AS ENUM ('WEB', 'APP', 'DESKTOP');

ALTER TABLE "products"
  ADD COLUMN "product_platform" "ProductPlatformEnum" NOT NULL DEFAULT 'WEB';

UPDATE "products"
SET "product_platform" = 'APP'
WHERE "product_type" = 'MOBILE_APP';

ALTER TABLE "deals"
  ADD COLUMN "product_platform" "ProductPlatformEnum";

UPDATE "deals"
SET "product_platform" = 'APP'
WHERE "product_type" = 'MOBILE_APP';

UPDATE "deals"
SET "product_platform" = 'WEB'
WHERE "product_type" IS NOT NULL
  AND "product_type" <> 'MOBILE_APP'
  AND "product_platform" IS NULL;
