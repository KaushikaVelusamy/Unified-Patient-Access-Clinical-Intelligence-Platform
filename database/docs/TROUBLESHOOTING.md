# PostgreSQL + pgvector Troubleshooting Guide

Common issues and solutions for PostgreSQL 15 and pgvector extension installation and configuration.

## Table of Contents

- [Installation Issues](#installation-issues)
  - [pgvector Extension Not Found](#pgvector-extension-not-found)
  - [PostgreSQL Installation Fails](#postgresql-installation-fails)
  - [Permission Denied Errors](#permission-denied-errors)
- [Connection Issues](#connection-issues)
  - [Connection Refused](#connection-refused)
  - [Password Authentication Failed](#password-authentication-failed)
  - [Cannot Connect from Remote Host](#cannot-connect-from-remote-host)
- [pgvector Issues](#pgvector-issues)
  - [CREATE EXTENSION vector Fails](#create-extension-vector-fails)
  - [Vector Operations Return Errors](#vector-operations-return-errors)
  - [Index Creation Fails](#index-creation-fails)
- [Performance Issues](#performance-issues)
- [Docker-Specific Issues](#docker-specific-issues)
- [Windows-Specific Issues](#windows-specific-issues)
- [Linux-Specific Issues](#linux-specific-issues)

---

## Installation Issues

### pgvector Extension Not Found

#### Symptom
```
ERROR: could not open extension control file "/usr/share/postgresql/15/extension/vector.control": No such file or directory
```

#### Diagnosis
The pgvector extension files are not installed in the correct PostgreSQL directories.

#### Solutions

**Windows:**

1. **Verify PostgreSQL installation path:**
   ```powershell
   Test-Path "C:\Program Files\PostgreSQL\15\bin\psql.exe"
   # Should return: True
   ```

2. **Check if vector.dll exists:**
   ```powershell
   Test-Path "C:\Program Files\PostgreSQL\15\lib\vector.dll"
   # Should return: True
   ```

3.

 **If missing, reinstall pgvector:**
   ```powershell
   # Download from GitHub releases
   $url = "https://github.com/pgvector/pgvector/releases/download/v0.5.1/pgvector-v0.5.1-pg15-windows-x64.zip"
   Invoke-WebRequest -Uri $url -OutFile "$env:TEMP\pgvector.zip"
   
   # Extract
   Expand-Archive -Path "$env:TEMP\pgvector.zip" -DestinationPath "$env:TEMP\pgvector" -Force
   
   # Copy files
   Copy-Item "$env:TEMP\pgvector\vector.dll" "C:\Program Files\PostgreSQL\15\lib\" -Force
   Copy-Item "$env:TEMP\pgvector\vector*.sql" "C:\Program Files\PostgreSQL\15\share\extension\" -Force
   Copy-Item "$env:TEMP\pgvector\vector.control" "C:\Program Files\PostgreSQL\15\share\extension\" -Force
   ```

**Linux:**

1. **Check PostgreSQL extensions directory:**
   ```bash
   ls -la /usr/share/postgresql/15/extension/ | grep vector
   # Should show vector.control and vector*.sql files
   ```

2. **If missing, rebuild and install pgvector:**
   ```bash
   cd /tmp
   git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
   cd pgvector
   make clean
   make
   sudo make install
   ```

3. **Verify installation:**
   ```bash
   ls -la $(pg_config --sharedir)/extension/vector*
   # Should show control and SQL files
   ```

**Docker:**

Use the official pgvector image:
```bash
docker pull ankane/pgvector:latest
```

---

### PostgreSQL Installation Fails

#### Symptom (Windows)
Installer exits with error or hangs during installation.

#### Solutions

1. **Check system requirements:**
   - Windows 10 or 11
   - 2GB+ free disk space
   - Administrator privileges
   - .NET Framework 4.7.2+

2. **Disable antivirus temporarily** during installation

3. **Clean previous installation:**
   ```powershell
   # Uninstall PostgreSQL from Control Panel
   # Delete PostgreSQL directory
   Remove-Item "C:\Program Files\PostgreSQL" -Recurse -Force
   
   # Delete data directory
   Remove-Item "C:\Program Files\PostgreSQL" -Recurse -Force -ErrorAction SilentlyContinue
   ```

4. **Download fresh installer** from [postgresql.org](https://www.postgresql.org/download/windows/)

#### Symptom (Linux)
Package manager errors during installation.

#### Solutions

1. **Update package cache:**
   ```bash
   sudo apt-get update
   sudo apt-get upgrade
   ```

2. **Fix broken packages:**
   ```bash
   sudo apt-get install -f
   sudo dpkg --configure -a
   ```

3. **Remove conflicting packages:**
   ```bash
   sudo apt-get remove --purge postgresql postgresql-*
   sudo apt-get autoremove
   ```

4. **Retry installation:**
   ```bash
   sudo apt-get install postgresql-15 postgresql-server-dev-15
   ```

---

### Permission Denied Errors

#### Symptom
```
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL: role "username" does not exist
```

#### Solutions

**Linux:**

1. **Switch to postgres user:**
   ```bash
   sudo -u postgres psql
   ```

2. **Create user for your system account:**
   ```sql
   CREATE USER your_username WITH SUPERUSER;
   ```

3. **Or use postgres user:**
   ```bash
   psql -U postgres -d upaci
   ```

**Windows:**

1. **Use postgres superuser:**
   ```powershell
   psql -U postgres -d upaci
   ```

2. **Set PGUSER environment variable:**
   ```powershell
   $env:PGUSER = "postgres"
   ```

---

## Connection Issues

### Connection Refused

#### Symptom
```
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed: Connection refused
```

#### Diagnosis
PostgreSQL service is not running or not listening on port 5432.

#### Solutions

**Windows:**

1. **Check service status:**
   ```powershell
   Get-Service -Name "postgresql-x64-15"
   ```

2. **Start service:**
   ```powershell
   Start-Service -Name "postgresql-x64-15"
   ```

3. **Verify port is listening:**
   ```powershell
   netstat -an | Select-String "5432"
   ```

**Linux:**

1. **Check service status:**
   ```bash
   sudo systemctl status postgresql
   ```

2. **Start service:**
   ```bash
   sudo systemctl start postgresql
   ```

3. **Enable auto-start:**
   ```bash
   sudo systemctl enable postgresql
   ```

4. **Check listening address:**
   ```bash
   sudo ss -tlnp | grep 5432
   ```

5. **Edit `postgresql.conf` if not listening:**
   ```bash
   sudo nano /etc/postgresql/15/main/postgresql.conf
   # Change: listen_addresses = '*'
   
   sudo systemctl restart postgresql
   ```

**Docker:**

1. **Check container status:**
   ```bash
   docker ps | grep postgres
   ```

2. **Start container:**
   ```bash
   docker start upaci-postgres
   ```

3. **Check logs:**
   ```bash
   docker logs upaci-postgres
   ```

---

### Password Authentication Failed

#### Symptom
```
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed: FATAL: password authentication failed for user "postgres"
```

#### Solutions

1. **Reset postgres password (Linux):**
   ```bash
   # Edit pg_hba.conf to allow trust authentication
   sudo nano /etc/postgresql/15/main/pg_hba.conf
   # Change line: local all postgres md5 → local all postgres trust
   
   # Restart PostgreSQL
   sudo systemctl restart postgresql
   
   # Connect and change password
   psql -U postgres
   ALTER USER postgres WITH PASSWORD 'new_password';
   \q
   
   # Restore md5 authentication
   sudo nano /etc/postgresql/15/main/pg_hba.conf
   # Change back: local all postgres trust → local all postgres md5
   
   # Restart PostgreSQL
   sudo systemctl restart postgresql
   ```

2. **Use PGPASSWORD environment variable:**
   ```bash
   export PGPASSWORD='your_password'
   psql -U postgres -d upaci
   unset PGPASSWORD
   ```

3. **Create `.pgpass` file (Linux/Mac):**
   ```bash
   echo "localhost:5432:*:postgres:your_password" > ~/.pgpass
   chmod 600 ~/.pgpass
   ```

4. **Create `pgpass.conf` (Windows):**
   ```
   File: %APPDATA%\postgresql\pgpass.conf
   Content: localhost:5432:*:postgres:your_password
   ```

---

### Cannot Connect from Remote Host

#### Symptom
```
psql: error: connection to server at "192.168.1.100" (192.168.1.100), port 5432 failed: Connection refused
```

#### Solutions

**Linux:**

1. **Edit postgresql.conf:**
   ```bash
   sudo nano /etc/postgresql/15/main/postgresql.conf
   # Change: listen_addresses = 'localhost' → listen_addresses = '*'
   ```

2. **Edit pg_hba.conf:**
   ```bash
   sudo nano /etc/postgresql/15/main/pg_hba.conf
   # Add line: host all all 0.0.0.0/0 md5
   # Or specific network: host all all 192.168.1.0/24 md5
   ```

3. **Restart PostgreSQL:**
   ```bash
   sudo systemctl restart postgresql
   ```

4. **Open firewall port:**
   ```bash
   sudo ufw allow 5432/tcp
   # Or iptables:
   sudo iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
   ```

**Windows:**

1. **Open Windows Firewall:**
   ```powershell
   New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow
   ```

---

## pgvector Issues

### CREATE EXTENSION vector Fails

#### Symptom
```
ERROR: could not load library "/usr/lib/postgresql/15/lib/vector.so": /usr/lib/postgresql/15/lib/vector.so: cannot open shared object file: No such file or directory
```

#### Solutions

1. **Verify pgvector installation:**
   ```bash
   # Linux
   ls -la $(pg_config --pkglibdir)/vector.so
   
   # Windows
   dir "C:\Program Files\PostgreSQL\15\lib\vector.dll"
   ```

2. **Reinstall pgvector** (see [pgvector Extension Not Found](#pgvector-extension-not-found))

3. **Check PostgreSQL version compatibility:**
   ```bash
   psql --version
   # pgvector 0.5.1 supports PostgreSQL 12-16
   ```

---

### Vector Operations Return Errors

#### Symptom
```
ERROR: type "vector" does not exist
```

#### Solution
Enable the vector extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

#### Symptom
```
ERROR: operator does not exist: vector <-> vector
```

#### Solution
1. **Verify extension version:**
   ```sql
   SELECT * FROM pg_extension WHERE extname='vector';
   ```

2. **Drop and recreate extension:**
   ```sql
   DROP EXTENSION vector CASCADE;
   CREATE EXTENSION vector;
   ```

---

### Index Creation Fails

#### Symptom
```
ERROR: index row size exceeds maximum for index "embedding_idx"
```

#### Solution
Use IVFFlat index with appropriate lists parameter:
```sql
-- For small datasets (< 1M rows)
CREATE INDEX embedding_idx ON table_name 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- For larger datasets
CREATE INDEX embedding_idx ON table_name 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 1000);
```

---

## Performance Issues

### Slow Vector Search Queries

#### Solutions

1. **Create appropriate index:**
   ```sql
   -- Cosine distance
   CREATE INDEX idx_embedding_cosine ON table_name 
   USING ivfflat (embedding vector_cosine_ops)
   WITH (lists = 100);
   
   -- L2 distance
   CREATE INDEX idx_embedding_l2 ON table_name 
   USING ivfflat (embedding vector_l2_ops)
   WITH (lists = 100);
   ```

2. **Increase maintenance_work_mem:**
   ```sql
   SET maintenance_work_mem = '512MB';
   ```

3. **Use LIMIT in queries:**
   ```sql
   SELECT * FROM table_name
   ORDER BY embedding <-> '[...]'
   LIMIT 10;  -- Always limit results
   ```

4. **Adjust lists parameter:**
   - Rule of thumb: `lists = rows / 1000` (min 10, max 10,000)

---

## Docker-Specific Issues

### Container Won't Start

Check logs:
```bash
docker logs upaci-postgres
```

Common issues:
- Port 5432 already in use: Change port mapping `-p 5433:5432`
- Data directory permissions: `docker volume rm upaci_pgdata` and recreate

### Data Persists After Container Removal

Volumes persist by design. To remove:
```bash
docker volume rm upaci_postgres_data
```

---

## Windows-Specific Issues

### PowerShell Script Execution Disabled

#### Error
```
cannot be loaded because running scripts is disabled on this system
```

#### Solution
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
```

### Service Won't Start

Check Windows Event Viewer:
1. Open Event Viewer (eventvwr.msc)
2. Navigate to: Windows Logs → Application
3. Filter by Source: PostgreSQL

---

## Linux-Specific Issues

### apt-get Install Fails

```bash
# Fix broken packages
sudo apt-get update
sudo apt-get install -f

# Clear cache
sudo apt-get clean
sudo rm -rf /var/lib/apt/lists/*
sudo apt-get update
```

### Build Dependencies Missing

```bash
sudo apt-get install -y build-essential postgresql-server-dev-15 git
```

---

## Additional Resources

- **PostgreSQL Documentation:** https://www.postgresql.org/docs/15/
- **pgvector GitHub:** https://github.com/pgvector/pgvector
- **Community Forums:** https://www.postgresql.org/community/
- **Stack Overflow:** https://stackoverflow.com/questions/tagged/postgresql

---

## Still Having Issues?

1. **Check logs:**
   - Windows: `C:\Program Files\PostgreSQL\15\data\log\`
   - Linux: `/var/log/postgresql/postgresql-15-main.log`

2. **Enable debug logging:**
   ```sql
   ALTER SYSTEM SET log_min_messages = 'DEBUG1';
   SELECT pg_reload_conf();
   ```

3. **Consult fallback strategy:** [FALLBACK_STRATEGY.md](FALLBACK_STRATEGY.md)

4. **Contact support:** Check project README for support channels

---

**Troubleshooting Guide Version:** 1.0.0  
**Last Updated:** March 18, 2026  
**Clinical Appointment Platform Team**
