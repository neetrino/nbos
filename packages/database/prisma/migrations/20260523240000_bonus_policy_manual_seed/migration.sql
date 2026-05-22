INSERT INTO "bonus_policies" (
    "id",
    "name",
    "template_code",
    "status",
    "scope",
    "notes",
    "updated_at"
) VALUES (
    'b0000000-0000-4000-8000-000000000002',
    'Manual bonus only',
    'MANUAL_ONLY',
    'ACTIVE',
    'COMPANY',
    'No automatic accrual; bonuses created by Finance / CEO decision.',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
