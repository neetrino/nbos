CREATE TABLE "dashboard_preferences" (
  "id" TEXT NOT NULL,
  "employee_id" TEXT NOT NULL,
  "pinned_action_order" TEXT[] NOT NULL,
  "hidden_pinned_actions" TEXT[] NOT NULL,
  "visible_widgets" TEXT[] NOT NULL,
  "hidden_widgets" TEXT[] NOT NULL,
  "compact_widgets" TEXT[] NOT NULL,
  "default_dashboard_mode" TEXT NOT NULL DEFAULT 'control_center',
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dashboard_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dashboard_preferences_employee_id_key" ON "dashboard_preferences"("employee_id");

ALTER TABLE "dashboard_preferences"
  ADD CONSTRAINT "dashboard_preferences_employee_id_fkey"
  FOREIGN KEY ("employee_id")
  REFERENCES "employees"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
