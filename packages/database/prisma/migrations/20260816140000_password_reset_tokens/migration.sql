-- Password reset tokens (hashed). Used by POST /v1/auth/forgot-password
-- and POST /v1/auth/reset-password.

CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

CREATE INDEX "password_reset_tokens_employee_id_used_at_idx" ON "password_reset_tokens"("employee_id", "used_at");

ALTER TABLE "password_reset_tokens"
  ADD CONSTRAINT "password_reset_tokens_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
