INSERT INTO "bonus_policies" (
    "id",
    "name",
    "template_code",
    "status",
    "scope",
    "notes",
    "updated_at"
) VALUES (
    'b0000000-0000-4000-8000-000000000003',
    'Product funding auto-release',
    'DELIVERY_PROPORTIONAL_FUNDING',
    'ACTIVE',
    'COMPANY',
    'When Product/Extension is Done, proportional AUTO releases use client payments minus already released (NBOS § pool funding).',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
