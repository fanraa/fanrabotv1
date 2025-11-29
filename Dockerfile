FROM node:18-bullseye-slim

# Install dependencies sistem
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    imagemagick \
    webp \
    git && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json dulu
COPY package.json .

# Install dependencies
RUN npm install

# Copy semua file
COPY . .

# Ekspos port 8000
EXPOSE 8000

# Start bot
CMD ["npm", "start"]
