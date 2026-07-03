FROM node:20-alpine

# Install compilers and runtimes needed by the sandboxed code runner
RUN apk update && apk add --no-cache \
    g++ \
    gcc \
    python3 \
    py3-pip \
    openjdk21-jdk \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy the full app source
COPY . .

# Run as a non-root user for safer container execution
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "server.js"]