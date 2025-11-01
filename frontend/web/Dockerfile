# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Set NPM configuration for better reliability and rate limiting
RUN npm config set fund false && \
    npm config set audit-level none && \
    npm config set progress false && \
    npm config set registry https://registry.npmjs.org/

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install --no-fund --no-audit --production=false

# Copy source code
COPY . .

# Build environment variables
ARG NEXT_PUBLIC_API_URL=https://api.deyarun.com
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# Production stage - minimal runtime image
FROM node:20-alpine AS runner
WORKDIR /app

# Install curl for healthcheck support
RUN apk add --no-cache curl

# Add non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application directly
# Next.js standalone includes all needed dependencies
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
