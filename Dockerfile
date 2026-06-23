# ---- Build stage ----
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package.json and lock file first for caching
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy the full source
COPY . .

# Build the app (compile TS → JS into dist/)
RUN npm run build


# ---- Runtime stage ----
FROM node:24-alpine AS runner

WORKDIR /app

# Copy package.json to install only production deps
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built output
COPY --from=builder /app/dist ./dist

# Expose Fastify port
EXPOSE 9002

# Run the app with source maps enabled
CMD ["node", "--enable-source-maps", "./dist/index.js"]
