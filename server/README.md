# Clinical Appointment Platform API

Express.js backend API with TypeScript for the Clinical Appointment and Intelligence Platform.

## Tech Stack

- **Runtime**: Node.js 20.x LTS
- **Framework**: Express 5.2.1
- **Language**: TypeScript 5.9.3
- **Security**: Helmet, CORS, JWT
- **Logging**: Winston, Morgan
- **Validation**: express-validator
- **Development**: nodemon, ts-node, ESLint, Prettier

## Prerequisites

- Node.js >= 20.0.0
- npm >= 9.0.0

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the server directory (use `.env.example` as template):

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DB_URL=mongodb://localhost:27017/clinical_platform

# Redis
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Optional: OpenAI API
OPENAI_API_KEY=your-openai-api-key

# Optional: Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-email-password

# Optional: Twilio SMS
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Required Environment Variables:**
- `DB_URL`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Minimum 32 characters for secure token signing

### 3. Run Development Server

```bash
# Start with auto-reload
npm run dev

# Or use specific commands
npm start        # Production mode
npm run build    # Build TypeScript to JavaScript
npm run type-check  # Check TypeScript without emitting
```

### 4. Development Tools

```bash
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

## Project Structure

```
server/
├── src/
│   ├── config/           # Configuration and environment validation
│   │   └── env.ts        # Environment variable validation
│   ├── middleware/       # Express middleware
│   │   ├── auth.ts       # JWT authentication & authorization
│   │   ├── errorHandler.ts  # Global error handling
│   │   └── validation.ts     # Request validation wrapper
│   ├── routes/           # API route definitions
│   │   ├── index.ts      # Route aggregator & health check
│   │   ├── auth.routes.ts    # Authentication endpoints
│   │   ├── appointments.routes.ts  # Appointment management
│   │   └── patients.routes.ts      # Patient management
│   ├── controllers/      # Business logic handlers (to be implemented)
│   ├── services/         # Business logic layer (to be implemented)
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts      # Global types (ApiResponse, ApiError, etc.)
│   ├── utils/            # Utility functions
│   │   └── logger.ts     # Winston logger configuration
│   ├── app.ts            # Express application setup
│   └── server.ts         # HTTP server entry point
├── logs/                 # Application logs (auto-generated)
├── dist/                 # Compiled JavaScript (auto-generated)
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment template
├── tsconfig.json         # TypeScript configuration
├── nodemon.json          # Nodemon configuration
├── .eslintrc.js          # ESLint configuration
├── .prettierrc           # Prettier configuration
└── package.json          # Dependencies and scripts
```

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api` | API information |
| GET | `/api/health` | Health check endpoint |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |

### Protected Endpoints (Require Authentication)

#### Authentication
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/api/auth/refresh` | Refresh access token | All |
| POST | `/api/auth/logout` | Logout user | All |

#### Appointments
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/appointments` | List appointments | All |
| GET | `/api/appointments/:id` | Get appointment details | All |
| POST | `/api/appointments` | Create appointment | Patient, Staff |
| PUT | `/api/appointments/:id` | Update appointment | Patient, Staff |
| DELETE | `/api/appointments/:id` | Cancel appointment | Patient, Staff |

#### Patients
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | `/api/patients` | List all patients | Staff, Admin |
| GET | `/api/patients/:id` | Get patient details | All |
| PUT | `/api/patients/:id` | Update patient profile | All |
| POST | `/api/patients/:id/documents` | Upload patient document | All |

## Features

### ✅ Port Fallback Logic
If port 3001 is busy, the server automatically tries ports 3002, 3003, 3004, and 3005 until it finds an available port.

### ✅ Environment Validation
Server validates all required environment variables on startup and throws descriptive errors if any are missing or invalid.

### ✅ Error Handling
- Global error handler with dev/production modes
- Stack traces in development only
- Operational vs system error classification
- Unhandled rejection and uncaught exception handlers

### ✅ Security
- **Helmet**: Sets secure HTTP headers
- **CORS**: Configurable origin whitelist
- **JWT**: Token-based authentication
- **Rate Limiting**: Coming in future tasks
- **Input Validation**: express-validator for request validation

### ✅ Logging
- **Winston**: Structured logging to console and files
- **Morgan**: HTTP request logging
- **Log Rotation**: 5MB max file size, 5 file retention
- **Separate Logs**: app.log, error.log, exceptions.log, rejections.log

### ✅ Authentication & Authorization
- JWT token-based authentication
- Role-based access control (patient, staff, admin)
- Protected routes with middleware
- Token refresh mechanism (to be implemented)

### ✅ Request Validation
- express-validator integration
- Reusable validation middleware
- Automatic error formatting

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-03-18T10:00:00.000Z"
}
```

### Error Response (Development)
```json
{
  "success": false,
  "error": "Detailed error message",
  "statusCode": 400,
  "stack": "Error stack trace (dev only)",
  "timestamp": "2024-03-18T10:00:00.000Z"
}
```

### Error Response (Production)
```json
{
  "success": false,
  "error": "User-friendly error message",
  "statusCode": 400,
  "timestamp": "2024-03-18T10:00:00.000Z"
}
```

## Health Check

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2024-03-18T10:00:00.000Z",
  "uptime": 123.45,
  "environment": "development"
}
```

## Authentication

### JWT Token Format

Include the JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Payload
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "role": "patient|staff|admin",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Path Aliases

TypeScript path aliases are configured for cleaner imports:

```typescript
import { config } from '@config/env';
import { authenticateToken } from '@middleware/auth';
import { logger } from '@utils/logger';
import { ApiError } from '@types';
```

Available aliases:
- `@config/*` → `src/config/*`
- `@middleware/*` → `src/middleware/*`
- `@routes/*` → `src/routes/*`
- `@controllers/*` → `src/controllers/*`
- `@services/*` → `src/services/*`
- `@types` → `src/types`
- `@utils/*` → `src/utils/*`

## Testing

Currently, all endpoints return placeholder responses indicating which user story will implement the actual functionality:

- **US_008**: Authentication endpoints (register, login, refresh, logout)
- **US_009**: Patient CRUD operations
- **US_010**: List appointments
- **US_012**: Cancel appointment
- **US_013**: Create appointment
- **US_014**: Update appointment
- **US_040**: Document upload

## Graceful Shutdown

The server handles shutdown signals gracefully:

```bash
# SIGTERM or SIGINT (Ctrl+C)
- Closes HTTP server
- Waits for active connections (max 10 seconds)
- Logs shutdown completion
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

## Logging

Logs are written to the `logs/` directory:

- **app.log**: All application logs (info, warn, error)
- **error.log**: Error level and above
- **exceptions.log**: Uncaught exceptions
- **rejections.log**: Unhandled promise rejections

Console logs include:
- Timestamps
- Log levels with colors
- Request metadata (via Morgan)
- Formatted JSON for structured logging

## Development Guidelines

1. **Code Style**: Follow ESLint and Prettier configurations
2. **Type Safety**: Use strict TypeScript mode
3. **Error Handling**: Always use `ApiError` class for operational errors
4. **Validation**: Use `validate()` middleware for request validation
5. **Logging**: Use Winston logger instead of `console.log`
6. **Authentication**: Use `authenticateToken` middleware for protected routes
7. **Authorization**: Use `authorizeRoles()` for role-based access control

## Acceptance Criteria ✅

- [x] Express 4.x+ with CORS, helmet, and morgan middleware
- [x] Server starts on port 3001 with nodemon for auto-reload
- [x] Organized directory structure (routes, middleware, config)
- [x] Error handling middleware with dev/production modes
- [x] Environment variable validation on startup
- [x] Port fallback mechanism (3001-3005)
- [x] Winston logger with file rotation
- [x] JWT authentication and role-based authorization
- [x] TypeScript strict mode with path aliases
- [x] Graceful shutdown handling
- [x] Security headers with Helmet
- [x] CORS configuration for frontend

## Future Enhancements

- Database connection (MongoDB) - US_003
- Redis session management - US_003
- Rate limiting - Future task
- API documentation with Swagger - Future task
- Integration tests - Future task
- Socket.io for real-time updates - US_021

## License

Private - Clinical Appointment Platform

## Contact

Development Team - Clinical Appointment Platform
