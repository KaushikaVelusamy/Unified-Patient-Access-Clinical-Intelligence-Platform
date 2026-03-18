# pgvector Fallback Strategy

This document outlines the fallback strategies when the pgvector extension is unavailable or disabled in the Clinical Appointment Platform.

## Table of Contents

- [Overview](#overview)
- [Scenarios Requiring Fallback](#scenarios-requiring-fallback)
- [Fallback Strategies](#fallback-strategies)
  - [1. PostgreSQL Full-Text Search](#1-postgresql-full-text-search)
  - [2. Basic Keyword Matching](#2-basic-keyword-matching)
  - [3. Deferred AI Features](#3-deferred-ai-features)
- [Implementation Guidelines](#implementation-guidelines)
- [Feature Comparison](#feature-comparison)
- [Migration Path](#migration-path)

---

## Overview

The Clinical Appointment Platform uses pgvector for AI-powered semantic search capabilities. However, the application **must remain functional** even when pgvector is unavailable.

**pgvector Use Cases in the Platform:**
- Intelligent appointment search (semantic matching)
- Medical document similarity search
- Patient symptom clustering
- Clinical note recommendations
- Medication interaction detection (future)

**Fallback Principle:**
- ✅ Core functionality (booking, scheduling, patient management) **must always work**
- ⚠️ AI-enhanced features gracefully degrade to traditional search
- 🔄 Enable seamless migration when pgvector becomes available

---

## Scenarios Requiring Fallback

### 1. pgvector Extension Not Installed
- PostgreSQL installed without pgvector
- Installation failed or unavailable for platform
- Compilation issues on unsupported systems

### 2. Extension Disabled
- Database administrator disabled extension
- Extension incompatible with PostgreSQL version
- Security policies prohibit custom extensions

### 3. Performance Constraints
- Vector operations too slow for production workload
- Insufficient resources for vector indexing
- High-volume environment exceeds capacity

### 4. Development/Testing Environments
- Simplified setup without AI dependencies
- CI/CD pipelines without pgvector
- Local development with minimal requirements

---

## Fallback Strategies

### 1. PostgreSQL Full-Text Search

**Use For:** Appointment search, document search, clinical notes

**Implementation:**

#### Create Full-Text Search Indexes

```sql
-- Example: Appointment search
ALTER TABLE appointments 
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
    to_tsvector('english', 
        coalesce(title, '') || ' ' || 
        coalesce(description, '') || ' ' || 
        coalesce(patient_symptoms, '')
    )
) STORED;

-- Create GIN index for fast search
CREATE INDEX appointments_search_idx 
ON appointments 
USING gin(search_vector);

-- Example query
SELECT * FROM appointments
WHERE search_vector @@ to_tsquery('english', 'diabetes & appointment');
```

#### Advantages:
- ✅ Native PostgreSQL feature (no extension required)
- ✅ Fast for keyword-based searches
- ✅ Supports ranking and highlighting
- ✅ Handles stemming and stop words

#### Limitations:
- ❌ No semantic understanding (e.g., "diabetes" ≠ "blood sugar issue")
- ❌ Exact keyword matching only
- ❌ No similarity-based clustering

---

### 2. Basic Keyword Matching

**Use For:** Simple search scenarios, minimal dependency environments

**Implementation:**

#### ILIKE Pattern Matching

```sql
-- Case-insensitive search
SELECT * FROM appointments
WHERE 
    title ILIKE '%diabetes%' OR
    description ILIKE '%diabetes%' OR
    patient_symptoms ILIKE '%diabetes%';
```

#### Advantages:
- ✅ Zero dependencies
- ✅ Simple to implement
- ✅ Works on any PostgreSQL version

#### Limitations:
- ❌ Slow on large datasets (sequential scan)
- ❌ No ranking or relevance scoring
- ❌ No stemming or fuzzy matching

---

### 3. Deferred AI Features

**Use For:** Optional AI enhancements that can be disabled

#### Feature Detection Pattern

```javascript
// Backend: Check for pgvector availability
class SearchService {
  constructor() {
    this.pgvectorEnabled = this.checkPgVectorAvailability();
  }

  async checkPgVectorAvailability() {
    try {
      const result = await db.query(
        "SELECT 1 FROM pg_extension WHERE extname='vector'"
      );
      return result.rowCount > 0;
    } catch (error) {
      console.warn('pgvector not available, using fallback search');
      return false;
    }
  }

  async searchAppointments(query, limit = 10) {
    if (this.pgvectorEnabled) {
      return this.semanticSearch(query, limit);
    } else {
      return this.keywordSearch(query, limit);
    }
  }

  async semanticSearch(query, limit) {
    // Generate embedding from query
    const embedding = await this.generateEmbedding(query);
    
    // Vector similarity search
    return db.query(`
      SELECT * FROM appointments
      ORDER BY embedding <-> $1
      LIMIT $2
    `, [embedding, limit]);
  }

  async keywordSearch(query, limit) {
    // Fallback to full-text search
    return db.query(`
      SELECT * FROM appointments
      WHERE search_vector @@ to_tsquery('english', $1)
      ORDER BY ts_rank(search_vector, to_tsquery('english', $1)) DESC
      LIMIT $2
    `, [query, limit]);
  }
}
```

#### Frontend: Conditional Feature Display

```typescript
// React component example
const SearchBar = () => {
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    // Check AI features availability
    api.getSystemCapabilities().then(data => {
      setAiEnabled(data.semanticSearch);
    });
  }, []);

  return (
    <div>
      <input placeholder="Search appointments..." />
      {aiEnabled && (
        <Badge color="green">AI-Powered Search</Badge>
      )}
      {!aiEnabled && (
        <Tooltip content="Upgrade to enable semantic search">
          <Badge color="gray">Keyword Search</Badge>
        </Tooltip>
      )}
    </div>
  );
};
```

---

## Implementation Guidelines

### 1. Environment Configuration

**Add to `server/.env`:**

```env
# AI Features Configuration
ENABLE_PGVECTOR=true          # Set to false to disable vector search
ENABLE_AI_FEATURES=true       # Master switch for all AI features
FALLBACK_TO_FULLTEXT=true     # Enable full-text search fallback
```

### 2. Application Startup Check

**Add to `server/src/config/env.ts`:**

```typescript
export const aiConfig = {
  pgvectorEnabled: getEnvVar('ENABLE_PGVECTOR', 'true') === 'true',
  aiFeatures: getEnvVar('ENABLE_AI_FEATURES', 'true') === 'true',
  fallbackFullText: getEnvVar('FALLBACK_TO_FULLTEXT', 'true') === 'true',
};

// Runtime detection
export async function detectPgVector(): Promise<boolean> {
  try {
    const result = await db.query(
      "SELECT 1 FROM pg_extension WHERE extname='vector'"
    );
    return result.rows.length > 0;
  } catch {
    return false;
  }
}
```

### 3. Database Migration Strategy

**Create migration with conditional logic:**

```sql
-- migrations/005_add_vector_search.sql

-- Try to enable pgvector
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
    RAISE NOTICE 'pgvector extension enabled';
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'pgvector not available - using full-text search fallback';
END $$;

-- Always create full-text search columns (fallback)
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
) STORED;

CREATE INDEX IF NOT EXISTS appointments_search_idx 
ON appointments USING gin(search_vector);

-- Conditionally create embedding column if pgvector is available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='vector') THEN
        ALTER TABLE appointments 
        ADD COLUMN IF NOT EXISTS embedding vector(1536);
        
        CREATE INDEX IF NOT EXISTS appointments_embedding_idx 
        ON appointments 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
        
        RAISE NOTICE 'Embedding column and index created';
    ELSE
        RAISE NOTICE 'Skipping embedding column (pgvector not available)';
    END IF;
END $$;
```

### 4. Service Layer Abstraction

```typescript
// server/src/services/search.service.ts

interface SearchService {
  search(query: string, options: SearchOptions): Promise<SearchResult[]>;
  isAiEnabled(): boolean;
}

class VectorSearchService implements SearchService {
  async search(query: string, options: SearchOptions) {
    const embedding = await this.generateEmbedding(query);
    return this.vectorSearch(embedding, options);
  }

  isAiEnabled() {
    return true;
  }
}

class FullTextSearchService implements SearchService {
  async search(query: string, options: SearchOptions) {
    return this.fullTextSearch(query, options);
  }

  isAiEnabled() {
    return false;
  }
}

// Factory pattern
export function createSearchService(): SearchService {
  if (config.pgvectorEnabled && pgvectorDetected) {
    return new VectorSearchService();
  } else {
    return new FullTextSearchService();
  }
}
```

---

## Feature Comparison

| Feature | pgvector (AI) | Full-Text Search | Keyword Match |
|---------|---------------|------------------|---------------|
| **Semantic Understanding** | ✓ Yes | ✗ No | ✗ No |
| **Synonym Matching** | ✓ Automatic | ✓ With config | ✗ No |
| **Fuzzy Matching** | ✓ Yes | ✓ Limited | ✗ No |
| **Multi-language** | ✓ Yes | ✓ With dictionaries | ✓ Yes |
| **Performance (10K rows)** | Fast | Fast | Slow |
| **Performance (1M+ rows)** | Fast | Medium | Very Slow |
| **Setup Complexity** | High | Low | None |
| **Dependencies** | pgvector + AI model | None | None |
| **Result Relevance** | Excellent | Good | Poor |
| **Clustering Support** | ✓ Yes | ✗ No | ✗ No |
| **Recommendation Engine** | ✓ Yes | ✗ No | ✗ No |

---

## Migration Path

### Phase 1: Without pgvector (Initial Deployment)
- ✓ Full-text search enabled
- ✓ All core features working
- ⚠️ No semantic search or AI recommendations

### Phase 2: pgvector Available (Upgrade)
1. Install pgvector extension
2. Run migration to add `embedding` columns
3. Set `ENABLE_PGVECTOR=true` in `.env`
4. Restart application
5. **Backfill embeddings** for existing records:
   ```sql
   -- Example: Generate embeddings for existing appointments
   -- (Requires OpenAI API integration)
   UPDATE appointments 
   SET embedding = generate_embedding(title || ' ' || description)
   WHERE embedding IS NULL;
   ```

### Phase 3: Full AI Features Enabled
- ✓ Semantic search active
- ✓ AI recommendations enabled
- ✓ Clustering and similarity features available
- ✓ Full-text search remains as fallback

---

## Testing Fallback Scenarios

### Test 1: Simulate pgvector Unavailable

```bash
# Disable extension
psql -U postgres -d upaci -c "DROP EXTENSION IF EXISTS vector CASCADE;"

# Restart application
npm run dev

# Verify fallback
curl http://localhost:3001/api/appointments/search?q=diabetes
# Should return results using full-text search
```

### Test 2: Performance Comparison

```sql
-- Full-text search performance
EXPLAIN ANALYZE
SELECT * FROM appointments
WHERE search_vector @@ to_tsquery('diabetes')
LIMIT 10;

-- Vector search performance (if available)
EXPLAIN ANALYZE
SELECT * FROM appointments
ORDER BY embedding <-> '[...]'
LIMIT 10;
```

---

## Recommendations

### For Production Deployments:
1. **Install pgvector** for optimal performance and features
2. **Enable full-text search** as fallback mechanism
3. **Monitor AI feature usage** and performance metrics
4. **Document** which features degrade without pgvector

### For Development Environments:
1. **Use Docker** with ankane/pgvector image for consistency
2. **Set ENABLE_PGVECTOR=false** for minimal setup
3. **Test both modes** (AI enabled and fallback) in CI/CD

### For High-Availability Systems:
1. **Load balance** vector search operations
2. **Cache embeddings** to reduce AI API calls
3. **Implement circuit breaker** for AI service failures
4. **Graceful degradation** to full-text search on errors

---

## Conclusion

The Clinical Appointment Platform is designed to function fully **with or without pgvector**. The fallback strategy ensures:

✅ **Zero downtime** if pgvector is unavailable  
✅ **Seamless migration** path to enable AI features  
✅ **Flexible deployment** options for different environments  
✅ **User transparency** about available features  

**Recommended Setup:** Install pgvector for production; use fallback for development/testing environments.

---

**Fallback Strategy Version:** 1.0.0  
**Last Updated:** March 18, 2026  
**Clinical Appointment Platform Team**
