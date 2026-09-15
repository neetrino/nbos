-- Align stored categories with the unified catalog.
-- ENV/SSH types first so leftover Other does not swallow them.

UPDATE "credentials"
SET "category" = 'ENV'
WHERE "credential_type" = 'ENV_BUNDLE';

UPDATE "credentials"
SET "category" = 'SSH'
WHERE "credential_type" = 'SSH_PRIVATE_KEY';

UPDATE "credentials"
SET "category" = 'SERVICE'
WHERE "category" = 'OTHER';
