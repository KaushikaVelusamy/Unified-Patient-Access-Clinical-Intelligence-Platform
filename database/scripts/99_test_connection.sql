-- ============================================================================
-- Connection Test Script
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Verifies PostgreSQL connection and extension installation
-- Usage: psql -U postgres -d upaci -f 99_test_connection.sql
-- ============================================================================

\echo ''
\echo '================================================'
\echo 'PostgreSQL Connection & Extension Test'
\echo 'Clinical Appointment Platform (UPACI)'
\echo '================================================'
\echo ''

-- Test 1: PostgreSQL Version
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 1: PostgreSQL Version'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
SELECT version();
\echo ''

-- Test 2: Current Database
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 2: Current Database'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
SELECT current_database() AS database_name;
\echo ''

-- Test 3: Current User
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 3: Current User & Role'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
SELECT 
    current_user AS username,
    session_user AS session_user,
    current_role AS current_role;
\echo ''

-- Test 4: Database Size
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 4: Database Size'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
SELECT 
    pg_database.datname AS database_name,
    pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'upaci';
\echo ''

-- Test 5: Installed Extensions
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 5: Installed Extensions'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
SELECT 
    extname AS extension_name,
    extversion AS version,
    extnamespace::regnamespace::text AS schema
FROM pg_extension
ORDER BY extname;
\echo ''

-- Test 6: pgvector Extension Verification
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 6: pgvector Extension Status'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'INSTALLED ✓'
        ELSE 'NOT INSTALLED ✗'
    END AS pgvector_status,
    MAX(extversion) AS version
FROM pg_extension 
WHERE extname = 'vector';
\echo ''

-- Test 7: Available Schemas
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 7: Database Schemas'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
SELECT 
    schema_name,
    schema_owner
FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name;
\echo ''

-- Test 8: Connection Information
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 8: Connection Information'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
SELECT 
    inet_server_addr() AS server_address,
    inet_server_port() AS server_port,
    current_timestamp AS connection_time;
\echo ''

-- Test 9: Database Settings
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 9: Database Configuration'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
SELECT 
    name AS setting_name,
    setting AS value,
    unit
FROM pg_settings
WHERE name IN ('max_connections', 'shared_buffers', 'effective_cache_size', 'timezone')
ORDER BY name;
\echo ''

-- Test 10: Active Connections
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'Test 10: Active Connections'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
SELECT 
    COUNT(*) AS active_connections,
    current_database() AS database
FROM pg_stat_activity
WHERE datname = current_database();
\echo ''

-- Summary
\echo '================================================'
\echo 'Connection Test Complete!'
\echo '================================================'
\echo ''
\echo 'All tests executed successfully.'
\echo 'Next: Run vector operations test'
\echo '   psql -U postgres -d upaci -f 99_test_vector_operations.sql'
\echo ''
