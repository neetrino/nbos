-- Section default list visibility + optional per-document override (NBOS Documents canon).
CREATE TYPE "DocumentListScopeEnum" AS ENUM ('ALL', 'OWN', 'DEPARTMENT');

ALTER TABLE "document_sections"
ADD COLUMN "default_list_scope" "DocumentListScopeEnum" NOT NULL DEFAULT 'ALL';

ALTER TABLE "documents"
ADD COLUMN "list_scope_override" "DocumentListScopeEnum";
