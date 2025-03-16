const moment = require("moment-timezone");

module.exports = async (chiwa, m, groupMetadata) => {
  // Pastikan pesan hanya "p" (case-insensitive) dan merupakan reply pesan
  if (m.text.trim().toLowerCase() !== "p") return;
  if (!m.message?.extendedTextMessage?.contextInfo?.quotedMessage) return;

  // Cek apakah pengirim (admin) adalah admin grup
  const sender = m.sender;
  let isAdmin = false;
  if (groupMetadata && groupMetadata.participants) {
    const participant = groupMetadata.participants.find((p) => p.id === sender);
    if (
      participant &&
      (participant.admin === "admin" || participant.admin === "superadmin")
    ) {
      isAdmin = true;
    }
  }
  if (!isAdmin) return;

  // Dapatkan nomor WhatsApp user yang di-reply (pembeli)
  const quotedParticipant =
    m.message.extendedTextMessage.contextInfo.participant || "";

  // Format tanggal dan jam di zona Asia/Jakarta
  const currentTime = moment().tz("Asia/Jakarta");
  const tanggal = currentTime.format("DD/MM/YYYY");
  const jam = currentTime.format("HH:mm:ss");

  // Buat pesan pending
  const pendingText = `╭─❒ 「 ⏳ 𝗣𝗘𝗡𝗗𝗜𝗡𝗚 」  
│ 📆 𝑇𝑎𝑛𝑔𝑔𝑎𝑙: ${tanggal} 
│ ⏰ 𝑊𝑎𝑘𝑡𝑢: ${jam}  
│ 🚫 𝑆𝑡𝑎𝑡𝑢𝑠: Pending  
│ 👤 𝑃𝑒𝑚𝑏𝑒𝑙𝑖: @${quotedParticipant.split("@")[0]}  
│ 📩 𝑅𝑒𝑠𝑝𝑜𝑛: 𝐀𝐤𝐚𝐧 𝐝𝐢𝐩𝐫𝑜𝐬𝐞𝐬 𝐬𝐞𝐠𝐞𝐫𝐚  
╰───────────────❍  

📢 Harap bersabar!
Pesan dalam antrian dan akan segera diproses.`;

  // Kirim pesan pending ke grup dengan mention ke user yang di-reply
  await chiwa.sendMessage(
    m.chat,
    { text: pendingText, mentions: [quotedParticipant] },
    { quoted: m }
  );
};
