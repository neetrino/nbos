-- Additive session client label for web vs native apps. Existing rows default to WEB.

CREATE TYPE "AuthSessionClientKind" AS ENUM (
  'WEB',
  'MOBILE_WORK',
  'MOBILE_MESSENGER',
  'MOBILE_VAULT'
);

ALTER TABLE "auth_sessions"
ADD COLUMN "client_kind" "AuthSessionClientKind" NOT NULL DEFAULT 'WEB';
