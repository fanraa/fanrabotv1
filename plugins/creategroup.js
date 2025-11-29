// plugins/creategroup.js
// Create a WhatsApp group with ticket deduction + auto-add creator

module.exports.meta = {
    name: 'creategroup',
    description: 'Buat grup WhatsApp baru, auto-add user, dan dapatkan link (Free: potong tiket 1)',
    aliases: ['cg', 'creategroup', 'buatgrup'],
    ownerOnly: false,
    premiumOnly: false
};

module.exports.handle = async (sock, m, args, ctx) => {
    const { senderNumber, db, isPremium, pushName, logger } = ctx;
    const { getUser, reduceTicket } = db;

    // Ambil nama grup
    const groupName = args.join(' ').trim();
    if (!groupName) {
        return sock.sendMessage(
            m.key.remoteJid,
            { text: "⚠️ Gunakan: *.creategroup <Nama Grup>*\nContoh: *.creategroup Fanra Community*" },
            { quoted: m }
        );
    }

    const user = getUser(senderNumber);

    // Cek tiket (free user)
    if (!isPremium && user.tickets < 1) {
        return sock.sendMessage(
            m.key.remoteJid,
            { text: `⛔ Tiket kamu habis.\n🎫 Sisa tiket: *${user.tickets}*\nUpgrade ke Premium untuk unlimited penggunaan.` },
            { quoted: m }
        );
    }

    // Reaction loading
    await sock.sendMessage(m.key.remoteJid, {
        react: { text: "⏳", key: m.key }
    });

    try {
        // Kurangi tiket
        if (!isPremium) {
            const ok = reduceTicket(senderNumber);
            if (!ok) throw new Error('Gagal memotong tiket');
        }

        // Buat grup kosong
        const groupData = await sock.groupCreate(groupName, []);

        // Delay biar backend WA siap
        await new Promise(res => setTimeout(res, 1600));

        // Auto-add creator
        const jid = senderNumber + "@s.whatsapp.net";
        await sock.groupParticipantsUpdate(groupData.id, [jid], "add");

        // Ambil link invite
        const code = await sock.groupInviteCode(groupData.id);
        const link = `https://chat.whatsapp.com/${code}`;

        // Ganti reaction menjadi sukses
        await sock.sendMessage(m.key.remoteJid, {
            react: { text: "✅", key: m.key }
        });

        // Info tiket
        const ticketInfo = isPremium
            ? "UNLIMITED (Premium 👑)"
            : `1 Tiket Terpakai (Sisa: ${user.tickets - 1})`;

        // Pesan final super premium
        const finalMsg =
`🎉 *GRUP BERHASIL DIBUAT!*

👑 *Dibuat Oleh:* ${pushName}
🏷️ *Nama Grup:* ${groupName}
🎫 *Biaya:* ${ticketInfo}
🔗 *Link Invite:* ${link}

_Kamu sudah otomatis dimasukkan ke dalam grup._`;

        await sock.sendMessage(m.key.remoteJid, { text: finalMsg }, { quoted: m });

        // Log
        logger.info(
            'CREATEGROUP',
            `${pushName} (${senderNumber}) created group "${groupName}" — Premium: ${isPremium}`
        );

    } catch (err) {
        // Reaction error
        await sock.sendMessage(m.key.remoteJid, {
            react: { text: "❌", key: m.key }
        });

        logger.error('CREATEGROUP', err.stack || err);

        return sock.sendMessage(
            m.key.remoteJid,
            { text: '❌ Gagal membuat grup.\nMungkin karena privasi akun atau limit dari WhatsApp.' },
            { quoted: m }
        );
    }
};
