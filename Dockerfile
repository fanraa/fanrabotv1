# Gunakan base image yang stabil tapi ringan
FROM node:18-bullseye-slim

WORKDIR /app

# Install HANYA yang wajib (ffmpeg & webp)
# Kita hapus build-tools (python/make) biar hemat space, 
# karena kita akan skip proses compile di bawah.
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    webp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json
COPY package.json .

# Hapus package-lock.json (PENTING)
RUN rm -f package-lock.json

# --- BAGIAN SAKTI ---
# --omit=dev: Gak usah install devDependencies
# --ignore-scripts: JANGAN jalankan script aneh-aneh (cegah error node-gyp)
# --no-bin-links: Cegah error symlink di beberapa sistem
RUN npm install --omit=dev --ignore-scripts --no-bin-links

# Copy sisa file
COPY . .

# Port
EXPOSE 8000

# Jalankan
CMD ["node", "index.js"]
