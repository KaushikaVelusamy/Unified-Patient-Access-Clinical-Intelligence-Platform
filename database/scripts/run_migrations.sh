#!/bin/bash

################################################################################
# Database Migration Runner - Linux/Mac
# Clinical Appointment Platform (UPACI)
#
# Description: Executes all database migrations in sequential order
# Usage: ./run_migrations.sh [options]
#
# Options:
#   --db-name        Database name (default: upaci)
#   --db-user        Database user (default: postgres)
#   --db-host        Database host (default: localhost)
#   --db-port        Database port (default: 5432)
#   --skip-seed      Skip loading seed data
#   --rollback-first Rollback all tables before running migrations
#
# Requirements: PostgreSQL 15+, psql client
# Author: Clinical Appointment Platform Team
# Version: 1.0.0
################################################################################

set -e  # Exit on error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
DB_NAME="upaci"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
SKIP_SEED=false
ROLLBACK_FIRST=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --db-name)
            DB_NAME="$2"
            shift 2
            ;;
        --db-user)
            DB_USER="$2"
            shift 2
            ;;
        --db-host)
            DB_HOST="$2"
            shift 2
            ;;
        --db-port)
            DB_PORT="$2"
            shift 2
            ;;
        --skip-seed)
            SKIP_SEED=true
            shift
            ;;
        --rollback-first)
            ROLLBACK_FIRST=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Helper functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${CYAN}[INFO] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_header() {
    echo -e "${CYAN}==========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}==========================================${NC}"
    echo ""
}

# Header
print_header "Database Migration Runner\nClinical Appointment Platform"

# Get script directory
SCRIPT_DIR="$( cd "$(  dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Migration directories
MIGRATIONS_DIR="$PROJECT_ROOT/migrations"
SEEDS_DIR="$PROJECT_ROOT/seeds"
ROLLBACK_DIR="$PROJECT_ROOT/rollback"

# Check if directories exist
if [ ! -d "$MIGRATIONS_DIR" ]; then
    print_error "Migrations directory not found: $MIGRATIONS_DIR"
    exit 1
fi

# Test database connection
print_info "Testing database connection..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_error "Cannot connect to database"
    print_info "Connection details:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    exit 1
fi

# Rollback if requested
if [ "$ROLLBACK_FIRST" = true ]; then
    print_warning "Rolling back all tables first..."
    
    if [ -f "$ROLLBACK_DIR/rollback_all.sql" ]; then
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$ROLLBACK_DIR/rollback_all.sql"
        print_success "Rollback completed"
    else
        print_warning "Rollback script not found, skipping..."
    fi
    echo ""
fi

# Run migrations
print_header "Running Migrations"

MIGRATION_COUNT=0
MIGRATION_ERRORS=0

for migration_file in $(ls -1 "$MIGRATIONS_DIR"/V*.sql | sort -V); do
    migration_name=$(basename "$migration_file")
    print_info "Running migration: $migration_name"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"; then
        print_success "Migration $migration_name completed"
        ((MIGRATION_COUNT++))
    else
        print_error "Migration $migration_name failed"
        ((MIGRATION_ERRORS++))
        exit 1
    fi
    echo ""
done

# Load seed data
if [ "$SKIP_SEED" = false ]; then
    print_header "Loading Seed Data"
    
    if [ -f "$SEEDS_DIR/dev_seed_data.sql" ]; then
        print_info "Loading development seed data..."
        
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SEEDS_DIR/dev_seed_data.sql"; then
            print_success "Seed data loaded successfully"
        else
            print_error "Failed to load seed data"
            print_warning "Migrations completed but seed data failed"
        fi
    else
        print_warning "Seed data file not found, skipping..."
    fi
    echo ""
fi

# Verify tables created
print_header "Verification"

print_info "Verifying tables..."
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'app'" | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    print_success "Tables created: $TABLE_COUNT"
else
    print_error "No tables found in app schema"
    exit 1
fi

# Verify foreign keys
FK_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND constraint_schema = 'app'" | tr -d ' ')
print_success "Foreign keys created: $FK_COUNT"

# Verify indexes
INDEX_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'app'" | tr -d ' ')
print_success "Indexes created: $INDEX_COUNT"

# Verify pgvector
VECTOR_EXTENSION=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector'" | tr -d ' ')
if [ "$VECTOR_EXTENSION" -eq "1" ]; then
    print_success "pgvector extension enabled"
else
    print_warning "pgvector extension not found"
fi

echo ""

# Summary
print_header "Migration Summary"
print_success "Migrations executed: $MIGRATION_COUNT"
print_success "Migration errors: $MIGRATION_ERRORS"
print_success "Tables in app schema: $TABLE_COUNT"
print_success "Foreign key constraints: $FK_COUNT"
print_success "Indexes: $INDEX_COUNT"

echo ""
print_info "Database: $DB_NAME on $DB_HOST:$DB_PORT"
print_info "Migration directory: $MIGRATIONS_DIR"

echo ""
print_success "All migrations completed successfully!"
echo ""
