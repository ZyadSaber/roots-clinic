# Stage 1: Install dependencies using Bun
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock* ./
# Bun is much more resilient with Alpine/Linux dependencies
RUN bun install --frozen-lockfile

# Stage 2: Build the app
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Stage 3: Production runner (Back to Node 24)
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=9090

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the standalone output from the Bun builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 9090
CMD ["node", "server.js"]