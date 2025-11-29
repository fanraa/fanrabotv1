// index.js — FANRA BOT (Koyeb Deployment Ready)
// Updated for Cloud Serverless Environment

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    delay
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const boxen = require('boxen');
const express = require('express'); // Wajib untuk Koyeb

// Import modules lokal
const { msgHandler, preloadPlugins } = require('./handler');
const logger = require('./lib/logger');
const config = require('./config');

const { SESSION_DIR, SAFE_RESTART_DELAY_MS } = config;

// --- CONFIGURATION FOR DEPLOYMENT ---
const PORT = process.env.PORT || 8080; // Koyeb biasanya pakai 8000 atau 8080
const usePairingCode = true; // Ubah ke false jika ingin tetap pakai QR Code
// ------------------------------------

// 1. SETUP SERVER UNTUK KOYEB (AGAR TIDAK MATI)
const app = express();

app.get('/', (req, res) => {
    res.status(200).send('FANRA BOT is Running perfectly on Koyeb! 🚀');
});

app.listen(PORT, () => {
    console.log(chalk.blue(`🌐 Server Health Check running on port ${PORT}`));
});

// 2. TAMPILAN BANNER PREMIUM
function banner() {
    const titleText = ' FANRA BOT — CLOUD EDITION ';
    const title = chalk.hex('#F2C94C').bold(titleText);
    const subtitle = chalk.white('Koyeb Ready • Anti-Downtime • Smart Handler');
    console.log(boxen(`${title}\n\n${subtitle}`, { 
        padding: 1, 
        margin: 1, 
        borderStyle: 'round', 
        borderColor: 'cyan',
        float: 'center'
    }));
}

let sock = null;
let restarting = false;

async function startBot() {
    try {
        console.clear();
        banner();

        // Ensure session dir exists
        if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

        // Auth state
        const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
        const { version } = await fetchLatestBaileysVersion();

        logger.info('STARTUP', `Using Baileys version ${version.join('.')}`);

        // Create socket
        sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: !usePairingCode, // Jika pakai pairing code, jangan print QR
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
            },
            browser: ['Ubuntu', 'Chrome', '20.0.04'], // Browser linux agar tidak mudah terdeteksi bot
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            retryRequestDelayMs: 2000
        });

        // --- LOGIKA PAIRING CODE (PREMIUM FEATURE) ---
        if (usePairingCode && !sock.authState.creds.registered) {
            console.log(chalk.yellow('⏳ Menunggu Pairing Code...'));
            // Tunggu sebentar agar socket siap
            setTimeout(async () => {
                // Ganti nomor ini dengan nomor kamu di file config atau hardcode sementara
                // Pastikan format: 628xxx (tanpa + atau spasi)
                const phoneNumber = config.BOT_NUMBER || "628xxxxxxxxxx"; 
                
                if(!phoneNumber || phoneNumber.includes('x')) {
                     console.log(chalk.red('❌ Nomor Bot belum diset untuk Pairing Code! Cek config.'));
                } else {
                    const code = await sock.requestPairingCode(phoneNumber);
                    console.log(chalk.bgGreen.black(` CODE PAIRING ANDA: `) + " " + chalk.bold.white(code?.match(/.{1,4}/g)?.join("-") || code));
                }
            }, 3000);
        }

        // Save creds on updates
        sock.ev.on('creds.update', saveCreds);

        // Connection updates handling
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'connecting') {
                console.log(chalk.blue('🔄 Menghubungkan ke WhatsApp...'));
            }
            
            if (connection === 'open') {
                console.log(chalk.green('✔ BOT CONNECTED — Siap menerima perintah!'));
            } 
            
            if (connection === 'close') {
                const reason = lastDisconnect?.error ? (new Error(lastDisconnect.error).message || lastDisconnect.error) : 'unknown';
                
                // Ignore logged out
                if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
                   console.log(chalk.red('⚠ Sesi Logged Out. Hapus folder session dan scan ulang.'));
                   process.exit(1);
                } else {
                   console.log(chalk.red(`🔌 Terputus: ${reason}. Mencoba restart...`));
                   safeRestart();
                }
            }
        });

        // Preload plugins
        preloadPlugins();

        // Message upsert
        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const message = chatUpdate.messages && chatUpdate.messages[0];
                if (!message) return;
                // Jangan proses pesan dari diri sendiri (opsional)
                if (message.key.fromMe) return; 
                
                await msgHandler(sock, message, chatUpdate);
            } catch (err) {
                logger.error('MSG_UPSERT', err.stack || err);
            }
        });

    } catch (err) {
        logger.error('START', err.stack || err);
        setTimeout(() => startBot(), SAFE_RESTART_DELAY_MS);
    }
}

function safeRestart() {
    if (restarting) return;
    restarting = true;
    setTimeout(() => {
        try {
            if (sock && sock.ws) sock.ws.close();
            sock.ev.removeAllListeners();
            sock = null;
        } catch (e) { /* ignore */ }
        restarting = false;
        startBot();
    }, SAFE_RESTART_DELAY_MS);
}

// Graceful shutdown & Anti Crash
const handleExit = (signal) => {
    console.log(chalk.yellow(`\nMenutup proses (${signal})...`));
    try { if (sock) sock.logout(); } catch (e) {}
    process.exit(0);
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);

process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT', err.stack || err);
});

process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED', err && (err.stack || err));
});

// Jalankan Bot
startBot();