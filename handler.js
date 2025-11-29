// handler.js — Advanced Message Handler & Plugin Router (Premium Cloud Edition)

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const boxen = require('boxen');
const { delay } = require('@whiskeysockets/baileys');

// Load Modules
const config = require('./config');
const logger = require('./lib/logger');

// Fallback jika file database belum ada/error (agar bot tidak crash saat deploy pertama)
let db = { addUser: () => {}, checkPremium: () => false, getUser: async () => ({}) };
try {
    db = require('./lib/db');
} catch (e) {
    console.log(chalk.yellow("⚠ Warning: modul './lib/db' tidak ditemukan atau error. Menggunakan dummy DB."));
}
const { addUser, checkPremium, getUser } = db;

// In-memory rate limiter
const rateMap = new Map();

// Configuration
const PREFIX = '.';
const PLUGIN_DIR = path.join(__dirname, 'plugins');
const pluginCache = new Map();

// Utility: load plugin
function loadPlugin(name) {
    const pPath = path.join(PLUGIN_DIR, `${name}.js`);
    if (!fs.existsSync(pPath)) return null;
    try {
        delete require.cache[require.resolve(pPath)];
        const mod = require(pPath);
        mod.meta = mod.meta || {
            name,
            description: mod.description || '-',
            aliases: [],
            ownerOnly: false,
            premiumOnly: false
        };
        pluginCache.set(name, mod);
        if (mod.meta.aliases && Array.isArray(mod.meta.aliases)) {
            for (const alias of mod.meta.aliases) pluginCache.set(alias, mod);
        }
        return mod;
    } catch (err) {
        logger.error('PLUGIN_LOAD', `Failed to load plugin ${name}: ${err.stack || err}`);
        return null;
    }
}

// Preload plugins
function preloadPlugins() {
    if (!fs.existsSync(PLUGIN_DIR)) {
        console.log(chalk.red(`⚠ Folder plugins tidak ditemukan di: ${PLUGIN_DIR}`));
        return;
    }
    try {
        const files = fs.readdirSync(PLUGIN_DIR).filter(f => f.endsWith('.js'));
        for (const f of files) {
            const name = path.basename(f, '.js');
            loadPlugin(name);
        }
        logger.info('HANDLER', `Success preloaded ${pluginCache.size} commands`);
    } catch (err) {
        logger.error('HANDLER', 'Failed to preload plugins: ' + err.stack);
    }
}

// Rate limiter
function checkRateLimit(sender) {
    const now = Date.now();
    const entry = rateMap.get(sender) || { count: 0, windowStart: now };
    if (now - entry.windowStart > config.RATE_LIMIT_WINDOW_MS) {
        entry.count = 0;
        entry.windowStart = now;
    }
    entry.count += 1;
    rateMap.set(sender, entry);
    return entry.count <= config.RATE_LIMIT_MAX;
}

// Extract Body
function extractBody(m) {
    if (!m) return '';
    const message = m.message || {};
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message.imageMessage?.caption) return message.imageMessage.caption;
    if (message.videoMessage?.caption) return message.videoMessage.caption;
    return '';
}

// --- Helper: Cek apakah sender adalah Owner ---
function isOwner(sender) {
    const cleanSender = sender.split('@')[0];
    return config.OWNER_NUMBERS.includes(cleanSender);
}

module.exports = {
    msgHandler: async (sock, m, chatUpdate) => {
        try {
            if (!m || !m.key) return;
            if (m.key.fromMe) return; 
            if (!m.message) return;

            const isGroup = m.key.remoteJid.endsWith('@g.us');
            const senderRaw = isGroup ? (m.key.participant || m.key.remoteJid) : m.key.remoteJid;
            const senderNumber = (senderRaw || '').split('@')[0];
            
            // Auto Read (Opsional, atur di config)
            if (config.AUTO_READ) {
                await sock.readMessages([m.key]);
            }

            // Database handling (Safe mode)
            let pushName = m.pushName || 'User';
            try {
                const userDb = await getUser(senderNumber);
                if (userDb && userDb.name) pushName = userDb.name;
                addUser(senderNumber, pushName);
            } catch (e) { /* ignore db error */ }

            const body = extractBody(m).trim();

            // Check Prefix
            if (!body || !body.startsWith(PREFIX)) return;

            const withoutPrefix = body.slice(PREFIX.length).trim();
            if (!withoutPrefix) return;

            const split = withoutPrefix.split(/ +/);
            const command = split[0].toLowerCase();
            const args = split.slice(1);
            
            const isCreator = isOwner(senderNumber);

            // --- MODE CHECK (Public vs Self) ---
            if (config.MODE === 'self' && !isCreator) {
                return; // Silent ignore jika mode self
            }

            // Rate Limit (Skip for owner)
            if (!isCreator && !checkRateLimit(senderNumber)) {
                console.log(chalk.red(`⚠ Spam detected from ${senderNumber}`));
                return sock.sendMessage(m.key.remoteJid, { text: '⏳ *Slow Down!* Jangan spam command.' }, { quoted: m });
            }

            // Load Plugin
            let plugin = pluginCache.get(command);
            if (!plugin) plugin = loadPlugin(command);

            // Logging Compact (Cocok untuk Koyeb Logs)
            console.log(chalk.bgCyan.black(` CMD `), chalk.bold.white(command), 
                chalk.gray('from'), chalk.yellow(pushName), 
                isGroup ? chalk.gray('in Group') : chalk.gray('in Private'));

            if (!plugin || !plugin.handle) {
                // Jangan reply jika command tidak ditemukan agar tidak mengganggu (Silent Fail)
                // Atau aktifkan code di bawah jika ingin memberi tahu user
                /* await sock.sendMessage(m.key.remoteJid, { text: `❓ Command *${command}* tidak ditemukan.` }, { quoted: m }); */
                return;
            }

            // Permission Checks
            const meta = plugin.meta || {};
            const isPremium = checkPremium(senderNumber);

            if (meta.ownerOnly && !isCreator) {
                return sock.sendMessage(m.key.remoteJid, { text: '🔒 Fitur ini khusus *Owner Bot*.' }, { quoted: m });
            }

            if (meta.premiumOnly && !isPremium && !isCreator) {
                return sock.sendMessage(m.key.remoteJid, { text: '👑 Fitur ini khusus member *Premium*.' }, { quoted: m });
            }

            // --- PREMIUM FEEL: TYPING EFFECT ---
            // Bot seolah-olah mengetik sebelum membalas
            await sock.sendPresenceUpdate('composing', m.key.remoteJid);
            await delay(500); // Jeda sedikit agar terasa natural

            // Context Object
            const pluginContext = {
                senderNumber,
                pushName,
                isGroup,
                isPremium,
                isOwner: isCreator,
                args,
                text: args.join(' '), // Helper untuk ambil full text argumen
                db,
                config,
                logger
            };

            // Execute
            try {
                await plugin.handle(sock, m, args, pluginContext);
            } catch (err) {
                logger.error('PLUGIN_EXEC', `Error in ${command}: ${err.stack}`);
                await sock.sendMessage(m.key.remoteJid, { 
                    text: `❌ *Error System*\nTerjadi kesalahan saat menjalankan perintah.\n\n_Log: ${err.message}_` 
                }, { quoted: m });
            }

        } catch (err) {
            logger.error('MSG_HANDLER', err.stack || err);
        }
    },
    preloadPlugins
};