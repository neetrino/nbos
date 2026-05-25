-- CreateTable
CREATE TABLE "product_access_slot_bindings" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "slot_key" TEXT NOT NULL,
    "credential_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_access_slot_bindings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_access_slot_bindings_product_id_slot_key_key" ON "product_access_slot_bindings"("product_id", "slot_key");

-- CreateIndex
CREATE UNIQUE INDEX "product_access_slot_bindings_product_id_credential_id_key" ON "product_access_slot_bindings"("product_id", "credential_id");

-- CreateIndex
CREATE INDEX "product_access_slot_bindings_credential_id_idx" ON "product_access_slot_bindings"("credential_id");

-- AddForeignKey
ALTER TABLE "product_access_slot_bindings" ADD CONSTRAINT "product_access_slot_bindings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_access_slot_bindings" ADD CONSTRAINT "product_access_slot_bindings_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
