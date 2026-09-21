-- Unique owner of a configuration and one allocation per employee per component.
-- PostgreSQL unique indexes still allow multiple NULLs.

CREATE UNIQUE INDEX "delivery_configurations_product_id_key"
  ON "delivery_configurations" ("product_id");

CREATE UNIQUE INDEX "delivery_configurations_extension_id_key"
  ON "delivery_configurations" ("extension_id");

CREATE UNIQUE INDEX "delivery_bonus_allocations_component_id_employee_id_key"
  ON "delivery_bonus_allocations" ("component_id", "employee_id");
