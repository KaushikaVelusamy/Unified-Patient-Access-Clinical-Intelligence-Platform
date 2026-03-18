-- ============================================================================
-- Migration: V006 - Create Vector Indexes
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates IVFFlat indexes on vector columns for fast similarity search
-- Version: 1.0.0
-- Date: 2026-03-18
-- Dependencies: V003__create_clinical_tables.sql (vector columns must exist)
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Verify pgvector extension
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE EXCEPTION 'pgvector extension not installed. Run: CREATE EXTENSION vector;';
    END IF;
    RAISE NOTICE 'pgvector extension verified ✓';
END $$;

-- ============================================================================
-- Set maintenance_work_mem for index creation
-- ============================================================================

SET maintenance_work_mem = '512MB';

-- ============================================================================
-- IVFFlat Index on clinical_documents.embedding
-- ============================================================================

-- Index for cosine similarity search (most common for embeddings)
CREATE INDEX IF NOT EXISTS idx_clinical_documents_embedding_cosine
ON clinical_documents
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

COMMENT ON INDEX idx_clinical_documents_embedding_cosine IS 
    'IVFFlat index for cosine similarity search on clinical document embeddings (OpenAI ada-002)';

-- Alternative: Index for L2 distance (Euclidean)
-- Uncomment if you need L2 distance instead of cosine
-- CREATE INDEX IF NOT EXISTS idx_clinical_documents_embedding_l2
-- ON clinical_documents
-- USING ivfflat (embedding vector_l2_ops)
-- WITH (lists = 100);

-- Alternative: Index for inner product
-- Uncomment if you need inner product distance
-- CREATE INDEX IF NOT EXISTS idx_clinical_documents_embedding_ip
-- ON clinical_documents
-- USING ivfflat (embedding vector_ip_ops)
-- WITH (lists = 100);

-- ============================================================================
-- Index Configuration Notes
-- ============================================================================

-- lists parameter guidelines:
-- - Small datasets (< 10K rows): lists = 10-50
-- - Medium datasets (10K-100K rows): lists = 100-500
-- - Large datasets (100K-1M rows): lists = 1000-5000
-- - Very large datasets (1M+ rows): lists = 5000-10000
--
-- Rule of thumb: lists = sqrt(rows) or rows / 1000
-- More lists = faster search but slower index creation and updates

-- ============================================================================
-- Analyze table for query planner
-- ============================================================================

ANALYZE clinical_documents;

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
DECLARE
    embedding_count BIGINT;
    index_size TEXT;
BEGIN
    -- Count rows with embeddings
    SELECT COUNT(*) INTO embedding_count
    FROM clinical_documents
    WHERE embedding IS NOT NULL;
    
    -- Get index size
    SELECT pg_size_pretty(pg_relation_size('idx_clinical_documents_embedding_cosine'))
    INTO index_size;
    
    RAISE NOTICE 'Migration V006 completed successfully';
    RAISE NOTICE 'IVFFlat index created: idx_clinical_documents_embedding_cosine';
    RAISE NOTICE 'Distance operator: <-> (cosine similarity)';
    RAISE NOTICE 'Lists parameter: 100 (suitable for datasets up to 100K rows)';
    RAISE NOTICE 'Documents with embeddings: %', embedding_count;
    RAISE NOTICE 'Index size: %', index_size;
    RAISE NOTICE '';
    RAISE NOTICE 'Example query:';
    RAISE NOTICE '  SELECT id, title FROM clinical_documents';
    RAISE NOTICE '  ORDER BY embedding <-> ''[...]''::vector';
    RAISE NOTICE '  LIMIT 10;';
END $$;

COMMIT;
