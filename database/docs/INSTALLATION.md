# PostgreSQL 15 + pgvector Installation Guide

Complete installation guide for PostgreSQL 15+ with pgvector extension for the Clinical Appointment Platform.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
  - [Windows Installation](#windows-installation)
  - [Linux Installation (Ubuntu/Debian)](#linux-installation-ubuntudebian)
  - [Docker Installation](#docker-installation)
- [Post-Installation Setup](#post-installation-setup)
- [Verification](#verification)
- [Configuration](#configuration)
- [Next Steps](#next-steps)

---

## Overview

This guide covers installation of:
- **PostgreSQL 15+**: Open-source relational database
- **pgvector 0.5.0+**: Extension for AI vector similarity search

**Why pgvector?**
- Enables semantic search using AI embeddings
- Supports OpenAI ada-002, Cohere, sentence-transformers
- Native PostgreSQL integration (no external services)
- Cosine similarity, L2 distance, inner product operators

---

## Prerequisites

### All Platforms
- Administrator/root privileges
- Internet connection for downloads
- 2GB+ free disk space

### Windows
- Windows 10 or Windows 11
- PowerShell 5.1+
- .NET Framework 4.7.2+ (usually pre-installed)

### Linux
- Ubuntu 20.04+ or Debian 11+
- sudo privileges
- Build tools (gcc, make, git)

### Docker
- Docker Engine 20.10+
- Docker Compose (optional)

---

## Installation Methods

### Windows Installation

#### Option 1: Automated PowerShell Script (Recommended)

1. **Open PowerShell as Administrator**
   - Right-click Start → Windows PowerShell (Admin)

2. **Navigate to installation directory**
   ```powershell
   cd C:\path\to\ASSIGNMENT\database\install
   ```

3. **Run installation script**
   ```powershell
   .\windows-install.ps1
   ```

4. **Follow prompts**
   - Accept PostgreSQL 15 installation
   - Default password: `postgres` (change for production!)
   - Installation takes 5-10 minutes

#### Option 2: Manual Installation

##### Step 1: Download PostgreSQL 15

1. Visit [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)
2. Download PostgreSQL 15.x installer (Windows x86-64)
3. Run installer `postgresql-15.x-x-windows-x64.exe`

##### Step 2: Install PostgreSQL

1. Click **Next** through Welcome screen
2. Installation Directory: `C:\Program Files\PostgreSQL\15` (default)
3. Components: Select **all** (PostgreSQL Server, pgAdmin, Command Line Tools)
4. Data Directory: `C:\Program Files\PostgreSQL\15\data` (default)
5. Password: Set superuser password (remember this!)
6. Port: `5432` (default)
7. Locale: `en_US.UTF-8` or system default
8. Click **Next** → **Install** (wait 5-10 minutes)

##### Step 3: Add PostgreSQL to PATH

```powershell
$pgBinPath = "C:\Program Files\PostgreSQL\15\bin"
[Environment]::SetEnvironmentVariable("Path", "$env:Path;$pgBinPath", "Machine")
```

Restart PowerShell after this step.

##### Step 4: Download and Install pgvector

1. Download pgvector prebuilt binary:
   - Visit [pgvector Releases](https://github.com/pgvector/pgvector/releases)
   - Download `pgvector-v0.5.1-pg15-windows-x64.zip`

2. Extract the ZIP file

3. Copy files to PostgreSQL directories:
   ```powershell
   # Copy DLL
   Copy-Item vector.dll "C:\Program Files\PostgreSQL\15\lib\"
   
   # Copy SQL and control files
   Copy-Item vector*.sql "C:\Program Files\PostgreSQL\15\share\extension\"
   Copy-Item vector.control "C:\Program Files\PostgreSQL\15\share\extension\"
   ```

##### Step 5: Initialize Database

```powershell
# Set password (temporary)
$env:PGPASSWORD = "your_password"

# Create database
psql -U postgres -c "CREATE DATABASE upaci;"

# Enable extension
psql -U postgres -d upaci -c "CREATE EXTENSION vector;"

# Remove password variable
Remove-Item Env:\PGPASSWORD
```

---

### Linux Installation (Ubuntu/Debian)

#### Option 1: Automated Bash Script (Recommended)

1. **Open Terminal**

2. **Navigate to installation directory**
   ```bash
   cd /path/to/ASSIGNMENT/database/install
   ```

3. **Make script executable**
   ```bash
   chmod +x linux-install.sh
   ```

4. **Run installation script with sudo**
   ```bash
   sudo ./linux-install.sh
   ```

5. **Optional script parameters**
   ```bash
   # Skip PostgreSQL installation (if already installed)
   sudo ./linux-install.sh --skip-postgresql
   
   # Set custom password
   sudo ./linux-install.sh --postgres-password "my_secure_password"
   
   # Skip pgvector
   sudo ./linux-install.sh --skip-pgvector
   ```

#### Option 2: Manual Installation

##### Step 1: Add PostgreSQL Repository

```bash
# Install prerequisites
sudo apt-get update
sudo apt-get install -y curl ca-certificates gnupg lsb-release

# Import PostgreSQL signing key
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | \
  sudo gpg --dearmor -o /usr/share/keyrings/postgresql-archive-keyring.gpg

# Add PostgreSQL repository
echo "deb [signed-by=/usr/share/keyrings/postgresql-archive-keyring.gpg] \
  http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | \
  sudo tee /etc/apt/sources.list.d/pgdg.list
```

##### Step 2: Install PostgreSQL 15

```bash
# Update package list
sudo apt-get update

# Install PostgreSQL 15
sudo apt-get install -y \
  postgresql-15 \
  postgresql-client-15 \
  postgresql-contrib-15 \
  postgresql-server-dev-15
```

##### Step 3: Start PostgreSQL Service

```bash
# Start service
sudo systemctl start postgresql

# Enable auto-start on boot
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

##### Step 4: Set PostgreSQL Password

```bash
# Switch to postgres user and set password
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'your_password';"
```

##### Step 5: Install Build Tools

```bash
sudo apt-get install -y build-essential git
```

##### Step 6: Build and Install pgvector

```bash
# Clone pgvector repository
cd /tmp
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector

# Build
make

# Install (requires sudo)
sudo make install

# Cleanup
cd ..
rm -rf pgvector
```

##### Step 7: Initialize Database

```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE upaci;"

# Enable pgvector extension
sudo -u postgres psql -d upaci -c "CREATE EXTENSION vector;"
```

##### Step 8: Configure External Access (Optional)

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf
# Change: listen_addresses = '*'

# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: host all all 0.0.0.0/0 md5

# Restart PostgreSQL
sudo systemctl restart postgresql

# Open firewall port (if using UFW)
sudo ufw allow 5432/tcp
```

---

### Docker Installation

#### Option 1: Docker Run (Quick Start)

```bash
# Run PostgreSQL 15 + pgvector container
docker run -d \
  --name upaci-postgres \
  -e POSTGRES_DB=upaci \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=change_me_in_production \
  -p 5432:5432 \
  -v upaci_pgdata:/var/lib/postgresql/data \
  ankane/pgvector:latest

# Verify container is running
docker ps | grep upaci-postgres

# Test connection
docker exec -it upaci-postgres psql -U postgres -d upaci -c "SELECT version();"

# Test pgvector extension
docker exec -it upaci-postgres psql -U postgres -d upaci -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### Option 2: Docker Compose

1. **Create `docker-compose.yml`** in `database/` directory:

```yaml
version: '3.8'

services:
  postgres:
    image: ankane/pgvector:latest
    container_name: upaci-postgres
    environment:
      POSTGRES_DB: upaci
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: change_me_in_production
      POSTGRES_INITDB_ARGS: "-E UTF8 --locale=en_US.UTF-8"
    ports:
      - "5432:5432"
    volumes:
      - upaci_pgdata:/var/lib/postgresql/data
      - ./scripts:/docker-entrypoint-initdb.d
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d upaci"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  upaci_pgdata:
    name: upaci_postgres_data
```

2. **Start services**:

```bash
cd database
docker-compose up -d

# View logs
docker-compose logs -f postgres

# Stop services
docker-compose down
```

---

## Post-Installation Setup

### 1. Run Initialization Script

```bash
# Windows
cd C:\path\to\ASSIGNMENT\database
psql -U postgres -f scripts\01_init_database.sql

# Linux/Mac
cd /path/to/ASSIGNMENT/database
psql -U postgres -f scripts/01_init_database.sql

# Docker
docker exec -i upaci-postgres psql -U postgres < scripts/01_init_database.sql
```

### 2. Verify Installation

Run connection test:

```bash
# Windows/Linux
psql -U postgres -d upaci -f scripts/99_test_connection.sql

# Docker
docker exec -i upaci-postgres psql -U postgres -d upaci < scripts/99_test_connection.sql
```

Run vector operations test:

```bash
# Windows/Linux
psql -U postgres -d upaci -f scripts/99_test_vector_operations.sql

# Docker
docker exec -i upaci-postgres psql -U postgres -d upaci < scripts/99_test_vector_operations.sql
```

---

## Verification

### Check PostgreSQL Version

```bash
psql --version
# Expected: psql (PostgreSQL) 15.x or higher
```

### Check Service Status

**Windows:**
```powershell
Get-Service -Name "postgresql-x64-15"
# Status should be "Running"
```

**Linux:**
```bash
sudo systemctl status postgresql
# Active: active (running)
```

**Docker:**
```bash
docker ps | grep upaci-postgres
# Should show running container
```

### Test Database Connection

```bash
psql -U postgres -h localhost -p 5432 -d upaci -c "SELECT version();"
```

Expected output:
```
PostgreSQL 15.x on x86_64-pc-linux-gnu, compiled by gcc...
```

### Verify pgvector Extension

```bash
psql -U postgres -d upaci -c "SELECT * FROM pg_extension WHERE extname='vector';"
```

Expected output:
```
 oid  | extname | extowner | extnamespace | extrelocatable | extversion 
------+---------+----------+--------------+----------------+------------
 16xxx | vector  |       10 |         2200 | t              | 0.5.1
```

---

## Configuration

### Update Server Environment Variables

Edit `server/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=upaci
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SSL=false

# For production, use connection pooling
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Security Hardening (Production)

#### 1. Change Default Password

```bash
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'very_secure_password_32_chars_min';"
```

#### 2. Create Application User

```bash
psql -U postgres -d upaci << EOF
CREATE USER upaci_app WITH PASSWORD 'app_user_password';
GRANT CONNECT ON DATABASE upaci TO upaci_app;
GRANT USAGE ON SCHEMA app, ai TO upaci_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA app, ai TO upaci_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app, ai TO upaci_app;
EOF
```

#### 3. Configure SSL (Production)

1. Generate SSL certificates
2. Update `postgresql.conf`:
   ```
   ssl = on
   ssl_cert_file = '/path/to/server.crt'
   ssl_key_file = '/path/to/server.key'
   ```
3. Update `server/.env`: `DB_SSL=true`

---

## Next Steps

1. **✓ PostgreSQL 15+ installed** → Verify with `psql --version`
2. **✓ pgvector extension enabled** → Run test scripts
3. **Configure application** → Update `server/.env` with connection details
4. **Run database migrations** → Execute schema creation (future tasks)
5. **Test vector search** → Integrate with OpenAI/Cohere embeddings

---

## Quick Reference

| Task | Command |
|------|---------|
| Connect to database | `psql -U postgres -d upaci` |
| List databases | `psql -U postgres -l` |
| List extensions | `\dx` (inside psql) |
| Check service (Windows) | `Get-Service postgresql-x64-15` |
| Check service (Linux) | `sudo systemctl status postgresql` |
| Restart service (Windows) | `Restart-Service postgresql-x64-15` |
| Restart service (Linux) | `sudo systemctl restart postgresql` |
| View logs (Linux) | `sudo tail -f /var/log/postgresql/postgresql-15-main.log` |

---

## Troubleshooting

If you encounter issues, refer to [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common problems and solutions.

For fallback strategies when pgvector is unavailable, see [FALLBACK_STRATEGY.md](FALLBACK_STRATEGY.md).

---

**Installation Guide Version:** 1.0.0  
**Last Updated:** March 18, 2026  
**Clinical Appointment Platform Team**
