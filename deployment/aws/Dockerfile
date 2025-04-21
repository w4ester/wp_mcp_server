# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist/ ./dist/

# Create directory for configs
RUN mkdir -p /etc/wordpress-mcp

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O - http://localhost:80/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=80

# Run with limited permissions
USER node

# Start the server
CMD ["node", "dist/index.js"]
