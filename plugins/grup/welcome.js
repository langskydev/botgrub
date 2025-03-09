const moment = require('moment-timezone');

module.exports = async (chiwa, update) => {
  // Pastikan hanya memproses jika ada peserta yang ditambahkan
  if (update.action !== 'add') return;
  
  // Ambil metadata grup untuk mendapatkan nama grup
  let groupMetadata = await chiwa.groupMetadata(update.id).catch(e => null);
  if (!groupMetadata) {
    console.error("Gagal mengambil metadata grup untuk welcome message.");
    return;
  }
  let groupName = groupMetadata.subject;
  
  // Iterasi setiap peserta baru
  for (const participant of update.participants) {
    // Format pesan welcome
    let welcomeMessage = `🎉 Selamat Datang di ${groupName}! 🎉\n\nHai, @${participant.split('@')[0]} user yang baru masuk grub! 👋 Senang kamu bergabung di sini. Untuk melihat daftar harga dan aplikasi yang tersedia, ketik "list".\n\nJika ada pertanyaan, jangan ragu untuk bertanya. Selamat berbelanja! 🚀`;
    
    // Kirim pesan welcome dengan mention
    await chiwa.sendMessage(update.id, { text: welcomeMessage, mentions: [participant] });
  }
};
