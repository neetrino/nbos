INSERT INTO "bonus_policies" (
    "id",
    "name",
    "template_code",
    "status",
    "scope",
    "notes",
    "updated_at"
) VALUES (
    'b0000000-0000-4000-8000-000000000004',
    'Marketing planned (manual)',
    'MARKETING_MANUAL_PLANNED',
    'ACTIVE',
    'COMPANY',
    'Marketing bonuses are created manually in Finance; CPL/MQL scorecard accrual is not automated yet.',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
