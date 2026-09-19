-- Canonical Network rates only. Do not update CLIENT/SALES/MARKETING/PARTNER rows.

INSERT INTO "sales_bonus_policies" (
  "id",
  "from_category",
  "payment_model",
  "seller_percent",
  "assistant_percent",
  "effective_from",
  "is_active",
  "created_at",
  "updated_at"
)
SELECT gen_random_uuid()::text, 'NETWORK', 'CLASSIC', 4, 1, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "sales_bonus_policies"
  WHERE "from_category" = 'NETWORK' AND "payment_model" = 'CLASSIC' AND "is_active" = true
);

INSERT INTO "sales_bonus_policies" (
  "id",
  "from_category",
  "payment_model",
  "seller_percent",
  "assistant_percent",
  "effective_from",
  "is_active",
  "created_at",
  "updated_at"
)
SELECT gen_random_uuid()::text, 'NETWORK', 'SUBSCRIPTION_FIRST_MONTH', 40, 10, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "sales_bonus_policies"
  WHERE "from_category" = 'NETWORK' AND "payment_model" = 'SUBSCRIPTION_FIRST_MONTH' AND "is_active" = true
);

INSERT INTO "sales_bonus_policies" (
  "id",
  "from_category",
  "payment_model",
  "seller_percent",
  "assistant_percent",
  "effective_from",
  "is_active",
  "created_at",
  "updated_at"
)
SELECT gen_random_uuid()::text, 'NETWORK', 'SUBSCRIPTION_RECURRING', 0, 0, TIMESTAMP '2020-01-01 00:00:00', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "sales_bonus_policies"
  WHERE "from_category" = 'NETWORK' AND "payment_model" = 'SUBSCRIPTION_RECURRING' AND "is_active" = true
);
