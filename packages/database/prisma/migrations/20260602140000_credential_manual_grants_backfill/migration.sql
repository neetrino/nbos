-- Backfill ResourceAccessGrant from legacy SECRET credential allowedEmployees

INSERT INTO "resource_access_grants" (
  "id",
  "resource_type",
  "resource_id",
  "employee_id",
  "level",
  "granted_by_id",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text,
  'credential',
  c."id",
  emp."employee_id",
  'VIEW',
  COALESCE(c."owner_id", emp."employee_id"),
  NOW(),
  NOW()
FROM "credentials" c
CROSS JOIN LATERAL unnest(c."allowed_employees") AS emp("employee_id")
WHERE c."access_level" = 'SECRET'
  AND cardinality(c."allowed_employees") > 0
ON CONFLICT ("resource_type", "resource_id", "employee_id") DO NOTHING;
