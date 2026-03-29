-- Remove Clerk user ID, add password hash for own authentication
ALTER TABLE "employees" DROP COLUMN IF EXISTS "clerk_user_id";
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;
