// ───────────────────────────────────────────────────────────
// ADD PREMIUM — FINAL PREMIUM EDITION
// Smart, clean, aesthetic, and complete.
// ───────────────────────────────────────────────────────────

const { addPremium, checkPremium } = require('../lib/db');
const chalk = require('chalk');

module.exports = {
    handle: async (sock, m, args, { senderNumber }) => {

        // ──────────────────────────────────────────────
        //  STYLE FOR CONSOLE LOGGING ONLY (No WhatsApp colors)
        // ──────────────────────────────────────────────
        const gold  = chalk.hex('#F2C94C');
        const gray  = chalk.hex('#A9A9A9');
        const green = chalk.hex('#27AE60');
        const red   = chalk.hex('#EB5757');

        // Owner list (boleh diperluas)
        const ownerList = ['6285788918217', '6288291298977', '6790494347481'];

        // ──────────────────────────────────────────────
        //  CHECK OWNER ACCESS
        // ──────────────────────────────────────────────
        if (!ownerList.includes(senderNumber)) {
            return sock.sendMessage(
                m.key.remoteJid,
                { text: '❌ *Kamu bukan Owner!* Akses ditolak.' },
                { quoted: m }
            );
        }

        // ──────────────────────────────────────────────
        //  EXTRACT TARGET USER
        //  (Support: mention, nomor, reply, auto-normalize)
        // ──────────────────────────────────────────────
        let target;

        // Jika mention
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = m.message.extendedTextMessage.contextInfo.mentionedJid[0].split('@')[0];
        }

        // Jika reply pesan seseorang
        else if (m.message?.extendedTextMessage?.contextInfo?.participant) {
            target = m.message.extendedTextMessage.contextInfo.participant.split('@')[0];
        }

        // Jika input manual
        else if (args[0]) {
            target = args[0].replace(/[^0-9]/g, '');
        }

        // Tidak ada input
        else {
            return sock.sendMessage(
                m.key.remoteJid,
                { text: '⚠️ Format salah!\nGunakan:\n• *.addprem @tag*\n• *.addprem 628xxxx*' },
                { quoted: m }
            );
        }

        // Normalize target
        if (target.startsWith('08')) target = '62' + target.slice(1);
        if (target.startsWith('620')) target = '62' + target.slice(3);

        // Prevent Owner from being downgraded or weird edits
        if (ownerList.includes(target)) {
            return sock.sendMessage(
                m.key.remoteJid,
                { text: `💎 *Owner tidak perlu dijadikan premium.*` },
                { quoted: m }
            );
        }

        // ──────────────────────────────────────────────
        //  EXECUTE ADD PREMIUM
        // ──────────────────────────────────────────────
        const result = addPremium(target);

        if (result) {
            await sock.sendMessage(
                m.key.remoteJid,
                { 
                    text: `🎉 *BERHASIL!*\nUser *${target}* resmi menjadi **PREMIUM USER 💎**.\n\nAkses fitur premium telah diaktifkan.` 
                },
                { quoted: m }
            );

            // Log untuk developer
            console.log(green("\n[ADD-PREMIUM SUCCESS]"));
            console.log(gold("Target  : ") + gray(target));
            console.log(gold("By      : ") + gray(senderNumber));
            console.log(green("Status  : Premium ditambahkan ✔\n"));
        } 
        
        else {
            await sock.sendMessage(
                m.key.remoteJid,
                { 
                    text: `⚠️ *Gagal!* User *${target}* belum terdaftar di database.\n\nSuruh dia *chat bot 1x* dulu untuk otomatis masuk DB.` 
                },
                { quoted: m }
            );

            console.log(red("\n[ADD-PREMIUM FAILED]"));
            console.log(gold("Target  : ") + gray(target));
            console.log(red("Status  : User belum terdaftar ❌\n"));
        }
    }
};
