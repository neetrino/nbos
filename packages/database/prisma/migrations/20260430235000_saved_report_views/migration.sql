CREATE TABLE "saved_report_views" (
    "id" TEXT NOT NULL,
    "report_key" TEXT NOT NULL,
    "report_title" TEXT NOT NULL,
    "owner_module" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_report_views_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "saved_report_views_owner_id_report_key_name_key" ON "saved_report_views"("owner_id", "report_key", "name");
CREATE INDEX "saved_report_views_owner_id_idx" ON "saved_report_views"("owner_id");
CREATE INDEX "saved_report_views_report_key_idx" ON "saved_report_views"("report_key");
CREATE INDEX "saved_report_views_owner_module_idx" ON "saved_report_views"("owner_module");

ALTER TABLE "saved_report_views" ADD CONSTRAINT "saved_report_views_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
