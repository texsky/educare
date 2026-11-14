# ============================================================
# Stage 1: Builder — install all deps (including dev) for build
# ============================================================
FROM node:20-alpine AS builder

# System deps required for Tesseract.js native bindings + build tools
RUN apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    leptonica-dev \
    build-base \
    python3 \
    make \
    g++

WORKDIR /app

# Install dependencies first (leverages Docker layer cache)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# ============================================================
# Stage 2: Production — slim image with only what's needed
# ============================================================
FROM node:20-alpine AS production

# Install runtime system deps for Tesseract.js
RUN apk add --no-cache \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    leptonica \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy source code from builder
COPY --from=builder /app/src ./src

# Create required directories and set permissions
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the server
CMD ["node", "src/server.js"]
