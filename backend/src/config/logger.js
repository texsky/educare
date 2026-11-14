'use strict';
const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const LOG_DIR = process.env.LOG_DIR || 'logs';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const { combine, timestamp, printf, colorize, errors, json } = format;

/** Human-readable format for console */
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack }) =>
    stack
      ? `[${timestamp}] ${level}: ${message}\n${stack}`
      : `[${timestamp}] ${level}: ${message}`
  )
);

/** JSON format for log files */
const fileFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = createLogger({
  level: LOG_LEVEL,
  defaultMeta: { service: 'educare-backend' },
  transports: [
    new transports.Console({ format: consoleFormat }),
    new transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    }),
    new transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 10,
    }),
  ],
  exitOnError: false,
});

module.exports = logger;
