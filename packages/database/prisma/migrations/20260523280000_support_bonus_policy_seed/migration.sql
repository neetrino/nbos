INSERT INTO "bonus_policies" (
    "id",
    "name",
    "template_code",
    "status",
    "scope",
    "notes",
    "updated_at"
) VALUES (
    'b0000000-0000-4000-8000-000000000005',
    'Support planned (manual)',
    'SUPPORT_MANUAL_PLANNED',
    'ACTIVE',
    'COMPANY',
    'Support/maintenance bonuses are created manually in Finance; SLA scorecard accrual is not automated yet.',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
