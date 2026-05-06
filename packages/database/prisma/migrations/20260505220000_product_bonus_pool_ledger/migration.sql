CREATE TYPE "ProductBonusPoolStatusEnum" AS ENUM ('DRAFT', 'ACTIVE', 'PARTIALLY_RELEASED', 'CLOSED');

CREATE TABLE "product_bonus_pools" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "product_id" TEXT,
    "extension_id" TEXT,
    "total_planned_amount" DECIMAL(14, 2) NOT NULL,
    "total_released_amount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "total_paid_amount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "total_remaining_amount" DECIMAL(14, 2) NOT NULL,
    "available_funding" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "over_funding_amount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "status" "ProductBonusPoolStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_bonus_pools_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_bonus_pools_order_id_key" ON "product_bonus_pools"("order_id");

CREATE INDEX "product_bonus_pools_project_id_idx" ON "product_bonus_pools"("project_id");

ALTER TABLE "product_bonus_pools" ADD CONSTRAINT "product_bonus_pools_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_bonus_pools" ADD CONSTRAINT "product_bonus_pools_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_bonus_pools" ADD CONSTRAINT "product_bonus_pools_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_bonus_pools" ADD CONSTRAINT "product_bonus_pools_extension_id_fkey" FOREIGN KEY ("extension_id") REFERENCES "extensions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "product_bonus_pools" (
    "id",
    "order_id",
    "project_id",
    "product_id",
    "extension_id",
    "total_planned_amount",
    "total_released_amount",
    "total_paid_amount",
    "total_remaining_amount",
    "available_funding",
    "over_funding_amount",
    "status",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid()::text,
    o."id",
    o."project_id",
    o."product_id",
    o."extension_id",
    agg."planned",
    0,
    COALESCE(agg."paid_amt", 0),
    agg."planned",
    0,
    0,
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "orders" o
INNER JOIN (
    SELECT
        be."order_id",
        SUM(be."amount")::decimal(14, 2) AS "planned",
        SUM(CASE WHEN be."status" = 'PAID' THEN be."amount" ELSE 0 END)::decimal(14, 2) AS "paid_amt"
    FROM "bonus_entries" be
    GROUP BY be."order_id"
) agg ON agg."order_id" = o."id";
