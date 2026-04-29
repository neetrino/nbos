-- Denormalized FTS for linked attachment file labels (title/body stay on `search_vector`).
-- Requires PostgreSQL 14+ (`EXECUTE FUNCTION` on triggers). Use `EXECUTE PROCEDURE` on PG13 if needed.
ALTER TABLE "documents"
ADD COLUMN "attachment_search_vector" tsvector NOT NULL DEFAULT ''::tsvector;

CREATE INDEX "documents_attachment_search_vector_gin"
ON "documents" USING GIN ("attachment_search_vector");

CREATE OR REPLACE FUNCTION documents_rebuild_attachment_search_vector(p_document_id TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "documents" d
  SET "attachment_search_vector" = (
    SELECT CASE
      WHEN trim(both ' ' FROM COALESCE(s.agg_text, '')) = '' THEN ''::tsvector
      ELSE to_tsvector('english', trim(both ' ' FROM s.agg_text))
    END
    FROM (
      SELECT string_agg(
        trim(both ' ' FROM (COALESCE(fa.display_name, '') || ' ' || COALESCE(fa.original_name, ''))),
        ' ' ORDER BY da.sort_order ASC, da.id ASC
      ) AS agg_text
      FROM "document_attachments" da
      INNER JOIN "file_assets" fa ON fa.id = da.file_asset_id
      WHERE da.document_id = p_document_id
        AND fa.deleted_at IS NULL
        AND fa.status = 'ACTIVE'::"FileAssetStatusEnum"
    ) s
  )
  WHERE d.id = p_document_id;
END;
$$;

CREATE OR REPLACE FUNCTION documents_attachment_search_vector_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM documents_rebuild_attachment_search_vector(OLD.document_id);
  ELSIF (TG_OP = 'UPDATE' AND OLD.document_id IS DISTINCT FROM NEW.document_id) THEN
    PERFORM documents_rebuild_attachment_search_vector(OLD.document_id);
    PERFORM documents_rebuild_attachment_search_vector(NEW.document_id);
  ELSE
    PERFORM documents_rebuild_attachment_search_vector(NEW.document_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER "document_attachments_rebuild_attachment_search_vector"
AFTER INSERT OR UPDATE OR DELETE ON "document_attachments"
FOR EACH ROW
EXECUTE FUNCTION documents_attachment_search_vector_trigger();

CREATE OR REPLACE FUNCTION documents_file_assets_attachment_search_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  doc_id TEXT;
BEGIN
  IF (TG_OP = 'UPDATE') AND (
    COALESCE(OLD.display_name, '') IS DISTINCT FROM COALESCE(NEW.display_name, '')
    OR COALESCE(OLD.original_name, '') IS DISTINCT FROM COALESCE(NEW.original_name, '')
    OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at
    OR OLD.status IS DISTINCT FROM NEW.status
  ) THEN
    FOR doc_id IN
      SELECT DISTINCT da.document_id
      FROM "document_attachments" da
      WHERE da.file_asset_id = NEW.id
    LOOP
      PERFORM documents_rebuild_attachment_search_vector(doc_id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "file_assets_rebuild_document_attachment_search_vector"
AFTER UPDATE ON "file_assets"
FOR EACH ROW
EXECUTE FUNCTION documents_file_assets_attachment_search_trigger();

-- Initial fill (triggers cover future changes).
UPDATE "documents" d
SET "attachment_search_vector" = (
  SELECT CASE
    WHEN trim(both ' ' FROM COALESCE(s.agg_text, '')) = '' THEN ''::tsvector
    ELSE to_tsvector('english', trim(both ' ' FROM s.agg_text))
  END
  FROM (
    SELECT string_agg(
      trim(both ' ' FROM (COALESCE(fa.display_name, '') || ' ' || COALESCE(fa.original_name, ''))),
      ' ' ORDER BY da.sort_order ASC, da.id ASC
    ) AS agg_text
    FROM "document_attachments" da
    INNER JOIN "file_assets" fa ON fa.id = da.file_asset_id
    WHERE da.document_id = d.id
      AND fa.deleted_at IS NULL
      AND fa.status = 'ACTIVE'::"FileAssetStatusEnum"
  ) s
);
