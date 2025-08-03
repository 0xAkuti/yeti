# Multi-stage Docker build for Yeti DEX project
# Handles local package dependencies and serves both frontend and orderbook server

# Stage 1: Build yeti-order-manager package
FROM node:18-alpine AS order-manager-builder
WORKDIR /app/yeti-order-manager
COPY yeti-order-manager/package*.json ./
RUN npm ci
COPY yeti-order-manager/ .
RUN npm run build

# Stage 2: Build orderbook server
FROM node:18-alpine AS orderbook-builder
WORKDIR /app/orderbook-server
COPY orderbook-server/package*.json ./
RUN npm ci
COPY orderbook-server/ .
RUN npm run build

# Stage 3: Build frontend (depends on yeti-order-manager)
FROM node:18-alpine AS frontend-builder
WORKDIR /app

# Copy built yeti-order-manager with dependencies
COPY --from=order-manager-builder /app/yeti-order-manager /app/yeti-order-manager

# Build frontend with local dependency
COPY yeti-frontend2/ /app/yeti-frontend2/
WORKDIR /app/yeti-frontend2

# Add resolutions to frontend package.json to force ethers version
RUN npm pkg set overrides.ethers="^6.15.0"
RUN npm pkg set resolutions.ethers="^6.15.0"

# Install dependencies with forced resolution (use install instead of ci to rebuild lock)
RUN npm install --legacy-peer-deps
RUN npm run build

# Stage 4: Production runtime
FROM node:18-alpine AS production
WORKDIR /app

# Install PM2 for process management
RUN npm install -g pm2

# Copy built orderbook server
COPY --from=orderbook-builder /app/orderbook-server/dist /app/orderbook-server/dist
COPY --from=orderbook-builder /app/orderbook-server/node_modules /app/orderbook-server/node_modules
COPY --from=orderbook-builder /app/orderbook-server/package.json /app/orderbook-server/

# Copy built frontend
COPY --from=frontend-builder /app/yeti-frontend2/.next /app/yeti-frontend2/.next
COPY --from=frontend-builder /app/yeti-frontend2/node_modules /app/yeti-frontend2/node_modules
COPY --from=frontend-builder /app/yeti-frontend2/package.json /app/yeti-frontend2/
COPY --from=frontend-builder /app/yeti-frontend2/public /app/yeti-frontend2/public
COPY --from=frontend-builder /app/yeti-frontend2/next.config.ts /app/yeti-frontend2/

# Copy yeti-order-manager built package
COPY --from=order-manager-builder /app/yeti-order-manager/dist /app/yeti-order-manager/dist
COPY --from=order-manager-builder /app/yeti-order-manager/node_modules /app/yeti-order-manager/node_modules
COPY --from=order-manager-builder /app/yeti-order-manager/package.json /app/yeti-order-manager/

# Create PM2 ecosystem file
COPY ecosystem.config.js /app/

# Create data directory for SQLite
RUN mkdir -p /app/orderbook-server/data

# Expose ports
EXPOSE 3000 3002

# Set default environment
ENV NODE_ENV=production
ENV PORT=3000
ENV ORDERBOOK_PORT=3002

# Start both services with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"] 