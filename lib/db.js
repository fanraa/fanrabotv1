// lib/db.js — Simple JSON DB with Config Integration
const fs = require('fs');
const path = require('path');
const config = require('../config'); // Mengambil data dari config.js

const DATA_DIR = path.join(__dirname, '..', 'database');
const dbPath = path.join(DATA_DIR, 'users.json');

// Default starter ticket
const STARTER_TICKET = 5;

// Ensure storage directory exists
if (!fs.existsSync(DATA_DIR)) {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
        console.error('❌ Gagal membuat folder database:', e);
    }
}

// Ensure database file exists
if (!fs.existsSync(dbPath)) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify({}), 'utf8');
    } catch (e) {
        console.error('❌ Gagal membuat file database:', e);
    }
}

// Basic synchronous read/write
function readDb() {
    try {
        if (!fs.existsSync(dbPath)) return {};
        const raw = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(raw || '{}');
    } catch (err) {
        console.error('⚠ Database Corrupt, resetting...', err.message);
        return {};
    }
}

function writeDb(data) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('⚠ Gagal menulis database:', err.message);
    }
}

// --- HELPERS ---

const isOwner = (id) => {
    // Bersihkan id (hilangkan @s.whatsapp.net jika ada)
    const cleanId = (id || '').split('@')[0];
    return config.OWNER_NUMBERS.includes(cleanId);
};

module.exports = {
    addUser: (id, name = 'User') => {
        const data = readDb();
        const cleanId = id.split('@')[0];
        
        if (!data[cleanId]) {
            data[cleanId] = {
                id: cleanId,
                name,
                premium: isOwner(cleanId), // Owner otomatis premium saat register
                tickets: STARTER_TICKET,
                created_count: 0,
                date: new Date().toISOString()
            };
            writeDb(data);
            return true;
        }
        // update name if changed
        if (data[cleanId].name !== name) {
            data[cleanId].name = name;
            writeDb(data);
        }
        return false;
    },

    getUser: (id) => {
        const data = readDb();
        const cleanId = id.split('@')[0];
        if (data[cleanId]) return data[cleanId];
        
        // return dummy without writing DB
        return { 
            id: cleanId, 
            name: 'User', 
            premium: isOwner(cleanId), 
            tickets: 0, 
            created_count: 0 
        };
    },

    reduceTicket: (id) => {
        const cleanId = id.split('@')[0];
        // Owner unlimited ticket
        if (isOwner(cleanId)) return true;

        const data = readDb();
        if (data[cleanId] && typeof data[cleanId].tickets === 'number') {
            if (data[cleanId].tickets > 0) {
                data[cleanId].tickets -= 1;
                data[cleanId].created_count = (data[cleanId].created_count || 0) + 1;
                writeDb(data);
                return true;
            }
        }
        return false;
    },

    addTicket: (id, amount) => {
        const data = readDb();
        const cleanId = id.split('@')[0];
        if (data[cleanId]) {
            data[cleanId].tickets = (data[cleanId].tickets || 0) + parseInt(amount || 0, 10);
            writeDb(data);
            return true;
        }
        return false;
    },

    setPremium: (id, val = true) => {
        const data = readDb();
        const cleanId = id.split('@')[0];
        if (!data[cleanId]) {
            // Register if not exists
            data[cleanId] = { id: cleanId, name: 'User', tickets: STARTER_TICKET, created_count: 0 };
        }
        data[cleanId].premium = !!val;
        writeDb(data);
        return true;
    },

    checkPremium: (id) => {
        const cleanId = id.split('@')[0];
        if (isOwner(cleanId)) return true; // Owner always premium

        const data = readDb();
        if (data[cleanId] && data[cleanId].premium) return true;
        
        return false;
    },

    isOwner // Export helper ini
};