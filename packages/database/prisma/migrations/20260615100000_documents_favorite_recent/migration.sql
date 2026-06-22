-- CreateEnum
CREATE TYPE "DocumentRecentInteractionTypeEnum" AS ENUM ('OPENED', 'EDITED');

-- CreateTable: per-user document favorites
CREATE TABLE "document_favorites" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable: per-user recently interacted documents
CREATE TABLE "document_recents" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_interacted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "interaction_count" INTEGER NOT NULL DEFAULT 1,
    "last_interaction_type" "DocumentRecentInteractionTypeEnum" NOT NULL DEFAULT 'OPENED',

    CONSTRAINT "document_recents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_favorites_document_id_user_id_key" ON "document_favorites"("document_id", "user_id");

CREATE INDEX "document_favorites_user_id_idx" ON "document_favorites"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_recents_document_id_user_id_key" ON "document_recents"("document_id", "user_id");

CREATE INDEX "document_recents_user_id_last_interacted_at_idx" ON "document_recents"("user_id", "last_interacted_at" DESC);

-- AddForeignKey
ALTER TABLE "document_favorites" ADD CONSTRAINT "document_favorites_document_id_fkey"
    FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_recents" ADD CONSTRAINT "document_recents_document_id_fkey"
    FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
