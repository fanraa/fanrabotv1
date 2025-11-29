// plugins/menu.js
// Simple dynamic menu (reads plugin metadata if available)

const fs = require('fs');
const path = require('path');

module.exports.meta = {
    name: 'menu',
    description: 'Tampilkan daftar perintah dan info bot',
    aliases: ['help'],
    ownerOnly: false,
    premiumOnly: false
};

module.exports.handle = async (sock, m, args, ctx) => {
    const { pushName, isPremium, db } = ctx;
    const pluginDir = path.join(__dirname);
    const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));

    const cmds = files.map(f => {
        try {
            const mod = require(path.join(pluginDir, f));
            const meta = mod.meta || {};
            return {
                name: meta.name || f.replace('.js', ''),
                desc: meta.description || '-',
                aliases: meta.aliases || []
            };
        } catch (e) {
            return { name: f.replace('.js', ''), desc: 'Error reading meta', aliases: [] };
        }
    });

    const lines = [
        `👋 Halo ${pushName}!\n`,
        `⚙️ Bot Status: ${isPremium ? '👑 PREMIUM' : '👤 FREE'}\n`,
        '📜 Daftar Perintah:\n'
    ];

    for (const c of cmds) {
        const aliasText = c.aliases.length ? ` (alias: ${c.aliases.join(', ')})` : '';
        lines.push(`• ${c.name}${aliasText}\n  → ${c.desc}\n`);
    }

    lines.push('\n⚠️ Tip: Gunakan perintah dengan prefix `.` (contoh: .ping)');
    await sock.sendMessage(m.key.remoteJid, { text: lines.join('\n') }, { quoted: m });
};