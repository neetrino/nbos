-- Product delivery languages (display order: hy, en, ru first, then alphabetical in app).
ALTER TABLE "products" ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
