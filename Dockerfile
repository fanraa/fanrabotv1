# Pakai Alpine Linux (Versi paling ringan, cuma 50MB-an)
FROM node:18-alpine

WORKDIR /app

# Install dependencies sistem (ffmpeg, dll) pakai APK (lebih cepat dari APT)
RUN apk add --no-cache \
    ffmpeg \
    imagemagick \
    webp \
    git \
    python3 \
    make \
    g++

# Copy package.json
COPY package.json .

# Hapus node_modules kalau ada (biar bersih)
RUN rm -rf node_modules

# Install dependencies bot (hanya production biar hemat memori)
RUN npm install --production

# Copy sisa file
COPY . .

# Ekspos port 8000
EXPOSE 8000

# Jalankan
CMD ["node", "index.js"]
