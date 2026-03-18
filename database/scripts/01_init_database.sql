-- ============================================================================
-- Database Initialization Script
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates the UPACI database and enables pgvector extension
-- Prerequisite: PostgreSQL 15+ installed
-- Usage: psql -U postgres -f 01_init_database.sql
-- ============================================================================

-- Switch to postgres database to create new database
\c postgres

-- Drop database if exists (CAUTION: Use only for development/testing)
-- Uncomment the following line if you want to start fresh
-- DROP DATABASE IF EXISTS upaci;

-- Create UPACI database
CREATE DATABASE upaci
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    TEMPLATE = template0;

-- Add comment to database
COMMENT ON DATABASE upaci 
    IS 'Clinical Appointment and Intelligence Platform Database';

-- Switch to upaci database
\c upaci

-- ============================================================================
-- Enable Extensions
-- ============================================================================

-- Enable pgvector extension for AI vector similarity search
-- This extension allows storing and querying vector embeddings for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Verify Extensions
-- ============================================================================

-- Display installed extensions
\echo ''
\echo '=============================================='
\echo 'Installed Extensions:'
\echo '=============================================='
SELECT extname, extversion, extrelocatable, extnamespace::regnamespace::text AS schema
FROM pg_extension
WHERE extname IN ('vector', 'uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- ============================================================================
-- Database Configuration
-- ============================================================================

-- Set timezone to UTC for consistency
ALTER DATABASE upaci SET timezone TO 'UTC';

-- ============================================================================
-- Create Schemas
-- ============================================================================

-- Create schema for application tables
CREATE SCHEMA IF NOT EXISTS app
    AUTHORIZATION postgres;

COMMENT ON SCHEMA app 
    IS 'Application data tables (users, appointments, patients, etc.)';

-- Create schema for AI/ML related tables
CREATE SCHEMA IF NOT EXISTS ai
    AUTHORIZATION postgres;

COMMENT ON SCHEMA ai 
    IS 'AI/ML tables (embeddings, vector search, semantic cache)';

-- Create schema for audit logs
CREATE SCHEMA IF NOT EXISTS audit
    AUTHORIZATION postgres;

COMMENT ON SCHEMA audit 
    IS 'Audit trail and logging tables';

-- ============================================================================
-- Set Default Search Path
-- ============================================================================

-- Set default search path to include application schema
ALTER DATABASE upaci SET search_path TO app, public;

-- ============================================================================
-- Summary
-- ============================================================================

\echo ''
\echo '=============================================='
\echo 'Database Initialization Complete!'
\echo '=============================================='
\echo ''
\echo 'Database: upaci'
\echo 'Extensions: pgvector, uuid-ossp, pgcrypto'
\echo 'Schemas: app, ai, audit'
\echo ''
\echo 'Next Steps:'
\echo '  1. Run connection test: psql -U postgres -d upaci -f 99_test_connection.sql'
\echo '  2. Run vector test: psql -U postgres -d upaci -f 99_test_vector_operations.sql'
\echo '  3. Run database migrations (to be created in future tasks)'
\echo ''
