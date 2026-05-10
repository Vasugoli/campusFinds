FROM deno:alpine-3.18

WORKDIR /app

# Copy all source files
COPY . .

# Cache dependencies
RUN deno cache --reload ./server/deno.json

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user for security
RUN addgroup -g 1001 -S deno && \
    adduser -S deno -u 1001

USER deno

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD deno eval "fetch('http://localhost:${PORT}').then(() => Deno.exit(0)).catch(() => Deno.exit(1))"

# Run the server
CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "./server/src/index.ts"]
