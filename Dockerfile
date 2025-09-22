# Pixel Prompt Docker Configuration
# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S pixelprompt && \
    adduser -S pixelprompt -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/build ./build

# Copy server file
COPY server.js ./

# Create necessary directories with proper permissions
RUN mkdir -p uploads config && \
    chown -R pixelprompt:pixelprompt /app

# Copy default settings
COPY --chown=pixelprompt:pixelprompt config/settings.json ./config/

# Switch to non-root user
USER pixelprompt

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:3001/api/settings', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["node", "server.js"]