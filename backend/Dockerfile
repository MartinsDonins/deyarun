# Use an Alpine version that still provides the openssl1.1-compat package
FROM node:20-alpine3.18
WORKDIR /app

# Install OpenSSL 1.1 compatibility for Prisma and curl for healthcheck
RUN apk add --no-cache openssl1.1-compat curl

# Copy package files
COPY package*.json ./

# Instalē atkarības
RUN npm ci

# Copy application code
COPY . .

# Use Coolify's PORT environment variable or fallback to 3001
EXPOSE $PORT
EXPOSE 3001

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health-simple || exit 1

# Start the application
CMD ["npm", "start"]
