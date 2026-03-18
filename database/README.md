# Database Setup - Clinical Appointment Platform

PostgreSQL 15+ database with pgvector extension for AI-powered vector similarity search.

## Quick Start

### 1. Install PostgreSQL + pgvector

Choose your platform:

**Windows:**
```powershell
cd install
.\windows-install.ps1
```

**Linux (Ubuntu/Debian):**
```bash
cd install
chmod +x linux-install.sh
sudo ./linux-install.sh
```

**Docker:**
```bash
docker run -d \
  --name upaci-postgres \
  -e POSTGRES_DB=upaci \
  -e POSTGRES_PASSWORD=change_me \
  -p 5432:5432 \
  ankane/pgvector:latest
```

### 2. Initialize Database

```bash
psql -U postgres -f scripts/01_init_database.sql
```

### 3. Test Installation

```bash
# Connection test
psql -U postgres -d upaci -f scripts/99_test_connection.sql

# Vector operations test
psql -U postgres -d upaci -f scripts/99_test_vector_operations.sql
```

### 4. Configure Application

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env  # or use your preferred editor
```

Update `server/.env` with database connection:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=upaci
DB_USER=postgres
DB_PASSWORD=your_password
```

---

## Directory Structure

```
database/
├── install/                    # Installation scripts
│   ├── windows-install.ps1     # Windows automated installation
│   └── linux-install.sh        # Linux automated installation
├── scripts/                    # SQL scripts
│   ├── 01_init_database.sql    # Database and extension setup
│   ├── 99_test_connection.sql  # Connection verification
│   └── 99_test_vector_operations.sql  # pgvector functionality test
├── docs/                       # Documentation
│   ├── INSTALLATION.md         # Detailed installation guide
│   ├── TROUBLESHOOTING.md      # Common issues and solutions
│   └── FALLBACK_STRATEGY.md    # Operating without pgvector
├── .env.example                # Environment configuration template
├── .gitignore                  # Excluded files
└── README.md                   # This file
```

---

## What's Included

### PostgreSQL 15+
- Open-source relational database
- ACID compliance
- Advanced indexing and query optimization
- JSON support
- Full-text search

### pgvector 0.5.0+
- Vector similarity search extension
- Supports embeddings from:
  - OpenAI (ada-002, text-embedding-3)
  - Cohere (embed-english-v3.0)
  - Sentence-transformers (all-MiniLM, all-mpnet)
- Distance operators:
  - `<->` Cosine distance
  - `<->` L2 distance (Euclidean)
  - `<#>` Inner product
- IVFFlat indexing for fast approximate nearest neighbor search

### Database Schemas
- **app**: Application tables (users, appointments, patients)
- **ai**: AI/ML tables (embeddings, vector search, semantic cache)
- **audit**: Audit logs and change tracking

### Pre-configured Extensions
- `vector`: AI vector similarity search
- `uuid-ossp`: UUID generation
- `pgcrypto`: Cryptographic functions

---

## Use Cases

### 1. Semantic Search
```sql
-- Find similar appointments by description
SELECT title, description
FROM appointments
ORDER BY embedding <-> '[query_embedding_vector]'
LIMIT 5;
```

### 2. Document Clustering
```sql
-- Group similar medical documents
SELECT 
    doc1.id AS doc1_id,
    doc2.id AS doc2_id,
    doc1.embedding <-> doc2.embedding AS distance
FROM documents doc1
CROSS JOIN documents doc2
WHERE doc1.id < doc2.id
  AND doc1.embedding <-> doc2.embedding < 0.3
ORDER BY distance;
```

### 3. Recommendation Engine
```sql
-- Find appointments similar to user's history
SELECT a.* FROM appointments a
WHERE a.embedding <-> (
    SELECT AVG(embedding)::vector(1536)
    FROM appointments
    WHERE patient_id = $1
) < 0.5
LIMIT 10;
```

---

## Documentation

- **[INSTALLATION.md](docs/INSTALLATION.md)** - Complete installation guide for all platforms
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[FALLBACK_STRATEGY.md](docs/FALLBACK_STRATEGY.md)** - Operating without pgvector

---

## Technology Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL | 15+ | Relational database |
| pgvector | 0.5.0+ | Vector similarity search |
| uuid-ossp | Latest | UUID generation |
| pgcrypto | Latest | Cryptographic functions |

---

## Connection Examples

### psql Command Line

```bash
# Local connection
psql -U postgres -d upaci

# Remote connection
psql -h database-host -U postgres -d upaci

# With password from environment
PGPASSWORD=your_password psql -U postgres -d upaci
```

### Node.js (pg library)

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'upaci',
  user: 'postgres',
  password: 'your_password',
  max: 10,
});

const result = await pool.query('SELECT version()');
console.log(result.rows[0]);
```

### Connection String

```
postgresql://postgres:password@localhost:5432/upaci
```

---

## Common Commands

| Task | Command |
|------|---------|
| Connect to database | `psql -U postgres -d upaci` |
| List databases | `psql -U postgres -l` |
| List tables | `\dt` (inside psql) |
| List extensions | `\dx` (inside psql) |
| Check pgvector | `SELECT * FROM pg_extension WHERE extname='vector';` |
| Database size | `SELECT pg_size_pretty(pg_database_size('upaci'));` |
| Table size | `SELECT pg_size_pretty(pg_total_relation_size('table_name'));` |

---

## Security Best Practices

### Production Deployment

1. **Change default password:**
   ```sql
   ALTER USER postgres WITH PASSWORD 'strong_32_char_password';
   ```

2. **Create application user:**
   ```sql
   CREATE USER upaci_app WITH PASSWORD 'app_password';
   GRANT CONNECT ON DATABASE upaci TO upaci_app;
   GRANT USAGE ON SCHEMA app, ai TO upaci_app;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA app, ai TO upaci_app;
   ```

3. **Enable SSL connections** (see INSTALLATION.md)

4. **Configure pg_hba.conf:** Restrict connections to specific IP addresses

5. **Regular backups:**
   ```bash
   pg_dump -U postgres -d upaci > upaci_backup_$(date +%Y%m%d).sql
   ```

---

## Performance Tuning

### Vector Search Optimization

```sql
-- Create IVFFlat index for faster similarity search
CREATE INDEX appointments_embedding_idx 
ON appointments 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Adjust lists parameter based on dataset size
-- Rule of thumb: lists = rows / 1000 (min 10, max 10,000)
```

### Connection Pooling

Use PgBouncer for high-traffic applications:

```ini
# /etc/pgbouncer/pgbouncer.ini
[databases]
upaci = host=localhost port=5432 dbname=upaci

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
pool_mode = transaction
max_client_conn = 100
default_pool_size = 25
```

---

## Troubleshooting

### Connection refused
```bash
# Check PostgreSQL service status
# Windows: Get-Service postgresql-x64-15
# Linux: sudo systemctl status postgresql
```

### pgvector extension not found
See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md#pgvector-extension-not-found)

### Slow vector queries
- Create IVFFlat index
- Adjust `lists` parameter
- Use LIMIT in queries

---

## Fallback Mode

If pgvector is unavailable, the application automatically falls back to PostgreSQL full-text search. See [FALLBACK_STRATEGY.md](docs/FALLBACK_STRATEGY.md) for details.

**To disable pgvector intentionally:**
```env
# In .env file
ENABLE_PGVECTOR=false
FALLBACK_TO_FULLTEXT=true
```

---

## Next Steps

1. ✅ **Database installed** → Run test scripts
2. ✅ **pgvector enabled** → Verify with test_vector_operations.sql
3. 🔄 **Run migrations** → Create application tables (future tasks)
4. 🔄 **Seed data** → Populate with sample data (development)
5. 🔄 **Configure backup** → Automated backup schedule

---

## Support

- **Installation Issues:** See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- **PostgreSQL Docs:** https://www.postgresql.org/docs/15/
- **pgvector GitHub:** https://github.com/pgvector/pgvector
- **Project Issues:** Check main README for support channels

---

## License

This database setup is part of the Clinical Appointment Platform.  
Private - Internal Use Only

---

**Database Setup Version:** 1.0.0  
**Last Updated:** March 18, 2026  
**Clinical Appointment Platform Team**
