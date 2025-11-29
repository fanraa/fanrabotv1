// config.js — Configuration for Cloud Deployment
// Menggunakan process.env agar aman dan mudah diubah via Dashboard Koyeb

const fs = require('fs');
const path = require('path');

module.exports = {
    // Nomor Bot (PENTING untuk Pairing Code)
    // Di Koyeb nanti isi Variable: BOT_NUMBER value: 628xxxxxxxx
    BOT_NUMBER: process.env.BOT_NUMBER || '6288291298977',

    // Nomor Owner (Bisa lebih dari satu, pisahkan dengan koma di Env Var)
    // Contoh di Koyeb: OWNER_NUMBERS value: 628123,628456
    OWNER_NUMBERS: process.env.OWNER_NUMBERS 
        ? process.env.OWNER_NUMBERS.split(',') 
        : ['6285788918217', '6288291298977', '6790494347481'],

    // Session: Di Koyeb, folder default biasanya read-only kecuali dikonfigurasi khusus.
    // Kita gunakan /tmp atau path relatif standar.
    SESSION_DIR: process.env.SESSION_DIR || './session',

    // Mode: 'public' (semua bisa pakai) atau 'self' (hanya owner)
    MODE: process.env.MODE || 'public',

    // Keamanan & Rate Limit
    SAFE_RESTART_DELAY_MS: 3000,
    RATE_LIMIT_WINDOW_MS: 10 * 1000, // 10 detik
    RATE_LIMIT_MAX: 5, // Maksimal 5 command per 10 detik (Diturunkan agar lebih aman dari spam)
    
    // Auto Read (Centang dua biru otomatis)
    AUTO_READ: process.env.AUTO_READ === 'true' || false, 
};