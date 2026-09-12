-- LOW-risk empty singleton for company-wide wallpaper slots.
-- No backfill. Rollback: DROP TABLE "platform_appearance";

CREATE TABLE "platform_appearance" (
    "id" TEXT NOT NULL,
    "light_storage_key" TEXT,
    "light_version" INTEGER NOT NULL DEFAULT 0,
    "light_original_file_name" TEXT,
    "light_bytes" INTEGER,
    "light_width" INTEGER,
    "light_height" INTEGER,
    "dark_storage_key" TEXT,
    "dark_version" INTEGER NOT NULL DEFAULT 0,
    "dark_original_file_name" TEXT,
    "dark_bytes" INTEGER,
    "dark_width" INTEGER,
    "dark_height" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_employee_id" TEXT,

    CONSTRAINT "platform_appearance_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "platform_appearance"
ADD CONSTRAINT "platform_appearance_updated_by_employee_id_fkey"
FOREIGN KEY ("updated_by_employee_id") REFERENCES "employees"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
