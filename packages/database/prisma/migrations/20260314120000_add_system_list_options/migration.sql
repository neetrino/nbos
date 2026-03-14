-- CreateTable
CREATE TABLE "system_list_options" (
    "id" TEXT NOT NULL,
    "list_key" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_list_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_list_options_list_key_code_key" ON "system_list_options"("list_key", "code");

-- CreateIndex
CREATE INDEX "system_list_options_list_key_idx" ON "system_list_options"("list_key");
