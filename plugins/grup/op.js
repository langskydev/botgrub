const moment = require('moment-timezone');

module.exports = async (chiwa, m, isRegistered, text, isOwner, command, prefix) => {
  // Pastikan perintah yang dijalankan adalah 'op'
  if (command !== 'op') return;
  
  // Pastikan pesan berasal dari grup target
  if (!m.isGroup || m.chat !== process.env.GROUP_ID) return;
  
  // Ambil metadata grup untuk mendapatkan daftar admin
  let metadata = await chiwa.groupMetadata(m.chat).catch(() => null);
  if (!metadata) return m.reply("Gagal mengambil metadata grup.");

  // Dapatkan daftar admin grup
  let adminIds = metadata.participants
    .filter(p => p.admin !== null)
    .map(p => p.id);

  // Pastikan pengirim adalah admin grup
  if (!adminIds.includes(m.sender)) {
    return m.reply("Maaf, fitur ini hanya dapat digunakan oleh admin grup.");
  }

  // Ubah setting grup ke mode 'not_announcement' (semua peserta dapat mengirim pesan)
  try {
    await chiwa.groupSettingUpdate(m.chat, 'not_announcement');
  } catch (err) {
    console.error("Error updating group setting:", err);
    return m.reply("Gagal membuka grup.");
  }

  // Siapkan pesan notifikasi pembukaan grup dengan tanggal dan waktu saat ini
  let currentDate = moment().tz('Asia/Jakarta').format('DD/MM/YYYY');
  let currentTime = moment().tz('Asia/Jakarta').format('HH:mm:ss') + " WIB";

  let messageText = `╭─❒ 「 🔓 𝗚𝗥𝗨𝗣 𝗞𝗘𝗠𝗕𝗔𝗟𝗜 𝗗𝗜𝗕𝗨𝗞𝗔 」  
│ 📆 𝑇𝑎𝑛𝑔𝑔𝑎𝑙: ${currentDate}
│ ⏰ 𝑊𝑎𝑘𝑡𝑢: ${currentTime}  
│ 🌐 𝑆𝑡𝑎𝑡𝑢𝑠: 𝐎𝐧𝐥𝐢𝐧𝐞  
│ 🛒 𝑇𝑟𝑎𝑛𝑠𝑎𝑘𝑠𝑖: 𝐕𝐢𝐚 𝐀𝐝𝐦𝐢𝐧  
╰───────────────❍  

📌 Grup telah dibuka.  
Silakan berkomunikasi seperti biasa.`;

  // Kirim pesan notifikasi ke grup
  await chiwa.sendMessage(m.chat, { text: messageText }, { quoted: m });
};
