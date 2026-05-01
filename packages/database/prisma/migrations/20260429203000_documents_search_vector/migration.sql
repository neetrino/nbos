-- Full-text search vector for native document list (title, description, plain body).
ALTER TABLE "documents"
ADD COLUMN "search_vector" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("title", '')), 'A')
  || setweight(to_tsvector('english', coalesce("description", '')), 'B')
  || setweight(to_tsvector('english', coalesce("plain_text", '')), 'C')
) STORED;

CREATE INDEX "documents_search_vector_gin" ON "documents" USING GIN ("search_vector");
