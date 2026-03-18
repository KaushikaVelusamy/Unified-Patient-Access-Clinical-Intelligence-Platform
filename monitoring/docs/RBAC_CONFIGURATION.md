# Grafana RBAC Configuration Guide

## Overview

This guide covers Role-Based Access Control (RBAC) configuration for UPACI Grafana dashboards, ensuring proper access management and security compliance.

## Default Security Configuration

The monitoring stack is configured with the following security defaults:

```ini
# grafana/grafana.ini
[users]
allow_sign_up = false          # Prevent self-registration
default_org_role = Viewer      # New users get read-only access

[auth.anonymous]
enabled = false                # Disable anonymous access

[security]
admin_user = admin             # Set via GF_SECURITY_ADMIN_USER env var
admin_password = ***           # Set via GF_SECURITY_ADMIN_PASSWORD env var
```

## Grafana Roles Overview

Grafana provides three built-in organization roles:

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Viewer** | View dashboards and panels | Operations staff, stakeholders |
| **Editor** | View + edit dashboards, create panels | DevOps engineers, SREs |
| **Admin** | All Editor permissions + user management | Platform administrators |

## AC2 Requirement: Admin-Only Dashboard Editing

**Acceptance Criteria**: "Only users with admin role can modify dashboard settings and add new panels"

### Default Configuration (AC2 Compliant)

The provisioned dashboards are configured with:

```yaml
# grafana/provisioning/dashboards/default.yml
providers:
  - name: 'default'
    options:
      path: /var/lib/grafana/dashboards
      foldersFromFilesStructure: true
```

By default, provisioned dashboards:
- ✅ Viewable by all authenticated users (Viewer role)
- ✅ Editable only by Admins and Editors
- ⚠️ To restrict editing to Admins only, see "Enforcing Admin-Only Editing" below

## User Management

### Creating Users

#### Option 1: Grafana UI (Recommended)

1. Login as admin
2. Navigate to **Administration > Users**
3. Click **New user**
4. Fill in details:
   - Name
   - Email
   - Username
   - Password
5. Set **Organization role** to Viewer (default)
6. Click **Create**

#### Option 2: Grafana API

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -u admin:${ADMIN_PASSWORD} \
  -d '{
    "name": "John Doe",
    "email": "john.doe@upaci.com",
    "login": "johndoe",
    "password": "temporaryPassword123!",
    "OrgId": 1
  }'
```

#### Option 3: Grafana CLI (Docker)

```bash
docker-compose exec grafana grafana-cli admin reset-admin-password newpassword
```

### Assigning Roles

#### Update User Role via UI

1. **Administration > Users**
2. Click on user
3. Navigate to **Organizations** tab
4. Change role in dropdown (Viewer/Editor/Admin)
5. Click **Update**

#### Update User Role via API

```bash
curl -X PATCH http://localhost:3000/api/org/users/{userId} \
  -H "Content-Type: application/json" \
  -u admin:${ADMIN_PASSWORD} \
  -d '{"role": "Viewer"}'
```

Replace `{userId}` with actual user ID from `/api/org/users`.

## Enforcing Admin-Only Editing

To ensure **only Admins** can edit dashboards (strict AC2 compliance):

### Method 1: Dashboard Permissions (Recommended)

Set explicit permissions on each dashboard:

1. Open dashboard (e.g., UPACI System Health)
2. Click Settings (gear icon)
3. Navigate to **Permissions** tab
4. Remove "Editor" role if present
5. Ensure only "Admin" role has "Edit" permission
6. Click **Save**

#### Bulk Permission Update via API

```bash
#!/bin/bash
GRAFANA_URL="http://localhost:3000"
ADMIN_USER="admin"
ADMIN_PASS="${ADMIN_PASSWORD}"

DASHBOARDS=("upaci-system-health" "upaci-api-performance" "upaci-infrastructure")

for DASHBOARD_UID in "${DASHBOARDS[@]}"; do
  curl -X POST "${GRAFANA_URL}/api/dashboards/uid/${DASHBOARD_UID}/permissions" \
    -H "Content-Type: application/json" \
    -u ${ADMIN_USER}:${ADMIN_PASS} \
    -d '{
      "items": [
        {
          "role": "Viewer",
          "permission": 1
        },
        {
          "role": "Admin",
          "permission": 2
        }
      ]
    }'
done
```

**Permission Levels**:
- `1` = View
- `2` = Edit
- `4` = Admin

### Method 2: Disable allowUiUpdates for Editors

Modify dashboard provisioning config:

```yaml
# grafana/provisioning/dashboards/default.yml
providers:
  - name: 'default'
    allowUiUpdates: false  # Prevent UI edits to provisioned dashboards
    options:
      path: /var/lib/grafana/dashboards
```

This prevents **all users** (including Admins) from editing via UI. Changes must be made by:
1. Editing JSON files directly
2. Restarting Grafana to reload

**Trade-off**: Admins lose UI editing convenience but gain version control enforcement.

### Method 3: Organization-Level Settings

Restrict "Editor" role from accessing dashboards entirely:

```ini
# grafana/grafana.ini
[users]
editors_can_admin = false
viewers_can_edit = false
```

Then ensure only Admins are assigned if dashboard editing is needed.

## Authentication Options

### Basic Authentication (Default)

Current configuration uses Grafana's built-in authentication:

```ini
[auth]
disable_login_form = false
```

**Security Considerations**:
- Change default admin password immediately
- Enforce strong password policy
- Rotate credentials regularly

### LDAP/Active Directory Integration

For enterprise environments, configure LDAP:

```ini
# grafana/grafana.ini
[auth.ldap]
enabled = true
config_file = /etc/grafana/ldap.toml
allow_sign_up = true
```

Create `grafana/ldap.toml`:

```toml
[[servers]]
host = "ldap.upaci.com"
port = 389
use_ssl = false
bind_dn = "cn=admin,dc=upaci,dc=com"
bind_password = "password"
search_filter = "(uid=%s)"
search_base_dns = ["ou=users,dc=upaci,dc=com"]

[[servers.group_mappings]]
group_dn = "cn=admins,ou=groups,dc=upaci,dc=com"
org_role = "Admin"

[[servers.group_mappings]]
group_dn = "cn=ops,ou=groups,dc=upaci,dc=com"
org_role = "Viewer"
```

### OAuth2 / SSO Integration

Configure OAuth for identity providers (Azure AD, Okta, Google):

```ini
# grafana/grafana.ini
[auth.generic_oauth]
enabled = true
name = Azure AD
allow_sign_up = true
client_id = YOUR_CLIENT_ID
client_secret = YOUR_CLIENT_SECRET
scopes = openid profile email
auth_url = https://login.microsoftonline.com/YOUR_TENANT/oauth2/v2.0/authorize
token_url = https://login.microsoftonline.com/YOUR_TENANT/oauth2/v2.0/token
api_url = https://graph.microsoft.com/v1.0/me
role_attribute_path = contains(roles[*], 'GrafanaAdmin') && 'Admin' || 'Viewer'
```

## Service Accounts (API Access)

For programmatic access (CI/CD, automation), use service accounts:

### Creating Service Account

```bash
curl -X POST http://localhost:3000/api/serviceaccounts \
  -H "Content-Type: application/json" \
  -u admin:${ADMIN_PASSWORD} \
  -d '{
    "name": "monitoring-automation",
    "role": "Viewer"
  }'
```

### Generating API Token

```bash
curl -X POST http://localhost:3000/api/serviceaccounts/{id}/tokens \
  -H "Content-Type: application/json" \
  -u admin:${ADMIN_PASSWORD} \
  -d '{
    "name": "dashboard-readonly-token"
  }'
```

**Security Best Practices**:
- Use service accounts with minimum required permissions
- Rotate tokens regularly
- Store tokens in secrets management (Vault, AWS Secrets Manager)
- Never commit tokens to version control

## Audit Logging

Enable audit logging to track dashboard modifications:

```ini
# grafana/grafana.ini
[log]
level = info
mode = console file

[auditing]
enabled = true
log_dashboard_content = false  # Exclude full JSON from logs
```

Audit logs capture:
- User login/logout events
- Dashboard create/update/delete operations
- Permission changes
- API access

Logs are written to `/var/log/grafana/grafana.log` in the container.

## Folder-Based Organization

Organize dashboards with folder permissions:

### Create Dashboard Folder

```bash
curl -X POST http://localhost:3000/api/folders \
  -H "Content-Type: application/json" \
  -u admin:${ADMIN_PASSWORD} \
  -d '{
    "title": "UPACI Monitoring"
  }'
```

### Set Folder Permissions

```bash
curl -X POST http://localhost:3000/api/folders/{folderUid}/permissions \
  -H "Content-Type: application/json" \
  -u admin:${ADMIN_PASSWORD} \
  -d '{
    "items": [
      {
        "role": "Viewer",
        "permission": 1
      },
      {
        "role": "Admin",
        "permission": 2
      }
    ]
  }'
```

Dashboards inherit folder permissions by default.

## Password Policies

Enforce strong passwords with LDAP or external auth. For built-in auth:

```ini
# grafana/grafana.ini
[security]
min_password_length = 10
password_complexity = true
```

**Manual Policy Enforcement**:
- Minimum 10 characters
- Mix of uppercase, lowercase, numbers, symbols
- No common dictionary words
- Rotate every 90 days

## Session Management

Control session timeouts:

```ini
# grafana/grafana.ini
[auth]
login_maximum_inactive_lifetime_duration = 24h
login_maximum_lifetime_duration = 30d
token_rotation_interval_minutes = 10
```

## Access Review Checklist

Perform quarterly access reviews:

- [ ] List all users: `GET /api/org/users`
- [ ] Verify user roles are appropriate
- [ ] Remove inactive users (>90 days)
- [ ] Rotate admin credentials
- [ ] Review dashboard permissions
- [ ] Audit service account tokens
- [ ] Check external auth mappings (LDAP/OAuth)

## Compliance Considerations

### SOC 2 / ISO 27001

- ✅ Principle of least privilege (Viewer default role)
- ✅ Access logging (audit trail)
- ✅ Strong authentication (configurable)
- ✅ Session management (timeout policies)

### HIPAA (Healthcare Data)

- Configure TLS/HTTPS for Grafana
- Enable audit logging
- Implement SSO with MFA
- Regular access reviews
- Encrypt data at rest (Grafana database)

### GDPR (User Privacy)

- Limit personal data in dashboards
- Implement data retention policies
- Enable "Right to Erasure" (delete user data)
- Log access to sensitive dashboards

## Troubleshooting RBAC Issues

### User Can't View Dashboard

1. Check organization membership: `/api/org/users`
2. Verify dashboard permissions: Dashboard Settings > Permissions
3. Confirm folder permissions if dashboard is in folder
4. Check Grafana logs for auth errors

### Admin Can't Edit Provisioned Dashboard

- If `allowUiUpdates: false` in provisioning config, edit JSON file directly
- Restart Grafana after JSON changes: `docker-compose restart grafana`

### LDAP Users Not Getting Correct Roles

1. Test LDAP connection: `docker-compose exec grafana grafana-cli admin ldap-test`
2. Verify group mappings in `ldap.toml`
3. Check Grafana logs for LDAP errors
4. Ensure user is in correct LDAP group

## Security Hardening Checklist

- [ ] Change default admin credentials
- [ ] Disable anonymous access
- [ ] Disable self-registration
- [ ] Enable HTTPS/TLS
- [ ] Configure session timeouts
- [ ] Enable audit logging
- [ ] Implement SSO/MFA if available
- [ ] Regular access reviews
- [ ] Rotate service account tokens
- [ ] Restrict network access (firewall rules)
- [ ] Keep Grafana updated (security patches)

## Additional Resources

- [Grafana Security Documentation](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/)
- [RBAC API Reference](https://grafana.com/docs/grafana/latest/developers/http_api/access_control/)
- [Authentication Providers](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/)
- [Audit Logging](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/audit-grafana/)
