// plugins/ping.js
// Clean ping command with console and WA feedback

const chalk = require('chalk');

module.exports.meta = {
    name: 'ping',
    description: 'Cek latensi & status bot',
    aliases: [],
    ownerOnly: false,
    premiumOnly: false
};

module.exports.handle = async (sock, m, args, ctx) => {
    const sender = m.key.remoteJid;
    const start = Date.now();

    const gold  = chalk.hex('#F2C94C');
    const gray  = chalk.hex('#B5B5B5');
    const green = chalk.hex('#27AE60');

    console.log(gold("\n────────────────────────────────────────"));
    console.log(gold("⚡  PING EXECUTED"));
    console.log(gray("User      : ") + (ctx.pushName || "User"));
    console.log(gray("Chat ID   : ") + sender);
    console.log(gold("────────────────────────────────────────\n"));

    const loadingMsg = await sock.sendMessage(sender, { text: "⏳ *Mengukur kecepatan...*" }, { quoted: m });

    // Slight fake work to compute measurable latency
    await new Promise(r => setTimeout(r, 50));

    const latency = Date.now() - start;

    let status = "";
    if (latency < 150) status = "⚡ Sangat Cepat";
    else if (latency < 350) status = "📶 Stabil";
    else if (latency < 700) status = "⌛ Lumayan Lambat";
    else status = "🐌 Lemot Banget";

    const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    const output =
`✨ *PONG PREMIUM!*

📡 *Latency* : ${latency} ms
🔍 *Status*  : ${status}
🕒 *Waktu*   : ${now}

_Bot aktif & responsif._`;

    await sock.sendMessage(sender, { text: output, edit: loadingMsg.key });
    console.log(green(`✔ Latency: ${latency}ms`));
};