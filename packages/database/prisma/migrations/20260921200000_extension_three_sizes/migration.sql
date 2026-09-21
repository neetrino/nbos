-- Owner 2026-09-21: Extension.size is SMALL / STANDARD / LARGE only.
-- MICRO collapses into SMALL. MEDIUM becomes STANDARD. Micro Extension (< 1h) is a process, not a size.

CREATE TYPE "ExtensionSizeEnum_new" AS ENUM ('SMALL', 'STANDARD', 'LARGE');

ALTER TABLE "extensions" ALTER COLUMN "size" DROP DEFAULT;
ALTER TABLE "extensions"
  ALTER COLUMN "size" TYPE "ExtensionSizeEnum_new"
  USING (
    CASE "size"::text
      WHEN 'MICRO' THEN 'SMALL'
      WHEN 'SMALL' THEN 'SMALL'
      WHEN 'MEDIUM' THEN 'STANDARD'
      WHEN 'LARGE' THEN 'LARGE'
      ELSE 'SMALL'
    END
  )::"ExtensionSizeEnum_new";

ALTER TABLE "delivery_stage_checklist_rules"
  ALTER COLUMN "filter_extension_size" TYPE "ExtensionSizeEnum_new"
  USING (
    CASE "filter_extension_size"::text
      WHEN 'MICRO' THEN 'SMALL'
      WHEN 'SMALL' THEN 'SMALL'
      WHEN 'MEDIUM' THEN 'STANDARD'
      WHEN 'LARGE' THEN 'LARGE'
      ELSE NULL
    END
  )::"ExtensionSizeEnum_new";

DROP TYPE "ExtensionSizeEnum";
ALTER TYPE "ExtensionSizeEnum_new" RENAME TO "ExtensionSizeEnum";

ALTER TABLE "extensions"
  ALTER COLUMN "size" SET DEFAULT 'SMALL'::"ExtensionSizeEnum";
