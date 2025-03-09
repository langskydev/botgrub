const moment = require('moment-timezone');

module.exports = async (chiwa, m, isRegistered, text, isOwner, command, prefix) => {
  // Pastikan hanya merespon perintah 'cl'
  if (command !== 'cl') return;
  
  // Cek apakah pesan berasal dari grup dengan ID yang sudah ditentukan
  if (!m.isGroup || m.chat !== process.env.GROUP_ID) return;
  
  // Ambil metadata grup untuk mendapatkan daftar admin
  let metadata = await chiwa.groupMetadata(m.chat).catch(() => null);
  if (!metadata) return m.reply("Gagal mengambil metadata grup.");

  // Dapatkan daftar ID admin grup
  let adminIds = metadata.participants
    .filter(p => p.admin !== null)
    .map(p => p.id);

  // Cek apakah pengirim pesan adalah admin
  if (!adminIds.includes(m.sender)) {
    return m.reply("Maaf, fitur ini hanya dapat digunakan oleh admin grup.");
  }

  // Ubah setting grup ke mode announcement (hanya admin yang bisa mengirim pesan)
  try {
    await chiwa.groupSettingUpdate(m.chat, 'announcement');
  } catch (err) {
    console.error("Error updating group setting:", err);
    return m.reply("Gagal menutup grup.");
  }

  // Siapkan pesan notifikasi penutupan grup dengan tanggal dan waktu saat ini
  let currentDate = moment().tz('Asia/Jakarta').format('DD/MM/YYYY');
  let currentTime = moment().tz('Asia/Jakarta').format('HH:mm:ss') + " WIB";

  let messageText = `╭─❒ 「 🔒 𝗚𝗥𝗨𝗣 𝗗𝗜𝗧𝑼𝗧𝑼𝗣 」  
│ 📆 𝑇𝑎𝑛𝑔𝑔𝑎𝑙: ${currentDate}
│ ⏰ 𝑊𝑎𝑘𝑡𝑢: ${currentTime}  
│ 🌐 𝑆𝑡𝑎𝑡𝑢𝑠: 𝐎𝐟𝐟𝐥𝐢𝐧𝐞  
│ 🛒 𝑇𝑟𝑎𝑛𝑠𝑎𝑘𝑠𝑖: 𝐕𝐢𝐚 𝐀𝐝𝐦𝐢𝐧  
╰───────────────❍  

📌 Terima kasih atas kepercayaan kalian!  
Untuk pemesanan atau pertanyaan, hubungi admin.  
Pastikan semua transaksi hanya melalui admin resmi ✅`;

  // Kirim pesan notifikasi ke grup
  await chiwa.sendMessage(m.chat, { text: messageText }, { quoted: m });
};
