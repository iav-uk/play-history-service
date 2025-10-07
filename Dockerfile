# Stage 1: build the TypeScript app
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package and lock files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations
COPY jest.config.js ./
COPY jest.setup.js ./

# Build TypeScript to JS
RUN npm run build

# Stage 2: run the built app
FROM node:20-alpine
WORKDIR /app

# Copy only built artifacts and necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/jest.config.js ./
COPY --from=builder /app/jest.setup.js ./

# Install only production dependencies
# RUN npm ci --omit=dev
RUN npm ci

# Expose API port
EXPOSE 3000

# Environment variables (safe defaults)
ENV NODE_ENV=production
ENV PORT=3000

# Start app
CMD ["node", "dist/index.js"]
