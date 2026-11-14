'use strict';
const mongoose = require('mongoose');
const logger = require('./logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (process.env.REQUIRE_MONGODB_URI === 'true' && !uri) {
    throw new Error('Set MONGODB_URI in the deployment environment to connect to MongoDB.');
  }

  if (!uri && process.env.MONGO_ROOT_USER && process.env.MONGO_ROOT_PASSWORD) {
    const host = process.env.MONGO_HOST || 'mongodb';
    const port = process.env.MONGO_PORT || 27017;
    const db = process.env.MONGO_DB_NAME || 'educare';
    return `mongodb://${process.env.MONGO_ROOT_USER}:${process.env.MONGO_ROOT_PASSWORD}@${host}:${port}/${db}?authSource=admin`;
  }

  return uri || 'mongodb://localhost:27017/educare';
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let connectionHandlersRegistered = false;

/**
 * Connect to MongoDB with exponential back-off retry logic.
 * @param {number} attempt - Current attempt number (1-based).
 */
const connectDB = async (attempt = 1) => {
  const uri = getMongoUri();
  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== 'production',
    });

    logger.info(`MongoDB connected: ${conn.connection.host} (attempt ${attempt})`);

    if (!connectionHandlersRegistered) {
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect…');
        setTimeout(() => {
          connectDB().catch((err) => {
            logger.error(`MongoDB reconnection failed: ${err.message}`);
          });
        }, RETRY_DELAY_MS);
      });

      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB connection error: ${err.message}`);
      });
      connectionHandlersRegistered = true;
    }
  } catch (err) {
    logger.error(`MongoDB connection failed (attempt ${attempt}): ${err.message}`);
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * attempt;
      logger.info(`Retrying in ${delay / 1000}s…`);
      await wait(delay);
      return connectDB(attempt + 1);
    }

    logger.error('Max MongoDB connection retries reached.');
    throw err;
  }
};

/**
 * Gracefully close the MongoDB connection.
 */
const disconnectDB = async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed.');
};

module.exports = { connectDB, disconnectDB, getMongoUri };
