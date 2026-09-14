-- Roles stay referenced by PermissionRoleAssignment history and by archived seats, so they
-- cannot be deleted once used. Archiving retires a role without destroying the audit trail.
ALTER TABLE "roles" ADD COLUMN "archived_at" TIMESTAMP(3);

CREATE INDEX "roles_archived_at_idx" ON "roles"("archived_at");
