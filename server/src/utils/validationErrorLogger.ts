import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const validationLogger = winston.createLogger({
  level: 'warn',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, message, ...meta }) => {
      return `${timestamp} [VALIDATION] ${message} ${JSON.stringify(meta)}`;
    }),
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'validation-errors.log'),
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 30,
    }),
  ],
});

interface ValidationLogEntry {
  ip: string;
  endpoint: string;
  method: string;
  errors: Array<{ field: string; message: string; code: string }>;
}

const errorCounts: Map<string, number> = new Map();
const ALERT_THRESHOLD = 50;
const RESET_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

setInterval(() => {
  errorCounts.clear();
}, RESET_INTERVAL_MS).unref();

export function logValidationError(entry: ValidationLogEntry): void {
  for (const err of entry.errors) {
    validationLogger.warn('Validation failure', {
      ip: entry.ip,
      endpoint: entry.endpoint,
      method: entry.method,
      field: err.field,
      code: err.code,
      message: err.message,
    });

    const key = `${entry.endpoint}:${err.field}`;
    const count = (errorCounts.get(key) || 0) + 1;
    errorCounts.set(key, count);

    if (count === ALERT_THRESHOLD) {
      validationLogger.error(
        `High validation failure rate: ${key} has ${count} failures in the last hour`,
        { endpoint: entry.endpoint, field: err.field },
      );
    }
  }
}
