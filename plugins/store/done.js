const moment = require('moment-timezone');

module.exports = async (chiwa, m, groupMetadata) => {
  // Pastikan pesan yang diproses hanya "d" (case-insensitive) dan merupakan reply
  if (m.text.trim().toLowerCase() !== 'd') return;
  if (!m.message?.extendedTextMessage?.contextInfo?.quotedMessage) return;

  // Cek apakah pengirim (admin) adalah admin grup
  const sender = m.sender;
  let isAdmin = false;
  if (groupMetadata && groupMetadata.participants) {
    const participant = groupMetadata.participants.find(p => p.id === sender);
    if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
      isAdmin = true;
    }
  }
  if (!isAdmin) return;

  // Dapatkan nomor WhatsApp user yang di-reply (pembeli)
  const quotedParticipant = m.message.extendedTextMessage.contextInfo.participant || '';

  // Format tanggal dan jam di zona Asia/Jakarta
  const currentTime = moment().tz('Asia/Jakarta');
  const tanggal = currentTime.format('DD/MM/YYYY');
  const jam = currentTime.format('HH:mm:ss');

  // Buat pesan done
  const doneText = 
`╭─❒ 「 ✅ 𝗕𝗘𝗥𝗛𝗔𝗦𝗜𝗟 」  
│ 📆 𝑇𝑎𝑛𝑔𝑔𝑎𝑙: ${tanggal}  
│ ⏰ 𝑊𝑎𝑘𝑡𝑢: ${jam}  
│ 📦 𝑆𝑡𝑎𝑡𝑢𝑠: 𝐃𝐎𝐍𝐄  
╰───────────────❍  

🎉 Terima kasih, @${quotedParticipant.split('@')[0]}  
Pesananmu telah berhasil diproses. Jika ada kendala, silakan hubungi admin. Jangan lupa order lagi! ✅`;

  // Kirim pesan done ke grup dengan mention pada user yang di-reply
  await chiwa.sendMessage(
    m.chat, 
    { text: doneText, mentions: [quotedParticipant] }, 
    { quoted: m }
  );
};
