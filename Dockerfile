FROM node:18-bullseye-slim

# Gunakan "--no-install-recommends" agar tidak menginstall sampah (driver grafik, dll)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    imagemagick \
    webp \
    git \
    ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json
COPY package.json .

# Hapus package-lock.json jika ada (agar tidak bentrok versi Windows vs Linux)
RUN rm -f package-lock.json

# Install dependencies bot
RUN npm install

# Copy sisa file
COPY . .

# Ekspos port
EXPOSE 8000

# Start
CMD ["npm", "start"]
