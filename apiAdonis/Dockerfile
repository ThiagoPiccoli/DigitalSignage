###############################################################################
# Stage 1 — Install dependencies
###############################################################################
FROM node:22-alpine AS deps

WORKDIR /app

# Copy only package files first (better layer caching)
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

###############################################################################
# Stage 2 — Build the AdonisJS project
###############################################################################
FROM node:22-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the AdonisJS project (compiles TS → JS into ./build)
RUN node ace build --ignore-ts-errors

# Install only production dependencies inside the build output
WORKDIR /app/build
COPY package-lock.json ./
RUN npm ci --omit=dev

###############################################################################
# Stage 3 — Production image
###############################################################################
FROM node:22-alpine AS production

# Install dumb-init for proper PID 1 signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy build output with production node_modules
COPY --from=build /app/build ./

# Create directories for SQLite database and uploaded media
RUN mkdir -p tmp public/media && chown -R app:app /app

USER app

# Expose the default AdonisJS port
EXPOSE 3333

# Use dumb-init to start the server
CMD ["dumb-init", "node", "bin/server.js"]
