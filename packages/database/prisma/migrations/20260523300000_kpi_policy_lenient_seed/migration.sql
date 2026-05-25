INSERT INTO "kpi_policies" (
    "id",
    "name",
    "template_code",
    "gate_rules",
    "bonus_cap_base_salary_multiplier",
    "status",
    "scope",
    "notes",
    "updated_at"
) VALUES (
    'a0000000-0000-4000-8000-000000000002',
    'Lenient sales KPI gate',
    'KPI_GATE_PAYOUT_MULTIPLIER',
    '{"bands":[{"minAttainmentPct":60,"payoutFactor":1},{"minAttainmentPct":40,"payoutFactor":0.5},{"minAttainmentPct":0,"payoutFactor":0}]}'::jsonb,
    2,
    'ACTIVE',
    'COMPANY',
    'Softer attainment: 60%+ full payout, 40-59% half (for heads / stretch targets).',
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
