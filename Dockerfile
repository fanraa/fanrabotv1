FROM node:18-buster-slim

# Install dependencies sistem yang dibutuhkan (FFMPEG, GIT, Python untuk build)
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    imagemagick \
    webp \
    git \
    make \
    g++ \
    python3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy file package.json
COPY package.json .

# Hapus lockfile jika masih ada (tindakan pencegahan)
RUN rm -f package-lock.json

# Install dependencies dengan flag --production dan --ignore-scripts
# Ini kuncinya! "--ignore-scripts" mencegah error saat install module berat
RUN npm install --production --ignore-scripts --legacy-peer-deps

# Copy seluruh file bot
COPY . .

# Ekspos port
EXPOSE 8000

# Jalankan bot
CMD ["node", "index.js"]
