ALTER TABLE "dashboard_preferences"
  ADD COLUMN "sidebar_module_order" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "hidden_sidebar_modules" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
