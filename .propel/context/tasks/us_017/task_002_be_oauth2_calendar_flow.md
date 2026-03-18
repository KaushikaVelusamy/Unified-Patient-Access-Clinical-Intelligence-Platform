# Task - TASK_002_BE_OAUTH2_CALENDAR_FLOW

## Requirement Reference
- User Story: US_017  
- Story Location: `.propel/context/tasks/us_017/us_017.md`
- Acceptance Criteria:
    - AC1: OAuth2 PKCE flow during first booking to authorize calendar access
- Edge Cases:
    - OAuth token expires: Detect 401 Unauthorized, mark calendar_sync_enabled=false
    - Initial provider selection: Modal with Google + Outlook buttons

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **Note**: Backend OAuth service only

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
| Backend | googleapis | 118.x |
| Backend | @microsoft/microsoft-graph-client | 3.x |
| Database | PostgreSQL | 15+ |
| Database | node-postgres (pg) | 8.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: Backend OAuth only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend OAuth only

## Task Overview
Implement OAuth2 PKCE (Proof Key for Code Exchange) flow for Google Calendar and Microsoft Outlook calendar authorization. Create routes: GET /api/calendar/auth/:provider (initiate OAuth), GET /api/calendar/callback/:provider (handle OAuth callback). OAuth flow: (1) Generate code_verifier and code_challenge (PKCE), store in session. (2) Redirect to provider authorization URL with scopes (calendar.events for Google, Calendars.ReadWrite for Microsoft). (3) Handle callback with authorization code. (4) Exchange code for access_token and refresh_token. (5) Encrypt tokens using pgcrypto, store in database. (6) Set calendar_provider, calendar_sync_enabled=true, calendar_connected_at. (7) Return success response to frontend. Token refresh: Implement refreshAccessToken function that detects 401 errors, uses refresh_token to get new access_token, updates database. Environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_REDIRECT_URI, TOKEN_ENCRYPTION_KEY.

## Dependent Tasks
- US_017 TASK_001: Database schema with calendar columns must exist
- US_009: Authentication middleware (user session) must exist

## Impacted Components
**Modified:**
- server/src/routes/index.ts (Register calendar routes)

**New:**
- server/src/routes/calendarAuthRoutes.ts (OAuth routes)
- server/src/services/calendarOAuthService.ts (OAuth logic)
- server/src/config/calendarProviders.ts (Provider configurations)
- server/src/utils/pkce.ts (PKCE helper functions)
- server/.env.example (Add OAuth credentials)

## Implementation Plan
1. **Install SDKs**: googleapis for Google, @microsoft/microsoft-graph-client for Microsoft
2. **PKCE Helpers**: Generate code_verifier and code_challenge (SHA256 hash)
3. **Provider Configs**: OAuth endpoints, scopes, client IDs
4. **Auth Initiation**: GET /auth/:provider generates PKCE, redirects to provider
5. **Callback Handler**: GET /callback/:provider exchanges code for tokens
6. **Token Storage**: Encrypt tokens with pgcrypto, store in database
7. **Token Refresh**: Detect 401, use refresh_token to renew access_token
8. **Error Handling**: Handle OAuth errors (user declined, invalid code, network errors)
9. **Session Management**: Store PKCE verifier in session during OAuth flow
10. **Disconnect**: DELETE /api/calendar/disconnect endpoint to remove tokens

## Current Project State
```
ASSIGNMENT/
├── server/                  # Backend (US_001)
│   ├── src/
│   │   ├── routes/
│   │   │   └── index.ts
│   │   ├── services/
│   │   ├── config/
│   │   └── middleware/
│   │       └── auth.ts (US_009)
│   ├── .env
│   └── .env.example
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/routes/calendarAuthRoutes.ts | OAuth routes (auth, callback, disconnect) |
| CREATE | server/src/services/calendarOAuthService.ts | OAuth token exchange and refresh logic |
| CREATE | server/src/config/calendarProviders.ts | Google/Microsoft OAuth configurations |
| CREATE | server/src/utils/pkce.ts | PKCE code generation helpers |
| MODIFY | server/src/routes/index.ts | Register calendar auth routes |
| MODIFY | server/.env.example | Add OAuth credentials |

> 2 modified files, 4 new files created

## External References
- [OAuth2 PKCE Flow](https://oauth.net/2/pkce/)
- [Google OAuth2](https://developers.google.com/identity/protocols/oauth2)
- [Google Calendar API Scopes](https://developers.google.com/calendar/api/auth)
- [Microsoft Graph OAuth](https://learn.microsoft.com/en-us/graph/auth/)
- [Microsoft Calendar Permissions](https://learn.microsoft.com/en-us/graph/permissions-reference#calendars-permissions)

## Build Commands
```bash
# Install dependencies
cd server
npm install googleapis @microsoft/microsoft-graph-client @azure/msal-node
npm install --save-dev @types/node-fetch

# Set environment variables
cat >> .env <<EOF
# Google Calendar OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback/google

# Microsoft Outlook OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/calendar/callback/microsoft

# Token encryption
TOKEN_ENCRYPTION_KEY=your_secure_encryption_key_here
EOF

# Start backend server
npm run dev

# Test OAuth flow
# 1. Open browser: http://localhost:3000/api/calendar/auth/google
# Expected: Redirects to Google consent screen

# 2. Grant permissions
# Expected: Redirects back to callback URL

# 3. Verify database
psql -U postgres -d clinic_db -c "SELECT id, calendar_provider, calendar_sync_enabled, calendar_connected_at FROM patients WHERE id = 1;"
# Expected: calendar_provider='google', calendar_sync_enabled=true

# 4. Verify encrypted tokens
psql -U postgres -d clinic_db -c "SELECT pgp_sym_decrypt(calendar_access_token::bytea, 'your_encryption_key') FROM patients WHERE id = 1;"
# Expected: Decrypted access token

# Test token refresh
# Mock 401 error from calendar API
# Expected: refreshAccessToken called, new token stored

# Build
npm run build
```

## Implementation Validation Strategy
- [ ] googleapis and @microsoft/microsoft-graph-client installed
- [ ] PKCE helpers generate code_verifier (43-128 chars, base64url)
- [ ] PKCE code_challenge = SHA256(code_verifier) base64url encoded
- [ ] GET /api/calendar/auth/google redirects to Google OAuth
- [ ] GET /api/calendar/auth/outlook redirects to Microsoft OAuth
- [ ] OAuth redirects include: client_id, redirect_uri, scope, code_challenge, code_challenge_method=S256
- [ ] Callback handler exchanges authorization code for tokens
- [ ] Tokens encrypted with TOKEN_ENCRYPTION_KEY before database storage
- [ ] Database updated: calendar_provider, calendar_sync_enabled=true, calendar_connected_at
- [ ] Token refresh detects 401 errors, uses refresh_token
- [ ] Refreshed token replaces old token in database
- [ ] DELETE /api/calendar/disconnect clears tokens, sets calendar_sync_enabled=false
- [ ] Error handling: OAuth errors return user-friendly messages

## Implementation Checklist

### PKCE Helpers (server/src/utils/pkce.ts)
- [ ] Import: crypto from 'crypto'
- [ ] const base64URLEncode = (buffer: Buffer): string => {
- [ ]   return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
- [ ] };
- [ ] export const generateCodeVerifier = (): string => {
- [ ]   const verifier = base64URLEncode(crypto.randomBytes(32));
- [ ]   return verifier;
- [ ] };
- [ ] export const generateCodeChallenge = (verifier: string): string => {
- [ ]   const hash = crypto.createHash('sha256').update(verifier).digest();
- [ ]   const challenge = base64URLEncode(hash);
- [ ]   return challenge;
- [ ] };

### Calendar Provider Config (server/src/config/calendarProviders.ts)
- [ ] export const googleConfig = {
- [ ]   clientId: process.env.GOOGLE_CLIENT_ID,
- [ ]   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
- [ ]   redirectUri: process.env.GOOGLE_REDIRECT_URI,
- [ ]   authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
- [ ]   tokenUrl: 'https://oauth2.googleapis.com/token',
- [ ]   scopes: ['https://www.googleapis.com/auth/calendar.events'],
- [ ]   responseType: 'code',
- [ ]   accessType: 'offline',
- [ ]   prompt: 'consent'
- [ ] };
- [ ] export const microsoftConfig = {
- [ ]   clientId: process.env.MICROSOFT_CLIENT_ID,
- [ ]   clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
- [ ]   redirectUri: process.env.MICROSOFT_REDIRECT_URI,
- [ ]   authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
- [ ]   tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
- [ ]   scopes: ['Calendars.ReadWrite', 'offline_access'],
- [ ]   responseType: 'code'
- [ ] };

### Calendar OAuth Service (server/src/services/calendarOAuthService.ts)
- [ ] Import: pool (pg), googleConfig, microsoftConfig, generateCodeVerifier, generateCodeChallenge, axios
- [ ] const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;
- [ ] interface TokenResponse {
- [ ]   access_token: string;
- [ ]   refresh_token?: string;
- [ ]   expires_in: number;
- [ ]   token_type: string;
- [ ] }
- [ ] export const encryptToken = async (token: string): Promise<string> => {
- [ ]   const result = await pool.query('SELECT pgp_sym_encrypt($1, $2) AS encrypted', [token, ENCRYPTION_KEY]);
- [ ]   return result.rows[0].encrypted;
- [ ] };
- [ ] export const decryptToken = async (encryptedToken: string): Promise<string> => {
- [ ]   const result = await pool.query('SELECT pgp_sym_decrypt($1::bytea, $2) AS decrypted', [encryptedToken, ENCRYPTION_KEY]);
- [ ]   return result.rows[0].decrypted;
- [ ] };
- [ ] export const exchangeCodeForTokens = async (provider: string, code: string, codeVerifier: string): Promise<TokenResponse> => {
- [ ]   const config = provider === 'google' ? googleConfig : microsoftConfig;
- [ ]   const params = {
- [ ]     client_id: config.clientId,
- [ ]     client_secret: config.clientSecret,
- [ ]     code,
- [ ]     code_verifier: codeVerifier,
- [ ]     redirect_uri: config.redirectUri,
- [ ]     grant_type: 'authorization_code'
- [ ]   };
- [ ]   const response = await axios.post(config.tokenUrl, new URLSearchParams(params), {
- [ ]     headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
- [ ]   });
- [ ]   return response.data;
- [ ] };
- [ ] export const storeCalendarTokens = async (userId: number, provider: string, tokens: TokenResponse) => {
- [ ]   const encryptedAccessToken = await encryptToken(tokens.access_token);
- [ ]   const encryptedRefreshToken = tokens.refresh_token ? await encryptToken(tokens.refresh_token) : null;
- [ ]   const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
- [ ]   await pool.query(
- [ ]     'UPDATE patients SET calendar_provider = $1, calendar_sync_enabled = TRUE, calendar_access_token = $2, calendar_refresh_token = $3, calendar_token_expires_at = $4, calendar_connected_at = COALESCE(calendar_connected_at, NOW()) WHERE id = $5',
- [ ]     [provider, encryptedAccessToken, encryptedRefreshToken, expiresAt, userId]
- [ ]   );
- [ ] };
- [ ] export const refreshAccessToken = async (userId: number) => {
- [ ]   // Get refresh token from database
- [ ]   const userResult = await pool.query('SELECT calendar_provider, calendar_refresh_token FROM patients WHERE id = $1', [userId]);
- [ ]   if (userResult.rows.length === 0 || !userResult.rows[0].calendar_refresh_token) {
- [ ]     throw new Error('No refresh token found');
- [ ]   }
- [ ]   const { calendar_provider, calendar_refresh_token } = userResult.rows[0];
- [ ]   const refreshToken = await decryptToken(calendar_refresh_token);
- [ ]   const config = calendar_provider === 'google' ? googleConfig : microsoftConfig;
- [ ]   const params = {
- [ ]     client_id: config.clientId,
- [ ]     client_secret: config.clientSecret,
- [ ]     refresh_token: refreshToken,
- [ ]     grant_type: 'refresh_token'
- [ ]   };
- [ ]   const response = await axios.post(config.tokenUrl, new URLSearchParams(params), {
- [ ]     headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
- [ ]   });
- [ ]   const tokens: TokenResponse = response.data;
- [ ]   // Update access token
- [ ]   const encryptedAccessToken = await encryptToken(tokens.access_token);
- [ ]   const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
- [ ]   await pool.query(
- [ ]     'UPDATE patients SET calendar_access_token = $1, calendar_token_expires_at = $2, calendar_sync_enabled = TRUE, calendar_sync_last_error = NULL WHERE id = $3',
- [ ]     [encryptedAccessToken, expiresAt, userId]
- [ ]   );
- [ ]   return tokens.access_token;
- [ ] };
- [ ] export const disconnectCalendar = async (userId: number) => {
- [ ]   await pool.query(
- [ ]     'UPDATE patients SET calendar_provider = NULL, calendar_sync_enabled = FALSE, calendar_access_token = NULL, calendar_refresh_token = NULL, calendar_token_expires_at = NULL WHERE id = $1',
- [ ]     [userId]
- [ ]   );
- [ ] };

### Calendar Auth Routes (server/src/routes/calendarAuthRoutes.ts)
- [ ] Import: Router, authenticate, googleConfig, microsoftConfig, generateCodeVerifier, generateCodeChallenge, exchangeCodeForTokens, storeCalendarTokens, disconnectCalendar
- [ ] const router = Router();
- [ ] // Initiate OAuth flow
- [ ] router.get('/auth/:provider', authenticate, (req, res) => {
- [ ]   const provider = req.params.provider; // 'google' or 'outlook'
- [ ]   if (provider !== 'google' && provider !== 'outlook') {
- [ ]     return res.status(400).json({ error: 'Invalid provider' });
- [ ]   }
- [ ]   const config = provider === 'google' ? googleConfig : microsoftConfig;
- [ ]   const codeVerifier = generateCodeVerifier();
- [ ]   const codeChallenge = generateCodeChallenge(codeVerifier);
- [ ]   // Store verifier in session
- [ ]   req.session.codeVerifier = codeVerifier;
- [ ]   req.session.userId = req.user.id;
- [ ]   const authUrl = new URL(config.authUrl);
- [ ]   authUrl.searchParams.append('client_id', config.clientId);
- [ ]   authUrl.searchParams.append('redirect_uri', config.redirectUri);
- [ ]   authUrl.searchParams.append('response_type', 'code');
- [ ]   authUrl.searchParams.append('scope', config.scopes.join(' '));
- [ ]   authUrl.searchParams.append('code_challenge', codeChallenge);
- [ ]   authUrl.searchParams.append('code_challenge_method', 'S256');
- [ ]   if (provider === 'google') {
- [ ]     authUrl.searchParams.append('access_type', 'offline');
- [ ]     authUrl.searchParams.append('prompt', 'consent');
- [ ]   }
- [ ]   res.redirect(authUrl.toString());
- [ ] });
- [ ] // OAuth callback
- [ ] router.get('/callback/:provider', async (req, res) => {
- [ ]   const provider = req.params.provider;
- [ ]   const { code, error } = req.query;
- [ ]   if (error) {
- [ ]     return res.redirect(`${process.env.FRONTEND_URL}/settings/calendar?error=${error}`);
- [ ]   }
- [ ]   if (!code) {
- [ ]     return res.status(400).json({ error: 'No authorization code received' });
- [ ]   }
- [ ]   try {
- [ ]     const codeVerifier = req.session.codeVerifier;
- [ ]     const userId = req.session.userId;
- [ ]     if (!codeVerifier || !userId) {
- [ ]       throw new Error('Session data missing');
- [ ]     }
- [ ]     // Exchange code for tokens
- [ ]     const tokens = await exchangeCodeForTokens(provider, code as string, codeVerifier);
- [ ]     // Store tokens
- [ ]     await storeCalendarTokens(userId, provider, tokens);
- [ ]     // Clear session
- [ ]     delete req.session.codeVerifier;
- [ ]     delete req.session.userId;
- [ ]     res.redirect(`${process.env.FRONTEND_URL}/settings/calendar?success=true`);
- [ ]   } catch (error) {
- [ ]     console.error('OAuth callback error:', error);
- [ ]     res.redirect(`${process.env.FRONTEND_URL}/settings/calendar?error=token_exchange_failed`);
- [ ]   }
- [ ] });
- [ ] // Disconnect calendar
- [ ] router.delete('/disconnect', authenticate, async (req, res) => {
- [ ]   try {
- [ ]     await disconnectCalendar(req.user.id);
- [ ]     res.status(200).json({ message: 'Calendar disconnected successfully' });
- [ ]   } catch (error) {
- [ ]     console.error('Disconnect error:', error);
- [ ]     res.status(500).json({ error: 'Failed to disconnect calendar' });
- [ ]   }
- [ ] });
- [ ] export default router;

### Update Main Routes (server/src/routes/index.ts)
- [ ] Import: calendarAuthRoutes from './calendarAuthRoutes'
- [ ] router.use('/api/calendar', calendarAuthRoutes);

### Update .env.example (server/.env.example)
- [ ] # Google Calendar OAuth
- [ ] GOOGLE_CLIENT_ID=your_google_client_id
- [ ] GOOGLE_CLIENT_SECRET=your_google_client_secret
- [ ] GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback/google
- [ ] # Microsoft Outlook OAuth
- [ ] MICROSOFT_CLIENT_ID=your_microsoft_client_id
- [ ] MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
- [ ] MICROSOFT_REDIRECT_URI=http://localhost:3000/api/calendar/callback/microsoft
- [ ] # Token Encryption
- [ ] TOKEN_ENCRYPTION_KEY=your_32_character_encryption_key_abc123
- [ ] # Frontend URL for redirects
- [ ] FRONTEND_URL=http://localhost:3001

### Testing Checklist
- [ ] Install dependencies: googleapis, @microsoft/microsoft-graph-client
- [ ] Configure .env with OAuth credentials
- [ ] Test PKCE generation: code_verifier and code_challenge
- [ ] Test GET /api/calendar/auth/google → Redirects to Google
- [ ] Test GET /api/calendar/auth/outlook → Redirects to Microsoft
- [ ] Test OAuth callback: Returns from Google with code
- [ ] Verify token exchange: authorization_code → access_token + refresh_token
- [ ] Verify database: Tokens encrypted and stored
- [ ] Test token decryption: Can retrieve and decrypt tokens
- [ ] Test token refresh: Mock 401 error → refreshAccessToken called
- [ ] Verify refreshed token: New access_token stored in database
- [ ] Test disconnect: DELETE /disconnect → Tokens cleared
- [ ] Test error handling: User declines OAuth → Error redirect
- [ ] Integration test: Full OAuth flow from initiation to callback
