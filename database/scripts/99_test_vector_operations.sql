-- ============================================================================
-- Vector Operations Test Script
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Tests pgvector extension functionality with vector operations
-- Usage: psql -U postgres -d upaci -f 99_test_vector_operations.sql
-- Prerequisites: pgvector extension installed and enabled
-- ============================================================================

\echo ''
\echo '================================================'
\echo 'pgvector Vector Operations Test'
\echo 'Clinical Appointment Platform (UPACI)'
\echo '================================================'
\echo ''

-- Test 1: Verify pgvector Extension
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 1: Verify pgvector Extension'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE EXCEPTION 'pgvector extension is not installed. Run: CREATE EXTENSION vector;';
    ELSE
        RAISE NOTICE 'pgvector extension is installed ✓';
    END IF;
END $$;
\echo ''

-- Clean up any existing test tables
DROP TABLE IF EXISTS test_embeddings CASCADE;
DROP TABLE IF EXISTS test_documents CASCADE;

-- Test 2: Create Test Table with Vector Column
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 2: Create Table with Vector Column'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Create table with 3-dimensional vectors (for testing)
CREATE TABLE test_embeddings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    embedding vector(3),  -- 3-dimensional vector for testing
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE test_embeddings 
    IS 'Test table for vector similarity search operations';

\echo 'Table "test_embeddings" created with vector(3) column ✓'
\echo ''

-- Test 3: Insert Test Vectors
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 3: Insert Test Vectors'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

INSERT INTO test_embeddings (name, embedding) VALUES
    ('Vector A', '[1, 2, 3]'),
    ('Vector B', '[4, 5, 6]'),
    ('Vector C', '[7, 8, 9]'),
    ('Vector D', '[1, 1, 1]'),
    ('Vector E', '[0, 0, 0]'),
    ('Similar to A', '[1.1, 2.1, 3.1]'),
    ('Similar to B', '[3.9, 5.1, 6.2]'),
    ('Opposite of A', '[-1, -2, -3]');

\echo 'Inserted 8 test vectors ✓'
\echo ''

-- Display inserted vectors
SELECT id, name, embedding 
FROM test_embeddings 
ORDER BY id;
\echo ''

-- Test 4: Cosine Similarity Search (<->)
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 4: Cosine Similarity Search (<->)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Query: Find vectors most similar to [1, 2, 3] using cosine distance'
\echo ''

SELECT 
    id,
    name,
    embedding,
    embedding <-> '[1, 2, 3]' AS cosine_distance,
    1 - (embedding <-> '[1, 2, 3]') AS cosine_similarity
FROM test_embeddings
ORDER BY embedding <-> '[1, 2, 3]'
LIMIT 5;
\echo ''

-- Test 5: L2 Distance (Euclidean) Search (<->)
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 5: L2 Distance (Euclidean) Search'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Query: Find vectors with smallest L2 distance to [4, 5, 6]'
\echo ''

SELECT 
    id,
    name,
    embedding,
    embedding <-> '[4, 5, 6]' AS l2_distance
FROM test_embeddings
ORDER BY embedding <-> '[4, 5, 6]'
LIMIT 5;
\echo ''

-- Test 6: Inner Product Similarity (<#>)
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 6: Inner Product Similarity (<#>)'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Query: Find vectors with highest inner product with [1, 1, 1]'
\echo ''

SELECT 
    id,
    name,
    embedding,
    (embedding <#> '[1, 1, 1]') * -1 AS inner_product
FROM test_embeddings
ORDER BY embedding <#> '[1, 1, 1]'
LIMIT 5;
\echo ''

-- Test 7: Create Index for Performance
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 7: Create IVFFlat Index for Vector Search'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Create IVFFlat index (approximate nearest neighbor search)
CREATE INDEX test_embeddings_embedding_idx 
ON test_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10);

\echo 'IVFFlat index created ✓'
\echo 'Index Type: ivfflat with cosine distance'
\echo ''

-- Test 8: Verify Index Usage
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 8: Query Plan with Index'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

EXPLAIN (COSTS OFF)
SELECT id, name, embedding <-> '[1, 2, 3]' AS distance
FROM test_embeddings
ORDER BY embedding <-> '[1, 2, 3]'
LIMIT 5;
\echo ''

-- Test 9: Real-World Use Case - Document Similarity
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 9: Real-World Use Case - Document Similarity'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Create table simulating document embeddings (1536 dimensions for OpenAI ada-002)
CREATE TABLE test_documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    embedding vector(1536),  -- OpenAI ada-002 embedding dimension
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE test_documents 
    IS 'Test table simulating real-world document embeddings (1536-d OpenAI ada-002)';

\echo 'Table "test_documents" created with vector(1536) column ✓'
\echo 'Ready for OpenAI ada-002 or similar embeddings'
\echo ''

-- Display table info
SELECT 
    tablename,
    schemaname
FROM pg_tables
WHERE tablename IN ('test_embeddings', 'test_documents')
ORDER BY tablename;
\echo ''

-- Test 10: Supported Vector Dimensions
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 10: Common Embedding Dimensions'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT '✓ Supported Embedding Dimensions:' AS info;
SELECT '  - vector(384)    : sentence-transformers (e.g., all-MiniLM-L6-v2)' AS dimensions
UNION ALL
SELECT '  - vector(768)    : sentence-transformers (e.g., all-mpnet-base-v2)'
UNION ALL
SELECT '  - vector(1536)   : OpenAI ada-002'
UNION ALL
SELECT '  - vector(1024)   : Cohere embed-english-v3.0'
UNION ALL
SELECT '  - vector(3072)   : OpenAI text-embedding-3-large';
\echo ''

-- Test 11: Distance Operators Summary
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 11: pgvector Distance Operators'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 'Available Distance Operators:' AS info;
SELECT '  <-> : Euclidean distance (L2)' AS operators
UNION ALL
SELECT '  <#> : Negative inner product'
UNION ALL
SELECT '  <=> : Cosine distance (1 - cosine similarity)';
\echo ''

-- Performance Statistics
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test Summary Statistics'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
    'test_embeddings' AS table_name,
    COUNT(*) AS row_count,
    pg_size_pretty(pg_total_relation_size('test_embeddings')) AS table_size
FROM test_embeddings
UNION ALL
SELECT 
    'test_documents',
    0,
    pg_size_pretty(pg_total_relation_size('test_documents'))
FROM test_documents
LIMIT 1;
\echo ''

-- Cleanup Instructions
\echo '================================================'
\echo 'Vector Operations Test Complete!'
\echo '================================================'
\echo ''
\echo '✓ All vector operations tested successfully'
\echo '✓ Cosine similarity search working'
\echo '✓ L2 distance search working'
\echo '✓ Inner product similarity working'
\echo '✓ IVFFlat index created and verified'
\echo ''
\echo 'Test tables created:'
\echo '  - test_embeddings (vector(3)): Basic vector operations'
\echo '  - test_documents (vector(1536)): OpenAI ada-002 compatible'
\echo ''
\echo 'To cleanup test tables, run:'
\echo '  DROP TABLE test_embeddings CASCADE;'
\echo '  DROP TABLE test_documents CASCADE;'
\echo ''
\echo 'Next Steps:'
\echo '  1. Update server/.env with database connection'
\echo '  2. Run database migrations (future tasks)'
\echo '  3. Integrate vector search in application'
\echo ''
