-- New website directions only expand ProductTypeEnum. Existing product, deal and
-- compensation rows keep their values and published snapshots.
ALTER TYPE "ProductTypeEnum" ADD VALUE IF NOT EXISTS 'REAL_ESTATE_WEBSITE';
ALTER TYPE "ProductTypeEnum" ADD VALUE IF NOT EXISTS 'SERVICE_WEBSITE';
ALTER TYPE "ProductTypeEnum" ADD VALUE IF NOT EXISTS 'TRAVEL_WEBSITE';
ALTER TYPE "ProductTypeEnum" ADD VALUE IF NOT EXISTS 'CLASSIFIEDS_PORTAL';
ALTER TYPE "ProductTypeEnum" ADD VALUE IF NOT EXISTS 'JOB_BOARD';

-- Deal pickers intersect the code list with active PRODUCT_TYPE options.
-- Add only missing rows and leave Owner-managed existing options untouched.
WITH new_types(code, sort_offset) AS (
  VALUES
    ('REAL_ESTATE_WEBSITE', 1),
    ('SERVICE_WEBSITE', 2),
    ('TRAVEL_WEBSITE', 3),
    ('CLASSIFIEDS_PORTAL', 4),
    ('JOB_BOARD', 5)
), current_order AS (
  SELECT COALESCE(MAX(sort_order), -1) AS last_position
  FROM "system_list_options"
  WHERE "list_key" = 'PRODUCT_TYPE'
)
INSERT INTO "system_list_options"
  ("id", "list_key", "code", "label", "sort_order", "is_active", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  'PRODUCT_TYPE',
  new_types.code,
  new_types.code,
  current_order.last_position + new_types.sort_offset,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM new_types CROSS JOIN current_order
ON CONFLICT ("list_key", "code") DO NOTHING;
