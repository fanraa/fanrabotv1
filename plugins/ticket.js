// plugins/ticket.js
// Check ticket, add ticket (owner-only), and support a few aliases

module.exports.meta = {
    name: 'ticket',
    description: 'Cek tiketmu (.myticket / .tiket) atau tambah tiket (Owner: .addticket)',
    aliases: ['myticket', 'tiket', 'addticket'],
    ownerOnly: false,
    premiumOnly: false
};

module.exports.handle = async (sock, m, args, ctx) => {
    const { senderNumber, isPremium, db, pushName } = ctx;
    const { getUser, addTicket } = db;

    // Command used (we normalize)
    const body = (m.message.conversation || m.message.extendedTextMessage?.text || '').trim();
    const command = body.slice(1).split(' ')[0].toLowerCase();

    if (command === 'myticket' || command === 'tiket' || command === 'ticket') {
        const user = getUser(senderNumber);
        const status = isPremium ? "👑 PREMIUM (Unlimited)" : "👤 FREE USER";
        const text =
`🎫 *TIKET PROFILE*

👤 *Nama:* ${pushName}
🏷️ *Status:* ${status}
🎟️ *Sisa Tiket:* ${user.tickets}
🔨 *Grup Dibuat:* ${user.created_count} Kali

_Tiket digunakan untuk membuat grup._`;
        return sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
    }

    if (command === 'addticket') {
        // Owner check
        const { isOwner } = db;
        if (!isOwner(senderNumber)) return; // ignore if not owner

        const target = args[0];
        const amount = parseInt(args[1], 10);
        if (!target || !amount || isNaN(amount)) {
            return sock.sendMessage(m.key.remoteJid, { text: '⚠️ Format: .addticket 628xxx <jumlah>' }, { quoted: m });
        }

        const ok = addTicket(target, amount);
        if (ok) {
            return sock.sendMessage(m.key.remoteJid, { text: `✅ Berhasil menambah ${amount} tiket ke ${target}` }, { quoted: m });
        } else {
            return sock.sendMessage(m.key.remoteJid, { text: `❌ Gagal: user ${target} tidak ditemukan di database.` }, { quoted: m });
        }
    }
};