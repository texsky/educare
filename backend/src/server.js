'use strict';
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const logger = require('./config/logger');

const PORT = parseInt(process.env.PORT, 10) || 5000;

// Catch unhandled synchronous exceptions
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION! Shutting down... ${err.name}: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

let server;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  server = http.createServer(app);

  server.listen(PORT, () => {
    logger.info(`EduCare Backend Server running in [${process.env.NODE_ENV || 'development'}] mode on port ${PORT}`);
    logger.info(`Health check available at http://localhost:${PORT}/health`);
    logger.info(`API endpoints under http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
  });
};

// Handle unhandled Promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`UNHANDLED REJECTION! Shutting down... ${err.name}: ${err.message}`);
  logger.error(err.stack);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown on SIGTERM / SIGINT
const handleShutdown = (signal) => {
  logger.info(`${signal} received. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      logger.info('Clean shutdown complete.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer();
