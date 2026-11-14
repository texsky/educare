FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS backend-deps

RUN apk add --no-cache build-base python3 make g++
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/src ./src

FROM node:20-alpine AS runtime

RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng leptonica \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 -G nodejs

ENV NODE_ENV=production REQUIRE_MONGODB_URI=true PORT=10000
WORKDIR /app/backend

COPY --from=backend-deps /app/backend/package.json ./package.json
COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY --from=backend-deps /app/backend/src ./src
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

RUN mkdir -p uploads logs && chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 10000
CMD ["node", "src/server.js"]
