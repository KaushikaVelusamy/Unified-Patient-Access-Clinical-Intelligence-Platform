#!/bin/bash

################################################################################
# PostgreSQL 15 + pgvector Installation Script for Linux (Ubuntu/Debian)
#
# Description: Automates installation of PostgreSQL 15.x and pgvector extension
#              on Ubuntu 20.04+ and Debian 11+
#
# Usage: sudo ./linux-install.sh [options]
#
# Options:
#   --skip-postgresql    Skip PostgreSQL installation
#   --skip-pgvector      Skip pgvector installation
#   --postgres-password  Set PostgreSQL password (default: postgres)
#
# Requirements: sudo privileges, Ubuntu 20.04+ or Debian 11+
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
SKIP_POSTGRESQL=false
SKIP_PGVECTOR=false
POSTGRES_PASSWORD="postgres"
POSTGRESQL_VERSION="15"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-postgresql)
            SKIP_POSTGRESQL=true
            shift
            ;;
        --skip-pgvector)
            SKIP_PGVECTOR=true
            shift
            ;;
        --postgres-password)
            POSTGRES_PASSWORD="$2"
            shift 2
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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Header
print_header "PostgreSQL 15 + pgvector Installation\nClinical Appointment Platform"

# Detect OS
print_info "[Step 1/6] Detecting operating system..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VERSION=$VERSION_ID
    print_success "Detected: $PRETTY_NAME"
else
    print_error "Cannot detect OS. This script supports Ubuntu 20.04+ and Debian 11+"
    exit 1
fi

# Verify OS compatibility
if [[ "$OS" != "ubuntu" && "$OS" != "debian" ]]; then
    print_error "Unsupported OS: $OS. This script supports Ubuntu and Debian only."
    exit 1
fi

if [[ "$OS" == "ubuntu" ]]; then
    if [[ "${OS_VERSION%%.*}" -lt 20 ]]; then
        print_error "Ubuntu version must be 20.04 or higher (detected: $OS_VERSION)"
        exit 1
    fi
elif [[ "$OS" == "debian" ]]; then
    if [[ "${OS_VERSION%%.*}" -lt 11 ]]; then
        print_error "Debian version must be 11 or higher (detected: $OS_VERSION)"
        exit 1
    fi
fi

# Step 2: Update package repositories
print_info "[Step 2/6] Updating package repositories..."
apt-get update -qq
print_success "Package repositories updated"

# Step 3: Install PostgreSQL
if [ "$SKIP_POSTGRESQL" = false ]; then
    print_info "[Step 3/6] Installing PostgreSQL $POSTGRESQL_VERSION..."
    
    # Check if PostgreSQL is already installed
    if command -v psql &> /dev/null; then
        INSTALLED_VERSION=$(psql --version | grep -oP '\d+' | head -1)
        print_warning "PostgreSQL $INSTALLED_VERSION is already installed"
        read -p "Do you want to skip PostgreSQL installation? (Y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            SKIP_POSTGRESQL=true
        fi
    fi
    
    if [ "$SKIP_POSTGRESQL" = false ]; then
        # Add PostgreSQL APT repository
        print_info "Adding PostgreSQL official repository..."
        apt-get install -y -qq curl ca-certificates gnupg lsb-release > /dev/null 2>&1
        
        # Import PostgreSQL signing key
        curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql-archive-keyring.gpg
        
        # Add repository to sources list
        echo "deb [signed-by=/usr/share/keyrings/postgresql-archive-keyring.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
        
        # Update package list
        apt-get update -qq
        
        # Install PostgreSQL
        print_info "Installing PostgreSQL $POSTGRESQL_VERSION packages..."
        apt-get install -y -qq \
            postgresql-$POSTGRESQL_VERSION \
            postgresql-client-$POSTGRESQL_VERSION \
            postgresql-contrib-$POSTGRESQL_VERSION \
            postgresql-server-dev-$POSTGRESQL_VERSION \
            > /dev/null 2>&1
        
        print_success "PostgreSQL $POSTGRESQL_VERSION installed successfully"
        
        # Start PostgreSQL service
        print_info "Starting PostgreSQL service..."
        systemctl start postgresql
        systemctl enable postgresql > /dev/null 2>&1
        print_success "PostgreSQL service started and enabled"
        
        # Set postgres user password
        print_info "Setting PostgreSQL password..."
        sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$POSTGRES_PASSWORD';" > /dev/null 2>&1
        print_success "PostgreSQL password configured"
    fi
else
    print_info "[Step 3/6] Skipping PostgreSQL installation"
fi

# Step 4: Verify PostgreSQL installation
print_info "[Step 4/6] Verifying PostgreSQL installation..."
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version)
    print_success "PostgreSQL version: $PG_VERSION"
    
    # Check PostgreSQL service status
    if systemctl is-active --quiet postgresql; then
        print_success "PostgreSQL service is running"
    else
        print_error "PostgreSQL service is not running"
        exit 1
    fi
else
    print_error "PostgreSQL is not installed or not in PATH"
    exit 1
fi

# Step 5: Install pgvector extension
if [ "$SKIP_PGVECTOR" = false ]; then
    print_info "[Step 5/6] Installing pgvector extension..."
    
    # Install build dependencies
    print_info "Installing build dependencies..."
    apt-get install -y -qq \
        build-essential \
        git \
        postgresql-server-dev-$POSTGRESQL_VERSION \
        > /dev/null 2>&1
    print_success "Build dependencies installed"
    
    # Clone pgvector repository
    print_info "Downloading pgvector source code..."
    PGVECTOR_DIR="/tmp/pgvector"
    if [ -d "$PGVECTOR_DIR" ]; then
        rm -rf "$PGVECTOR_DIR"
    fi
    
    git clone --quiet --branch v0.5.1 https://github.com/pgvector/pgvector.git "$PGVECTOR_DIR" > /dev/null 2>&1
    print_success "pgvector source code downloaded"
    
    # Build and install pgvector
    print_info "Building pgvector extension..."
    cd "$PGVECTOR_DIR"
    make > /dev/null 2>&1
    print_success "pgvector built successfully"
    
    print_info "Installing pgvector extension..."
    make install > /dev/null 2>&1
    print_success "pgvector extension installed"
    
    # Cleanup
    cd - > /dev/null
    rm -rf "$PGVECTOR_DIR"
else
    print_info "[Step 5/6] Skipping pgvector installation"
fi

# Step 6: Initialize Database and Enable Extension
print_info "[Step 6/6] Initializing UPACI database..."

# Create database
DATABASE_EXISTS=$(sudo -u postgres psql -t -c "SELECT 1 FROM pg_database WHERE datname='upaci'" 2>/dev/null | tr -d '[:space:]')

if [ "$DATABASE_EXISTS" = "1" ]; then
    print_warning "Database 'upaci' already exists"
else
    print_info "Creating database 'upaci'..."
    sudo -u postgres psql -c "CREATE DATABASE upaci;" > /dev/null 2>&1
    print_success "Database 'upaci' created"
fi

# Enable pgvector extension
if [ "$SKIP_PGVECTOR" = false ]; then
    print_info "Enabling pgvector extension..."
    sudo -u postgres psql -d upaci -c "CREATE EXTENSION IF NOT EXISTS vector;" > /dev/null 2>&1
    
    # Verify extension
    EXT_EXISTS=$(sudo -u postgres psql -d upaci -t -c "SELECT 1 FROM pg_extension WHERE extname='vector'" 2>/dev/null | tr -d '[:space:]')
    
    if [ "$EXT_EXISTS" = "1" ]; then
        print_success "pgvector extension enabled successfully"
    else
        print_warning "pgvector extension could not be verified. Check TROUBLESHOOTING.md"
    fi
fi

# Configure PostgreSQL for external connections (optional)
print_info "Configuring PostgreSQL for external connections..."
PG_CONF="/etc/postgresql/$POSTGRESQL_VERSION/main/postgresql.conf"
PG_HBA="/etc/postgresql/$POSTGRESQL_VERSION/main/pg_hba.conf"

if [ -f "$PG_CONF" ]; then
    # Enable listening on all interfaces
    sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"
    
    # Add entry to pg_hba.conf for local network access
    if ! grep -q "host.*all.*all.*0.0.0.0/0.*md5" "$PG_HBA"; then
        echo "# Allow connections from local network" >> "$PG_HBA"
        echo "host    all             all             0.0.0.0/0               md5" >> "$PG_HBA"
    fi
    
    # Restart PostgreSQL to apply changes
    systemctl restart postgresql
    print_success "PostgreSQL configured for external connections"
fi

# Summary
echo ""
print_header "Installation Complete!"
echo -e "${CYAN}PostgreSQL Details:${NC}"
echo "  - Version: PostgreSQL $POSTGRESQL_VERSION"
echo "  - Port: 5432"
echo "  - Database: upaci"
echo "  - Service: postgresql"
echo ""
echo -e "${CYAN}Connection String:${NC}"
echo "  postgresql://postgres:$POSTGRES_PASSWORD@localhost:5432/upaci"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Update server/.env with database connection details"
echo "  2. Test connection: psql -U postgres -d upaci"
echo "  3. Run test scripts in database/scripts/"
echo ""
print_warning "IMPORTANT: Change the default postgres password for production!"
print_warning "FIREWALL: If accessing remotely, open port 5432 in firewall"
echo ""
