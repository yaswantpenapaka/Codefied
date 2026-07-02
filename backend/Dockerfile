FROM node:20-alpine

# Install compilers and runtimes
RUN apk update && apk add --no-cache \
    g++ \
    gcc \
    python3 \
    py3-pip \
    openjdk21-jdk \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Use npm install instead of ci for now
RUN npm install --production

# Copy the rest of the application
COPY . .

EXPOSE 3000

CMD ["node", "index.js"]