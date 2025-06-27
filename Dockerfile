# Use Node.js 20 slim image for smaller size
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install essential tools including PostgreSQL client
RUN apt-get update && apt-get install -y \
    postgresql-client \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY --chown=node:node . .

# Make docker-entrypoint.sh executable
RUN chmod +x docker-entrypoint.sh

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 5013

# Set default environment variables (DATABASE_URL deve vir do EasyPanel)
ENV NODE_ENV=${NODE_ENV:-production}
ENV PORT=${PORT:-5013}
ENV SESSION_SECRET=${SESSION_SECRET:-almoxarifado-secret-2024}

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/health || exit 1

# Switch to non-root user for security
USER node

# Use entrypoint script for initialization
ENTRYPOINT ["./docker-entrypoint.sh"]

# Default command to start the application
CMD ["npm", "run", "start"]