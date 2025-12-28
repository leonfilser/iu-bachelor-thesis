# Multi-stage build to optimize final image size
# - builder: installs all deps (incl. dev deps) and compiles the app to /dist
# - runner: installs only production deps and runs the compiled output
# Result: smaller, cleaner runtime image

# ---- Stage 1: Build ----
# Use a Node base image to compile the application
FROM node:24.11 AS builder

# Set working directory inside the image
WORKDIR /app

# Copy only package manifests first to leverage Docker layer caching
# Dependencies are reinstalled only when package.json / package-lock.json changes
COPY package*.json ./

# Use npm ci for deterministic, clean installs based on package-lock.json
# (faster and more reproducible than npm install in CI/containers)
RUN npm ci

# Copy the rest of the source code and build it
COPY . .
RUN npm run build

### ---- Stage 2: Runtime ----
# Start from a fresh image so we dont ship build tools and dev dependencies
FROM node:24.11 AS runner

# Tells Node we are running in production mode
ENV NODE_ENV=production

# Set working directory for the runtime container
WORKDIR /app

# Copy package manifests again for production-only install
COPY package*.json ./

# Install only production dependencies to keep the runtime image small
# Clean npm cache to reduce image size
RUN npm ci --omit=dev && npm cache clean --force

# Copy only the compiled output from the builder stage
# (no source code, no tests, no build tooling in the final image)
COPY --from=builder /app/dist ./dist

# The port the application listens on
EXPOSE 3000

# Starts the application
CMD ["node", "dist/main.js"]