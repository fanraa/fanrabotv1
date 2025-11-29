FROM node:18-buster

# Install dependencies sistem (opsional, untuk ffmpeg/sharp)
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    imagemagick \
    webp && \
    apt-get upgrade -y && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

# Port yang diekspos (sesuai index.js)
EXPOSE 8080

CMD ["node", "index.js"]