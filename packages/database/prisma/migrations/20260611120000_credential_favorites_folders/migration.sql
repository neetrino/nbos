-- Credentials favorites and virtual folder grouping.

CREATE TABLE "credential_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "project_id" TEXT,
    "owner_id" TEXT,
    "parent_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credential_folders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "credential_favorites" (
    "credential_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credential_favorites_pkey" PRIMARY KEY ("credential_id","employee_id")
);

CREATE TABLE "credential_folder_memberships" (
    "credential_id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,

    CONSTRAINT "credential_folder_memberships_pkey" PRIMARY KEY ("credential_id","folder_id")
);

CREATE INDEX "credential_folders_scope_idx" ON "credential_folders"("scope");
CREATE INDEX "credential_folders_project_id_idx" ON "credential_folders"("project_id");
CREATE INDEX "credential_folders_owner_id_idx" ON "credential_folders"("owner_id");
CREATE INDEX "credential_folders_parent_id_idx" ON "credential_folders"("parent_id");
CREATE INDEX "credential_favorites_employee_id_idx" ON "credential_favorites"("employee_id");
CREATE INDEX "credential_folder_memberships_folder_id_idx" ON "credential_folder_memberships"("folder_id");
CREATE INDEX "credential_folder_memberships_created_by_id_idx" ON "credential_folder_memberships"("created_by_id");

ALTER TABLE "credential_folders" ADD CONSTRAINT "credential_folders_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credential_folders" ADD CONSTRAINT "credential_folders_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "credential_folders" ADD CONSTRAINT "credential_folders_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "credential_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credential_favorites" ADD CONSTRAINT "credential_favorites_credential_id_fkey"
  FOREIGN KEY ("credential_id") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credential_favorites" ADD CONSTRAINT "credential_favorites_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credential_folder_memberships" ADD CONSTRAINT "credential_folder_memberships_credential_id_fkey"
  FOREIGN KEY ("credential_id") REFERENCES "credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credential_folder_memberships" ADD CONSTRAINT "credential_folder_memberships_folder_id_fkey"
  FOREIGN KEY ("folder_id") REFERENCES "credential_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "credential_folder_memberships" ADD CONSTRAINT "credential_folder_memberships_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
